package com.personalfinance.controller;

import com.personalfinance.dto.AccountDTO;
import com.personalfinance.dto.CreateAccountRequest;
import com.personalfinance.service.AccountService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/accounts")
@RequiredArgsConstructor
public class AccountController {

    private final AccountService accountService;

    @GetMapping
    public ResponseEntity<List<AccountDTO>> getUserAccounts(Authentication authentication) {
        return ResponseEntity.ok(accountService.getUserAccounts(authentication.getName()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<AccountDTO> getAccountById(
            @PathVariable Long id,
            Authentication authentication) {
        return ResponseEntity.ok(accountService.getAccountById(id, authentication.getName()));
    }

    @PostMapping
    public ResponseEntity<AccountDTO> createAccount(
            @Valid @RequestBody CreateAccountRequest request,
            Authentication authentication) {
        return ResponseEntity.ok(accountService.createAccount(request, authentication.getName()));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<AccountDTO> updateAccount(
            @PathVariable Long id,
            @Valid @RequestBody CreateAccountRequest request,
            Authentication authentication) {
        return ResponseEntity.ok(accountService.updateAccount(id, request, authentication.getName()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteAccount(
            @PathVariable Long id,
            Authentication authentication) {
        accountService.deleteAccount(id, authentication.getName());
        return ResponseEntity.noContent().build();
    }
} 