package com.finance.analytics;

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
import java.util.List;

@Service
@RequiredArgsConstructor
public class FinancialStoryService {

    private final TransactionRepository transactionRepository;
    private final UserRepository userRepository;

    private User currentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email).orElseThrow();
    }

    public AnalyticsDTOs.FinancialStoryDTO generateFinancialStory() {
        User user = currentUser();
        YearMonth currentYm = YearMonth.now();
        YearMonth prevYm = currentYm.minusMonths(1);

        LocalDate currentFrom = currentYm.atDay(1);
        LocalDate currentTo = currentYm.atEndOfMonth();

        LocalDate prevFrom = prevYm.atDay(1);
        LocalDate prevTo = prevYm.atEndOfMonth();

        BigDecimal currIncome = transactionRepository.sumByTypeAndDateRange(user, TransactionType.INCOME, currentFrom, currentTo);
        if (currIncome == null) currIncome = BigDecimal.ZERO;

        BigDecimal currExpense = transactionRepository.sumByTypeAndDateRange(user, TransactionType.EXPENSE, currentFrom, currentTo);
        if (currExpense == null) currExpense = BigDecimal.ZERO;

        BigDecimal prevExpense = transactionRepository.sumByTypeAndDateRange(user, TransactionType.EXPENSE, prevFrom, prevTo);
        if (prevExpense == null) prevExpense = BigDecimal.ZERO;

        double expenseChangePct = 0;
        if (prevExpense.compareTo(BigDecimal.ZERO) > 0) {
            expenseChangePct = currExpense.subtract(prevExpense)
                    .divide(prevExpense, 4, RoundingMode.HALF_UP).doubleValue() * 100;
        }

        List<Object[]> categoryData = transactionRepository.categorySpending(user, currentFrom, currentTo);
        String topCategory = "General";
        BigDecimal topCategoryAmount = BigDecimal.ZERO;

        if (!categoryData.isEmpty()) {
            topCategory = (String) categoryData.get(0)[0];
            topCategoryAmount = (BigDecimal) categoryData.get(0)[1];
        }

        String headline;
        StringBuilder narrative = new StringBuilder();

        if (expenseChangePct < 0) {
            headline = String.format("Expenses decreased by %.1f%% this month", Math.abs(expenseChangePct));
            narrative.append(String.format("Your total expenses fell to ₹%s this month (a %.1f%% drop compared to last month). ",
                    currExpense, Math.abs(expenseChangePct)));
        } else if (expenseChangePct > 0) {
            headline = String.format("Expenses increased by %.1f%% this month", expenseChangePct);
            narrative.append(String.format("Your spending rose to ₹%s this month (up %.1f%% from last month). ",
                    currExpense, expenseChangePct));
        } else {
            headline = "Expenses remained consistent with last month";
            narrative.append(String.format("Your total expenses held steady at ₹%s this month. ", currExpense));
        }

        if (topCategoryAmount.compareTo(BigDecimal.ZERO) > 0) {
            narrative.append(String.format("Your single largest expense category was %s at ₹%s. ", topCategory, topCategoryAmount));
        }

        BigDecimal netSavings = currIncome.subtract(currExpense);
        if (netSavings.compareTo(BigDecimal.ZERO) > 0) {
            narrative.append(String.format("You generated a net positive surplus of ₹%s for savings and goals.", netSavings));
        } else if (currIncome.compareTo(BigDecimal.ZERO) > 0) {
            narrative.append("Your expenses exceeded your income this month. Focus on reducing discretionary spending next month.");
        } else {
            narrative.append("Add more transactions to unlock deeper historical narrative comparisons.");
        }

        String keyTakeaway = netSavings.compareTo(BigDecimal.ZERO) > 0
                ? "On track: Surplus balance supports your financial goals."
                : "Watch out: High expense ratio requires budget tightening.";

        return AnalyticsDTOs.FinancialStoryDTO.builder()
                .month(currentYm.getMonth().name() + " " + currentYm.getYear())
                .headline(headline)
                .narrative(narrative.toString())
                .topCategory(topCategory)
                .topCategoryAmount(topCategoryAmount)
                .keyTakeaway(keyTakeaway)
                .build();
    }
}
