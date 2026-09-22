package com.finance.experiment;

import com.finance.user.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "financial_challenges")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FinancialChallenge {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private String title; // e.g. "30-Day Food Spending Challenge", "Subscription Cleanup"

    private String targetCategory; // e.g. "Food"

    @Column(precision = 15, scale = 2)
    private BigDecimal baselineSpend;

    @Column(precision = 15, scale = 2)
    private BigDecimal targetLimit;

    @Column(precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal currentSpend = BigDecimal.ZERO;

    private LocalDate startDate;
    private LocalDate endDate;

    @Builder.Default
    private boolean active = true;

    @CreationTimestamp
    private LocalDateTime createdAt;
}
