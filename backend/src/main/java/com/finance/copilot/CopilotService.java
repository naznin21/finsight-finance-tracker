package com.finance.copilot;

import com.finance.analytics.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class CopilotService {

    private final FinancialTools financialTools;
    private final AnalyticsController analyticsController;
    private final FinancialStoryService financialStoryService;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CopilotRequest {
        private String question;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CopilotResponse {
        private String question;
        private String answer;
        private List<String> sourceDataPoints;
        private List<String> suggestedFollowUps;
    }

    public CopilotResponse answerQuestion(CopilotRequest req) {
        String q = req.getQuestion() != null ? req.getQuestion().trim().toLowerCase() : "";
        List<String> dataPoints = new ArrayList<>();
        List<String> followUps = new ArrayList<>();
        StringBuilder answer = new StringBuilder();

        if (q.contains("why") && (q.contains("increase") || q.contains("higher") || q.contains("rise") || q.contains("more"))) {
            AnalyticsDTOs.FinancialPulseDTO pulse = analyticsController.getPulse().getBody();
            AnalyticsDTOs.BehaviorAnalysisDTO behavior = analyticsController.getBehavior().getBody();
            AnalyticsDTOs.FinancialStoryDTO story = financialStoryService.generateFinancialStory();

            double changePct = pulse != null ? pulse.getExpenseChangePct() : 0.0;
            String direction = changePct >= 0 ? "increased by " + String.format("%.1f%%", changePct) : "decreased by " + String.format("%.1f%%", Math.abs(changePct));

            answer.append("Your expenses ").append(direction).append(" compared to last month.\n\n");
            answer.append("Key Drivers & Discretionary Spikes:\n");
            if (story != null && story.getTopCategory() != null) {
                answer.append("• **1. ").append(story.getTopCategory()).append("**: Leading category with ₹")
                        .append(story.getTopCategoryAmount()).append(" recorded.\n");
            }
            if (behavior != null && behavior.getLargestTransactionDescription() != null) {
                answer.append("• **2. Major Outflow**: Single transaction of ₹")
                        .append(behavior.getLargestTransactionAmount())
                        .append(" at ").append(behavior.getLargestTransactionDescription()).append(".\n");
                answer.append("• **3. Average Ticket Size**: ₹")
                        .append(behavior.getAvgTransactionSize()).append(" across your recorded purchases.\n");
            }

            dataPoints.add("Month-over-month expense variance analysis");
            dataPoints.add("Top category outflow: " + (story != null ? story.getTopCategory() : "N/A"));
            followUps.add("How can I save more money?");
            followUps.add("Which budget is most at risk?");
            followUps.add("Can I afford a ₹50,000 laptop?");

        } else if (q.contains("where") && (q.contains("money") || q.contains("spend") || q.contains("category"))) {
            AnalyticsDTOs.FinancialStoryDTO story = financialStoryService.generateFinancialStory();
            AnalyticsDTOs.BehaviorAnalysisDTO behavior = analyticsController.getBehavior().getBody();

            answer.append("Based on your recorded transaction history:\n\n");
            if (story != null) {
                answer.append("• ").append(story.getHeadline()).append(".\n");
                answer.append("• ").append(story.getNarrative()).append("\n\n");
            }
            if (behavior != null) {
                answer.append("• Average transaction size: ₹").append(behavior.getAvgTransactionSize()).append("\n");
                answer.append("• Largest transaction: ₹").append(behavior.getLargestTransactionAmount())
                        .append(" (").append(behavior.getLargestTransactionDescription()).append(").\n");
            }

            dataPoints.add("Category spending aggregates");
            if (story != null && story.getTopCategory() != null) {
                dataPoints.add("Top expense category: " + story.getTopCategory() + " (₹" + story.getTopCategoryAmount() + ")");
            }
            followUps.add("Which budget is most at risk?");
            followUps.add("Can I afford a ₹50,000 purchase?");
            followUps.add("Why did my expenses increase this month?");

        } else if (q.contains("afford") || q.contains("buy") || q.contains("laptop") || q.contains("purchase")) {
            BigDecimal amount = BigDecimal.valueOf(50000);
            String cleaned = q.replaceAll("[^0-9]", "");
            if (!cleaned.isEmpty()) {
                try {
                    amount = new BigDecimal(cleaned);
                } catch (Exception ignored) {}
            }

            AnalyticsDTOs.DecisionRequest decisionReq = AnalyticsDTOs.DecisionRequest.builder()
                    .title("Requested Purchase")
                    .amount(amount)
                    .paymentMethod("LUMP_SUM")
                    .build();

            AnalyticsDTOs.DecisionResponse eval = analyticsController.evaluateDecision(decisionReq).getBody();

            if (eval != null) {
                answer.append("Exact financial impact assessment for a ₹").append(amount).append(" purchase:\n\n");
                answer.append("• **Recommendation**: ").append(eval.getRecommendation()).append("\n");
                answer.append("• **Budget Pressure**: ").append(eval.getBudgetPressureLevel()).append("\n");
                answer.append("• **Immediate Cash Impact**: ₹").append(eval.getImmediateBalanceImpact()).append("\n");
                if (eval.getGoalDelayMonths() > 0) {
                    answer.append("• **Estimated Goal Delay**: ~").append(String.format("%.1f", eval.getGoalDelayMonths())).append(" months across active savings goals.\n");
                }
                answer.append("• **Health Score Impact**: ").append(eval.getHealthScoreImpact()).append(" points.\n");
                for (String detail : eval.getEvaluationBreakdown()) {
                    answer.append("  - ").append(detail).append("\n");
                }
            }

            dataPoints.add("Decision Engine multi-dimensional evaluation");
            dataPoints.add("Evaluated purchase amount: ₹" + amount);
            followUps.add("What happens if I save ₹5,000 more each month?");
            followUps.add("Where did most of my money go this month?");

        } else if (q.contains("subscription") || q.contains("recurring") || q.contains("bill")) {
            AnalyticsDTOs.SubscriptionSummaryDTO sub = financialTools.getSubscriptionSummary();
            answer.append("Here is your subscription and recurring obligations summary:\n\n");
            if (sub != null) {
                answer.append("• **Monthly Commitment**: ₹").append(sub.getTotalMonthlyCost()).append("\n");
                answer.append("• **Annualized Commitment**: ₹").append(sub.getTotalAnnualCost()).append("\n");
                answer.append("• **Active Subscriptions**: ").append(sub.getTotalActiveSubscriptions()).append(" items\n\n");
                if (sub.getItems() != null && !sub.getItems().isEmpty()) {
                    answer.append("Upcoming / Top Active Recurring Items:\n");
                    sub.getItems().stream().limit(5).forEach(item ->
                            answer.append("• ").append(item.getName())
                                    .append(" (₹").append(item.getAmount()).append(", ")
                                    .append(item.getFrequency()).append(")\n")
                    );
                }
            } else {
                answer.append("No active recurring subscriptions detected.\n");
            }

            dataPoints.add("Recurring cost normalizer & subscription detector");
            followUps.add("How can I save more money?");
            followUps.add("Show my financial health score");

        } else if (q.contains("budget") || q.contains("risk") || q.contains("limit")) {
            AnalyticsDTOs.ForecastDTO forecast = financialTools.getForecast();

            answer.append("Here is your current budget risk analysis:\n\n");
            if (forecast != null && forecast.getCategoryRisks() != null && !forecast.getCategoryRisks().isEmpty()) {
                for (AnalyticsDTOs.CategoryRiskDTO r : forecast.getCategoryRisks()) {
                    answer.append("• **").append(r.getCategoryName()).append("**: Spent ₹").append(r.getSpentAmount())
                            .append(" / ₹").append(r.getBudgetAmount()).append(" (Status: ").append(r.getRiskLevel()).append(")\n");
                }
            } else {
                answer.append("All category budgets are currently within safe limits.\n");
            }

            dataPoints.add("Run-rate forecast service category risk assessment");
            followUps.add("Where did most of my money go this month?");
            followUps.add("Show my financial health score");

        } else if (q.contains("health") || q.contains("score")) {
            AnalyticsDTOs.FinancialHealth2DTO health = financialTools.getFinancialHealth();

            if (health != null) {
                answer.append("Your current Financial Health Score is **").append(health.getOverallScore()).append("/100** (Rating: **")
                        .append(health.getRating()).append("**).\n\n");
                answer.append("Score Breakdown:\n");
                answer.append("• Savings Discipline: ").append(health.getSavingsScore()).append("/100\n");
                answer.append("• Budget Adherence: ").append(health.getBudgetDisciplineScore()).append("/100\n");
                answer.append("• Expense Stability: ").append(health.getStabilityScore()).append("/100\n");
                answer.append("• Goal Progress: ").append(health.getGoalProgressScore()).append("/100\n");
                answer.append("• Obligation Ratio: ").append(health.getObligationScore()).append("/100\n\n");

                if (!health.getActionItems().isEmpty()) {
                    answer.append("Top Priority: ").append(health.getActionItems().get(0));
                }
            }

            dataPoints.add("Financial Health 2.0 multi-pillar scoring engine");
            followUps.add("Which budget is most at risk?");
            followUps.add("Can I afford a ₹50,000 purchase?");

        } else if (q.contains("save") || q.contains("reduce") || q.contains("cut")) {
            AnalyticsDTOs.FinancialPulseDTO pulse = analyticsController.getPulse().getBody();
            AnalyticsDTOs.SubscriptionSummaryDTO sub = financialTools.getSubscriptionSummary();

            answer.append("Targeted strategies to accelerate your savings:\n\n");
            if (pulse != null && pulse.getMonthlyIncome().compareTo(BigDecimal.ZERO) > 0) {
                BigDecimal tenPct = pulse.getMonthlyIncome().multiply(BigDecimal.valueOf(0.10));
                answer.append("1. **Rule-of-Thumb 10% Boost**: Saving an additional ₹")
                        .append(tenPct).append(" per month would raise your savings rate to ")
                        .append(String.format("%.1f%%", pulse.getSavingsRate() + 10)).append(".\n");
            }
            if (sub != null && sub.getTotalActiveSubscriptions() > 0) {
                answer.append("2. **Subscription Audit**: You have ").append(sub.getTotalActiveSubscriptions())
                        .append(" recurring commitments totaling ₹").append(sub.getTotalMonthlyCost())
                        .append("/month. Canceling 1-2 unused services saves money immediately.\n");
            }
            answer.append("3. **Budget Caps**: Set a hard spending limit on your top discretionary categories.\n");

            dataPoints.add("Savings optimization engine");
            followUps.add("Analyze my subscription expenses");
            followUps.add("Show my financial health score");

        } else {
            // General status
            Map<String, Object> summary = financialTools.getMonthlySummary();
            AnalyticsDTOs.FinancialStoryDTO story = financialStoryService.generateFinancialStory();

            answer.append("Here is your current financial status summary:\n\n");
            answer.append("• **Financial Pulse**: ").append(summary.getOrDefault("pulseScore", 0)).append("/100 (")
                    .append(summary.getOrDefault("status", "Evaluating")).append(")\n");
            answer.append("• **Monthly Income**: ₹").append(summary.getOrDefault("income", 0)).append("\n");
            answer.append("• **Monthly Expenses**: ₹").append(summary.getOrDefault("expense", 0)).append("\n");
            answer.append("• **Monthly Savings Rate**: ").append(summary.getOrDefault("savingsRate", 0)).append("%\n\n");
            if (story != null && story.getHeadline() != null) {
                answer.append("Story Headline: ").append(story.getHeadline());
            }

            dataPoints.add("Dashboard summary & Financial Pulse engine");
            followUps.add("Where did most of my money go this month?");
            followUps.add("Why did my expenses increase this month?");
            followUps.add("Can I afford a ₹50,000 laptop?");
        }

        return CopilotResponse.builder()
                .question(req.getQuestion())
                .answer(answer.toString())
                .sourceDataPoints(dataPoints)
                .suggestedFollowUps(followUps)
                .build();
    }
}

