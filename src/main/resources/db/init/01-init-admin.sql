-- Init script for PostgreSQL - runs automatically on first container startup
-- Creates default admin user if not exists

INSERT INTO users (first_name, last_name, email, password_hash, role, status, created_at)
VALUES ('Admin', 'User', 'admin@helpdesk.com', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVEFDi', 'ADMIN', 'ACTIVE', NOW())
ON CONFLICT (email) DO NOTHING;