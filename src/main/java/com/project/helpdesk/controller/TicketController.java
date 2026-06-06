package com.project.helpdesk.controller;

import com.project.helpdesk.dto.request.TicketCreateRequest;
import com.project.helpdesk.dto.response.TicketResponse;
import com.project.helpdesk.service.TicketService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Validated
@RestController
@RequestMapping("/api/v1")
public class TicketController {
    private final TicketService ticketService;

    public TicketController(TicketService ticketService) {
        this.ticketService = ticketService;
    }

    @PostMapping("/tickets")
    public ResponseEntity<TicketResponse> openNewTicket(@RequestBody @Valid TicketCreateRequest request) {
        TicketResponse response = ticketService.create(request);

        return ResponseEntity.ok(response);
    }
}
