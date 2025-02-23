package com.personalfinance.service;

import com.personalfinance.domain.account.Account;
import com.personalfinance.domain.user.User;
import com.personalfinance.dto.AccountDTO;
import com.personalfinance.dto.CreateAccountRequest;
import com.personalfinance.repository.AccountRepository;
import com.personalfinance.repository.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AccountService {

    private final AccountRepository accountRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public List<AccountDTO> getUserAccounts(String userEmail) {
        User user = getUserByEmail(userEmail);
        return accountRepository.findByUserAndActiveTrue(user)
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public AccountDTO getAccountById(Long id, String userEmail) {
        User user = getUserByEmail(userEmail);
        return accountRepository.findByIdAndUserAndActiveTrue(id, user)
                .map(this::convertToDTO)
                .orElseThrow(() -> new EntityNotFoundException("Account not found with id: " + id));
    }

    @Transactional
    public AccountDTO createAccount(CreateAccountRequest request, String userEmail) {
        User user = getUserByEmail(userEmail);
        
        Account account = new Account();
        account.setUser(user);
        account.setName(request.getName());
        account.setBalance(request.getBalance());
        account.setType(request.getType());
        account.setDescription(request.getDescription());
        account.setInstitutionName(request.getInstitutionName());
        account.setAccountNumber(request.getAccountNumber());
        account.setRoutingNumber(request.getRoutingNumber());
        account.setInterestRate(request.getInterestRate());
        account.setCreditLimit(request.getCreditLimit());
        account.setDueDateDay(request.getDueDateDay());
        account.setActive(true);

        Account savedAccount = accountRepository.save(account);
        return convertToDTO(savedAccount);
    }

    @Transactional
    public AccountDTO updateAccount(Long id, CreateAccountRequest request, String userEmail) {
        User user = getUserByEmail(userEmail);
        Account account = accountRepository.findByIdAndUserAndActiveTrue(id, user)
                .orElseThrow(() -> new EntityNotFoundException("Account not found with id: " + id));

        account.setName(request.getName());
        account.setType(request.getType());
        account.setDescription(request.getDescription());
        account.setInstitutionName(request.getInstitutionName());
        account.setAccountNumber(request.getAccountNumber());
        account.setRoutingNumber(request.getRoutingNumber());
        account.setInterestRate(request.getInterestRate());
        account.setCreditLimit(request.getCreditLimit());
        account.setDueDateDay(request.getDueDateDay());

        Account savedAccount = accountRepository.save(account);
        return convertToDTO(savedAccount);
    }

    @Transactional
    public void deleteAccount(Long id, String userEmail) {
        User user = getUserByEmail(userEmail);
        Account account = accountRepository.findByIdAndUserAndActiveTrue(id, user)
                .orElseThrow(() -> new EntityNotFoundException("Account not found with id: " + id));
        
        account.setActive(false);
        accountRepository.save(account);
    }

    private User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new EntityNotFoundException("User not found with email: " + email));
    }

    private AccountDTO convertToDTO(Account account) {
        AccountDTO dto = new AccountDTO();
        dto.setId(account.getId());
        dto.setName(account.getName());
        dto.setBalance(account.getBalance());
        dto.setType(account.getType());
        dto.setDescription(account.getDescription());
        dto.setActive(account.isActive());
        dto.setInstitutionName(account.getInstitutionName());
        dto.setAccountNumber(account.getAccountNumber());
        dto.setRoutingNumber(account.getRoutingNumber());
        dto.setInterestRate(account.getInterestRate());
        dto.setCreditLimit(account.getCreditLimit());
        dto.setDueDateDay(account.getDueDateDay());
        return dto;
    }
} 