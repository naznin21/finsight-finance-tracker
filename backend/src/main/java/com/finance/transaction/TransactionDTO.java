package com.finance.transaction;

import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Set;

@Data
public class TransactionDTO {
    private Long id;
    private TransactionType type;
    private BigDecimal amount;
    private String description;
    private LocalDate date;
    private Long categoryId;
    private String categoryName;
    private Long accountId;
    private String accountName;
    private PaymentMethod paymentMethod;
    private String merchant;
    private Set<String> tags;
}
