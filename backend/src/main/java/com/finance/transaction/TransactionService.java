package com.finance.transaction;

import com.finance.account.Account;
import com.finance.account.AccountRepository;
import com.finance.category.Category;
import com.finance.category.CategoryRepository;
import com.finance.user.User;
import com.finance.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.apache.poi.ss.usermodel.*;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TransactionService {

    private final TransactionRepository transactionRepository;
    private final CategoryRepository categoryRepository;
    private final AccountRepository accountRepository;
    private final UserRepository userRepository;

    private User currentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email).orElseThrow();
    }

    public List<TransactionDTO> getAll() {
        return transactionRepository.findByUserOrderByDateDesc(currentUser())
                .stream().map(this::toDTO).collect(Collectors.toList());
    }

    public TransactionDTO create(TransactionDTO dto) {
        Transaction t = toEntity(dto, new Transaction());
        t.setUser(currentUser());
        Transaction saved = transactionRepository.save(t);

        // Synchronize Account Balance
        if (saved.getAccount() != null) {
            Account acc = saved.getAccount();
            if (saved.getType() == TransactionType.INCOME) {
                acc.setCurrentBalance(acc.getCurrentBalance().add(saved.getAmount()));
            } else {
                acc.setCurrentBalance(acc.getCurrentBalance().subtract(saved.getAmount()));
            }
            accountRepository.save(acc);
        }

        return toDTO(saved);
    }

    public TransactionDTO update(Long id, TransactionDTO dto) {
        Transaction t = transactionRepository.findById(id).orElseThrow();
        ensureOwner(t);

        // Reverse old account impact if exists
        if (t.getAccount() != null) {
            Account oldAcc = t.getAccount();
            if (t.getType() == TransactionType.INCOME) {
                oldAcc.setCurrentBalance(oldAcc.getCurrentBalance().subtract(t.getAmount()));
            } else {
                oldAcc.setCurrentBalance(oldAcc.getCurrentBalance().add(t.getAmount()));
            }
            accountRepository.save(oldAcc);
        }

        toEntity(dto, t);
        Transaction saved = transactionRepository.save(t);

        // Apply new account impact
        if (saved.getAccount() != null) {
            Account newAcc = saved.getAccount();
            if (saved.getType() == TransactionType.INCOME) {
                newAcc.setCurrentBalance(newAcc.getCurrentBalance().add(saved.getAmount()));
            } else {
                newAcc.setCurrentBalance(newAcc.getCurrentBalance().subtract(saved.getAmount()));
            }
            accountRepository.save(newAcc);
        }

        return toDTO(saved);
    }

    public void delete(Long id) {
        Transaction t = transactionRepository.findById(id).orElseThrow();
        ensureOwner(t);

        if (t.getAccount() != null) {
            Account acc = t.getAccount();
            if (t.getType() == TransactionType.INCOME) {
                acc.setCurrentBalance(acc.getCurrentBalance().subtract(t.getAmount()));
            } else {
                acc.setCurrentBalance(acc.getCurrentBalance().add(t.getAmount()));
            }
            accountRepository.save(acc);
        }

        transactionRepository.delete(t);
    }

    public List<TransactionDTO> importCsv(MultipartFile file) throws Exception {
        List<Transaction> list = new ArrayList<>();
        User user = currentUser();
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(file.getInputStream()))) {
            String line;
            boolean first = true;
            while ((line = reader.readLine()) != null) {
                if (first) { first = false; continue; } // skip header
                String[] cols = line.split(",");
                if (cols.length < 4) continue;
                Transaction t = Transaction.builder()
                        .type(TransactionType.valueOf(cols[0].trim().toUpperCase()))
                        .amount(new BigDecimal(cols[1].trim()))
                        .description(cols[2].trim())
                        .date(LocalDate.parse(cols[3].trim()))
                        .user(user)
                        .build();
                list.add(t);
            }
        }
        return transactionRepository.saveAll(list).stream().map(this::toDTO).collect(Collectors.toList());
    }

    public List<TransactionDTO> importExcel(MultipartFile file) throws Exception {
        List<Transaction> list = new ArrayList<>();
        User user = currentUser();
        Workbook wb = WorkbookFactory.create(file.getInputStream());
        Sheet sheet = wb.getSheetAt(0);
        boolean first = true;
        for (Row row : sheet) {
            if (first) { first = false; continue; }
            Transaction t = Transaction.builder()
                    .type(TransactionType.valueOf(row.getCell(0).getStringCellValue().toUpperCase()))
                    .amount(BigDecimal.valueOf(row.getCell(1).getNumericCellValue()))
                    .description(row.getCell(2).getStringCellValue())
                    .date(row.getCell(3).getLocalDateTimeCellValue().toLocalDate())
                    .user(user)
                    .build();
            list.add(t);
        }
        wb.close();
        return transactionRepository.saveAll(list).stream().map(this::toDTO).collect(Collectors.toList());
    }

    private void ensureOwner(Transaction t) {
        if (!t.getUser().getEmail().equals(currentUser().getEmail())) {
            throw new RuntimeException("Access denied.");
        }
    }

    private Transaction toEntity(TransactionDTO dto, Transaction t) {
        t.setType(dto.getType());
        t.setAmount(dto.getAmount());
        t.setDescription(dto.getDescription());
        t.setDate(dto.getDate());
        t.setMerchant(dto.getMerchant());
        t.setPaymentMethod(dto.getPaymentMethod());
        t.setTags(dto.getTags() != null ? dto.getTags() : Set.of());
        if (dto.getCategoryId() != null) {
            Category cat = categoryRepository.findById(dto.getCategoryId()).orElse(null);
            t.setCategory(cat);
        }
        if (dto.getAccountId() != null) {
            Account acc = accountRepository.findByIdAndUser(dto.getAccountId(), currentUser()).orElse(null);
            t.setAccount(acc);
        } else {
            t.setAccount(null);
        }
        return t;
    }

    private TransactionDTO toDTO(Transaction t) {
        TransactionDTO dto = new TransactionDTO();
        dto.setId(t.getId());
        dto.setType(t.getType());
        dto.setAmount(t.getAmount());
        dto.setDescription(t.getDescription());
        dto.setDate(t.getDate());
        dto.setMerchant(t.getMerchant());
        dto.setPaymentMethod(t.getPaymentMethod());
        dto.setTags(t.getTags());
        if (t.getCategory() != null) {
            dto.setCategoryId(t.getCategory().getId());
            dto.setCategoryName(t.getCategory().getName());
        }
        if (t.getAccount() != null) {
            dto.setAccountId(t.getAccount().getId());
            dto.setAccountName(t.getAccount().getName());
        }
        return dto;
    }
}
