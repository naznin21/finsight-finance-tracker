package com.finance.budget;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class BudgetDTO {
    private Long id;
    private Long categoryId;
    private String categoryName;
    private BigDecimal amount;
    private BigDecimal rolledOverAmount;
    private String month;
    private boolean rollover;
    // computed fields
    private BigDecimal spent;
    private BigDecimal remaining;
    private double percentUsed;
    private String status;              // SAFE, WATCH, AT_RISK, EXCEEDED
    private BigDecimal projectedMonthEnd;
    private BigDecimal recommendationMin;
    private BigDecimal recommendationMax;
    private String recommendationReason;
}
