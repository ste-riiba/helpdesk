package com.project.helpdesk.controller;

import com.project.helpdesk.dto.request.CommentCreateRequest;
import com.project.helpdesk.dto.response.CommentResponse;
import com.project.helpdesk.service.CommentService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Positive;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1")
public class CommentController {
    private final CommentService commentService;


    public CommentController(CommentService commentService) {
        this.commentService = commentService;

    }
    
    @GetMapping("/tickets/{ticketId}/comments")
    public ResponseEntity<List<CommentResponse>> findAllCommentsByTicketId(@PathVariable @Positive Integer ticketId) {
        List<CommentResponse> response = commentService.findAllByTicketId(ticketId);

        return ResponseEntity.ok(response);
    }

    @PostMapping("/tickets/{ticketId}/comments")
    public ResponseEntity<CommentResponse> createComment(@PathVariable @Positive Integer ticketId,
                                                         @RequestBody @Valid CommentCreateRequest request) {
        CommentResponse response = commentService.create(ticketId, request);

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
}
