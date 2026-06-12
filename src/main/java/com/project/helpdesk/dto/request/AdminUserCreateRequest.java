package com.project.helpdesk.dto.request;

import com.project.helpdesk.entity.UserRole;
import com.project.helpdesk.entity.UserStatus;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record AdminUserCreateRequest(
        @NotBlank
        @Size(max = 100)
        String firstName,

        @NotBlank
        @Size(max = 100)
        String lastName,

        @NotBlank
        @Email
        String email,

        UserRole role,

        UserStatus status,

        @NotBlank
        @Size(min = 8, max = 30)
        String password,

        @NotBlank
        @Size(min = 8, max = 30)
        String confirmPassword
) {
}
