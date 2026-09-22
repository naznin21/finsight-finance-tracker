package com.finance.account;

import com.finance.user.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "accounts")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Account {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private String name; // e.g. "HDFC Savings", "SBI Credit Card", "UPI Wallet"

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AccountType type;

    @Column(precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal openingBalance = BigDecimal.ZERO;

    @Column(precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal currentBalance = BigDecimal.ZERO;

    @Builder.Default
    private String currency = "INR";

    @Builder.Default
    private boolean active = true;

    @CreationTimestamp
    private LocalDateTime createdAt;
}
