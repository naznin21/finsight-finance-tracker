package com.finance.user;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String password;

    @Column(nullable = false)
    private String name;

    private boolean enabled = false;

    private String verificationToken;

    private String resetPasswordToken;

    private LocalDateTime resetTokenExpiry;

    // OTP fields
    private String otp;

    private LocalDateTime otpExpiry;

    private boolean otpVerified = false;

    @CreationTimestamp
    private LocalDateTime createdAt;
}