package com.project.helpdesk.dto.response;

import com.project.helpdesk.entity.ActivityLogType;

import java.time.LocalDateTime;

public record ActivityLogResponse(
        Integer id,
        ActivityLogType type,
        String title,
        String description,
        String entityType,
        Integer entityId,
        Integer authorId,
        String authorFullName,
        LocalDateTime createdAt
) {
}