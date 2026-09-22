package com.finance.analytics;

import com.finance.goal.GoalRepository;
import com.finance.goal.SavingsGoal;
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
public class SimulatorService {

    private final TransactionRepository transactionRepository;
    private final GoalRepository goalRepository;
    private final UserRepository userRepository;

    private User currentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email).orElseThrow();
    }

    public AnalyticsDTOs.SimulatorResponse simulate(AnalyticsDTOs.SimulatorRequest req) {
        User user = currentUser();
        YearMonth ym = YearMonth.now();
        LocalDate from = ym.atDay(1);
        LocalDate to = ym.atEndOfMonth();

        BigDecimal baselineIncome = transactionRepository.sumByTypeAndDateRange(user, TransactionType.INCOME, from, to);
        if (baselineIncome == null) {
            // Check past 3 months
            BigDecimal pastInc = transactionRepository.sumByTypeAndDateRange(user, TransactionType.INCOME, from.minusMonths(3), to);
            baselineIncome = pastInc != null ? pastInc.divide(BigDecimal.valueOf(3), 2, RoundingMode.HALF_UP) : BigDecimal.ZERO;
        }

        BigDecimal baselineExpense = transactionRepository.sumByTypeAndDateRange(user, TransactionType.EXPENSE, from, to);
        if (baselineExpense == null) {
            BigDecimal pastExp = transactionRepository.sumByTypeAndDateRange(user, TransactionType.EXPENSE, from.minusMonths(3), to);
            baselineExpense = pastExp != null ? pastExp.divide(BigDecimal.valueOf(3), 2, RoundingMode.HALF_UP) : BigDecimal.ZERO;
        }

        BigDecimal baselineSavings = baselineIncome.subtract(baselineExpense);
        double baselineSavingsRate = baselineIncome.compareTo(BigDecimal.ZERO) > 0
                ? (baselineSavings.divide(baselineIncome, 4, RoundingMode.HALF_UP).doubleValue() * 100) : 0;

        // Apply scenario deltas
        BigDecimal newIncome = baselineIncome;
        if (req.getIncomeChangePct() != 0) {
            BigDecimal delta = baselineIncome.multiply(BigDecimal.valueOf(req.getIncomeChangePct() / 100.0));
            newIncome = baselineIncome.add(delta);
        }

        BigDecimal newExpense = baselineExpense;
        if (req.getRentChangeAmount() != null) {
            newExpense = newExpense.add(req.getRentChangeAmount());
        }

        if (req.getCategoryCutPct() > 0 && req.getTargetCategory() != null) {
            // Cut specific category spending
            BigDecimal catSpent = transactionRepository.categorySpending(user, from, to).stream()
                    .filter(row -> req.getTargetCategory().equalsIgnoreCase((String) row[0]))
                    .map(row -> (BigDecimal) row[1])
                    .findFirst().orElse(BigDecimal.ZERO);
            BigDecimal cut = catSpent.multiply(BigDecimal.valueOf(req.getCategoryCutPct() / 100.0));
            newExpense = newExpense.subtract(cut);
        }

        BigDecimal newSavings = newIncome.subtract(newExpense);
        if (req.getMonthlySavingsDelta() != null) {
            newSavings = newSavings.add(req.getMonthlySavingsDelta());
        }

        double newSavingsRate = newIncome.compareTo(BigDecimal.ZERO) > 0
                ? (newSavings.divide(newIncome, 4, RoundingMode.HALF_UP).doubleValue() * 100) : 0;

        // Goal impacts
        List<SavingsGoal> goals = goalRepository.findByUserOrderByCreatedAtDesc(user);
        List<AnalyticsDTOs.GoalImpactDTO> goalImpacts = new ArrayList<>();

        for (SavingsGoal g : goals) {
            BigDecimal remaining = g.getTargetAmount().subtract(g.getSavedAmount());
            if (remaining.compareTo(BigDecimal.ZERO) <= 0) continue;

            double baseMonthlyRate = Math.max(100, baselineSavings.doubleValue());
            double newMonthlyRate = Math.max(100, newSavings.doubleValue());

            long baseMonths = (long) Math.ceil(remaining.doubleValue() / baseMonthlyRate);
            long newMonths = (long) Math.ceil(remaining.doubleValue() / newMonthlyRate);

            LocalDate baseDate = LocalDate.now().plusMonths(baseMonths);
            LocalDate newDate = LocalDate.now().plusMonths(newMonths);

            double deltaMonths = newMonths - baseMonths;
            String status = deltaMonths < 0 ? "ACCELERATED" : (deltaMonths > 0 ? "DELAYED" : "UNCHANGED");

            goalImpacts.add(AnalyticsDTOs.GoalImpactDTO.builder()
                    .goalId(g.getId())
                    .goalName(g.getName())
                    .baselineCompletionDate(baseDate.toString())
                    .newCompletionDate(newDate.toString())
                    .monthsDelta(Math.abs(deltaMonths))
                    .status(status)
                    .build());
        }

        List<String> insights = new ArrayList<>();
        if (newSavings.compareTo(baselineSavings) > 0) {
            BigDecimal diff = newSavings.subtract(baselineSavings);
            insights.add("This decision increases your monthly savings by ₹" + diff + " (" + String.format("%.1f", newSavingsRate - baselineSavingsRate) + "% rate increase).");
        } else if (newSavings.compareTo(baselineSavings) < 0) {
            BigDecimal diff = baselineSavings.subtract(newSavings);
            insights.add("This decision reduces your monthly savings by ₹" + diff + ". Ensure your emergency fund can absorb this change.");
        } else {
            insights.add("This scenario maintains your current financial baseline.");
        }

        return AnalyticsDTOs.SimulatorResponse.builder()
                .baselineSavings(baselineSavings)
                .newSavings(newSavings)
                .baselineSavingsRate(baselineSavingsRate)
                .newSavingsRate(newSavingsRate)
                .baselineMonthEndBalance(baselineSavings)
                .newMonthEndBalance(newSavings)
                .goalImpacts(goalImpacts)
                .insights(insights)
                .build();
    }
}
