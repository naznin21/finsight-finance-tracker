package com.finance.recurring;

import com.finance.user.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface RecurringRepository extends JpaRepository<RecurringTransaction, Long> {
    List<RecurringTransaction> findByUser(User user);
    List<RecurringTransaction> findByUserAndActiveTrue(User user);
    List<RecurringTransaction> findByActiveTrue();
}
