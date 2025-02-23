package com.personalfinance.domain.account;

import com.personalfinance.domain.common.BaseEntity;
import com.personalfinance.domain.user.User;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Entity
@Table(name = "accounts")
@Getter
@Setter
public class Account extends BaseEntity {
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
    
    @NotBlank
    @Column(nullable = false)
    private String name;
    
    @NotNull
    @Column(nullable = false)
    private BigDecimal balance = BigDecimal.ZERO;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AccountType type;
    
    @Column(length = 1000)
    private String description;
    
    @Column(nullable = false)
    private boolean active = true;
    
    @Column(name = "institution_name")
    private String institutionName;
    
    @Column(name = "account_number")
    private String accountNumber;
    
    @Column(name = "routing_number")
    private String routingNumber;
    
    @Column(name = "interest_rate")
    private BigDecimal interestRate;
    
    @Column(name = "credit_limit")
    private BigDecimal creditLimit;
    
    @Column(name = "due_date")
    private Integer dueDateDay;
} 