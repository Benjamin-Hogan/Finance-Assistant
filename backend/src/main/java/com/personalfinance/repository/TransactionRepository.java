package com.personalfinance.repository;

import com.personalfinance.domain.account.Account;
import com.personalfinance.domain.transaction.Transaction;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface TransactionRepository extends JpaRepository<Transaction, Long> {
    Page<Transaction> findByAccountOrderByDateDesc(Account account, Pageable pageable);
    
    Page<Transaction> findByAccountInOrderByDateDesc(List<Account> accounts, Pageable pageable);
    
    @Query("SELECT t FROM Transaction t WHERE t.account = :account AND t.date BETWEEN :startDate AND :endDate ORDER BY t.date DESC")
    List<Transaction> findByAccountAndDateBetween(Account account, LocalDate startDate, LocalDate endDate);
    
    @Query("SELECT t FROM Transaction t WHERE t.account IN :accounts AND t.date BETWEEN :startDate AND :endDate ORDER BY t.date DESC")
    List<Transaction> findByAccountInAndDateBetween(List<Account> accounts, LocalDate startDate, LocalDate endDate);
    
    @Query("SELECT SUM(t.amount) FROM Transaction t WHERE t.account = :account AND t.date BETWEEN :startDate AND :endDate")
    Double sumAmountByAccountAndDateBetween(Account account, LocalDate startDate, LocalDate endDate);
} 