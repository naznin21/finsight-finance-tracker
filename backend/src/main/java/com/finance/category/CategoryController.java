package com.finance.category;

import com.finance.user.User;
import com.finance.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/categories")
@RequiredArgsConstructor
public class CategoryController {

    private final CategoryService categoryService;
    private final UserRepository userRepository;

    private User getUser(UserDetails userDetails) {
        return userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
    }

    @GetMapping
    public ResponseEntity<List<CategoryDTO>> getCategories(@AuthenticationPrincipal UserDetails userDetails) {
        User user = getUser(userDetails);
        return ResponseEntity.ok(categoryService.getCategoriesForUser(user));
    }

    @PostMapping
    public ResponseEntity<CategoryDTO> createCategory(
            @RequestBody CategoryDTO dto,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        User user = getUser(userDetails);
        return ResponseEntity.ok(categoryService.createCategory(dto, user));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCategory(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        User user = getUser(userDetails);
        categoryService.deleteCategory(id, user);
        return ResponseEntity.noContent().build();
    }
}
