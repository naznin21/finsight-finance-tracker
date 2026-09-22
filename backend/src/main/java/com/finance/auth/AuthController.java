package com.finance.auth;

import com.finance.user.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Slf4j
public class AuthController {

    private final AuthService authService;
    private final UserRepository userRepository;

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest req) {
        try {
            authService.register(req);
            return ResponseEntity.ok("Registration successful. OTP sent to your email. Please verify.");
        } catch (RuntimeException e) {
            log.error("Registration error: {}", e.getMessage());
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/send-otp")
    public ResponseEntity<?> sendOtp(@RequestParam String email) {
        try {
            authService.sendOtp(email);
            return ResponseEntity.ok("OTP sent to your email. Please check your inbox.");
        } catch (RuntimeException e) {
            log.error("Send OTP error: {}", e.getMessage());
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/verify-otp")
    public ResponseEntity<?> verifyOtp(@RequestParam String email, @RequestParam String otp) {
        try {
            authService.verifyOtp(email, otp);
            return ResponseEntity.ok("✅ OTP verified successfully! You can now log in.");
        } catch (RuntimeException e) {
            log.error("Verify OTP error: {}", e.getMessage());
            return ResponseEntity.badRequest().body("❌ " + e.getMessage());
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest req) {
        try {
            AuthResponse response = authService.login(req);
            return ResponseEntity.ok(response);
        } catch (BadCredentialsException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("❌ Invalid email or password.");
        } catch (DisabledException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("❌ Please verify your email with OTP first. Use /api/auth/send-otp?email=" + req.getEmail());
        } catch (RuntimeException e) {
            log.error("Login error: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("❌ " + e.getMessage());
        }
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@RequestParam String email) {
        try {
            authService.forgotPassword(email);
            return ResponseEntity.ok("Password reset link sent to your email.");
        } catch (RuntimeException e) {
            log.error("Forgot password error: {}", e.getMessage());
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestParam String token,
                                           @RequestParam String newPassword) {
        try {
            authService.resetPassword(token, newPassword);
            return ResponseEntity.ok("Password reset successful.");
        } catch (RuntimeException e) {
            log.error("Reset password error: {}", e.getMessage());
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}