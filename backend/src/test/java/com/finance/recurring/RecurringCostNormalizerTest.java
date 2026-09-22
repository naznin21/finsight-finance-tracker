package com.finance.recurring;

import org.junit.jupiter.api.Test;
import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.assertEquals;

public class RecurringCostNormalizerTest {

    @Test
    public void testMonthlyNormalization() {
        BigDecimal daily = RecurringCostNormalizer.toMonthly(BigDecimal.valueOf(100), Frequency.DAILY);
        assertEquals(BigDecimal.valueOf(3043.75), daily);

        BigDecimal weekly = RecurringCostNormalizer.toMonthly(BigDecimal.valueOf(500), Frequency.WEEKLY);
        assertEquals(BigDecimal.valueOf(2174.05), weekly);

        BigDecimal monthly = RecurringCostNormalizer.toMonthly(BigDecimal.valueOf(5000), Frequency.MONTHLY);
        assertEquals(BigDecimal.valueOf(5000.00).setScale(2), monthly);

        BigDecimal yearly = RecurringCostNormalizer.toMonthly(BigDecimal.valueOf(24000), Frequency.YEARLY);
        assertEquals(BigDecimal.valueOf(2000.00).setScale(2), yearly);
    }
}
