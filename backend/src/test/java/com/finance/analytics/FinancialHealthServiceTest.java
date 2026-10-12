package com.finance.analytics;

import com.finance.budget.BudgetRepository;
import com.finance.goal.GoalRepository;
import com.finance.recurring.RecurringRepository;
import com.finance.transaction.TransactionRepository;
import com.finance.transaction.TransactionType;
import com.finance.user.User;
import com.finance.user.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.Collections;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
public class FinancialHealthServiceTest {

    @Mock
    private TransactionRepository transactionRepository;

    @Mock
    private BudgetRepository budgetRepository;

    @Mock
    private GoalRepository goalRepository;

    @Mock
    private RecurringRepository recurringRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private FinancialHealthService financialHealthService;

    private User testUser;
    private YearMonth currentYm;

    @BeforeEach
    void setUp() {
        testUser = new User();
        testUser.setId(1L);
        testUser.setEmail("user@example.com");
        currentYm = YearMonth.now();
    }

    @Test
    void testZeroIncomeCalculatesWithoutArithmeticException() {
        when(transactionRepository.sumByTypeAndDateRange(eq(testUser), eq(TransactionType.INCOME), any(LocalDate.class), any(LocalDate.class)))
                .thenReturn(BigDecimal.ZERO);
        when(transactionRepository.sumByTypeAndDateRange(eq(testUser), eq(TransactionType.EXPENSE), any(LocalDate.class), any(LocalDate.class)))
                .thenReturn(new BigDecimal("5000.00"));
        when(budgetRepository.findByUserAndMonth(eq(testUser), any())).thenReturn(Collections.emptyList());
        when(goalRepository.findByUserOrderByCreatedAtDesc(testUser)).thenReturn(Collections.emptyList());
        when(recurringRepository.findByUser(testUser)).thenReturn(Collections.emptyList());

        AnalyticsDTOs.FinancialHealth2DTO result = financialHealthService.calculateHealthForMonth(testUser, currentYm);

        assertNotNull(result);
        assertEquals(50, result.getSavingsScore()); // Default neutral score when income is zero
        assertTrue(result.getOverallScore() > 0);
    }

    @Test
    void testNegativeSavingsRateGivesPenalty() {
        when(transactionRepository.sumByTypeAndDateRange(eq(testUser), eq(TransactionType.INCOME), any(LocalDate.class), any(LocalDate.class)))
                .thenReturn(new BigDecimal("10000.00"));
        when(transactionRepository.sumByTypeAndDateRange(eq(testUser), eq(TransactionType.EXPENSE), any(LocalDate.class), any(LocalDate.class)))
                .thenReturn(new BigDecimal("15000.00")); // Expense > Income
        when(budgetRepository.findByUserAndMonth(eq(testUser), any())).thenReturn(Collections.emptyList());
        when(goalRepository.findByUserOrderByCreatedAtDesc(testUser)).thenReturn(Collections.emptyList());
        when(recurringRepository.findByUser(testUser)).thenReturn(Collections.emptyList());

        AnalyticsDTOs.FinancialHealth2DTO result = financialHealthService.calculateHealthForMonth(testUser, currentYm);

        assertNotNull(result);
        assertEquals(10, result.getSavingsScore()); // 10 is low score for negative savings rate
    }

    @Test
    void testHighSavingsRateGivesHighScore() {
        when(transactionRepository.sumByTypeAndDateRange(eq(testUser), eq(TransactionType.INCOME), any(LocalDate.class), any(LocalDate.class)))
                .thenReturn(new BigDecimal("100000.00"));
        when(transactionRepository.sumByTypeAndDateRange(eq(testUser), eq(TransactionType.EXPENSE), any(LocalDate.class), any(LocalDate.class)))
                .thenReturn(new BigDecimal("40000.00")); // 60% savings rate
        when(budgetRepository.findByUserAndMonth(eq(testUser), any())).thenReturn(Collections.emptyList());
        when(goalRepository.findByUserOrderByCreatedAtDesc(testUser)).thenReturn(Collections.emptyList());
        when(recurringRepository.findByUser(testUser)).thenReturn(Collections.emptyList());

        AnalyticsDTOs.FinancialHealth2DTO result = financialHealthService.calculateHealthForMonth(testUser, currentYm);

        assertNotNull(result);
        assertEquals(100, result.getSavingsScore());
    }
}
