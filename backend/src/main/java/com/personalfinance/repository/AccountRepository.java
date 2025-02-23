package com.personalfinance.repository;

import com.personalfinance.domain.account.Account;
import com.personalfinance.domain.user.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AccountRepository extends JpaRepository<Account, Long> {
    List<Account> findByUserAndActiveTrue(User user);
    Optional<Account> findByIdAndUserAndActiveTrue(Long id, User user);
    boolean existsByIdAndUser(Long id, User user);
    List<Account> findByUser(User user);
} 