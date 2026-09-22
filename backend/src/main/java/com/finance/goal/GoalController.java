package com.finance.goal;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/goals")
@RequiredArgsConstructor
public class GoalController {

    private final GoalService goalService;

    @GetMapping
    public List<GoalDTO> getAll() { return goalService.getAll(); }

    @PostMapping
    public GoalDTO create(@RequestBody GoalDTO dto) { return goalService.create(dto); }

    @PutMapping("/{id}")
    public GoalDTO update(@PathVariable Long id, @RequestBody GoalDTO dto) {
        return goalService.update(id, dto);
    }

    @PostMapping("/{id}/add-savings")
    public GoalDTO addSavings(@PathVariable Long id, @RequestParam BigDecimal amount) {
        return goalService.addSavings(id, amount);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        goalService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
