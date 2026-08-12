# Helpdesk

Applicazione Spring Boot per la gestione di ticket di supporto con API REST e interfaccia web.

## Funzionalità principali
- **Autenticazione JWT** con 3 ruoli: `CUSTOMER`, `AGENT`, `ADMIN`
- **Ticket**: creazione, assegnazione agenti, cambio stato (OPEN → IN_PROGRESS → WAITING_FOR_CUSTOMER → RESOLVED → CLOSED), commenti
- **Utenti** (solo admin): CRUD, disabilitazione/riattivazione, profilo
- **Activity log** per audit (solo admin)
- **Frontend** integrato: dashboard, login, gestione ticket/utenti

## Stack
Java 25, Spring Boot 4.0.6, Spring Data JPA, Spring Security, PostgreSQL 17, Lombok

## Avvio con Docker

Dopo aver clonato il repository, creare il JAR dell'applicazione:

```bash
.\mvnw.cmd clean package -DskipTests
```
Poi costruire l'immagine e avviare i container:

```bash
docker compose up --build
```
L'applicazione sarà disponibile su:

```bash
http://localhost:8080
```

- App: http://localhost:8080
- PostgreSQL: localhost:5432 (db: `helpdesk_db`, user: `stefano`, pass: `1234`)

## Credenziali Admin (create automaticamente al primo avvio)

- **Email**: admin@helpdesk.com
- **Password**: admin123

Lo script `src/main/resources/db/init/01-init-admin.sql` viene eseguito automaticamente da PostgreSQL alla prima inizializzazione del database (volume vuoto).
