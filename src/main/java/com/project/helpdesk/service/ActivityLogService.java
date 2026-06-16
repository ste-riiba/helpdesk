package com.project.helpdesk.service;

import com.project.helpdesk.dto.response.ActivityLogResponse;
import com.project.helpdesk.entity.*;
import com.project.helpdesk.repository.ActivityLogRepository;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@Transactional
public class ActivityLogService {
    private final ActivityLogRepository activityLogRepository;

    public ActivityLogService(ActivityLogRepository activityLogRepository) {
        this.activityLogRepository = activityLogRepository;
    }

    public List<ActivityLogResponse> findRecentActivities() {
        return activityLogRepository.findTop10ByOrderByCreatedAtDesc()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public ActivityLog logUserCreated(User user, User author) {
        validateUser(user);
        validateUser(author);
        ActivityLog activityLog = logUserActivity(
                user,
                author,
                ActivityLogType.USER_CREATED,
                "User created",
                author.getEmail() + " created user " + user.getEmail()
        );

        return activityLogRepository.save(activityLog);
    }

    public ActivityLog logUserActivated(User user, User author) {
        validateUser(user);
        validateUser(author);
        ActivityLog activityLog = logUserActivity(
                user,
                author,
                ActivityLogType.USER_STATUS_CHANGED,
                "User activated",
                author.getEmail() + " activated user " + user.getEmail()
        );
        return activityLogRepository.save(activityLog);
    }

    public ActivityLog logUserDisabled(User user, User author) {
        validateUser(user);
        validateUser(author);
        ActivityLog activityLog = logUserActivity(
                user,
                author,
                ActivityLogType.USER_STATUS_CHANGED,
                "User disabled",
                author.getEmail() + " disabled user " + user.getEmail()
        );
        return activityLogRepository.save(activityLog);
    }

    public ActivityLog logTicketCreated(Ticket ticket, User author) {
        validateUser(author);
        validateTicket(ticket);
        ActivityLog activityLog = logTicketActivity(
                author,
                ticket,
                ActivityLogType.TICKET_CREATED,
                "Ticket created",
                author.getEmail() + " created ticket #" + ticket.getId() + ": " + ticket.getTitle()
        );

        return activityLogRepository.save(activityLog);
    }

    public ActivityLog logTicketAssigned(Ticket ticket, User author) {
        validateTicket(ticket);
        validateUser(author);

        ActivityLog activityLog = logTicketActivity(
                author,
                ticket,
                ActivityLogType.TICKET_ASSIGNED,
                "Ticket assigned",
                author.getEmail() + " started working on ticket #" + ticket.getId()
        );

        return activityLogRepository.save(activityLog);
    }

    public ActivityLog logTicketReleased(Ticket ticket, User author) {
        validateTicket(ticket);
        validateUser(author);

        ActivityLog activityLog = logTicketActivity(
                author,
                ticket,
                ActivityLogType.TICKET_RELEASED,
                "Ticket released",
                author.getEmail() + " released ticket #" + ticket.getId()
        );

        return activityLogRepository.save(activityLog);
    }

    public ActivityLog logTicketStatusChanged(Ticket ticket, User author, TicketStatus oldStatus, TicketStatus newStatus) {
        validateTicket(ticket);
        validateUser(author);

        ActivityLogType type = newStatus == TicketStatus.CLOSED
                ? ActivityLogType.TICKET_CLOSED
                : ActivityLogType.TICKET_STATUS_CHANGED;
        String title = getTicketStatusTitle(newStatus);

        return activityLogRepository.save(
                logTicketActivity(
                        author,
                        ticket,
                        type,
                        title,
                        author.getEmail() + " changed ticket #" + ticket.getId() + " from " + oldStatus + " to " + newStatus
                )
        );
    }

//    Helpers

    private void validateUser(User user) {
        if (user == null) {
            throw new IllegalArgumentException("User can't be null");
        }

        if (user.getId() == null) {
            throw new IllegalArgumentException("User must be saved before logging activity");
        }
    }

    private void validateTicket(Ticket ticket) {
        if (ticket == null) {
            throw new IllegalArgumentException("Ticket can't be null");
        }

        if (ticket.getId() == null) {
            throw new IllegalArgumentException("Ticket must be saved before logging activity");
        }
    }

    private ActivityLog logUserActivity(User user, User author, ActivityLogType type, String title, String description) {
        return ActivityLog.builder()
                .type(type)
                .title(title)
                .description(description)
                .entityType("USER")
                .entityId(user.getId())
                .author(author)
                .build();
    }

    private ActivityLog logTicketActivity(User author, Ticket ticket, ActivityLogType type, String title, String description) {
        return ActivityLog.builder()
                .type(type)
                .title(title)
                .description(description)
                .entityType("TICKET")
                .entityId(ticket.getId())
                .author(author)
                .build();
    }

    private String getTicketStatusTitle(TicketStatus status) {
        if (status == TicketStatus.CLOSED) {
            return "Ticket closed";
        }

        if (status == TicketStatus.RESOLVED) {
            return "Ticket resolved";
        }

        return "Ticket status changed";
    }

    private ActivityLogResponse toResponse(ActivityLog activityLog) {
        User author = activityLog.getAuthor();

        String authorFullName = author.getFirstName() + " " + author.getLastName();

        return new ActivityLogResponse(
                activityLog.getId(),
                activityLog.getType(),
                activityLog.getTitle(),
                activityLog.getDescription(),
                activityLog.getEntityType(),
                activityLog.getEntityId(),
                author.getId(),
                authorFullName,
                activityLog.getCreatedAt()
        );
    }

}
