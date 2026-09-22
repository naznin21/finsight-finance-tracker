package com.finance.currency;

import lombok.AllArgsConstructor;
import lombok.Data;
import java.math.BigDecimal;

@Data @AllArgsConstructor
public class ConversionResult {
    private String fromCurrency;
    private String toCurrency;
    private BigDecimal originalAmount;
    private BigDecimal convertedAmount;
    private BigDecimal exchangeRate;
}
