package com.finance.goal;

import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class GoalDTO {
    private Long id;
    private String name;
    private String icon;
    private BigDecimal targetAmount;
    private BigDecimal savedAmount;
    private LocalDate targetDate;
    private GoalStatus status;
    // computed
    private double progressPercent;
    private String completionPrediction;  // "On track", "Behind", estimated date
}
