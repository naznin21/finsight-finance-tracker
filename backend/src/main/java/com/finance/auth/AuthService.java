package com.finance.auth;

import com.finance.config.JwtUtil;
import com.finance.user.User;
import com.finance.user.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Random;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final AuthenticationManager authManager;
    private final JavaMailSender mailSender;

    @Value("${app.frontend-url}")
    private String frontendUrl;

    @Transactional
    public void register(RegisterRequest req) {
        log.info("Registration attempt for email: {}", req.getEmail());

        if (userRepository.findByEmail(req.getEmail()).isPresent()) {
            throw new RuntimeException("Email already registered.");
        }

        // Create user WITHOUT builder to avoid issues
        User user = new User();
        user.setEmail(req.getEmail());
        user.setPassword(passwordEncoder.encode(req.getPassword()));
        user.setName(req.getName());
        user.setEnabled(false);
        user.setOtpVerified(false);
        user.setOtp(null);
        user.setOtpExpiry(null);

        userRepository.save(user);
        log.info("User registered successfully: {}", req.getEmail());

        // Send OTP automatically after registration
        sendOtp(req.getEmail());
    }

    @Transactional
    public void sendOtp(String email) {
        log.info("Sending OTP to: {}", email);

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found with email: " + email));

        if (user.isEnabled()) {
            throw new RuntimeException("User is already verified.");
        }

        // Generate 6-digit OTP
        String otp = generateOtp();

        // Save OTP to database
        user.setOtp(otp);
        user.setOtpExpiry(LocalDateTime.now().plusMinutes(10));
        user.setOtpVerified(false);
        userRepository.save(user);

        // Send OTP via email
        String emailBody = String.format(
                "Hello %s,\n\n" +
                        "Your OTP for email verification is: %s\n\n" +
                        "This OTP is valid for 10 minutes.\n\n" +
                        "Please use this OTP to verify your email: /api/auth/verify-otp?email=%s&otp=%s\n\n" +
                        "Regards,\n" +
                        "Finance App Team",
                user.getName(), otp, email, otp
        );

        sendEmail(email, "Your OTP for Email Verification", emailBody);
        log.info("OTP sent successfully to: {}", email);
    }

    @Transactional
    public void verifyOtp(String email, String otp) {
        log.info("Verifying OTP for: {}", email);

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found with email: " + email));

        if (user.isEnabled()) {
            throw new RuntimeException("User is already verified.");
        }

        if (user.getOtp() == null) {
            throw new RuntimeException("No OTP found. Please request a new OTP.");
        }

        if (user.getOtpExpiry() == null || user.getOtpExpiry().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("OTP has expired. Please request a new OTP.");
        }

        if (!user.getOtp().equals(otp)) {
            throw new RuntimeException("Invalid OTP. Please try again.");
        }

        // OTP is valid - enable user
        user.setEnabled(true);
        user.setOtpVerified(true);
        user.setOtp(null);
        user.setOtpExpiry(null);
        userRepository.save(user);

        log.info("OTP verified successfully for: {}", email);

        // Send success email
        String successEmail = String.format(
                "Hello %s,\n\n" +
                        "Your email has been verified successfully!\n\n" +
                        "You can now log in to your account.\n\n" +
                        "Regards,\n" +
                        "Finance App Team",
                user.getName()
        );
        sendEmail(email, "Email Verified Successfully", successEmail);
    }

    public AuthResponse login(LoginRequest req) {
        log.info("Login attempt for email: {}", req.getEmail());

        try {
            User user = userRepository.findByEmail(req.getEmail())
                    .orElseThrow(() -> new UsernameNotFoundException("User not found"));

            if (!user.isEnabled()) {
                log.warn("Login failed - User not enabled: {}", req.getEmail());
                throw new DisabledException("Please verify your email with OTP first. Use /api/auth/send-otp to get OTP.");
            }

            authManager.authenticate(
                    new UsernamePasswordAuthenticationToken(req.getEmail(), req.getPassword()));

            log.info("Authentication successful for: {}", req.getEmail());

            String token = jwtUtil.generateToken(req.getEmail());

            return new AuthResponse(token, user.getName(), user.getEmail());

        } catch (BadCredentialsException e) {
            log.warn("Login failed - Bad credentials for: {}", req.getEmail());
            throw new BadCredentialsException("Invalid email or password.");
        } catch (DisabledException e) {
            throw e;
        } catch (Exception e) {
            log.error("Login error for {}: {}", req.getEmail(), e.getMessage());
            throw new RuntimeException("Login failed: " + e.getMessage());
        }
    }

    @Transactional
    public void forgotPassword(String email) {
        log.info("Password reset request for email: {}", email);

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Email not found."));

        String token = UUID.randomUUID().toString();
        user.setResetPasswordToken(token);
        user.setResetTokenExpiry(LocalDateTime.now().plusHours(1));
        userRepository.save(user);

        String resetLink = frontendUrl + "/api/auth/reset-password?token=" + token;
        String emailBody = String.format(
                "Hello %s,\n\n" +
                        "Click the link to reset your password: %s\n\n" +
                        "This link will expire in 1 hour.\n\n" +
                        "Regards,\n" +
                        "Finance App Team",
                user.getName(), resetLink
        );

        sendEmail(email, "Reset your password", emailBody);
        log.info("Password reset email sent to: {}", email);
    }

    @Transactional
    public void resetPassword(String token, String newPassword) {
        log.info("Password reset attempt with token: {}", token);

        User user = userRepository.findByResetPasswordToken(token)
                .orElseThrow(() -> new RuntimeException("Invalid token."));

        if (user.getResetTokenExpiry() == null ||
                user.getResetTokenExpiry().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("Token expired. Please request a new password reset.");
        }

        user.setPassword(passwordEncoder.encode(newPassword));
        user.setResetPasswordToken(null);
        user.setResetTokenExpiry(null);
        userRepository.save(user);

        log.info("Password reset successful for: {}", user.getEmail());
    }

    private String generateOtp() {
        Random random = new Random();
        int otp = 100000 + random.nextInt(900000);
        return String.valueOf(otp);
    }

    private void sendEmail(String to, String subject, String text) {
        try {
            SimpleMailMessage msg = new SimpleMailMessage();
            msg.setTo(to);
            msg.setSubject(subject);
            msg.setText(text);
            mailSender.send(msg);
            log.debug("Email sent to: {}", to);
        } catch (Exception e) {
            log.error("Failed to send email to {}: {}", to, e.getMessage());
            throw new RuntimeException("Failed to send email. Please try again later.");
        }
    }
}