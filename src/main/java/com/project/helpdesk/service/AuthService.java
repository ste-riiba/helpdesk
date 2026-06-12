package com.project.helpdesk.service;

import com.project.helpdesk.dto.request.LoginRequest;
import com.project.helpdesk.dto.response.LoginResponse;
import com.project.helpdesk.entity.User;
import com.project.helpdesk.entity.UserStatus;
import com.project.helpdesk.repository.UserRepository;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder, JwtService jwtService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    public LoginResponse login(LoginRequest request) {
        String email = request.email().toLowerCase().trim();

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new BadCredentialsException("Invalid credentials"));

        if (user.getStatus() != UserStatus.ACTIVE) {
            throw new DisabledException("User is not active");
        }

        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new BadCredentialsException("Invalid credentials");
        }

        String token = jwtService.generateToken(user.getEmail(), user.getRole());

        return new LoginResponse(token, user.getEmail(), user.getRole());
    }
}
