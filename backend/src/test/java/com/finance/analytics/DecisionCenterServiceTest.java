package com.finance.analytics;

import com.finance.account.Account;
import com.finance.account.AccountRepository;
import com.finance.goal.GoalRepository;
import com.finance.goal.SavingsGoal;
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
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
public class DecisionCenterServiceTest {

    @Mock
    private TransactionRepository transactionRepository;

    @Mock
    private GoalRepository goalRepository;

    @Mock
    private FinancialHealthService financialHealthService;

    @Mock
    private UserRepository userRepository;

    @Mock
    private AccountRepository accountRepository;

    @InjectMocks
    private DecisionCenterService decisionCenterService;

    private User testUser;

    @BeforeEach
    void setUp() {
        testUser = new User();
        testUser.setId(1L);
        testUser.setEmail("decision@example.com");

        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(testUser.getEmail(), "pass")
        );

        lenient().when(userRepository.findByEmail(testUser.getEmail())).thenReturn(Optional.of(testUser));
    }

    @Test
    void testEmergencyFundReserveBreachedTriggersHighOrCriticalPressure() {
        // Monthly expense = 20,000, 3-month reserve = 60,000
        when(transactionRepository.sumByTypeAndDateRange(eq(testUser), eq(TransactionType.INCOME), any(LocalDate.class), any(LocalDate.class)))
                .thenReturn(new BigDecimal("50000.00"));
        when(transactionRepository.sumByTypeAndDateRange(eq(testUser), eq(TransactionType.EXPENSE), any(LocalDate.class), any(LocalDate.class)))
                .thenReturn(new BigDecimal("20000.00"));

        Account acc = Account.builder()
                .id(1L)
                .name("Savings")
                .currentBalance(new BigDecimal("70000.00"))
                .active(true)
                .build();
        when(accountRepository.findByUserAndActiveTrue(testUser)).thenReturn(List.of(acc));

        when(financialHealthService.getFinancialHealth()).thenReturn(
                AnalyticsDTOs.FinancialHealth2DTO.builder().overallScore(80).build()
        );

        // Purchase of 25,000 brings balance to 45,000 (which is < 60,000 emergency reserve)
        AnalyticsDTOs.DecisionRequest req = AnalyticsDTOs.DecisionRequest.builder()
                .title("Gaming Console")
                .amount(new BigDecimal("25000.00"))
                .paymentMethod("LUMP_SUM")
                .build();

        AnalyticsDTOs.DecisionResponse response = decisionCenterService.evaluateDecision(req);

        assertNotNull(response);
        assertEquals("HIGH", response.getBudgetPressureLevel());
        assertTrue(response.getEvaluationBreakdown().stream().anyMatch(s -> s.contains("Emergency Fund Alert")));
    }

    @Test
    void testSafePurchaseWithinReserves() {
        // Income = 80,000, Expense = 20,000, Liquid = 200,000
        when(transactionRepository.sumByTypeAndDateRange(eq(testUser), eq(TransactionType.INCOME), any(LocalDate.class), any(LocalDate.class)))
                .thenReturn(new BigDecimal("80000.00"));
        when(transactionRepository.sumByTypeAndDateRange(eq(testUser), eq(TransactionType.EXPENSE), any(LocalDate.class), any(LocalDate.class)))
                .thenReturn(new BigDecimal("20000.00"));

        Account acc = Account.builder()
                .id(1L)
                .name("Savings")
                .currentBalance(new BigDecimal("200000.00"))
                .active(true)
                .build();
        when(accountRepository.findByUserAndActiveTrue(testUser)).thenReturn(List.of(acc));

        when(financialHealthService.getFinancialHealth()).thenReturn(
                AnalyticsDTOs.FinancialHealth2DTO.builder().overallScore(85).build()
        );

        AnalyticsDTOs.DecisionRequest req = AnalyticsDTOs.DecisionRequest.builder()
                .title("Noise Cancelling Headphones")
                .amount(new BigDecimal("15000.00"))
                .paymentMethod("LUMP_SUM")
                .build();

        AnalyticsDTOs.DecisionResponse response = decisionCenterService.evaluateDecision(req);

        assertNotNull(response);
        assertEquals("LOW", response.getBudgetPressureLevel());
        assertTrue(response.getEvaluationBreakdown().stream().anyMatch(s -> s.contains("Emergency Reserve Safe")));
    }
}
