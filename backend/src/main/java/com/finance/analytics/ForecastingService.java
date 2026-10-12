package com.finance.analytics;

import com.finance.budget.Budget;
import com.finance.budget.BudgetRepository;
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
public class ForecastingService {

    private final TransactionRepository transactionRepository;
    private final BudgetRepository budgetRepository;
    private final RecurringRepository recurringRepository;
    private final UserRepository userRepository;

    private User currentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email).orElseThrow();
    }

    public AnalyticsDTOs.ForecastDTO getForecast() {
        User user = currentUser();
        YearMonth ym = YearMonth.now();
        LocalDate now = LocalDate.now();
        LocalDate from = ym.atDay(1);
        LocalDate to = ym.atEndOfMonth();

        BigDecimal income = transactionRepository.sumByTypeAndDateRange(user, TransactionType.INCOME, from, to);
        if (income == null) income = BigDecimal.ZERO;

        BigDecimal expense = transactionRepository.sumByTypeAndDateRange(user, TransactionType.EXPENSE, from, to);
        if (expense == null) expense = BigDecimal.ZERO;

        int totalDays = ym.lengthOfMonth();
        int dayOfMonth = Math.max(1, now.getDayOfMonth());

        // Normalized recurring obligations
        List<RecurringTransaction> recurringList = recurringRepository.findByUser(user);
        BigDecimal normalizedRecurring = RecurringCostNormalizer.sumMonthly(recurringList);

        // Find recurring expenses already recorded this month to avoid run-rate distortion & double-counting
        List<Transaction> monthTransactions = transactionRepository.findByUserAndDateBetweenOrderByDateDesc(user, from, to);
        BigDecimal recurringIncurredThisMonth = monthTransactions.stream()
                .filter(t -> t.getType() == TransactionType.EXPENSE && t.getDescription() != null && t.getDescription().contains("(Recurring)"))
                .map(Transaction::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // 1. Component 1: Discretionary run rate + fixed obligations (50%)
        BigDecimal discretionaryExpense = expense.subtract(recurringIncurredThisMonth).max(BigDecimal.ZERO);
        BigDecimal dailyDiscretionaryRate = discretionaryExpense.divide(BigDecimal.valueOf(dayOfMonth), 2, RoundingMode.HALF_UP);
        BigDecimal projectedDiscretionary = dailyDiscretionaryRate.multiply(BigDecimal.valueOf(totalDays));
        BigDecimal runRateProjection = projectedDiscretionary.add(normalizedRecurring);

        // 2. Component 2: Historical 6-month average (30%)
        List<BigDecimal> pastExpenses = new ArrayList<>();
        for (int i = 1; i <= 6; i++) {
            YearMonth pastYm = ym.minusMonths(i);
            BigDecimal pastExp = transactionRepository.sumByTypeAndDateRange(
                    user, TransactionType.EXPENSE, pastYm.atDay(1), pastYm.atEndOfMonth());
            if (pastExp != null && pastExp.compareTo(BigDecimal.ZERO) > 0) {
                pastExpenses.add(pastExp);
            }
        }

        BigDecimal historicalAvg = pastExpenses.isEmpty() ? expense :
                pastExpenses.stream().reduce(BigDecimal.ZERO, BigDecimal::add)
                        .divide(BigDecimal.valueOf(pastExpenses.size()), 2, RoundingMode.HALF_UP);

        // 3. Component 3: Recent trend (last month vs month before) (20%)
        BigDecimal lastMonthExp = transactionRepository.sumByTypeAndDateRange(
                user, TransactionType.EXPENSE, ym.minusMonths(1).atDay(1), ym.minusMonths(1).atEndOfMonth());
        if (lastMonthExp == null) lastMonthExp = historicalAvg;
        BigDecimal recentTrendProjection = lastMonthExp;

        // Weighted Average Calculation: 50% run-rate projection, 30% historical, 20% recent trend
        BigDecimal weightedExpense = runRateProjection.multiply(BigDecimal.valueOf(0.50))
                .add(historicalAvg.multiply(BigDecimal.valueOf(0.30)))
                .add(recentTrendProjection.multiply(BigDecimal.valueOf(0.20)))
                .setScale(2, RoundingMode.HALF_UP);

        // Ensure projection is at least current month expense
        BigDecimal finalProjectedExpense = weightedExpense.max(expense);
        BigDecimal projectedBalance = income.subtract(finalProjectedExpense);
        BigDecimal projectedSavings = income.subtract(finalProjectedExpense);
        double projectedSavingsRate = income.compareTo(BigDecimal.ZERO) > 0
                ? (projectedSavings.divide(income, 4, RoundingMode.HALF_UP).doubleValue() * 100) : 0;

        // Estimated range & Confidence level
        BigDecimal margin = finalProjectedExpense.multiply(BigDecimal.valueOf(0.08)).setScale(2, RoundingMode.HALF_UP);
        String confidence = pastExpenses.size() >= 3 ? "High" : (pastExpenses.size() >= 1 ? "Medium" : "Low");

        // Category budget risks
        List<Budget> budgets = budgetRepository.findByUserAndMonth(user, ym.toString());
        List<AnalyticsDTOs.CategoryRiskDTO> categoryRisks = new ArrayList<>();

        for (Budget b : budgets) {
            BigDecimal catSpent = transactionRepository.sumByCategoryAndTypeAndDateRange(
                    user, b.getCategory().getId(), TransactionType.EXPENSE, from, to);
            if (catSpent == null) catSpent = BigDecimal.ZERO;

            BigDecimal catDaily = catSpent.divide(BigDecimal.valueOf(dayOfMonth), 2, RoundingMode.HALF_UP);
            BigDecimal catProjected = catDaily.multiply(BigDecimal.valueOf(totalDays));
            BigDecimal allowed = b.getAmount().add(b.getRolledOverAmount() != null ? b.getRolledOverAmount() : BigDecimal.ZERO);

            String riskLevel;
            if (catSpent.compareTo(allowed) >= 0) riskLevel = "EXCEEDED";
            else if (catProjected.compareTo(allowed) > 0) riskLevel = "AT_RISK";
            else if (catSpent.divide(allowed, 2, RoundingMode.HALF_UP).doubleValue() >= 0.7) riskLevel = "WATCH";
            else riskLevel = "SAFE";

            categoryRisks.add(AnalyticsDTOs.CategoryRiskDTO.builder()
                    .categoryName(b.getCategory().getName())
                    .budgetAmount(allowed)
                    .spentAmount(catSpent)
                    .projectedAmount(catProjected)
                    .riskLevel(riskLevel)
                    .build());
        }

        return AnalyticsDTOs.ForecastDTO.builder()
                .month(ym.toString())
                .currentIncome(income)
                .currentExpense(expense)
                .projectedMonthEndExpense(finalProjectedExpense)
                .projectedMonthEndBalance(projectedBalance)
                .projectedSavings(projectedSavings)
                .projectedSavingsRate(projectedSavingsRate)
                .forecastMethod("Weighted Model (40% Run Rate, 30% Hist Avg, 20% Trend, 10% Recurring) [Confidence: " + confidence + "]")
                .categoryRisks(categoryRisks)
                .build();
    }
}
