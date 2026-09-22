package com.finance.transaction;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/transactions")
@RequiredArgsConstructor
public class TransactionController {

    private final TransactionService transactionService;

    @GetMapping
    public List<TransactionDTO> getAll() {
        return transactionService.getAll();
    }

    @PostMapping
    public TransactionDTO create(@RequestBody TransactionDTO dto) {
        return transactionService.create(dto);
    }

    @PutMapping("/{id}")
    public TransactionDTO update(@PathVariable Long id, @RequestBody TransactionDTO dto) {
        return transactionService.update(id, dto);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        transactionService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/import/csv")
    public List<TransactionDTO> importCsv(@RequestParam("file") MultipartFile file) throws Exception {
        return transactionService.importCsv(file);
    }

    @PostMapping("/import/excel")
    public List<TransactionDTO> importExcel(@RequestParam("file") MultipartFile file) throws Exception {
        return transactionService.importExcel(file);
    }
}
