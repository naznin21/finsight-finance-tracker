package com.finance.category;

import com.finance.user.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface CategoryRepository extends JpaRepository<Category, Long> {
    List<Category> findByUserIsNullOrUser(User user);
}
