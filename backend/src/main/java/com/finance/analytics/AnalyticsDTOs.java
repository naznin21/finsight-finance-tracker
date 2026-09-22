package com.finance.analytics;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

public class AnalyticsDTOs {

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class FinancialPulseDTO {
        private int score;                    // 0 - 100
        private String healthStatus;           // "Healthy", "Moderate", "Needs Attention"
        private List<String> pulseHighlights;  // E.g. "↑ Savings rate improved 6%", "↓ Shopping expenses decreased 12%"
        private BigDecimal currentBalance;
        private BigDecimal monthlyIncome;
        private BigDecimal monthlyExpenses;
        private BigDecimal monthlySavings;
        private double savingsRate;
        private double incomeChangePct;       // vs last month
        private double expenseChangePct;      // vs last month
        private double savingsRateChangePct;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class FinancialStoryDTO {
        private String month;
        private String headline;
        private String narrative;              // Data-based dynamic natural language story
        private String topCategory;
        private BigDecimal topCategoryAmount;
        private String biggestDeltaCategory;   // Category with largest spending decrease/increase
        private BigDecimal biggestDeltaAmount;
        private String keyTakeaway;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class FinancialHealth2DTO {
        private int overallScore;             // 0 - 100
        private String rating;                 // Excellent, Good, Fair, At Risk
        private int savingsScore;              // 0 - 100 (weight 25%)
        private int budgetDisciplineScore;     // 0 - 100 (weight 25%)
        private int stabilityScore;            // 0 - 100 (weight 20%)
        private int goalProgressScore;         // 0 - 100 (weight 15%)
        private int obligationScore;           // 0 - 100 (weight 15%)
        private List<MonthHealthTrend> trend;
        private List<String> actionItems;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MonthHealthTrend {
        private String month;
        private int score;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ForecastDTO {
        private String month;
        private BigDecimal currentIncome;
        private BigDecimal currentExpense;
        private BigDecimal projectedMonthEndExpense;
        private BigDecimal projectedMonthEndBalance;
        private BigDecimal projectedSavings;
        private double projectedSavingsRate;
        private String forecastMethod;          // "Run Rate Average", "Weighted Historical", "Recurring Adjusted"
        private List<CategoryRiskDTO> categoryRisks;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CategoryRiskDTO {
        private String categoryName;
        private BigDecimal budgetAmount;
        private BigDecimal spentAmount;
        private BigDecimal projectedAmount;
        private String riskLevel;               // SAFE, WATCH, AT_RISK, EXCEEDED
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SimulatorRequest {
        private double incomeChangePct;         // e.g. +10.0 for 10% salary raise
        private BigDecimal rentChangeAmount;    // e.g. +3000
        private BigDecimal monthlySavingsDelta; // e.g. +5000
        private double categoryCutPct;          // e.g. 20.0 for food reduction
        private String targetCategory;          // e.g. "Food"
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SimulatorResponse {
        private BigDecimal baselineSavings;
        private BigDecimal newSavings;
        private double baselineSavingsRate;
        private double newSavingsRate;
        private BigDecimal baselineMonthEndBalance;
        private BigDecimal newMonthEndBalance;
        private List<GoalImpactDTO> goalImpacts;
        private List<String> insights;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class GoalImpactDTO {
        private Long goalId;
        private String goalName;
        private String baselineCompletionDate;
        private String newCompletionDate;
        private double monthsDelta;             // e.g. -2.1 months (earlier) or +1.8 months (delayed)
        private String status;                  // "ACCELERATED", "DELAYED", "UNCHANGED"
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DecisionRequest {
        private String title;
        private BigDecimal amount;
        private String category;
        private String paymentMethod;           // "LUMP_SUM", "MONTHLY_EMI"
        private Integer emiMonths;              // e.g. 6 or 12
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DecisionResponse {
        private String title;
        private BigDecimal purchaseAmount;
        private BigDecimal immediateBalanceImpact;
        private BigDecimal monthlyCashFlowImpact;
        private double goalDelayMonths;
        private int healthScoreImpact;           // e.g. -4 points
        private String budgetPressureLevel;      // "LOW", "MODERATE", "HIGH", "CRITICAL"
        private String recommendation;           // "Proceed safely", "Consider delaying", "Fund gradually"
        private List<String> evaluationBreakdown;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DigitalTwinDTO {
        private List<TrajectoryPoint> currentTrajectory;
        private List<TrajectoryPoint> optimizedTrajectory;
        private String summaryNarrative;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TrajectoryPoint {
        private String timeLabel;               // "Today", "1 Month", "3 Months", "6 Months", "12 Months"
        private BigDecimal projectedBalance;
        private BigDecimal projectedSavings;
        private double averageGoalProgressPct;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SubscriptionSummaryDTO {
        private BigDecimal totalMonthlyCost;
        private BigDecimal totalAnnualCost;
        private int totalActiveSubscriptions;
        private List<SubscriptionItemDTO> items;
        private List<String> savingsOpportunities;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SubscriptionItemDTO {
        private Long id;
        private String name;
        private BigDecimal amount;
        private String frequency;
        private String nextDueDate;
        private String category;
        private boolean isEssential;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class BehaviorAnalysisDTO {
        private String topCategory;
        private BigDecimal topCategorySpend;
        private BigDecimal avgTransactionSize;
        private BigDecimal largestTransactionAmount;
        private String largestTransactionDescription;
        private double weekendSpendPct;
        private double weekdaySpendPct;
        private double essentialPct;
        private double discretionaryPct;
        private String fastestGrowingCategory;
        private List<String> behavioralInsights;
    }
}
