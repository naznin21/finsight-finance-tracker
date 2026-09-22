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

@Service
@RequiredArgsConstructor
public class CopilotService {

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

        if (q.contains("where") && (q.contains("money") || q.contains("spend") || q.contains("category"))) {
            AnalyticsDTOs.FinancialStoryDTO story = financialStoryService.generateFinancialStory();
            AnalyticsDTOs.BehaviorAnalysisDTO behavior = analyticsController.getBehavior().getBody();

            answer.append("Based on your actual backend transaction history:\n\n");
            answer.append("• ").append(story.getHeadline()).append(".\n");
            answer.append("• ").append(story.getNarrative()).append("\n\n");
            if (behavior != null) {
                answer.append("• Average transaction size: ₹").append(behavior.getAvgTransactionSize()).append("\n");
                answer.append("• Largest transaction: ₹").append(behavior.getLargestTransactionAmount())
                        .append(" (").append(behavior.getLargestTransactionDescription()).append(").\n");
            }

            dataPoints.add("Category spending aggregates");
            dataPoints.add("Top expense category: " + story.getTopCategory() + " (₹" + story.getTopCategoryAmount() + ")");
            followUps.add("Which budget is most at risk?");
            followUps.add("Can I afford a ₹50,000 purchase?");

        } else if (q.contains("afford") || q.contains("buy") || q.contains("laptop") || q.contains("purchase")) {
            // Extract numeric amount if present, default 50000
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

            answer.append("Here is the exact financial impact calculation for a ₹").append(amount).append(" purchase:\n\n");
            answer.append("• **Recommendation**: ").append(eval.getRecommendation()).append("\n");
            answer.append("• **Budget Pressure**: ").append(eval.getBudgetPressureLevel()).append("\n");
            answer.append("• **Immediate Cash Impact**: ₹").append(eval.getImmediateBalanceImpact()).append("\n");
            if (eval.getGoalDelayMonths() > 0) {
                answer.append("• **Estimated Goal Delay**: ~").append(String.format("%.1f", eval.getGoalDelayMonths())).append(" months across active savings goals.\n");
            }
            answer.append("• **Health Score Impact**: ").append(eval.getHealthScoreImpact()).append(" points.\n");

            dataPoints.add("Decision Engine multi-dimensional evaluation");
            dataPoints.add("Evaluated purchase amount: ₹" + amount);
            followUps.add("What happens if I save ₹5,000 more each month?");
            followUps.add("Where did most of my money go this month?");

        } else if (q.contains("budget") || q.contains("risk") || q.contains("limit")) {
            AnalyticsDTOs.ForecastDTO forecast = analyticsController.getForecast().getBody();

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
            followUps.add("How is my financial health score calculated?");

        } else if (q.contains("health") || q.contains("score")) {
            AnalyticsDTOs.FinancialHealth2DTO health = analyticsController.getHealth().getBody();

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

            dataPoints.add("Financial Health 2.0 multi-pillar scoring engine");
            followUps.add("Which budget is most at risk?");
            followUps.add("Can I afford a ₹50,000 purchase?");

        } else {
            // General summary
            AnalyticsDTOs.FinancialPulseDTO pulse = analyticsController.getPulse().getBody();
            AnalyticsDTOs.FinancialStoryDTO story = financialStoryService.generateFinancialStory();

            answer.append("Here is your current financial status summary:\n\n");
            answer.append("• **Financial Pulse**: ").append(pulse.getScore()).append("/100 (").append(pulse.getHealthStatus()).append(")\n");
            answer.append("• **Monthly Income**: ₹").append(pulse.getMonthlyIncome()).append("\n");
            answer.append("• **Monthly Expenses**: ₹").append(pulse.getMonthlyExpenses()).append("\n");
            answer.append("• **Monthly Savings Rate**: ").append(String.format("%.1f%%", pulse.getSavingsRate())).append("\n\n");
            answer.append("Story Headline: ").append(story.getHeadline());

            dataPoints.add("Dashboard summary & Financial Pulse engine");
            followUps.add("Where did most of my money go this month?");
            followUps.add("Can I afford a ₹60,000 purchase?");
            followUps.add("Which budget is most at risk?");
        }

        return CopilotResponse.builder()
                .question(req.getQuestion())
                .answer(answer.toString())
                .sourceDataPoints(dataPoints)
                .suggestedFollowUps(followUps)
                .build();
    }
}
