package com.finance.budget;

import com.finance.user.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface BudgetRepository extends JpaRepository<Budget, Long> {
    List<Budget> findByUserAndMonth(User user, String month);
    Optional<Budget> findByUserAndCategoryIdAndMonth(User user, Long categoryId, String month);
    List<Budget> findByUserAndRolloverTrue(User user);
}
