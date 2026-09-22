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
public class DigitalTwinService {

    private final TransactionRepository transactionRepository;
    private final GoalRepository goalRepository;
    private final UserRepository userRepository;

    private User currentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email).orElseThrow();
    }

    public AnalyticsDTOs.DigitalTwinDTO getDigitalTwin() {
        User user = currentUser();
        YearMonth ym = YearMonth.now();
        LocalDate from = ym.atDay(1);
        LocalDate to = ym.atEndOfMonth();

        BigDecimal income = transactionRepository.sumByTypeAndDateRange(user, TransactionType.INCOME, from, to);
        if (income == null) {
            BigDecimal pastInc = transactionRepository.sumByTypeAndDateRange(user, TransactionType.INCOME, from.minusMonths(3), to);
            income = pastInc != null ? pastInc.divide(BigDecimal.valueOf(3), 2, RoundingMode.HALF_UP) : BigDecimal.ZERO;
        }

        BigDecimal expense = transactionRepository.sumByTypeAndDateRange(user, TransactionType.EXPENSE, from, to);
        if (expense == null) {
            BigDecimal pastExp = transactionRepository.sumByTypeAndDateRange(user, TransactionType.EXPENSE, from.minusMonths(3), to);
            expense = pastExp != null ? pastExp.divide(BigDecimal.valueOf(3), 2, RoundingMode.HALF_UP) : BigDecimal.ZERO;
        }

        BigDecimal monthlySavingsCurrent = income.subtract(expense);
        BigDecimal monthlySavingsOptimized = monthlySavingsCurrent.add(income.multiply(BigDecimal.valueOf(0.10))); // +10% savings boost

        // Goal baseline calculation
        List<SavingsGoal> goals = goalRepository.findByUserOrderByCreatedAtDesc(user);
        double baselineGoalPct = 0;
        BigDecimal totalTarget = BigDecimal.ZERO;
        BigDecimal totalSaved = BigDecimal.ZERO;

        if (!goals.isEmpty()) {
            for (SavingsGoal g : goals) {
                totalTarget = totalTarget.add(g.getTargetAmount() != null ? g.getTargetAmount() : BigDecimal.ZERO);
                totalSaved = totalSaved.add(g.getSavedAmount() != null ? g.getSavedAmount() : BigDecimal.ZERO);
            }
            if (totalTarget.compareTo(BigDecimal.ZERO) > 0) {
                baselineGoalPct = totalSaved.divide(totalTarget, 4, RoundingMode.HALF_UP).doubleValue() * 100;
            }
        }

        List<AnalyticsDTOs.TrajectoryPoint> currentPath = new ArrayList<>();
        List<AnalyticsDTOs.TrajectoryPoint> optimizedPath = new ArrayList<>();

        int[] months = {0, 1, 3, 6, 12};
        String[] labels = {"Today", "1 Month", "3 Months", "6 Months", "12 Months"};

        for (int i = 0; i < months.length; i++) {
            int m = months[i];
            BigDecimal currentBal = monthlySavingsCurrent.multiply(BigDecimal.valueOf(m));
            BigDecimal currentSav = monthlySavingsCurrent.multiply(BigDecimal.valueOf(m));

            // Goal progress projection based on real savings pace vs target
            double curGoalProgress = baselineGoalPct;
            double optGoalProgress = baselineGoalPct;
            if (totalTarget.compareTo(BigDecimal.ZERO) > 0) {
                BigDecimal projectedSavedCur = totalSaved.add(monthlySavingsCurrent.multiply(BigDecimal.valueOf(m)));
                BigDecimal projectedSavedOpt = totalSaved.add(monthlySavingsOptimized.multiply(BigDecimal.valueOf(m)));

                curGoalProgress = Math.min(100.0, projectedSavedCur.divide(totalTarget, 4, RoundingMode.HALF_UP).doubleValue() * 100);
                optGoalProgress = Math.min(100.0, projectedSavedOpt.divide(totalTarget, 4, RoundingMode.HALF_UP).doubleValue() * 100);
            }

            currentPath.add(AnalyticsDTOs.TrajectoryPoint.builder()
                    .timeLabel(labels[i])
                    .projectedBalance(currentBal)
                    .projectedSavings(currentSav)
                    .averageGoalProgressPct(curGoalProgress)
                    .build());

            optimizedPath.add(AnalyticsDTOs.TrajectoryPoint.builder()
                    .timeLabel(labels[i])
                    .projectedBalance(monthlySavingsOptimized.multiply(BigDecimal.valueOf(m)))
                    .projectedSavings(monthlySavingsOptimized.multiply(BigDecimal.valueOf(m)))
                    .averageGoalProgressPct(optGoalProgress)
                    .build());
        }

        String narrative = income.compareTo(BigDecimal.ZERO) > 0
                ? "At your current pace, you will accumulate ₹" + currentPath.get(4).getProjectedSavings() +
                  " in 12 months. By optimizing discretionary spending by 10%, your projected 12-month wealth increases to ₹" +
                  optimizedPath.get(4).getProjectedSavings() + "."
                : "Insufficient transaction records to build trajectory projections. Add income and expense records to unlock your Digital Twin.";

        return AnalyticsDTOs.DigitalTwinDTO.builder()
                .currentTrajectory(currentPath)
                .optimizedTrajectory(optimizedPath)
                .summaryNarrative(narrative)
                .build();
    }
}
