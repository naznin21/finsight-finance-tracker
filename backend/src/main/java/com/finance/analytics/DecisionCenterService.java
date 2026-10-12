package com.finance.analytics;

import com.finance.account.Account;
import com.finance.account.AccountRepository;
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
public class DecisionCenterService {

    private final TransactionRepository transactionRepository;
    private final GoalRepository goalRepository;
    private final FinancialHealthService financialHealthService;
    private final UserRepository userRepository;
    private final AccountRepository accountRepository;

    private User currentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email).orElseThrow();
    }

    public AnalyticsDTOs.DecisionResponse evaluateDecision(AnalyticsDTOs.DecisionRequest req) {
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

        BigDecimal monthlySavings = income.subtract(expense);

        // Calculate total liquid funds across active accounts
        List<Account> accounts = accountRepository.findByUserAndActiveTrue(user);
        BigDecimal totalLiquidBalance = accounts.stream()
                .map(a -> a.getCurrentBalance() != null ? a.getCurrentBalance() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // If no accounts yet, default to monthly net savings if positive
        if (totalLiquidBalance.compareTo(BigDecimal.ZERO) == 0 && monthlySavings.compareTo(BigDecimal.ZERO) > 0) {
            totalLiquidBalance = monthlySavings;
        }

        BigDecimal purchase = req.getAmount() != null ? req.getAmount() : BigDecimal.ZERO;

        BigDecimal immediateBalanceImpact;
        BigDecimal monthlyCashFlowImpact;

        if ("MONTHLY_EMI".equalsIgnoreCase(req.getPaymentMethod()) && req.getEmiMonths() != null && req.getEmiMonths() > 0) {
            monthlyCashFlowImpact = purchase.divide(BigDecimal.valueOf(req.getEmiMonths()), 2, RoundingMode.HALF_UP);
            immediateBalanceImpact = monthlyCashFlowImpact;
        } else {
            immediateBalanceImpact = purchase;
            monthlyCashFlowImpact = BigDecimal.ZERO;
        }

        // Goal delay calculation based on real savings pace
        double goalDelayMonths = 0;
        List<SavingsGoal> goals = goalRepository.findByUserOrderByCreatedAtDesc(user);
        if (!goals.isEmpty() && monthlySavings.compareTo(BigDecimal.ZERO) > 0) {
            goalDelayMonths = purchase.divide(monthlySavings, 2, RoundingMode.HALF_UP).doubleValue();
        }

        // Emergency fund requirement: 3 months of baseline expenses
        BigDecimal monthlyBurn = expense.compareTo(BigDecimal.ZERO) > 0 ? expense : BigDecimal.ZERO;
        BigDecimal emergencyFundTarget = monthlyBurn.multiply(BigDecimal.valueOf(3));
        BigDecimal balanceAfterPurchase = totalLiquidBalance.subtract(immediateBalanceImpact);
        boolean emergencyFundBreached = emergencyFundTarget.compareTo(BigDecimal.ZERO) > 0 &&
                balanceAfterPurchase.compareTo(emergencyFundTarget) < 0;

        // Health score impact mathematically based on liquidity consumption ratio
        AnalyticsDTOs.FinancialHealth2DTO currentHealth = financialHealthService.getFinancialHealth();
        int baseHealth = currentHealth != null ? currentHealth.getOverallScore() : 70;
        int healthDelta = 0;
        if (monthlySavings.compareTo(BigDecimal.ZERO) > 0) {
            double ratio = purchase.divide(monthlySavings, 2, RoundingMode.HALF_UP).doubleValue();
            if (ratio > 3.0) healthDelta = -6;
            else if (ratio > 1.0) healthDelta = -3;
            else healthDelta = -1;
        } else {
            healthDelta = -8; // Deficit penalty
        }
        if (emergencyFundBreached) {
            healthDelta -= 4;
        }

        String pressureLevel;
        String recommendation;
        List<String> breakdown = new ArrayList<>();

        breakdown.add("Immediate Outflow: ₹" + immediateBalanceImpact.setScale(2, RoundingMode.HALF_UP));
        breakdown.add("Balance After Outflow: ₹" + balanceAfterPurchase.setScale(2, RoundingMode.HALF_UP));

        if (emergencyFundTarget.compareTo(BigDecimal.ZERO) > 0) {
            if (emergencyFundBreached) {
                breakdown.add("⚠ Emergency Fund Alert: Outflow cuts into your 3-month reserve target (₹" + emergencyFundTarget + ").");
            } else {
                breakdown.add("✓ Emergency Reserve Safe: 3+ months buffer (₹" + emergencyFundTarget + ") remains intact.");
            }
        }

        if (goalDelayMonths > 0) {
            breakdown.add("Estimated Goal Delay: ~" + String.format("%.1f", goalDelayMonths) + " months across active goals.");
        } else if (!goals.isEmpty() && monthlySavings.compareTo(BigDecimal.ZERO) <= 0) {
            breakdown.add("⚠ Current cash flow is in deficit; goal timelines are currently halted.");
        }

        breakdown.add("Financial Health Score Impact: " + healthDelta + " points (from " + baseHealth + " to " + Math.max(0, baseHealth + healthDelta) + ").");

        if (monthlySavings.compareTo(BigDecimal.ZERO) <= 0 || balanceAfterPurchase.compareTo(BigDecimal.ZERO) < 0) {
            pressureLevel = "CRITICAL";
            recommendation = "Do not purchase immediately. Cash flow or liquid reserves are insufficient.";
            breakdown.add("⚠ Outflow exceeds available liquid reserves or current cash flow is in deficit.");
        } else if (emergencyFundBreached || (monthlySavings.compareTo(BigDecimal.ZERO) > 0 && purchase.compareTo(monthlySavings.multiply(BigDecimal.valueOf(3))) > 0)) {
            pressureLevel = "HIGH";
            recommendation = "Affordable with caution: This purchase cuts into your safety buffer. Consider an EMI or phased savings.";
            breakdown.add("⚠ Outflow will consume more than 3 months of net savings or dip into safety buffer.");
        } else if (monthlySavings.compareTo(BigDecimal.ZERO) > 0 && purchase.compareTo(monthlySavings) > 0) {
            pressureLevel = "MODERATE";
            recommendation = "Affordable, but will pause net savings growth for this month.";
            breakdown.add("ℹ Purchase is within liquid reserves but exceeds a single month's savings surplus.");
        } else {
            pressureLevel = "LOW";
            recommendation = "Safely affordable within your current cash flow and liquid reserves.";
            breakdown.add("✓ Purchase fits comfortably within your monthly savings buffer.");
        }

        return AnalyticsDTOs.DecisionResponse.builder()
                .title(req.getTitle() != null ? req.getTitle() : "Unspecified Purchase")
                .purchaseAmount(purchase)
                .immediateBalanceImpact(immediateBalanceImpact)
                .monthlyCashFlowImpact(monthlyCashFlowImpact)
                .goalDelayMonths(goalDelayMonths)
                .healthScoreImpact(healthDelta)
                .budgetPressureLevel(pressureLevel)
                .recommendation(recommendation)
                .evaluationBreakdown(breakdown)
                .build();
    }
}

