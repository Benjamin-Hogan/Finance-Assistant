package com.personalfinance.dto;

import com.personalfinance.domain.transaction.TransactionType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class CreateTransactionRequest {
    @NotNull(message = "Account ID is required")
    private Long accountId;

    @NotNull(message = "Transaction date is required")
    private LocalDate date;

    @NotNull(message = "Transaction amount is required")
    private BigDecimal amount;

    @NotBlank(message = "Transaction description is required")
    private String description;

    @NotNull(message = "Transaction type is required")
    private TransactionType type;

    private String category;
    private String merchantName;
    private String referenceNumber;
    private boolean recurring;
    private String notes;
} 