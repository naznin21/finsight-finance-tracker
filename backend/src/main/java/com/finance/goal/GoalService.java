package com.finance.goal;

import com.finance.user.User;
import com.finance.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class GoalService {

    private final GoalRepository goalRepository;
    private final UserRepository userRepository;

    private User currentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email).orElseThrow();
    }

    public List<GoalDTO> getAll() {
        return goalRepository.findByUserOrderByCreatedAtDesc(currentUser())
                .stream().map(this::toDTO).collect(Collectors.toList());
    }

    public GoalDTO create(GoalDTO dto) {
        SavingsGoal goal = SavingsGoal.builder()
                .user(currentUser())
                .name(dto.getName())
                .icon(dto.getIcon())
                .targetAmount(dto.getTargetAmount())
                .savedAmount(dto.getSavedAmount() != null ? dto.getSavedAmount() : BigDecimal.ZERO)
                .targetDate(dto.getTargetDate())
                .status(GoalStatus.IN_PROGRESS)
                .build();
        return toDTO(goalRepository.save(goal));
    }

    public GoalDTO addSavings(Long id, BigDecimal amount) {
        SavingsGoal goal = goalRepository.findById(id).orElseThrow();
        ensureOwner(goal);
        goal.setSavedAmount(goal.getSavedAmount().add(amount));
        if (goal.getSavedAmount().compareTo(goal.getTargetAmount()) >= 0) {
            goal.setStatus(GoalStatus.COMPLETED);
        }
        return toDTO(goalRepository.save(goal));
    }

    public GoalDTO update(Long id, GoalDTO dto) {
        SavingsGoal goal = goalRepository.findById(id).orElseThrow();
        ensureOwner(goal);
        goal.setName(dto.getName());
        goal.setIcon(dto.getIcon());
        goal.setTargetAmount(dto.getTargetAmount());
        goal.setTargetDate(dto.getTargetDate());
        if (dto.getStatus() != null) goal.setStatus(dto.getStatus());
        return toDTO(goalRepository.save(goal));
    }

    public void delete(Long id) {
        SavingsGoal goal = goalRepository.findById(id).orElseThrow();
        ensureOwner(goal);
        goalRepository.delete(goal);
    }

    private void ensureOwner(SavingsGoal goal) {
        if (!goal.getUser().getEmail().equals(currentUser().getEmail())) {
            throw new RuntimeException("Access denied.");
        }
    }

    private GoalDTO toDTO(SavingsGoal g) {
        GoalDTO dto = new GoalDTO();
        dto.setId(g.getId());
        dto.setName(g.getName());
        dto.setIcon(g.getIcon());
        dto.setTargetAmount(g.getTargetAmount());
        dto.setSavedAmount(g.getSavedAmount());
        dto.setTargetDate(g.getTargetDate());
        dto.setStatus(g.getStatus());

        double pct = g.getSavedAmount()
                .divide(g.getTargetAmount(), 4, RoundingMode.HALF_UP)
                .doubleValue() * 100;
        dto.setProgressPercent(Math.min(pct, 100));
        dto.setCompletionPrediction(predict(g));
        return dto;
    }

    private String predict(SavingsGoal g) {
        if (g.getStatus() == GoalStatus.COMPLETED) return "Completed";
        BigDecimal remaining = g.getTargetAmount().subtract(g.getSavedAmount());
        if (remaining.compareTo(BigDecimal.ZERO) <= 0) return "Completed";

        long daysSinceCreation = ChronoUnit.DAYS.between(g.getCreatedAt().toLocalDate(), LocalDate.now());
        if (daysSinceCreation == 0) return "Just started";

        // daily saving rate
        double dailyRate = g.getSavedAmount().doubleValue() / daysSinceCreation;
        if (dailyRate <= 0) return "No savings recorded yet";

        long daysNeeded = (long) Math.ceil(remaining.doubleValue() / dailyRate);
        LocalDate predicted = LocalDate.now().plusDays(daysNeeded);

        if (g.getTargetDate() != null) {
            return predicted.isAfter(g.getTargetDate())
                    ? "Behind schedule (est. " + predicted + ")"
                    : "On track (est. " + predicted + ")";
        }
        return "Est. completion: " + predicted;
    }
}
