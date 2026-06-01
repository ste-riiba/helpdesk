package com.project.helpdesk.service;

import com.project.helpdesk.dto.request.CommentCreateRequest;
import com.project.helpdesk.dto.request.CommentUpdateRequest;
import com.project.helpdesk.dto.response.CommentResponse;
import com.project.helpdesk.entity.Comment;
import com.project.helpdesk.entity.Ticket;
import com.project.helpdesk.entity.User;
import com.project.helpdesk.entity.UserRole;
import com.project.helpdesk.exception.ForbiddenActionException;
import com.project.helpdesk.repository.CommentRepository;
import com.project.helpdesk.repository.TicketRepository;
import com.project.helpdesk.repository.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@Transactional
public class CommentService {
    private final CommentRepository commentRepository;
    private final TicketRepository ticketRepository;
    private final CurrentUserService currentUserService;
    private final UserRepository userRepository;

    public CommentService(CommentRepository commentRepository, TicketRepository ticketRepository, CurrentUserService currentUserService, UserRepository userRepository) {
        this.commentRepository = commentRepository;
        this.ticketRepository = ticketRepository;
        this.currentUserService = currentUserService;
        this.userRepository = userRepository;
    }

    public List<CommentResponse> findAll() {
        return commentRepository.findAll()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public CommentResponse findById(Integer id) {
        validateId(id);

        Comment existing = commentRepository.findById(id).orElseThrow(() -> new EntityNotFoundException("Comment not found with ID: " + id));

        return toResponse(existing);
    }

    public CommentResponse create(CommentCreateRequest request) {
        if (request == null) {
            throw new IllegalArgumentException("CommentCreateRequest can't be null");
        }

        Comment comment = commentRepository.save(toEntity(request));

        return toResponse(comment);
    }

    public CommentResponse update(CommentUpdateRequest request, Integer id) {
        validateId(id);

        if (request == null) {
            throw new IllegalArgumentException("CommentUpdateRequest can't be null");
        }

        User user = currentUserService.getCurrentUser();


        Comment existing = commentRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Comment not found with ID: " + id));

        if (!user.getId().equals(existing.getAuthor().getId())) {
            throw new ForbiddenActionException("You don't have permission to complete this action");
        }

        if (request.content() != null) {
            existing.setContent(request.content());
        }

        Comment updated = commentRepository.save(existing);

        return toResponse(updated);
    }

    public List<CommentResponse> findAllByTicketId(Integer id) {
        validateId(id);

        ticketRepository.findById(id).orElseThrow(() -> new EntityNotFoundException("TicketService not found with ID: " + id));

        List<Comment> comments = commentRepository.findAllByTicket_Id(id);

        return comments.stream().map(this::toResponse).toList();
    }

    public List<CommentResponse> findAllByUserId(Integer id) {
        validateId(id);

        userRepository.findById(id).orElseThrow(() -> new EntityNotFoundException("User not found with ID: " + id));

        List<Comment> comments = commentRepository.findAllByAuthor_Id(id);

        return comments.stream().map(this::toResponse).toList();
    }

    public void delete(Integer id) {
        validateId(id);

        User user = currentUserService.getCurrentUser();

        Comment existing = commentRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Comment not found with ID: " + id));

        if (!user.getId().equals(existing.getAuthor().getId()) && user.getRole() != UserRole.ADMIN) {
            throw new ForbiddenActionException("You don't have permission to complete this action");
        }

        commentRepository.delete(existing);
    }

    //    Helpers
    private Comment toEntity(CommentCreateRequest request) {
        Ticket ticket = ticketRepository.findById(request.ticketId())
                .orElseThrow(() -> new EntityNotFoundException("Ticket not found with ID: " + request.ticketId()));

        User author = currentUserService.getCurrentUser();
        return Comment.builder().content(request.content()).ticket(ticket).author(author).build();
    }

    private CommentResponse toResponse(Comment comment) {
        String authorFullName = comment.getAuthor()
                .getFirstName()
                .concat(" ")
                .concat(comment.getAuthor().getLastName());

        return new CommentResponse(comment.getId(),
                comment.getContent(),
                comment.getTicket().getId(),
                authorFullName,
                comment.getCreatedAt());
    }

    private void validateId(Integer id) {
        if (id == null) {
            throw new IllegalArgumentException("ID can't be null");
        }
    }
}
