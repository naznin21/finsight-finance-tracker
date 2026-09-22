package com.finance.insights;

import lombok.*;
import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@Data @Builder
public class InsightReport {
    private Map<String, BigDecimal> spendingPatterns;
    private List<String> anomalies;
    private List<String> suggestions;
}
