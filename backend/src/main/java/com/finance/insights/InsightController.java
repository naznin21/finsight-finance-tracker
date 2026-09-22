package com.finance.insights;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/insights")
@RequiredArgsConstructor
public class InsightController {

    private final InsightService insightService;

    @GetMapping
    public InsightReport getInsights() {
        return insightService.generateInsights();
    }
}
