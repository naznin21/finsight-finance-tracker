package com.finance.transaction;

import com.finance.account.Account;
import com.finance.account.AccountRepository;
import com.finance.category.CategoryRepository;
import com.finance.user.User;
import com.finance.user.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class TransactionServiceTest {

    @Mock
    private TransactionRepository transactionRepository;

    @Mock
    private CategoryRepository categoryRepository;

    @Mock
    private AccountRepository accountRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private TransactionService transactionService;

    private User testUser;
    private Account sourceAccount;
    private Account destAccount;

    @BeforeEach
    void setUp() {
        testUser = new User();
        testUser.setId(1L);
        testUser.setEmail("test@example.com");

        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(testUser.getEmail(), "pass")
        );

        lenient().when(userRepository.findByEmail(testUser.getEmail())).thenReturn(Optional.of(testUser));

        sourceAccount = Account.builder()
                .id(10L)
                .name("Checking")
                .currentBalance(new BigDecimal("50000.00"))
                .user(testUser)
                .active(true)
                .build();

        destAccount = Account.builder()
                .id(20L)
                .name("Savings")
                .currentBalance(new BigDecimal("10000.00"))
                .user(testUser)
                .active(true)
                .build();
    }

    @Test
    void testTransferAtomicBalanceUpdates() {
        TransactionDTO dto = new TransactionDTO();
        dto.setType(TransactionType.TRANSFER);
        dto.setAmount(new BigDecimal("15000.00"));
        dto.setDate(LocalDate.now());
        dto.setAccountId(10L);
        dto.setDestinationAccountId(20L);

        when(accountRepository.findByIdAndUser(10L, testUser)).thenReturn(Optional.of(sourceAccount));
        when(accountRepository.findByIdAndUser(20L, testUser)).thenReturn(Optional.of(destAccount));
        when(transactionRepository.save(any(Transaction.class))).thenAnswer(inv -> inv.getArgument(0));

        TransactionDTO result = transactionService.create(dto);

        assertNotNull(result);
        assertEquals(TransactionType.TRANSFER, result.getType());
        assertEquals(new BigDecimal("35000.00"), sourceAccount.getCurrentBalance());
        assertEquals(new BigDecimal("25000.00"), destAccount.getCurrentBalance());
        verify(accountRepository, times(1)).save(sourceAccount);
        verify(accountRepository, times(1)).save(destAccount);
    }

    @Test
    void testTransferSameAccountThrowsException() {
        TransactionDTO dto = new TransactionDTO();
        dto.setType(TransactionType.TRANSFER);
        dto.setAmount(new BigDecimal("5000.00"));
        dto.setDate(LocalDate.now());
        dto.setAccountId(10L);
        dto.setDestinationAccountId(10L);

        when(accountRepository.findByIdAndUser(10L, testUser)).thenReturn(Optional.of(sourceAccount));

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () -> transactionService.create(dto));
        assertTrue(ex.getMessage().contains("cannot be the same"));
    }

    @Test
    void testDeleteTransferReversesBalances() {
        Transaction t = Transaction.builder()
                .id(99L)
                .type(TransactionType.TRANSFER)
                .amount(new BigDecimal("5000.00"))
                .user(testUser)
                .account(sourceAccount)
                .destinationAccount(destAccount)
                .build();

        when(transactionRepository.findById(99L)).thenReturn(Optional.of(t));

        transactionService.delete(99L);

        assertEquals(new BigDecimal("55000.00"), sourceAccount.getCurrentBalance());
        assertEquals(new BigDecimal("5000.00"), destAccount.getCurrentBalance());
        verify(transactionRepository).delete(t);
    }

    @Test
    void testImportCsvSkipsDuplicates() throws Exception {
        String csvContent = "type,amount,description,date\n" +
                "EXPENSE,1000.00,Groceries,2026-10-01\n" +
                "EXPENSE,1000.00,Groceries,2026-10-01\n"; // Duplicate in batch

        MockMultipartFile file = new MockMultipartFile("file", "test.csv", "text/csv", csvContent.getBytes());

        when(transactionRepository.existsByUserAndDateAndAmountAndDescription(
                eq(testUser), eq(LocalDate.parse("2026-10-01")), eq(new BigDecimal("1000.00")), eq("Groceries")
        )).thenReturn(false);

        when(transactionRepository.saveAll(anyList())).thenAnswer(inv -> inv.getArgument(0));

        List<TransactionDTO> imported = transactionService.importCsv(file);

        assertEquals(1, imported.size());
    }
}
