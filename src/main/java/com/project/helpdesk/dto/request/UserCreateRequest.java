package com.project.helpdesk.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UserCreateRequest(
        @NotBlank
        @Size(max = 100)
        String firstName,

        @NotBlank
        @Size(max = 100)
        String lastName,

        @NotBlank
        @Email
        String email,

        @NotBlank
        @Size(max = 30)
        String password,

        @NotBlank
        @Size(max = 30)
        String confirmPassword
) {
}
