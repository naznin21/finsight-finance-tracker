package com.finance.budget;

import com.finance.category.Category;
import com.finance.category.CategoryRepository;
import com.finance.transaction.TransactionRepository;
import com.finance.transaction.TransactionType;
import com.finance.user.User;
import com.finance.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BudgetService {

    private final BudgetRepository budgetRepository;
    private final CategoryRepository categoryRepository;
    private final TransactionRepository transactionRepository;
    private final UserRepository userRepository;
    private final JavaMailSender mailSender;

    private User currentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email).orElseThrow();
    }

    public List<BudgetDTO> getBudgets(String month) {
        String m = month.isEmpty() ? YearMonth.now().toString() : month;
        return budgetRepository.findByUserAndMonth(currentUser(), m)
                .stream().map(b -> toDTO(b, m)).collect(Collectors.toList());
    }

    public BudgetDTO createOrUpdate(BudgetDTO dto) {
        User user = currentUser();
        String month = dto.getMonth() != null ? dto.getMonth() : YearMonth.now().toString();
        Budget budget = budgetRepository
                .findByUserAndCategoryIdAndMonth(user, dto.getCategoryId(), month)
                .orElse(new Budget());
        Category cat = categoryRepository.findById(dto.getCategoryId()).orElseThrow();
        budget.setUser(user);
        budget.setCategory(cat);
        budget.setAmount(dto.getAmount());
        budget.setMonth(month);
        budget.setRollover(dto.isRollover());
        if (budget.getRolledOverAmount() == null) budget.setRolledOverAmount(BigDecimal.ZERO);
        return toDTO(budgetRepository.save(budget), month);
    }

    public void delete(Long id) {
        budgetRepository.deleteById(id);
    }

    // Runs on 1st of every month at midnight to roll over unspent budgets
    @Scheduled(cron = "0 0 0 1 * *")
    public void processRollover() {
        String prevMonth = YearMonth.now().minusMonths(1).toString();
        String currMonth = YearMonth.now().toString();
        userRepository.findAll().forEach(user -> {
            budgetRepository.findByUserAndRolloverTrue(user).forEach(prev -> {
                if (!prev.getMonth().equals(prevMonth)) return;
                BigDecimal spent = getSpent(user, prev.getCategory().getId(), prevMonth);
                BigDecimal unspent = prev.getAmount().add(prev.getRolledOverAmount()).subtract(spent);
                if (unspent.compareTo(BigDecimal.ZERO) > 0) {
                    Budget curr = budgetRepository
                            .findByUserAndCategoryIdAndMonth(user, prev.getCategory().getId(), currMonth)
                            .orElse(Budget.builder().user(user).category(prev.getCategory())
                                    .amount(prev.getAmount()).month(currMonth).rollover(true)
                                    .rolledOverAmount(BigDecimal.ZERO).build());
                    curr.setRolledOverAmount(curr.getRolledOverAmount().add(unspent));
                    budgetRepository.save(curr);
                }
            });
        });
    }

    // Called after each transaction save to check alert thresholds
    public void checkAlerts(User user, Long categoryId, String month) {
        budgetRepository.findByUserAndCategoryIdAndMonth(user, categoryId, month).ifPresent(budget -> {
            BigDecimal total = budget.getAmount().add(budget.getRolledOverAmount());
            BigDecimal spent = getSpent(user, categoryId, month);
            double pct = spent.divide(total, 4, RoundingMode.HALF_UP).doubleValue() * 100;
            if (pct >= 100) sendAlert(user.getEmail(), budget.getCategory().getName(), 100, spent, total);
            else if (pct >= 80) sendAlert(user.getEmail(), budget.getCategory().getName(), 80, spent, total);
        });
    }

    private BigDecimal getSpent(User user, Long categoryId, String month) {
        YearMonth ym = YearMonth.parse(month);
        BigDecimal spent = transactionRepository.sumByCategoryAndTypeAndDateRange(
                user, categoryId, TransactionType.EXPENSE, ym.atDay(1), ym.atEndOfMonth());
        return spent != null ? spent : BigDecimal.ZERO;
    }

    private void sendAlert(String email, String category, int pct, BigDecimal spent, BigDecimal total) {
        try {
            SimpleMailMessage msg = new SimpleMailMessage();
            msg.setTo(email);
            msg.setSubject("Budget Alert: " + category);
            msg.setText(String.format("You've used %d%% of your %s budget. Spent: %.2f / %.2f", pct, category, spent, total));
            mailSender.send(msg);
        } catch (Exception ignored) {}
    }

    private BudgetDTO toDTO(Budget b, String month) {
        BudgetDTO dto = new BudgetDTO();
        dto.setId(b.getId());
        dto.setCategoryId(b.getCategory().getId());
        dto.setCategoryName(b.getCategory().getName());
        dto.setAmount(b.getAmount());
        dto.setRolledOverAmount(b.getRolledOverAmount());
        dto.setMonth(b.getMonth());
        dto.setRollover(b.isRollover());
        
        BigDecimal total = b.getAmount().add(b.getRolledOverAmount() != null ? b.getRolledOverAmount() : BigDecimal.ZERO);
        BigDecimal spent = getSpent(b.getUser(), b.getCategory().getId(), month);
        dto.setSpent(spent);
        dto.setRemaining(total.subtract(spent));
        
        double pct = total.compareTo(BigDecimal.ZERO) > 0
                ? spent.divide(total, 4, RoundingMode.HALF_UP).doubleValue() * 100 : 0;
        dto.setPercentUsed(pct);

        // Run rate calculation
        YearMonth ym = YearMonth.parse(month);
        LocalDate now = LocalDate.now();
        int totalDaysInMonth = ym.lengthOfMonth();
        int dayOfMonth = now.getMonth() == ym.getMonth() && now.getYear() == ym.getYear()
                ? Math.max(1, now.getDayOfMonth())
                : totalDaysInMonth;

        BigDecimal dailyRunRate = spent.divide(BigDecimal.valueOf(dayOfMonth), 2, RoundingMode.HALF_UP);
        BigDecimal projectedMonthEnd = dailyRunRate.multiply(BigDecimal.valueOf(totalDaysInMonth));
        dto.setProjectedMonthEnd(projectedMonthEnd);

        // Status determination
        if (pct >= 100 || spent.compareTo(total) > 0) {
            dto.setStatus("EXCEEDED");
        } else if (projectedMonthEnd.compareTo(total) > 0 || pct >= 85) {
            dto.setStatus("AT_RISK");
        } else if (pct >= 65) {
            dto.setStatus("WATCH");
        } else {
            dto.setStatus("SAFE");
        }

        // Data-driven 6-month budget recommendation calculation
        LocalDate sixMonthsAgo = now.minusMonths(6);
        BigDecimal past6MonthsSpent = transactionRepository.sumByCategoryAndTypeAndDateRange(
                b.getUser(), b.getCategory().getId(), TransactionType.EXPENSE, sixMonthsAgo, now);
        if (past6MonthsSpent != null && past6MonthsSpent.compareTo(BigDecimal.ZERO) > 0) {
            BigDecimal avgMonthlySpent = past6MonthsSpent.divide(BigDecimal.valueOf(6), 2, RoundingMode.HALF_UP);
            dto.setRecommendationMin(avgMonthlySpent.multiply(BigDecimal.valueOf(0.9)).setScale(2, RoundingMode.HALF_UP));
            dto.setRecommendationMax(avgMonthlySpent.multiply(BigDecimal.valueOf(1.1)).setScale(2, RoundingMode.HALF_UP));
            dto.setRecommendationReason("Based on your last 6 months average spending of ₹" + avgMonthlySpent);
        } else {
            dto.setRecommendationMin(b.getAmount());
            dto.setRecommendationMax(b.getAmount().multiply(BigDecimal.valueOf(1.15)).setScale(2, RoundingMode.HALF_UP));
            dto.setRecommendationReason("Suggested based on your current budget level.");
        }

        return dto;
    }
}
