package com.finance.goal;

import com.finance.user.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface GoalRepository extends JpaRepository<SavingsGoal, Long> {
    List<SavingsGoal> findByUserOrderByCreatedAtDesc(User user);
}
