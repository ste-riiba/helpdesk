package com.project.helpdesk.exception;

import com.project.helpdesk.dto.ApiErrorDto;
import jakarta.persistence.EntityNotFoundException;
import jakarta.validation.ConstraintViolationException;
import lombok.extern.slf4j.Slf4j;
import org.apache.coyote.BadRequestException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;


@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {
    @ExceptionHandler(ForbiddenActionException.class)
    public ResponseEntity<ApiErrorDto> handleForbiddenAction(ForbiddenActionException ex) {
        return buildError(ex.getMessage(), HttpStatus.FORBIDDEN);
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ApiErrorDto> handleAccessDenied(AccessDeniedException ex) {
        return buildError(ex.getMessage(), HttpStatus.FORBIDDEN);
    }

    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<ApiErrorDto> handleBadCredentials(BadCredentialsException ex) {
        return buildError("Invalid credentials", HttpStatus.UNAUTHORIZED);
    }

    @ExceptionHandler(DisabledException.class)
    public ResponseEntity<ApiErrorDto> handleDisabledUser(DisabledException ex) {
        return buildError(ex.getMessage(), HttpStatus.FORBIDDEN);
    }

    @ExceptionHandler(EntityNotFoundException.class)
    public ResponseEntity<ApiErrorDto> handleEntityNotFound(EntityNotFoundException ex) {
        return buildError(ex.getMessage(), HttpStatus.NOT_FOUND);
    }

    @ExceptionHandler(BadRequestException.class)
    public ResponseEntity<ApiErrorDto> handleBadRequest(BadRequestException ex) {
        return buildError(ex.getMessage(), HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(DuplicatedResourceException.class)
    public ResponseEntity<ApiErrorDto> handleDuplicate(DuplicatedResourceException ex) {
        return buildError(ex.getMessage(), HttpStatus.CONFLICT);
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ApiErrorDto> handleIllegalArgument(IllegalArgumentException ex) {
        return buildError(ex.getMessage(), HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiErrorDto> handleValidationErrors(MethodArgumentNotValidException ex) {

        Map<String, String> errors = new HashMap<>();

        ex.getBindingResult().getFieldErrors()
                .forEach(error -> errors.put(error.getField(), error.getDefaultMessage()));

        ApiErrorDto apiError = new ApiErrorDto();
        apiError.setTimestamp(LocalDateTime.now());
        apiError.setStatus(HttpStatus.BAD_REQUEST.value());
        apiError.setError(HttpStatus.BAD_REQUEST.getReasonPhrase());
        apiError.setMessage("Validation error");
        apiError.setErrors(errors);

        return new ResponseEntity<>(apiError, HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<ApiErrorDto> handleConstraintViolation(ConstraintViolationException ex) {
        Map<String, String> errors = new HashMap<>();

        ex.getConstraintViolations()
                .forEach(error -> errors.put(error.getPropertyPath().toString(), error.getMessage()));

        ApiErrorDto apiError = new ApiErrorDto();
        apiError.setTimestamp(LocalDateTime.now());
        apiError.setStatus(HttpStatus.BAD_REQUEST.value());
        apiError.setError(HttpStatus.BAD_REQUEST.getReasonPhrase());
        apiError.setMessage("Validation error");
        apiError.setErrors(errors);

        return new ResponseEntity<>(apiError, HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<ApiErrorDto> handleTypeMismatch(MethodArgumentTypeMismatchException ex) {
        return buildError("Parameter not valid: " + ex.getName(), HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiErrorDto> handleGeneric(Exception ex) {
        log.error("Internal server error: ", ex);
        return buildError("Internal server error: ", HttpStatus.INTERNAL_SERVER_ERROR);
    }

    private ResponseEntity<ApiErrorDto> buildError(String message, HttpStatus status) {
        ApiErrorDto error = new ApiErrorDto();
        error.setTimestamp(LocalDateTime.now());
        error.setStatus(status.value());
        error.setError(status.getReasonPhrase());
        error.setMessage(message);
        return new ResponseEntity<>(error, status);
    }
}
