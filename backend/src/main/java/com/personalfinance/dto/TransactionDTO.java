package com.personalfinance.dto;

import com.personalfinance.domain.transaction.TransactionType;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class TransactionDTO {
    private Long id;
    private Long accountId;
    private LocalDate date;
    private BigDecimal amount;
    private String description;
    private TransactionType type;
    private String category;
    private String merchantName;
    private String referenceNumber;
    private boolean recurring;
    private String notes;
} 