package com.finance.dashboard;

import com.finance.transaction.TransactionRepository;
import com.finance.transaction.TransactionType;
import com.finance.user.User;
import com.finance.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final TransactionRepository transactionRepository;
    private final UserRepository userRepository;

    private User currentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email).orElseThrow();
    }

    public DashboardSummary getMonthlySummary(String month) {
        YearMonth ym = month.isEmpty() ? YearMonth.now() : YearMonth.parse(month);
        LocalDate from = ym.atDay(1);
        LocalDate to = ym.atEndOfMonth();
        User user = currentUser();

        BigDecimal income = transactionRepository.sumByTypeAndDateRange(user, TransactionType.INCOME, from, to);
        BigDecimal expense = transactionRepository.sumByTypeAndDateRange(user, TransactionType.EXPENSE, from, to);

        List<Object[]> categoryData = transactionRepository.categorySpending(user, from, to);
        Map<String, BigDecimal> categoryMap = new HashMap<>();
        for (Object[] row : categoryData) {
            categoryMap.put((String) row[0], (BigDecimal) row[1]);
        }

        return DashboardSummary.builder()
                .totalIncome(income != null ? income : BigDecimal.ZERO)
                .totalExpense(expense != null ? expense : BigDecimal.ZERO)
                .balance(income != null && expense != null ? income.subtract(expense) : BigDecimal.ZERO)
                .categorySpending(categoryMap)
                .build();
    }
}
