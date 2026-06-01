package com.project.helpdesk.dto.response;

import java.time.LocalDateTime;

public record CommentResponse(
        Integer id,
        String content,
        Integer ticketId,
        String authorFullName,
        LocalDateTime createdAt
) {
}
