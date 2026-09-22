package com.finance.recurring;

import com.finance.transaction.TransactionType;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class RecurringDTO {
    private Long id;
    private TransactionType type;
    private BigDecimal amount;
    private String description;
    private Long categoryId;
    private String categoryName;
    private Frequency frequency;
    private LocalDate startDate;
    private LocalDate endDate;
    private LocalDate lastProcessed;
    private boolean active;
    private Integer reminderDaysBefore;
    private LocalDate nextDueDate;
}
