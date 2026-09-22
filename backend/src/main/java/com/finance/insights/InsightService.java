package com.finance.insights;

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
import java.util.*;

@Service
@RequiredArgsConstructor
public class InsightService {

    private final TransactionRepository transactionRepository;
    private final UserRepository userRepository;

    private User currentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email).orElseThrow();
    }

    public InsightReport generateInsights() {
        User user = currentUser();
        LocalDate now = LocalDate.now();
        LocalDate sixMonthsAgo = now.minusMonths(6);

        List<Transaction> recent = transactionRepository
                .findByUserAndDateBetweenOrderByDateDesc(user, sixMonthsAgo, now);

        List<String> suggestions = new ArrayList<>();
        List<String> anomalies = new ArrayList<>();
        Map<String, BigDecimal> patterns = new LinkedHashMap<>();

        // Group expense transactions by category
        Map<String, List<BigDecimal>> categoryAmounts = new HashMap<>();
        for (Transaction t : recent) {
            if (t.getType() == TransactionType.EXPENSE && t.getCategory() != null) {
                String cat = t.getCategory().getName();
                categoryAmounts.computeIfAbsent(cat, k -> new ArrayList<>()).add(t.getAmount());
            }
        }

        categoryAmounts.forEach((cat, amounts) -> {
            if (amounts.isEmpty()) return;

            // Calculate Mean (μ)
            double mean = amounts.stream().mapToDouble(BigDecimal::doubleValue).average().orElse(0);
            BigDecimal avgBd = BigDecimal.valueOf(mean).setScale(2, RoundingMode.HALF_UP);
            patterns.put(cat, avgBd);

            if (amounts.size() >= 3) {
                // Calculate Standard Deviation (σ)
                double variance = amounts.stream().mapToDouble(a -> Math.pow(a.doubleValue() - mean, 2)).average().orElse(0);
                double stdDev = Math.sqrt(variance);

                // Normal Range: Mean ± 2.0 * StdDev
                double minRange = Math.max(0, mean - (1.5 * stdDev));
                double maxRange = mean + (2.0 * stdDev);

                for (BigDecimal amount : amounts) {
                    double val = amount.doubleValue();
                    if (stdDev > 0) {
                        double zScore = (val - mean) / stdDev;
                        if (zScore > 2.2) {
                            anomalies.add(String.format("Unusual transaction in %s: ₹%.2f (Normal category baseline range: ₹%.0f – ₹%.0f, z-score: %.1f)",
                                    cat, val, minRange, maxRange, zScore));
                        }
                    } else if (val > mean * 2.5) {
                        anomalies.add(String.format("Unusual transaction in %s: ₹%.2f (Avg baseline: ₹%.2f)", cat, val, mean));
                    }
                }
            }

            // Suggestions based on mean patterns
            if (cat.equalsIgnoreCase("Food") && mean > 6000) {
                suggestions.add(String.format("Food spending averages ₹%.0f/month. Planning grocery purchases in bulk could reduce costs.", mean));
            }
            if (cat.equalsIgnoreCase("Entertainment") && mean > 3500) {
                suggestions.add(String.format("Entertainment spending averages ₹%.0f/month. Audit unused subscriptions.", mean));
            }
        });

        // Savings rate suggestion based on actual data
        BigDecimal totalIncome = recent.stream()
                .filter(t -> t.getType() == TransactionType.INCOME)
                .map(Transaction::getAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalExpense = recent.stream()
                .filter(t -> t.getType() == TransactionType.EXPENSE)
                .map(Transaction::getAmount).reduce(BigDecimal.ZERO, BigDecimal::add);

        if (totalIncome.compareTo(BigDecimal.ZERO) > 0) {
            double savingsRate = totalIncome.subtract(totalExpense)
                    .divide(totalIncome, 4, RoundingMode.HALF_UP).doubleValue() * 100;
            if (savingsRate < 20) {
                suggestions.add(String.format("Your 6-month savings rate is %.1f%%. Aim for a target of at least 20%%.", savingsRate));
            } else {
                suggestions.add(String.format("Strong posture! Your 6-month savings rate is %.1f%%.", savingsRate));
            }
        } else {
            suggestions.add("Insufficient income data recorded. Add income transactions to calculate savings rate suggestions.");
        }

        if (suggestions.isEmpty()) suggestions.add("Keep tracking transactions to unlock category suggestions.");

        return InsightReport.builder()
                .spendingPatterns(patterns)
                .anomalies(anomalies)
                .suggestions(suggestions)
                .build();
    }
}
