package com.finance.recurring;

import com.finance.category.CategoryRepository;
import com.finance.transaction.Transaction;
import com.finance.transaction.TransactionRepository;
import com.finance.user.User;
import com.finance.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RecurringService {

    private final RecurringRepository recurringRepository;
    private final TransactionRepository transactionRepository;
    private final CategoryRepository categoryRepository;
    private final UserRepository userRepository;
    private final JavaMailSender mailSender;

    private User currentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email).orElseThrow();
    }

    public List<RecurringDTO> getAll() {
        return recurringRepository.findByUserAndActiveTrue(currentUser())
                .stream().map(this::toDTO).collect(Collectors.toList());
    }

    public RecurringDTO create(RecurringDTO dto) {
        RecurringTransaction r = new RecurringTransaction();
        applyDTO(dto, r);
        r.setUser(currentUser());
        return toDTO(recurringRepository.save(r));
    }

    public RecurringDTO update(Long id, RecurringDTO dto) {
        RecurringTransaction r = recurringRepository.findById(id).orElseThrow();
        ensureOwner(r);
        applyDTO(dto, r);
        return toDTO(recurringRepository.save(r));
    }

    public void delete(Long id) {
        RecurringTransaction r = recurringRepository.findById(id).orElseThrow();
        ensureOwner(r);
        r.setActive(false);
        recurringRepository.save(r);
    }

    private void ensureOwner(RecurringTransaction r) {
        if (!r.getUser().getEmail().equals(currentUser().getEmail())) {
            throw new RuntimeException("Access denied.");
        }
    }

    // Runs daily at 8am — auto-creates transactions and sends reminders idempotently
    @Scheduled(cron = "0 0 8 * * *")
    public void processRecurring() {
        LocalDate today = LocalDate.now();
        recurringRepository.findByActiveTrue().forEach(r -> {
            LocalDate next = nextDueDate(r);
            // Idempotence check: ensure transaction for this occurrence date doesn't already exist
            if (!next.isAfter(today) && (r.getEndDate() == null || !today.isAfter(r.getEndDate()))) {
                boolean alreadyProcessed = r.getLastProcessed() != null && r.getLastProcessed().equals(next);
                if (!alreadyProcessed) {
                    Transaction t = Transaction.builder()
                            .type(r.getType())
                            .amount(r.getAmount())
                            .description(r.getDescription() + " (Recurring)")
                            .date(next)
                            .category(r.getCategory())
                            .user(r.getUser())
                            .build();
                    transactionRepository.save(t);
                    r.setLastProcessed(next);
                    recurringRepository.save(r);
                }
            }
            // Send reminder
            LocalDate reminder = next.minusDays(r.getReminderDaysBefore() != null ? r.getReminderDaysBefore() : 3);
            if (reminder.equals(today)) {
                sendReminder(r.getUser().getEmail(), r.getDescription(), next);
            }
        });
    }

    private LocalDate nextDueDate(RecurringTransaction r) {
        LocalDate base = r.getLastProcessed() != null ? r.getLastProcessed() : r.getStartDate().minusDays(1);
        return switch (r.getFrequency()) {
            case DAILY -> base.plusDays(1);
            case WEEKLY -> base.plusWeeks(1);
            case MONTHLY -> base.plusMonths(1);
            case YEARLY -> base.plusYears(1);
        };
    }

    private void sendReminder(String email, String desc, LocalDate dueDate) {
        SimpleMailMessage msg = new SimpleMailMessage();
        msg.setTo(email);
        msg.setSubject("Upcoming bill: " + desc);
        msg.setText("Reminder: '" + desc + "' is due on " + dueDate);
        mailSender.send(msg);
    }

    private void applyDTO(RecurringDTO dto, RecurringTransaction r) {
        r.setType(dto.getType());
        r.setAmount(dto.getAmount());
        r.setDescription(dto.getDescription());
        r.setFrequency(dto.getFrequency());
        r.setStartDate(dto.getStartDate());
        r.setEndDate(dto.getEndDate());
        r.setActive(true);
        r.setReminderDaysBefore(dto.getReminderDaysBefore() != null ? dto.getReminderDaysBefore() : 3);
        if (dto.getCategoryId() != null) {
            categoryRepository.findById(dto.getCategoryId()).ifPresent(r::setCategory);
        }
    }

    private RecurringDTO toDTO(RecurringTransaction r) {
        RecurringDTO dto = new RecurringDTO();
        dto.setId(r.getId());
        dto.setType(r.getType());
        dto.setAmount(r.getAmount());
        dto.setDescription(r.getDescription());
        dto.setFrequency(r.getFrequency());
        dto.setStartDate(r.getStartDate());
        dto.setEndDate(r.getEndDate());
        dto.setLastProcessed(r.getLastProcessed());
        dto.setActive(r.isActive());
        dto.setReminderDaysBefore(r.getReminderDaysBefore());
        dto.setNextDueDate(nextDueDate(r));
        if (r.getCategory() != null) {
            dto.setCategoryId(r.getCategory().getId());
            dto.setCategoryName(r.getCategory().getName());
        }
        return dto;
    }
}
