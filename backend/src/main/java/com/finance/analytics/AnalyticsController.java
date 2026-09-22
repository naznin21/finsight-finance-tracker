package com.finance.analytics;

import com.finance.category.Category;
import com.finance.recurring.RecurringCostNormalizer;
import com.finance.recurring.RecurringRepository;
import com.finance.recurring.RecurringTransaction;
import com.finance.transaction.Transaction;
import com.finance.transaction.TransactionRepository;
import com.finance.transaction.TransactionType;
import com.finance.user.User;
import com.finance.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/analytics")
@RequiredArgsConstructor
public class AnalyticsController {

    private final FinancialHealthService financialHealthService;
    private final ForecastingService forecastingService;
    private final SimulatorService simulatorService;
    private final DecisionCenterService decisionCenterService;
    private final DigitalTwinService digitalTwinService;
    private final FinancialStoryService financialStoryService;
    private final TransactionRepository transactionRepository;
    private final RecurringRepository recurringRepository;
    private final UserRepository userRepository;

    private User currentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email).orElseThrow();
    }

    @GetMapping("/pulse")
    public ResponseEntity<AnalyticsDTOs.FinancialPulseDTO> getPulse() {
        User user = currentUser();
        YearMonth currentYm = YearMonth.now();
        YearMonth prevYm = currentYm.minusMonths(1);

        LocalDate cFrom = currentYm.atDay(1);
        LocalDate cTo = currentYm.atEndOfMonth();
        LocalDate pFrom = prevYm.atDay(1);
        LocalDate pTo = prevYm.atEndOfMonth();

        BigDecimal income = transactionRepository.sumByTypeAndDateRange(user, TransactionType.INCOME, cFrom, cTo);
        if (income == null) income = BigDecimal.ZERO;

        BigDecimal expense = transactionRepository.sumByTypeAndDateRange(user, TransactionType.EXPENSE, cFrom, cTo);
        if (expense == null) expense = BigDecimal.ZERO;

        BigDecimal prevExpense = transactionRepository.sumByTypeAndDateRange(user, TransactionType.EXPENSE, pFrom, pTo);
        if (prevExpense == null) prevExpense = BigDecimal.ZERO;

        BigDecimal savings = income.subtract(expense);
        double savingsRate = income.compareTo(BigDecimal.ZERO) > 0
                ? (savings.divide(income, 4, RoundingMode.HALF_UP).doubleValue() * 100) : 0;

        double expenseChangePct = 0;
        if (prevExpense.compareTo(BigDecimal.ZERO) > 0) {
            expenseChangePct = currExpenseChangePct(expense, prevExpense);
        }

        AnalyticsDTOs.FinancialHealth2DTO health = financialHealthService.calculateHealthForMonth(user, currentYm);

        List<String> highlights = new ArrayList<>();
        if (income.compareTo(BigDecimal.ZERO) == 0 && expense.compareTo(BigDecimal.ZERO) == 0) {
            highlights.add("ℹ Insufficient transaction data for this month. Add income/expense records to see pulse.");
        } else {
            if (savingsRate >= 20) highlights.add(String.format("↑ Strong savings rate at %.1f%%", savingsRate));
            else highlights.add(String.format("⚠ Savings rate at %.1f%% (target: 20%%)", savingsRate));

            if (expenseChangePct < 0) highlights.add(String.format("↓ Expenses decreased %.1f%% from last month", Math.abs(expenseChangePct)));
            else if (expenseChangePct > 0) highlights.add(String.format("⚠ Expenses rose %.1f%% from last month", expenseChangePct));
        }

        List<RecurringTransaction> activeRec = recurringRepository.findByUser(user);
        long subCount = activeRec.stream().filter(r -> r.isActive() && r.getType() == TransactionType.EXPENSE).count();
        if (subCount > 0) highlights.add("ℹ " + subCount + " active recurring obligations tracked");

        AnalyticsDTOs.FinancialPulseDTO dto = AnalyticsDTOs.FinancialPulseDTO.builder()
                .score(health.getOverallScore())
                .healthStatus(health.getRating())
                .pulseHighlights(highlights)
                .currentBalance(savings)
                .monthlyIncome(income)
                .monthlyExpenses(expense)
                .monthlySavings(savings)
                .savingsRate(savingsRate)
                .expenseChangePct(expenseChangePct)
                .build();

        return ResponseEntity.ok(dto);
    }

    private double currExpenseChangePct(BigDecimal curr, BigDecimal prev) {
        return curr.subtract(prev).divide(prev, 4, RoundingMode.HALF_UP).doubleValue() * 100;
    }

    @GetMapping("/story")
    public ResponseEntity<AnalyticsDTOs.FinancialStoryDTO> getStory() {
        return ResponseEntity.ok(financialStoryService.generateFinancialStory());
    }

    @GetMapping("/health")
    public ResponseEntity<AnalyticsDTOs.FinancialHealth2DTO> getHealth() {
        return ResponseEntity.ok(financialHealthService.getFinancialHealth());
    }

    @GetMapping("/forecast")
    public ResponseEntity<AnalyticsDTOs.ForecastDTO> getForecast() {
        return ResponseEntity.ok(forecastingService.getForecast());
    }

    @PostMapping("/simulate")
    public ResponseEntity<AnalyticsDTOs.SimulatorResponse> simulate(@RequestBody AnalyticsDTOs.SimulatorRequest req) {
        return ResponseEntity.ok(simulatorService.simulate(req));
    }

    @PostMapping("/decision")
    public ResponseEntity<AnalyticsDTOs.DecisionResponse> evaluateDecision(@RequestBody AnalyticsDTOs.DecisionRequest req) {
        return ResponseEntity.ok(decisionCenterService.evaluateDecision(req));
    }

    @GetMapping("/digital-twin")
    public ResponseEntity<AnalyticsDTOs.DigitalTwinDTO> getDigitalTwin() {
        return ResponseEntity.ok(digitalTwinService.getDigitalTwin());
    }

    @GetMapping("/subscriptions")
    public ResponseEntity<AnalyticsDTOs.SubscriptionSummaryDTO> getSubscriptions() {
        User user = currentUser();
        List<RecurringTransaction> list = recurringRepository.findByUser(user);

        List<AnalyticsDTOs.SubscriptionItemDTO> items = new ArrayList<>();
        BigDecimal totalMonthly = BigDecimal.ZERO;
        BigDecimal optionalMonthlyTotal = BigDecimal.ZERO;

        for (RecurringTransaction r : list) {
            if (r.isActive() && r.getType() == TransactionType.EXPENSE) {
                BigDecimal monthlyEquivalent = RecurringCostNormalizer.toMonthly(r.getAmount(), r.getFrequency());
                totalMonthly = totalMonthly.add(monthlyEquivalent);

                boolean isEssential = r.getDescription() != null &&
                        (r.getDescription().toLowerCase().contains("rent") ||
                         r.getDescription().toLowerCase().contains("electricity font") ||
                         r.getDescription().toLowerCase().contains("water") ||
                         r.getDescription().toLowerCase().contains("emi"));

                if (!isEssential) {
                    optionalMonthlyTotal = optionalMonthlyTotal.add(monthlyEquivalent);
                }

                items.add(AnalyticsDTOs.SubscriptionItemDTO.builder()
                        .id(r.getId())
                        .name(r.getDescription())
                        .amount(monthlyEquivalent)
                        .frequency(r.getFrequency().name())
                        .nextDueDate(r.getStartDate() != null ? r.getStartDate().toString() : "-")
                        .category(r.getCategory() != null ? r.getCategory().getName() : "Subscription")
                        .isEssential(isEssential)
                        .build());
            }
        }

        BigDecimal totalAnnual = totalMonthly.multiply(BigDecimal.valueOf(12));
        List<String> opportunities = new ArrayList<>();
        if (optionalMonthlyTotal.compareTo(BigDecimal.ZERO) > 0) {
            opportunities.add("Optional subscriptions sum to ₹" + optionalMonthlyTotal + "/month. Canceling them yields ₹" +
                    optionalMonthlyTotal.multiply(BigDecimal.valueOf(12)) + " in annual savings.");
        } else {
            opportunities.add("No optional subscriptions detected.");
        }

        return ResponseEntity.ok(AnalyticsDTOs.SubscriptionSummaryDTO.builder()
                .totalMonthlyCost(totalMonthly)
                .totalAnnualCost(totalAnnual)
                .totalActiveSubscriptions(items.size())
                .items(items)
                .savingsOpportunities(opportunities)
                .build());
    }

    @GetMapping("/behavior")
    public ResponseEntity<AnalyticsDTOs.BehaviorAnalysisDTO> getBehavior() {
        User user = currentUser();
        LocalDate now = LocalDate.now();
        LocalDate threeMonthsAgo = now.minusMonths(3);

        List<Transaction> txns = transactionRepository.findByUserAndDateBetweenOrderByDateDesc(user, threeMonthsAgo, now);

        List<Transaction> expenses = txns.stream().filter(t -> t.getType() == TransactionType.EXPENSE).collect(Collectors.toList());

        BigDecimal totalSpend = expenses.stream().map(Transaction::getAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal avgSize = expenses.isEmpty() ? BigDecimal.ZERO : totalSpend.divide(BigDecimal.valueOf(expenses.size()), 2, RoundingMode.HALF_UP);

        Transaction largest = expenses.stream().max(Comparator.comparing(Transaction::getAmount)).orElse(null);

        long weekendCount = expenses.stream().filter(t -> t.getDate().getDayOfWeek().getValue() >= 6).count();
        double weekendPct = expenses.isEmpty() ? 0 : (double) weekendCount / expenses.size() * 100;
        double weekdayPct = expenses.isEmpty() ? 0 : 100.0 - weekendPct;

        // Actual Essential vs Discretionary calculation from category type
        double essentialSum = expenses.stream()
                .filter(t -> t.getCategory() != null && t.getCategory().getType() == Category.CategoryType.ESSENTIAL)
                .mapToDouble(t -> t.getAmount().doubleValue()).sum();

        double discretionarySum = expenses.stream()
                .filter(t -> t.getCategory() == null || t.getCategory().getType() == Category.CategoryType.DISCRETIONARY)
                .mapToDouble(t -> t.getAmount().doubleValue()).sum();

        double totalExpVal = totalSpend.doubleValue();
        double essentialPct = totalExpVal > 0 ? (essentialSum / totalExpVal) * 100 : 0;
        double discretionaryPct = totalExpVal > 0 ? (discretionarySum / totalExpVal) * 100 : 0;

        List<String> insights = new ArrayList<>();
        if (expenses.isEmpty()) {
            insights.add("Insufficient transaction data for behavior analysis.");
        } else {
            if (weekendPct > 35) {
                insights.add(String.format("You execute %.1f%% of your transactions on weekends vs weekdays.", weekendPct));
            }
            if (largest != null) {
                insights.add(String.format("Largest single expense was ₹%s for '%s'.", largest.getAmount(), largest.getDescription()));
            }
            insights.add(String.format("Actual spending split: %.1f%% Essential vs %.1f%% Discretionary.", essentialPct, discretionaryPct));
        }

        // Top category query result
        List<Object[]> catSpending = transactionRepository.categorySpending(user, threeMonthsAgo, now);
        String topCatName = !catSpending.isEmpty() ? (String) catSpending.get(0)[0] : "General";
        BigDecimal topCatAmount = !catSpending.isEmpty() ? (BigDecimal) catSpending.get(0)[1] : BigDecimal.ZERO;

        return ResponseEntity.ok(AnalyticsDTOs.BehaviorAnalysisDTO.builder()
                .topCategory(topCatName)
                .topCategorySpend(topCatAmount)
                .avgTransactionSize(avgSize)
                .largestTransactionAmount(largest != null ? largest.getAmount() : BigDecimal.ZERO)
                .largestTransactionDescription(largest != null ? largest.getDescription() : "None")
                .weekendSpendPct(weekendPct)
                .weekdaySpendPct(weekdayPct)
                .essentialPct(essentialPct)
                .discretionaryPct(discretionaryPct)
                .fastestGrowingCategory(topCatName)
                .behavioralInsights(insights)
                .build());
    }
}
