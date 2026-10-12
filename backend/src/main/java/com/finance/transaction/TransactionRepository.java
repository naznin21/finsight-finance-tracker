package com.finance.transaction;

import com.finance.category.Category;
import com.finance.user.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public interface TransactionRepository extends JpaRepository<Transaction, Long>, JpaSpecificationExecutor<Transaction> {

    List<Transaction> findByUserOrderByDateDesc(User user);

    List<Transaction> findByUserAndDateBetweenOrderByDateDesc(User user, LocalDate from, LocalDate to);

    boolean existsByUserAndDateAndAmountAndDescription(User user, LocalDate date, BigDecimal amount, String description);

    @Query("SELECT t.category.name, SUM(t.amount) FROM Transaction t " +
           "WHERE t.user = :user AND t.type = 'EXPENSE' AND t.date BETWEEN :from AND :to " +
           "GROUP BY t.category.name ORDER BY SUM(t.amount) DESC")
    List<Object[]> categorySpending(@Param("user") User user, @Param("from") LocalDate from, @Param("to") LocalDate to);

    List<Transaction> findByUserAndCategoryOrderByDateDesc(User user, Category category);

    @Query("SELECT SUM(t.amount) FROM Transaction t WHERE t.user = :user AND t.type = :type AND t.date BETWEEN :from AND :to")
    BigDecimal sumByTypeAndDateRange(@Param("user") User user, @Param("type") TransactionType type, @Param("from") LocalDate from, @Param("to") LocalDate to);

    @Query("SELECT SUM(t.amount) FROM Transaction t WHERE t.user = :user AND t.category.id = :categoryId AND t.type = :type AND t.date BETWEEN :from AND :to")
    BigDecimal sumByCategoryAndTypeAndDateRange(@Param("user") User user, @Param("categoryId") Long categoryId, @Param("type") TransactionType type, @Param("from") LocalDate from, @Param("to") LocalDate to);
}
