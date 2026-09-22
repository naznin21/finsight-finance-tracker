package com.finance.experiment;

import com.finance.user.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ChallengeRepository extends JpaRepository<FinancialChallenge, Long> {
    List<FinancialChallenge> findByUserAndActiveTrue(User user);
    Optional<FinancialChallenge> findByIdAndUser(Long id, User user);
}
