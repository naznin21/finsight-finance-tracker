package com.finance.budget;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/budgets")
@RequiredArgsConstructor
public class BudgetController {

    private final BudgetService budgetService;

    @GetMapping
    public List<BudgetDTO> getBudgets(@RequestParam(defaultValue = "") String month) {
        return budgetService.getBudgets(month);
    }

    @PostMapping
    public BudgetDTO createOrUpdate(@RequestBody BudgetDTO dto) {
        return budgetService.createOrUpdate(dto);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        budgetService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
