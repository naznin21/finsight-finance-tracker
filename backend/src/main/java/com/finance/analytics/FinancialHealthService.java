package com.finance.analytics;

import com.finance.budget.Budget;
import com.finance.budget.BudgetRepository;
import com.finance.goal.GoalRepository;
import com.finance.goal.SavingsGoal;
import com.finance.recurring.RecurringCostNormalizer;
import com.finance.recurring.RecurringRepository;
import com.finance.recurring.RecurringTransaction;
import com.finance.transaction.Transaction;
import com.finance.transaction.TransactionRepository;
import com.finance.transaction.TransactionType;
import com.finance.user.User;
import com.finance.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class FinancialHealthService {

    private final TransactionRepository transactionRepository;
    private final BudgetRepository budgetRepository;
    private final GoalRepository goalRepository;
    private final RecurringRepository recurringRepository;
    private final UserRepository userRepository;

    private User currentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email).orElseThrow();
    }

    public AnalyticsDTOs.FinancialHealth2DTO getFinancialHealth() {
        User user = currentUser();
        YearMonth currentYm = YearMonth.now();

        AnalyticsDTOs.FinancialHealth2DTO currentHealth = calculateHealthForMonth(user, currentYm);

        // Historical 4-month trend calculation
        List<AnalyticsDTOs.MonthHealthTrend> trend = new ArrayList<>();
        for (int i = 3; i >= 0; i--) {
            YearMonth ym = currentYm.minusMonths(i);
            AnalyticsDTOs.FinancialHealth2DTO h = calculateHealthForMonth(user, ym);
            trend.add(AnalyticsDTOs.MonthHealthTrend.builder()
                    .month(ym.getMonth().name().substring(0, 3) + " " + ym.getYear())
                    .score(h.getOverallScore())
                    .build());
        }

        currentHealth.setTrend(trend);
        return currentHealth;
    }

    public AnalyticsDTOs.FinancialHealth2DTO calculateHealthForMonth(User user, YearMonth ym) {
        LocalDate from = ym.atDay(1);
        LocalDate to = ym.atEndOfMonth();

        BigDecimal income = transactionRepository.sumByTypeAndDateRange(user, TransactionType.INCOME, from, to);
        if (income == null) income = BigDecimal.ZERO;

        BigDecimal expense = transactionRepository.sumByTypeAndDateRange(user, TransactionType.EXPENSE, from, to);
        if (expense == null) expense = BigDecimal.ZERO;

        // 1. Savings Score (25%)
        int savingsScore = 50;
        if (income.compareTo(BigDecimal.ZERO) > 0) {
            double savingsRate = income.subtract(expense).divide(income, 4, RoundingMode.HALF_UP).doubleValue() * 100;
            if (savingsRate >= 40) savingsScore = 100;
            else if (savingsRate >= 25) savingsScore = 85;
            else if (savingsRate >= 15) savingsScore = 70;
            else if (savingsRate >= 0) savingsScore = (int) Math.max(20, savingsRate * 3.5);
            else savingsScore = 10;
        }

        // 2. Budget Discipline Score (25%)
        List<Budget> budgets = budgetRepository.findByUserAndMonth(user, ym.toString());
        int budgetScore = 75;
        if (!budgets.isEmpty()) {
            int compliantBudgets = 0;
            for (Budget b : budgets) {
                BigDecimal spent = transactionRepository.sumByCategoryAndTypeAndDateRange(
                        user, b.getCategory().getId(), TransactionType.EXPENSE, from, to);
                if (spent == null) spent = BigDecimal.ZERO;
                BigDecimal allowed = b.getAmount().add(b.getRolledOverAmount() != null ? b.getRolledOverAmount() : BigDecimal.ZERO);
                if (spent.compareTo(allowed) <= 0) {
                    compliantBudgets++;
                }
            }
            budgetScore = (int) Math.round(((double) compliantBudgets / budgets.size()) * 100);
        }

        // 3. Expense Stability Score (20%) — Mathematical StdDev & Coefficient of Variation
        List<Double> monthlyTotals = new ArrayList<>();
        for (int i = 5; i >= 0; i--) {
            YearMonth pastYm = ym.minusMonths(i);
            BigDecimal pastExp = transactionRepository.sumByTypeAndDateRange(
                    user, TransactionType.EXPENSE, pastYm.atDay(1), pastYm.atEndOfMonth());
            if (pastExp != null && pastExp.compareTo(BigDecimal.ZERO) > 0) {
                monthlyTotals.add(pastExp.doubleValue());
            }
        }

        int stabilityScore = 70;
        if (monthlyTotals.size() >= 2) {
            double mean = monthlyTotals.stream().mapToDouble(Double::doubleValue).average().orElse(0);
            if (mean > 0) {
                double variance = monthlyTotals.stream().mapToDouble(v -> Math.pow(v - mean, 2)).average().orElse(0);
                double stdDev = Math.sqrt(variance);
                double cv = stdDev / mean; // Coefficient of Variation

                if (cv <= 0.15) stabilityScore = 95;
                else if (cv <= 0.30) stabilityScore = 80;
                else if (cv <= 0.50) stabilityScore = 60;
                else stabilityScore = 40;
            }
        }

        // 4. Goal Progress Score (15%)
        List<SavingsGoal> goals = goalRepository.findByUserOrderByCreatedAtDesc(user);
        int goalScore = 70;
        if (!goals.isEmpty()) {
            double avgProgress = goals.stream().mapToDouble(g -> {
                if (g.getTargetAmount() == null || g.getTargetAmount().compareTo(BigDecimal.ZERO) == 0) return 100;
                return g.getSavedAmount().divide(g.getTargetAmount(), 4, RoundingMode.HALF_UP).doubleValue() * 100;
            }).average().orElse(70);
            goalScore = (int) Math.min(100, Math.max(10, avgProgress));
        }

        // 5. Recurring Obligation Ratio Score (15%) — Normalized Monthly Cost
        List<RecurringTransaction> recurringList = recurringRepository.findByUser(user);
        BigDecimal normalizedRecurringExpense = RecurringCostNormalizer.sumMonthly(recurringList);

        int obligationScore = 80;
        if (income.compareTo(BigDecimal.ZERO) > 0) {
            double recurringRatio = (normalizedRecurringExpense.doubleValue() / income.doubleValue()) * 100;
            if (recurringRatio <= 25) obligationScore = 95;
            else if (recurringRatio <= 40) obligationScore = 80;
            else if (recurringRatio <= 60) obligationScore = 55;
            else obligationScore = 30;
        }

        // Weighted Overall Score
        int overall = (int) Math.round(
                (savingsScore * 0.25) +
                (budgetScore * 0.25) +
                (stabilityScore * 0.20) +
                (goalScore * 0.15) +
                (obligationScore * 0.15)
        );

        String rating;
        if (overall >= 80) rating = "Excellent";
        else if (overall >= 70) rating = "Healthy";
        else if (overall >= 55) rating = "Moderate";
        else rating = "Needs Attention";

        List<String> actionItems = new ArrayList<>();
        if (savingsScore < 70) actionItems.add("Increase your savings rate to at least 20% of monthly income.");
        if (budgetScore < 80) actionItems.add("Adjust category spending limits that were exceeded this month.");
        if (stabilityScore < 65) actionItems.add("High monthly spending variation detected (CV > 30%). Smooth out discretionary spikes.");
        if (obligationScore < 60) actionItems.add("Normalized recurring obligations consume > 40% of income. Audit optional subscriptions.");
        if (actionItems.isEmpty()) actionItems.add("Your financial posture is strong and disciplined.");

        return AnalyticsDTOs.FinancialHealth2DTO.builder()
                .overallScore(overall)
                .rating(rating)
                .savingsScore(savingsScore)
                .budgetDisciplineScore(budgetScore)
                .stabilityScore(stabilityScore)
                .goalProgressScore(goalScore)
                .obligationScore(obligationScore)
                .actionItems(actionItems)
                .build();
    }
}
