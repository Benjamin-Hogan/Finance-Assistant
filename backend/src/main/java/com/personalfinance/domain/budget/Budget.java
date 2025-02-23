package com.personalfinance.domain.budget;

import com.personalfinance.domain.common.BaseEntity;
import com.personalfinance.domain.user.User;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "budgets")
@Getter
@Setter
public class Budget extends BaseEntity {
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
    
    @NotBlank
    @Column(nullable = false)
    private String name;
    
    @NotNull
    @Column(nullable = false)
    private BigDecimal amount;
    
    @NotNull
    @Column(name = "period_start", nullable = false)
    private LocalDate periodStart;
    
    @Column(name = "period_end")
    private LocalDate periodEnd;
    
    @Column(nullable = false)
    private boolean active = true;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private BudgetType type;
    
    @Column(name = "category")
    private String category;
    
    @Column(length = 1000)
    private String description;
    
    @Column(name = "rollover_enabled")
    private boolean rolloverEnabled;
    
    @Column(name = "rollover_amount")
    private BigDecimal rolloverAmount = BigDecimal.ZERO;
} 