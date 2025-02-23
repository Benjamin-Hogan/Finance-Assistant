package com.personalfinance.dto;

import com.personalfinance.domain.account.AccountType;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class AccountDTO {
    private Long id;
    private String name;
    private BigDecimal balance;
    private AccountType type;
    private String description;
    private boolean active;
    private String institutionName;
    private String accountNumber;
    private String routingNumber;
    private BigDecimal interestRate;
    private BigDecimal creditLimit;
    private Integer dueDateDay;
} 