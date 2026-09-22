package com.finance.dashboard;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping("/summary")
    public DashboardSummary getSummary(@RequestParam(defaultValue = "") String month) {
        return dashboardService.getMonthlySummary(month);
    }
}
