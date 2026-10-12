package com.finance.transaction;

import com.finance.account.Account;
import com.finance.account.AccountRepository;
import com.finance.category.Category;
import com.finance.category.CategoryRepository;
import com.finance.user.User;
import com.finance.user.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.*;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
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

    @Transactional
    public TransactionDTO create(TransactionDTO dto) {
        User user = currentUser();
        Transaction t = toEntity(dto, new Transaction());
        t.setUser(user);

        if (t.getType() == TransactionType.TRANSFER) {
            if (t.getAccount() == null || t.getDestinationAccount() == null) {
                throw new IllegalArgumentException("Both source and destination accounts are required for a transfer.");
            }
            if (t.getAccount().getId().equals(t.getDestinationAccount().getId())) {
                throw new IllegalArgumentException("Source and destination accounts cannot be the same.");
            }
        }

        Transaction saved = transactionRepository.save(t);
        applyAccountImpact(saved);

        return toDTO(saved);
    }

    @Transactional
    public TransactionDTO update(Long id, TransactionDTO dto) {
        Transaction t = transactionRepository.findById(id).orElseThrow();
        ensureOwner(t);

        // Reverse old account impacts
        reverseAccountImpact(t);

        toEntity(dto, t);

        if (t.getType() == TransactionType.TRANSFER) {
            if (t.getAccount() == null || t.getDestinationAccount() == null) {
                throw new IllegalArgumentException("Both source and destination accounts are required for a transfer.");
            }
            if (t.getAccount().getId().equals(t.getDestinationAccount().getId())) {
                throw new IllegalArgumentException("Source and destination accounts cannot be the same.");
            }
        }

        Transaction saved = transactionRepository.save(t);
        applyAccountImpact(saved);

        return toDTO(saved);
    }

    @Transactional
    public void delete(Long id) {
        Transaction t = transactionRepository.findById(id).orElseThrow();
        ensureOwner(t);

        reverseAccountImpact(t);
        transactionRepository.delete(t);
    }

    @Transactional
    public List<TransactionDTO> importCsv(MultipartFile file) throws Exception {
        List<Transaction> list = new ArrayList<>();
        User user = currentUser();
        Set<String> seenInBatch = new HashSet<>();

        try (BufferedReader reader = new BufferedReader(new InputStreamReader(file.getInputStream()))) {
            String line;
            boolean first = true;
            while ((line = reader.readLine()) != null) {
                if (first) { first = false; continue; } // skip header
                String[] cols = line.split(",");
                if (cols.length < 4) continue;

                String typeStr = cols[0].trim().toUpperCase();
                TransactionType type;
                try {
                    type = TransactionType.valueOf(typeStr);
                } catch (IllegalArgumentException e) {
                    type = TransactionType.EXPENSE;
                }

                BigDecimal amount = new BigDecimal(cols[1].trim());
                String description = cols[2].trim();
                LocalDate date = LocalDate.parse(cols[3].trim());

                // Prevent duplicate imports: check DB and batch
                String batchKey = date + "|" + amount + "|" + description;
                if (seenInBatch.contains(batchKey)) {
                    log.warn("Skipping intra-file duplicate transaction: {} {} {}", date, amount, description);
                    continue;
                }
                if (transactionRepository.existsByUserAndDateAndAmountAndDescription(user, date, amount, description)) {
                    log.warn("Skipping existing database duplicate transaction: {} {} {}", date, amount, description);
                    continue;
                }
                seenInBatch.add(batchKey);

                Transaction t = Transaction.builder()
                        .type(type)
                        .amount(amount)
                        .description(description)
                        .date(date)
                        .user(user)
                        .build();
                list.add(t);
            }
        }
        return transactionRepository.saveAll(list).stream().map(this::toDTO).collect(Collectors.toList());
    }

    @Transactional
    public List<TransactionDTO> importExcel(MultipartFile file) throws Exception {
        List<Transaction> list = new ArrayList<>();
        User user = currentUser();
        Set<String> seenInBatch = new HashSet<>();

        Workbook wb = WorkbookFactory.create(file.getInputStream());
        Sheet sheet = wb.getSheetAt(0);
        boolean first = true;
        for (Row row : sheet) {
            if (first) { first = false; continue; }
            if (row == null || row.getCell(0) == null) continue;

            String typeStr = row.getCell(0).getStringCellValue().trim().toUpperCase();
            TransactionType type;
            try {
                type = TransactionType.valueOf(typeStr);
            } catch (Exception e) {
                type = TransactionType.EXPENSE;
            }

            BigDecimal amount = BigDecimal.valueOf(row.getCell(1).getNumericCellValue());
            String description = row.getCell(2).getStringCellValue().trim();
            LocalDate date = row.getCell(3).getLocalDateTimeCellValue().toLocalDate();

            String batchKey = date + "|" + amount + "|" + description;
            if (seenInBatch.contains(batchKey)) {
                continue;
            }
            if (transactionRepository.existsByUserAndDateAndAmountAndDescription(user, date, amount, description)) {
                continue;
            }
            seenInBatch.add(batchKey);

            Transaction t = Transaction.builder()
                    .type(type)
                    .amount(amount)
                    .description(description)
                    .date(date)
                    .user(user)
                    .build();
            list.add(t);
        }
        wb.close();
        return transactionRepository.saveAll(list).stream().map(this::toDTO).collect(Collectors.toList());
    }

    private void applyAccountImpact(Transaction t) {
        if (t.getType() == TransactionType.INCOME && t.getAccount() != null) {
            Account acc = t.getAccount();
            acc.setCurrentBalance(acc.getCurrentBalance().add(t.getAmount()));
            accountRepository.save(acc);
        } else if (t.getType() == TransactionType.EXPENSE && t.getAccount() != null) {
            Account acc = t.getAccount();
            acc.setCurrentBalance(acc.getCurrentBalance().subtract(t.getAmount()));
            accountRepository.save(acc);
        } else if (t.getType() == TransactionType.TRANSFER) {
            if (t.getAccount() != null) {
                Account src = t.getAccount();
                src.setCurrentBalance(src.getCurrentBalance().subtract(t.getAmount()));
                accountRepository.save(src);
            }
            if (t.getDestinationAccount() != null) {
                Account dest = t.getDestinationAccount();
                dest.setCurrentBalance(dest.getCurrentBalance().add(t.getAmount()));
                accountRepository.save(dest);
            }
        }
    }

    private void reverseAccountImpact(Transaction t) {
        if (t.getType() == TransactionType.INCOME && t.getAccount() != null) {
            Account acc = t.getAccount();
            acc.setCurrentBalance(acc.getCurrentBalance().subtract(t.getAmount()));
            accountRepository.save(acc);
        } else if (t.getType() == TransactionType.EXPENSE && t.getAccount() != null) {
            Account acc = t.getAccount();
            acc.setCurrentBalance(acc.getCurrentBalance().add(t.getAmount()));
            accountRepository.save(acc);
        } else if (t.getType() == TransactionType.TRANSFER) {
            if (t.getAccount() != null) {
                Account src = t.getAccount();
                src.setCurrentBalance(src.getCurrentBalance().add(t.getAmount()));
                accountRepository.save(src);
            }
            if (t.getDestinationAccount() != null) {
                Account dest = t.getDestinationAccount();
                dest.setCurrentBalance(dest.getCurrentBalance().subtract(t.getAmount()));
                accountRepository.save(dest);
            }
        }
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
        } else {
            t.setCategory(null);
        }
        if (dto.getAccountId() != null) {
            Account acc = accountRepository.findByIdAndUser(dto.getAccountId(), currentUser()).orElse(null);
            t.setAccount(acc);
        } else {
            t.setAccount(null);
        }
        if (dto.getDestinationAccountId() != null) {
            Account dest = accountRepository.findByIdAndUser(dto.getDestinationAccountId(), currentUser()).orElse(null);
            t.setDestinationAccount(dest);
        } else {
            t.setDestinationAccount(null);
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
        if (t.getDestinationAccount() != null) {
            dto.setDestinationAccountId(t.getDestinationAccount().getId());
            dto.setDestinationAccountName(t.getDestinationAccount().getName());
        }
        return dto;
    }
}

