package com.finance.account;

import com.finance.user.User;
import com.finance.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AccountService {

    private final AccountRepository accountRepository;
    private final UserRepository userRepository;

    private User currentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email).orElseThrow();
    }

    public List<AccountDTO> getAll() {
        return accountRepository.findByUserAndActiveTrue(currentUser())
                .stream().map(this::toDTO).collect(Collectors.toList());
    }

    public AccountDTO create(AccountDTO dto) {
        User user = currentUser();
        BigDecimal opening = dto.getOpeningBalance() != null ? dto.getOpeningBalance() : BigDecimal.ZERO;
        Account account = Account.builder()
                .user(user)
                .name(dto.getName())
                .type(dto.getType() != null ? dto.getType() : AccountType.SAVINGS)
                .openingBalance(opening)
                .currentBalance(opening)
                .currency(dto.getCurrency() != null ? dto.getCurrency() : "INR")
                .active(true)
                .build();
        return toDTO(accountRepository.save(account));
    }

    public AccountDTO update(Long id, AccountDTO dto) {
        Account account = accountRepository.findByIdAndUser(id, currentUser())
                .orElseThrow(() -> new RuntimeException("Account not found or access denied"));
        account.setName(dto.getName());
        if (dto.getType() != null) account.setType(dto.getType());
        if (dto.getCurrency() != null) account.setCurrency(dto.getCurrency());
        return toDTO(accountRepository.save(account));
    }

    public void delete(Long id) {
        Account account = accountRepository.findByIdAndUser(id, currentUser())
                .orElseThrow(() -> new RuntimeException("Account not found or access denied"));
        account.setActive(false);
        accountRepository.save(account);
    }

    private AccountDTO toDTO(Account a) {
        AccountDTO dto = new AccountDTO();
        dto.setId(a.getId());
        dto.setName(a.getName());
        dto.setType(a.getType());
        dto.setOpeningBalance(a.getOpeningBalance());
        dto.setCurrentBalance(a.getCurrentBalance());
        dto.setCurrency(a.getCurrency());
        dto.setActive(a.isActive());
        return dto;
    }
}
