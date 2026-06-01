package com.project.helpdesk.service;

import com.project.helpdesk.entity.User;
import com.project.helpdesk.repository.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.security.authentication.AuthenticationCredentialsNotFoundException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

@Service
public class CurrentUserService {
    private final UserRepository userRepository;

    public CurrentUserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null || !authentication.isAuthenticated()) {
            throw new AuthenticationCredentialsNotFoundException("No authenticated user found");
        }

        return userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new EntityNotFoundException("Current user not found"));
    }
}
