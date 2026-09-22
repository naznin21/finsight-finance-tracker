package com.finance.category;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class CategoryDataSeeder implements CommandLineRunner {

    private final CategoryService categoryService;

    @Override
    public void run(String... args) {
        try {
            categoryService.seedDefaultCategoriesIfEmpty();
        } catch (Exception e) {
            log.warn("Auto-seeding categories encountered non-fatal notice: {}", e.getMessage());
        }
    }
}
