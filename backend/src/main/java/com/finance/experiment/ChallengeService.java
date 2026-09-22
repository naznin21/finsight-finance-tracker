package com.finance.experiment;

import com.finance.transaction.TransactionRepository;
import com.finance.transaction.TransactionType;
import com.finance.user.User;
import com.finance.user.UserRepository;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ChallengeService {

    private final ChallengeRepository challengeRepository;
    private final TransactionRepository transactionRepository;
    private final UserRepository userRepository;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ChallengeDTO {
        private Long id;
        private String title;
        private String targetCategory;
        private BigDecimal baselineSpend;
        private BigDecimal targetLimit;
        private BigDecimal currentSpend;
        private BigDecimal totalSaved;
        private String status; // "ON_TRACK", "EXCEEDED", "COMPLETED"
        private String startDate;
        private String endDate;
    }

    private User currentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email).orElseThrow();
    }

    public List<ChallengeDTO> getActiveChallenges() {
        User user = currentUser();
        List<FinancialChallenge> list = challengeRepository.findByUserAndActiveTrue(user);
        return list.stream().map(c -> updateAndToDTO(user, c)).collect(Collectors.toList());
    }

    public ChallengeDTO createChallenge(ChallengeDTO dto) {
        User user = currentUser();
        LocalDate start = dto.getStartDate() != null ? LocalDate.parse(dto.getStartDate()) : LocalDate.now();
        LocalDate end = dto.getEndDate() != null ? LocalDate.parse(dto.getEndDate()) : start.plusDays(30);

        FinancialChallenge c = FinancialChallenge.builder()
                .user(user)
                .title(dto.getTitle())
                .targetCategory(dto.getTargetCategory() != null ? dto.getTargetCategory() : "Food")
                .baselineSpend(dto.getBaselineSpend() != null ? dto.getBaselineSpend() : BigDecimal.valueOf(8000))
                .targetLimit(dto.getTargetLimit() != null ? dto.getTargetLimit() : BigDecimal.valueOf(6500))
                .startDate(start)
                .endDate(end)
                .active(true)
                .build();

        return updateAndToDTO(user, challengeRepository.save(c));
    }

    public void deleteChallenge(Long id) {
        FinancialChallenge c = challengeRepository.findByIdAndUser(id, currentUser())
                .orElseThrow(() -> new RuntimeException("Challenge not found"));
        c.setActive(false);
        challengeRepository.save(c);
    }

    private ChallengeDTO updateAndToDTO(User user, FinancialChallenge c) {
        // Calculate actual spending in category within challenge window
        BigDecimal currentSpend = BigDecimal.ZERO;
        if (c.getTargetCategory() != null) {
            BigDecimal catSpent = transactionRepository.categorySpending(user, c.getStartDate(), c.getEndDate()).stream()
                    .filter(row -> c.getTargetCategory().equalsIgnoreCase((String) row[0]))
                    .map(row -> (BigDecimal) row[1])
                    .findFirst().orElse(BigDecimal.ZERO);
            currentSpend = catSpent;
        }

        c.setCurrentSpend(currentSpend);

        BigDecimal baseline = c.getBaselineSpend() != null ? c.getBaselineSpend() : BigDecimal.ZERO;
        BigDecimal saved = baseline.subtract(currentSpend).max(BigDecimal.ZERO);

        String status = "ON_TRACK";
        if (currentSpend.compareTo(c.getTargetLimit()) > 0) {
            status = "EXCEEDED";
        } else if (LocalDate.now().isAfter(c.getEndDate())) {
            status = "COMPLETED";
        }

        return ChallengeDTO.builder()
                .id(c.getId())
                .title(c.getTitle())
                .targetCategory(c.getTargetCategory())
                .baselineSpend(c.getBaselineSpend())
                .targetLimit(c.getTargetLimit())
                .currentSpend(currentSpend)
                .totalSaved(saved)
                .status(status)
                .startDate(c.getStartDate().toString())
                .endDate(c.getEndDate().toString())
                .build();
    }
}
