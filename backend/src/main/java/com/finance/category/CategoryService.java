package com.finance.category;

import com.finance.user.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class CategoryService {

    private final CategoryRepository categoryRepository;

    @Transactional
    public List<CategoryDTO> getCategoriesForUser(User user) {
        seedDefaultCategoriesIfEmpty();
        List<Category> categories = categoryRepository.findByUserIsNullOrUser(user);
        return categories.stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public CategoryDTO createCategory(CategoryDTO dto, User user) {
        Category.CategoryType type = Category.CategoryType.DISCRETIONARY;
        if (dto.getType() != null) {
            try {
                type = Category.CategoryType.valueOf(dto.getType().toUpperCase());
            } catch (Exception ignored) {}
        }

        Category category = Category.builder()
                .name(dto.getName())
                .icon(dto.getIcon() != null ? dto.getIcon() : "📁")
                .type(type)
                .user(user)
                .build();

        Category saved = categoryRepository.save(category);
        log.info("Created category '{}' for user {}", saved.getName(), user.getEmail());
        return mapToDTO(saved);
    }

    @Transactional
    public void deleteCategory(Long id, User user) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Category not found with id: " + id));

        if (category.getUser() == null) {
            throw new IllegalArgumentException("Default system categories cannot be deleted.");
        }

        if (!category.getUser().getId().equals(user.getId())) {
            throw new IllegalStateException("Unauthorized to delete this category.");
        }

        categoryRepository.delete(category);
        log.info("Deleted category id {} for user {}", id, user.getEmail());
    }

    @Transactional
    public void seedDefaultCategoriesIfEmpty() {
        if (categoryRepository.count() == 0) {
            log.info("Categories table is empty. Initializing default system categories in MySQL DB...");
            List<Category> defaults = List.of(
                Category.builder().name("Food & Dining").icon("🍔").type(Category.CategoryType.ESSENTIAL).user(null).build(),
                Category.builder().name("Housing & Rent").icon("🏠").type(Category.CategoryType.ESSENTIAL).user(null).build(),
                Category.builder().name("Transport & Fuel").icon("🚗").type(Category.CategoryType.ESSENTIAL).user(null).build(),
                Category.builder().name("Utilities & Bills").icon("💡").type(Category.CategoryType.ESSENTIAL).user(null).build(),
                Category.builder().name("Health & Medical").icon("🏥").type(Category.CategoryType.ESSENTIAL).user(null).build(),
                Category.builder().name("Salary & Income").icon("💰").type(Category.CategoryType.ESSENTIAL).user(null).build(),
                Category.builder().name("Investments & Savings").icon("📈").type(Category.CategoryType.ESSENTIAL).user(null).build(),
                Category.builder().name("Freelance & Business").icon("💻").type(Category.CategoryType.ESSENTIAL).user(null).build(),
                Category.builder().name("Shopping & Lifestyle").icon("🛍️").type(Category.CategoryType.DISCRETIONARY).user(null).build(),
                Category.builder().name("Entertainment & Leisure").icon("🎬").type(Category.CategoryType.DISCRETIONARY).user(null).build(),
                Category.builder().name("Subscriptions & Apps").icon("📱").type(Category.CategoryType.DISCRETIONARY).user(null).build(),
                Category.builder().name("Miscellaneous").icon("📦").type(Category.CategoryType.DISCRETIONARY).user(null).build()
            );
            categoryRepository.saveAll(defaults);
            log.info("Successfully seeded 12 default categories into database.");
        }
    }

    private CategoryDTO mapToDTO(Category c) {
        return CategoryDTO.builder()
                .id(c.getId())
                .name(c.getName())
                .icon(c.getIcon())
                .type(c.getType() != null ? c.getType().name() : "DISCRETIONARY")
                .build();
    }
}
