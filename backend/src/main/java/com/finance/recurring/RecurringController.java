package com.finance.recurring;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/recurring")
@RequiredArgsConstructor
public class RecurringController {

    private final RecurringService recurringService;

    @GetMapping
    public List<RecurringDTO> getAll() { return recurringService.getAll(); }

    @PostMapping
    public RecurringDTO create(@RequestBody RecurringDTO dto) { return recurringService.create(dto); }

    @PutMapping("/{id}")
    public RecurringDTO update(@PathVariable Long id, @RequestBody RecurringDTO dto) {
        return recurringService.update(id, dto);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        recurringService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
