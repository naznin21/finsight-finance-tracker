package com.finance.account;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class AccountDTO {
    private Long id;
    private String name;
    private AccountType type;
    private BigDecimal openingBalance;
    private BigDecimal currentBalance;
    private String currency;
    private boolean active;
}
