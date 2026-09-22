package com.finance.budget;

import com.finance.category.Category;
import com.finance.user.User;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.YearMonth;

@Entity
@Table(name = "budgets")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Budget {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id", nullable = false)
    private Category category;

    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal amount;

    // stored as "2024-03" string for easy querying
    @Column(nullable = false)
    private String month;

    private boolean rollover = false;

    // carried over from previous month if rollover=true
    @Column(precision = 15, scale = 2)
    private BigDecimal rolledOverAmount = BigDecimal.ZERO;
}
