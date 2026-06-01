package com.project.helpdesk.exception;

public class DuplicatedResourceException extends RuntimeException {
    public DuplicatedResourceException(String message) {
        super(message);
    }
}
