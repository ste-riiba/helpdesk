package com.project.helpdesk.dto.response;

import com.project.helpdesk.entity.UserRole;
import com.project.helpdesk.entity.UserStatus;

public record UserResponse(
        Integer id,
        String fullName,
        String email,
        UserRole role,
        UserStatus status
) {
}
