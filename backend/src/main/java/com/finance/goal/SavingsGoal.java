package com.finance.goal;

import com.finance.user.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "savings_goals")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class SavingsGoal {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private String name;           // "Vacation", "Emergency Fund"

    private String icon;

    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal targetAmount;

    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal savedAmount = BigDecimal.ZERO;

    private LocalDate targetDate;

    @Enumerated(EnumType.STRING)
    private GoalStatus status = GoalStatus.IN_PROGRESS;

    @CreationTimestamp
    private LocalDateTime createdAt;
}
