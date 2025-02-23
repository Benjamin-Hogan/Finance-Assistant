package com.personalfinance.controller;

import com.personalfinance.domain.user.User;
import com.personalfinance.domain.user.UserRole;
import com.personalfinance.dto.AuthRequest;
import com.personalfinance.dto.RegisterRequest;
import com.personalfinance.repository.UserRepository;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
@Slf4j
public class AuthController {

    private final UserRepository userRepository;
    private final AuthenticationManager authenticationManager;

    @GetMapping("/test")
    public ResponseEntity<String> testEndpoint() {
        log.info("Test endpoint accessed successfully");
        return ResponseEntity.ok("Auth controller is accessible");
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest request) {
        log.info("Received registration request for email: {}", request.getEmail());
        
        try {
            if (userRepository.existsByEmail(request.getEmail())) {
                log.warn("Email already taken: {}", request.getEmail());
                return ResponseEntity.badRequest().body("Email is already taken");
            }

            User user = new User();
            user.setEmail(request.getEmail());
            user.setPassword(request.getPassword());
            user.setFirstName(request.getFirstName());
            user.setLastName(request.getLastName());
            user.setRole(UserRole.USER);
            user.setEnabled(true);

            userRepository.save(user);
            log.info("Successfully registered user with email: {}", request.getEmail());
            
            return ResponseEntity.ok("User registered successfully");
            
        } catch (Exception e) {
            log.error("Error registering user: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().body("Error registering user: " + e.getMessage());
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody AuthRequest request, HttpSession session) {
        log.info("Login attempt for email: {}", request.getEmail());
        
        try {
            Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
            );
            
            SecurityContext securityContext = SecurityContextHolder.getContext();
            securityContext.setAuthentication(authentication);
            session.setAttribute(HttpSessionSecurityContextRepository.SPRING_SECURITY_CONTEXT_KEY, securityContext);
            
            log.info("Login successful for user: {}", request.getEmail());
            return ResponseEntity.ok(authentication.getName());
            
        } catch (Exception e) {
            log.error("Login failed for user {}: {}", request.getEmail(), e.getMessage());
            return ResponseEntity.badRequest().body("Invalid email or password");
        }
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(HttpSession session) {
        SecurityContextHolder.clearContext();
        session.invalidate();
        return ResponseEntity.ok().build();
    }

    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.ok(false);
        }
        return ResponseEntity.ok(authentication.getName());
    }

    @DeleteMapping("/users")
    public ResponseEntity<String> deleteAllUsers() {
        log.info("Deleting all users");
        userRepository.deleteAll();
        return ResponseEntity.ok("All users deleted");
    }
} 