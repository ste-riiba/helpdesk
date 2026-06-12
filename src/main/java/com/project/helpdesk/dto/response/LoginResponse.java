package com.project.helpdesk.dto.response;

import com.project.helpdesk.entity.UserRole;

public record LoginResponse(
        String token,
        String email,
        UserRole role
) {
}
