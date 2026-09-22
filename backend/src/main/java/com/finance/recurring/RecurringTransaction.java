package com.finance.recurring;

import com.finance.category.Category;
import com.finance.transaction.TransactionType;
import com.finance.user.User;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "recurring_transactions")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class RecurringTransaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    private TransactionType type;

    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal amount;

    private String description;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id")
    private Category category;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Frequency frequency;   // DAILY, WEEKLY, MONTHLY, YEARLY

    @Column(nullable = false)
    private LocalDate startDate;

    private LocalDate endDate;     // null = no end

    private LocalDate lastProcessed;

    private boolean active = true;

    // day of month for reminder (e.g. 5 = 5th of each month)
    private Integer reminderDaysBefore = 3;
}
