package com.finance.recurring;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Collection;

public class RecurringCostNormalizer {

    private static final BigDecimal DAYS_IN_MONTH = BigDecimal.valueOf(30.4375);
    private static final BigDecimal WEEKS_IN_MONTH = BigDecimal.valueOf(4.3481);

    public static BigDecimal toMonthly(BigDecimal amount, Frequency frequency) {
        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0 || frequency == null) {
            return BigDecimal.ZERO;
        }

        switch (frequency) {
            case DAILY:
                return amount.multiply(DAYS_IN_MONTH).setScale(2, RoundingMode.HALF_UP);
            case WEEKLY:
                return amount.multiply(WEEKS_IN_MONTH).setScale(2, RoundingMode.HALF_UP);
            case MONTHLY:
                return amount.setScale(2, RoundingMode.HALF_UP);
            case YEARLY:
                return amount.divide(BigDecimal.valueOf(12), 2, RoundingMode.HALF_UP);
            default:
                return amount.setScale(2, RoundingMode.HALF_UP);
        }
    }

    public static BigDecimal toAnnual(BigDecimal amount, Frequency frequency) {
        BigDecimal monthly = toMonthly(amount, frequency);
        return monthly.multiply(BigDecimal.valueOf(12)).setScale(2, RoundingMode.HALF_UP);
    }

    public static BigDecimal sumMonthly(Collection<RecurringTransaction> transactions) {
        if (transactions == null || transactions.isEmpty()) {
            return BigDecimal.ZERO;
        }
        return transactions.stream()
                .filter(t -> t.isActive() && t.getAmount() != null)
                .map(t -> toMonthly(t.getAmount(), t.getFrequency()))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }
}
