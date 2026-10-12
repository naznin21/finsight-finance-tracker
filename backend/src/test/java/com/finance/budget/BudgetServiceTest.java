package com.finance.budget;

import com.finance.category.Category;
import com.finance.category.CategoryRepository;
import com.finance.transaction.TransactionRepository;
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
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class BudgetServiceTest {

    @Mock
    private BudgetRepository budgetRepository;

    @Mock
    private CategoryRepository categoryRepository;

    @Mock
    private TransactionRepository transactionRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private BudgetService budgetService;

    private User currentUser;
    private User otherUser;

    @BeforeEach
    void setUp() {
        currentUser = new User();
        currentUser.setId(1L);
        currentUser.setEmail("owner@example.com");

        otherUser = new User();
        otherUser.setId(2L);
        otherUser.setEmail("other@example.com");

        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(currentUser.getEmail(), "pass")
        );

        lenient().when(userRepository.findByEmail(currentUser.getEmail())).thenReturn(Optional.of(currentUser));
    }

    @Test
    void testDeleteThrowsExceptionWhenUserIsNotOwner() {
        Budget otherBudget = Budget.builder()
                .id(100L)
                .amount(new BigDecimal("10000.00"))
                .user(otherUser) // Owned by different user
                .build();

        when(budgetRepository.findById(100L)).thenReturn(Optional.of(otherBudget));

        RuntimeException ex = assertThrows(RuntimeException.class, () -> budgetService.delete(100L));
        assertTrue(ex.getMessage().contains("Access denied"));
        verify(budgetRepository, never()).delete(any());
    }

    @Test
    void testDeleteSucceedsWhenUserIsOwner() {
        Budget ownBudget = Budget.builder()
                .id(100L)
                .amount(new BigDecimal("10000.00"))
                .user(currentUser)
                .build();

        when(budgetRepository.findById(100L)).thenReturn(Optional.of(ownBudget));

        budgetService.delete(100L);

        verify(budgetRepository, times(1)).delete(ownBudget);
    }
}
