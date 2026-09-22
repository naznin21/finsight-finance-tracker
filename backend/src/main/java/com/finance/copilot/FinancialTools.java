package com.finance.copilot;

import com.finance.account.AccountService;
import com.finance.analytics.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.Map;

@Component
@RequiredArgsConstructor
public class FinancialTools {

    private final FinancialHealthService financialHealthService;
    private final ForecastingService forecastingService;
    private final AnalyticsController analyticsController;
    private final AccountService accountService;

    public Map<String, Object> getMonthlySummary() {
        AnalyticsDTOs.FinancialPulseDTO pulse = analyticsController.getPulse().getBody();
        Map<String, Object> map = new HashMap<>();
        if (pulse != null) {
            map.put("income", pulse.getMonthlyIncome());
            map.put("expense", pulse.getMonthlyExpenses());
            map.put("savings", pulse.getMonthlySavings());
            map.put("savingsRate", pulse.getSavingsRate());
            map.put("pulseScore", pulse.getScore());
            map.put("status", pulse.getHealthStatus());
        }
        return map;
    }

    public AnalyticsDTOs.FinancialHealth2DTO getFinancialHealth() {
        return financialHealthService.getFinancialHealth();
    }

    public AnalyticsDTOs.ForecastDTO getForecast() {
        return forecastingService.getForecast();
    }

    public AnalyticsDTOs.SubscriptionSummaryDTO getSubscriptionSummary() {
        return analyticsController.getSubscriptions().getBody();
    }

    public AnalyticsDTOs.BehaviorAnalysisDTO getCategorySpending() {
        return analyticsController.getBehavior().getBody();
    }

    public Object getAccountBalances() {
        return accountService.getAll();
    }
}
