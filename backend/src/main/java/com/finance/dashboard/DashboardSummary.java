package com.finance.dashboard;

import lombok.*;
import java.math.BigDecimal;
import java.util.Map;

@Data @Builder
public class DashboardSummary {
    private BigDecimal totalIncome;
    private BigDecimal totalExpense;
    private BigDecimal balance;
    private Map<String, BigDecimal> categorySpending;
}
