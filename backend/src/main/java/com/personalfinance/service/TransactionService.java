package com.personalfinance.service;

import com.personalfinance.domain.account.Account;
import com.personalfinance.domain.transaction.Transaction;
import com.personalfinance.domain.transaction.TransactionType;
import com.personalfinance.domain.user.User;
import com.personalfinance.dto.CreateTransactionRequest;
import com.personalfinance.dto.TransactionDTO;
import com.personalfinance.repository.AccountRepository;
import com.personalfinance.repository.TransactionRepository;
import com.personalfinance.repository.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

@Service
@RequiredArgsConstructor
public class TransactionService {

    private final TransactionRepository transactionRepository;
    private final AccountRepository accountRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public TransactionDTO getTransaction(Long id, String userEmail) {
        User user = getUserByEmail(userEmail);
        Transaction transaction = transactionRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Transaction not found with id: " + id));

        if (!transaction.getAccount().getUser().getId().equals(user.getId())) {
            throw new IllegalArgumentException("Not authorized to view this transaction");
        }

        return convertToDTO(transaction);
    }

    @Transactional(readOnly = true)
    public Page<TransactionDTO> getAccountTransactions(Long accountId, String userEmail, Pageable pageable) {
        User user = getUserByEmail(userEmail);
        Account account = getAccountForUser(accountId, user);
        
        return transactionRepository.findByAccountOrderByDateDesc(account, pageable)
                .map(this::convertToDTO);
    }

    @Transactional(readOnly = true)
    public Page<TransactionDTO> getAllUserTransactions(String userEmail, Pageable pageable) {
        User user = getUserByEmail(userEmail);
        var accounts = accountRepository.findByUserAndActiveTrue(user);
        
        return transactionRepository.findByAccountInOrderByDateDesc(accounts, pageable)
                .map(this::convertToDTO);
    }

    @Transactional
    public TransactionDTO createTransaction(CreateTransactionRequest request, String userEmail) {
        User user = getUserByEmail(userEmail);
        Account account = getAccountForUser(request.getAccountId(), user);

        Transaction transaction = new Transaction();
        transaction.setAccount(account);
        transaction.setDate(request.getDate());
        transaction.setAmount(request.getAmount());
        transaction.setDescription(request.getDescription());
        transaction.setType(request.getType());
        transaction.setCategory(request.getCategory());
        transaction.setMerchantName(request.getMerchantName());
        transaction.setReferenceNumber(request.getReferenceNumber());
        transaction.setRecurring(request.isRecurring());
        transaction.setNotes(request.getNotes());

        // Update account balance
        updateAccountBalance(account, request.getAmount(), request.getType());

        Transaction savedTransaction = transactionRepository.save(transaction);
        return convertToDTO(savedTransaction);
    }

    @Transactional
    public void deleteTransaction(Long transactionId, String userEmail) {
        User user = getUserByEmail(userEmail);
        Transaction transaction = transactionRepository.findById(transactionId)
                .orElseThrow(() -> new EntityNotFoundException("Transaction not found with id: " + transactionId));

        if (!transaction.getAccount().getUser().getId().equals(user.getId())) {
            throw new IllegalArgumentException("Not authorized to delete this transaction");
        }

        // Reverse the balance update
        updateAccountBalance(
                transaction.getAccount(),
                transaction.getAmount().negate(),
                transaction.getType()
        );

        transactionRepository.delete(transaction);
    }

    @Transactional
    public TransactionDTO updateTransaction(Long id, CreateTransactionRequest request, String userEmail) {
        User user = getUserByEmail(userEmail);
        Transaction transaction = transactionRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Transaction not found with id: " + id));

        if (!transaction.getAccount().getUser().getId().equals(user.getId())) {
            throw new IllegalArgumentException("Not authorized to update this transaction");
        }

        // Reverse the previous balance update
        updateAccountBalance(
                transaction.getAccount(),
                transaction.getAmount().negate(),
                transaction.getType()
        );

        // Update transaction fields
        transaction.setAmount(request.getAmount());
        transaction.setDescription(request.getDescription());
        transaction.setDate(request.getDate());
        transaction.setType(request.getType());
        transaction.setCategory(request.getCategory());
        transaction.setMerchantName(request.getMerchantName());
        transaction.setReferenceNumber(request.getReferenceNumber());
        transaction.setRecurring(request.isRecurring());
        transaction.setNotes(request.getNotes());

        // Apply the new balance update
        updateAccountBalance(
                transaction.getAccount(),
                request.getAmount(),
                request.getType()
        );

        Transaction savedTransaction = transactionRepository.save(transaction);
        return convertToDTO(savedTransaction);
    }

    private Account getAccountForUser(Long accountId, User user) {
        return accountRepository.findByIdAndUserAndActiveTrue(accountId, user)
                .orElseThrow(() -> new EntityNotFoundException("Account not found with id: " + accountId));
    }

    private void updateAccountBalance(Account account, BigDecimal amount, TransactionType type) {
        switch (type) {
            case INCOME:
                account.setBalance(account.getBalance().add(amount));
                break;
            case EXPENSE:
                account.setBalance(account.getBalance().subtract(amount));
                break;
            case TRANSFER:
                // Transfer logic would be handled separately
                break;
            case REFUND:
                account.setBalance(account.getBalance().add(amount));
                break;
            case ADJUSTMENT:
                account.setBalance(account.getBalance().add(amount));
                break;
        }
        accountRepository.save(account);
    }

    private User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new EntityNotFoundException("User not found with email: " + email));
    }

    private TransactionDTO convertToDTO(Transaction transaction) {
        TransactionDTO dto = new TransactionDTO();
        dto.setId(transaction.getId());
        dto.setAccountId(transaction.getAccount().getId());
        dto.setDate(transaction.getDate());
        dto.setAmount(transaction.getAmount());
        dto.setDescription(transaction.getDescription());
        dto.setType(transaction.getType());
        dto.setCategory(transaction.getCategory());
        dto.setMerchantName(transaction.getMerchantName());
        dto.setReferenceNumber(transaction.getReferenceNumber());
        dto.setRecurring(transaction.isRecurring());
        dto.setNotes(transaction.getNotes());
        return dto;
    }
} 