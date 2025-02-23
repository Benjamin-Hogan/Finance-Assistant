package com.personalfinance.domain.transaction;

import com.personalfinance.domain.account.Account;
import com.personalfinance.domain.common.BaseEntity;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "transactions")
@Getter
@Setter
public class Transaction extends BaseEntity {
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "account_id", nullable = false)
    private Account account;
    
    @NotNull
    @Column(nullable = false)
    private LocalDate date;
    
    @NotNull
    @Column(nullable = false)
    private BigDecimal amount;
    
    @Column(nullable = false)
    private String description;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TransactionType type;
    
    @Column(name = "category")
    private String category;
    
    @Column(name = "merchant_name")
    private String merchantName;
    
    @Column(name = "reference_number")
    private String referenceNumber;
    
    @Column(name = "is_recurring")
    private boolean recurring;
    
    @Column(name = "notes", length = 1000)
    private String notes;
} 