package com.personalfinance.dto;

import com.personalfinance.domain.account.AccountType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class CreateAccountRequest {
    @NotBlank(message = "Account name is required")
    private String name;

    @NotNull(message = "Initial balance is required")
    private BigDecimal balance;

    @NotNull(message = "Account type is required")
    private AccountType type;

    private String description;
    private String institutionName;
    private String accountNumber;
    private String routingNumber;
    private BigDecimal interestRate;
    private BigDecimal creditLimit;
    private Integer dueDateDay;
} 