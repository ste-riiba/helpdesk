# Helpdesk

Helpdesk e' un progetto Spring Boot nato per fare pratica con lo sviluppo di una piccola API REST.

L'idea e' simulare un sistema semplice di assistenza: gli utenti possono aprire ticket, gli agenti possono prenderli in carico e i commenti permettono di seguire la conversazione fino alla risoluzione.

Il progetto include una prima modellazione con utenti, ticket e commenti, usando DTO, service layer, repository JPA, validazione e una configurazione base di Spring Security.

## Tecnologie

- Java
- Spring Boot
- Spring Data JPA
- Spring Security
- Bean Validation
- MariaDB/MySQL
- Lombok

## Note

Per l'esecuzione locale serve un database MariaDB/MySQL chiamato `helpdesk_db`.

```sql
CREATE DATABASE helpdesk_db;
```

Gli utenti non si registrano autonomamente: vengono creati da un amministratore tramite `POST /api/v1/admin/users`.

Se in futuro serve riabilitare la registrazione pubblica, impostare `helpdesk.registration.enabled=true`.
