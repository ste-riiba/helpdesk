package com.project.helpdesk.controller;

import com.project.helpdesk.dto.request.LoginRequest;
import com.project.helpdesk.dto.request.UserCreateRequest;
import com.project.helpdesk.dto.response.LoginResponse;
import com.project.helpdesk.dto.response.UserResponse;
import com.project.helpdesk.exception.ForbiddenActionException;
import com.project.helpdesk.service.AuthService;
import com.project.helpdesk.service.UserService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Validated
@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    private final AuthService authService;
    private final UserService userService;
    private final boolean registrationEnabled;

    public AuthController(
            AuthService authService,
            UserService userService,
            @Value("${helpdesk.registration.enabled:false}") boolean registrationEnabled
    ) {
        this.authService = authService;
        this.userService = userService;
        this.registrationEnabled = registrationEnabled;
    }

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@RequestBody @Valid LoginRequest request) {
        LoginResponse response = authService.login(request);

        return ResponseEntity.ok(response);
    }

    @PostMapping("/register")
    public ResponseEntity<UserResponse> register(@RequestBody @Valid UserCreateRequest request) {
        if (!registrationEnabled) {
            throw new ForbiddenActionException("Registration is disabled");
        }

        UserResponse response = userService.create(request);

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
}
