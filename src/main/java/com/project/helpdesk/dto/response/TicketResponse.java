package com.project.helpdesk.dto.response;

import com.project.helpdesk.entity.TicketCategory;
import com.project.helpdesk.entity.TicketPriority;
import com.project.helpdesk.entity.TicketStatus;

import java.time.LocalDateTime;

public record TicketResponse(
        Integer id,
        String title,
        String description,
        TicketStatus status,
        TicketPriority priority,
        LocalDateTime createdAt,
        LocalDateTime updatedAt,
        LocalDateTime closedAt,
        TicketCategory category,
        Integer authorId,
        String authorFullName,
        Integer agentId,
        String agentFullName
) {
}
