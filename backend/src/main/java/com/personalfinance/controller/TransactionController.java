package com.personalfinance.controller;

import com.personalfinance.dto.CreateTransactionRequest;
import com.personalfinance.dto.TransactionDTO;
import com.personalfinance.service.TransactionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/transactions")
@RequiredArgsConstructor
public class TransactionController {

    private final TransactionService transactionService;

    @GetMapping
    public ResponseEntity<Page<TransactionDTO>> getAllUserTransactions(
            Authentication authentication,
            @PageableDefault(size = 20, sort = {"date"}, direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(transactionService.getAllUserTransactions(authentication.getName(), pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<TransactionDTO> getTransaction(
            Authentication authentication,
            @PathVariable Long id) {
        return ResponseEntity.ok(transactionService.getTransaction(id, authentication.getName()));
    }

    @GetMapping("/account/{accountId}")
    public ResponseEntity<Page<TransactionDTO>> getAccountTransactions(
            Authentication authentication,
            @PathVariable Long accountId,
            @PageableDefault(size = 20, sort = {"date"}, direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(transactionService.getAccountTransactions(accountId, authentication.getName(), pageable));
    }

    @PostMapping
    public ResponseEntity<TransactionDTO> createTransaction(
            Authentication authentication,
            @Valid @RequestBody CreateTransactionRequest request) {
        return ResponseEntity.ok(transactionService.createTransaction(request, authentication.getName()));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<TransactionDTO> updateTransaction(
            Authentication authentication,
            @PathVariable Long id,
            @Valid @RequestBody CreateTransactionRequest request) {
        return ResponseEntity.ok(transactionService.updateTransaction(id, request, authentication.getName()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTransaction(
            Authentication authentication,
            @PathVariable Long id) {
        transactionService.deleteTransaction(id, authentication.getName());
        return ResponseEntity.noContent().build();
    }
} 