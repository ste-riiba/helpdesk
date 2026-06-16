import {getToken, logout} from "./auth-utils.js";
import {showToast} from "./toast.js";

const allowedRoles = ["ADMIN", "AGENT", "CUSTOMER"];
const userRole = sessionStorage.getItem("userRole");

if (!sessionStorage.getItem("token") || !allowedRoles.includes(userRole)) {
    window.location.replace("/index.html");
}

const params = new URLSearchParams(window.location.search);
const ticketId = params.get("id");
const logoutBtn = document.querySelector(".logout-btn");
const usersNavLink = document.querySelector("#users-nav-link");
const assignTicketBtn = document.querySelector("#assign-ticket-btn");
const releaseTicketBtn = document.querySelector("#release-ticket-btn");
const updateStatusBtn = document.querySelector("#update-status-btn");
const statusSelect = document.querySelector("#ticket-status-select");
const commentForm = document.querySelector("#comment-form");
const createCommentBtn = document.querySelector("#create-comment-btn");
const commentList = document.querySelector("#comment-list");

if (userRole !== "ADMIN") {
    usersNavLink?.remove();
}

if (userRole === "CUSTOMER") {
    document.querySelector(".brand-link")?.setAttribute("href", "/index.html");
    document.querySelector(".top-nav")?.remove();
    document.querySelector(".ticket-detail-actions")?.remove();
}

logoutBtn?.addEventListener("click", (event) => {
    event.preventDefault();
    logout();
});

assignTicketBtn?.addEventListener("click", assignTicketToMe);
releaseTicketBtn?.addEventListener("click", releaseTicket);
updateStatusBtn?.addEventListener("click", updateTicketStatus);
commentForm?.addEventListener("submit", createComment);

if (!ticketId) {
    showToast("error", "Ticket non valido", "ID ticket mancante.");
} else {
    loadTicketDetail();
}

async function loadTicketDetail() {
    const token = getToken();

    if (!token) {
        return;
    }

    try {
        const headers = {
            "Authorization": `Bearer ${token}`
        };

        const ticketResponse = await fetch(getTicketDetailUrl(), {
            method: "GET",
            headers
        });

        if (!ticketResponse.ok) {
            throw new Error(await getErrorMessage(ticketResponse, "Errore nel caricare il ticket."));
        }

        const ticketData = await ticketResponse.json();
        const ticket = getTicketFromResponse(ticketData);

        if (!ticket) {
            throw new Error("Ticket non trovato tra le tue richieste.");
        }

        const commentsResponse = await fetch(`/api/v1/tickets/${ticketId}/comments`, {
            method: "GET",
            headers
        });

        const currentUserResponse = await fetch("/api/v1/users/me", {
            method: "GET",
            headers
        });

        if (!commentsResponse.ok) {
            throw new Error(await getErrorMessage(commentsResponse, "Errore nel caricare i commenti."));
        }

        if (!currentUserResponse.ok) {
            throw new Error(await getErrorMessage(currentUserResponse, "Errore nel caricare il profilo."));
        }

        const comments = await commentsResponse.json();
        const currentUser = await currentUserResponse.json();

        renderTicket(ticket, currentUser);
        renderComments(comments);
    } catch (error) {
        showToast("error", "Dati non caricati", error.message);
    }
}

async function assignTicketToMe() {
    const token = getToken();

    if (!token) {
        return;
    }

    assignTicketBtn.disabled = true;

    try {
        const response = await fetch(`/api/v1/agent/tickets/${ticketId}/assign-to-me`, {
            method: "PUT",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error(await getErrorMessage(response, "Non e possibile assegnare questo ticket."));
        }

        showToast("success", "Ticket assegnato", "Il ticket e stato assegnato correttamente.");
        await loadTicketDetail();
    } catch (error) {
        showToast("error", "Assegnazione non riuscita", error.message);
        await loadTicketDetail();
    }
}

async function releaseTicket() {
    const token = getToken();

    if (!token) {
        return;
    }

    releaseTicketBtn.disabled = true;

    try {
        const response = await fetch(`/api/v1/agent/tickets/${ticketId}/release`, {
            method: "PUT",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error(await getErrorMessage(response, "Non e possibile rilasciare questo ticket."));
        }

        showToast("success", "Ticket rilasciato", "Il ticket e tornato disponibile.");
        await loadTicketDetail();
    } catch (error) {
        showToast("error", "Rilascio non riuscito", error.message);
        await loadTicketDetail();
    }
}

async function updateTicketStatus() {
    const token = getToken();

    if (!token) {
        return;
    }

    updateStatusBtn.disabled = true;

    try {
        const response = await fetch(`/api/v1/agent/tickets/${ticketId}/change-status`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({
                status: statusSelect.value
            })
        });

        if (!response.ok) {
            throw new Error(await getErrorMessage(response, "Non e possibile aggiornare lo stato del ticket."));
        }

        showToast("success", "Stato aggiornato", "Lo stato del ticket e stato aggiornato.");
        await loadTicketDetail();
    } catch (error) {
        showToast("error", "Aggiornamento non riuscito", error.message);
    } finally {
        updateStatusBtn.disabled = false;
    }
}

async function createComment(event) {
    event.preventDefault();

    const token = getToken();

    if (!token) {
        return;
    }

    const formData = new FormData(commentForm);
    const content = String(formData.get("content") ?? "").trim();

    if (!content) {
        showToast("error", "Commento vuoto", "Scrivi un commento prima di inviarlo.");
        return;
    }

    createCommentBtn.disabled = true;

    try {
        const response = await fetch(`/api/v1/tickets/${ticketId}/comments`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({content})
        });

        if (!response.ok) {
            throw new Error(await getErrorMessage(response, "Non e possibile inviare il commento."));
        }

        commentForm.reset();
        showToast("success", "Commento inviato", "Il commento e stato aggiunto al ticket.");
        await loadTicketDetail();
    } catch (error) {
        showToast("error", "Commento non inviato", error.message);
    } finally {
        createCommentBtn.disabled = false;
    }
}

function renderTicket(ticket, currentUser) {
    document.querySelector("#ticket-detail-code").textContent = `Ticket #${ticket.id}`;
    document.querySelector("#ticket-detail-title").textContent = ticket.title ?? "Ticket senza titolo";
    document.querySelector("#ticket-detail-description").textContent = ticket.description ?? "Nessuna descrizione.";
    document.querySelector("#ticket-category").textContent = formatLabel(ticket.category ?? "-");
    document.querySelector("#ticket-author").textContent = ticket.authorFullName ?? "-";
    document.querySelector("#ticket-agent").textContent = ticket.agentFullName ?? "Non assegnato";
    document.querySelector("#ticket-created-at").textContent = formatDate(ticket.createdAt);

    if (statusSelect) {
        statusSelect.value = ticket.status ?? "OPEN";
    }

    if (updateStatusBtn) {
        updateStatusBtn.disabled = false;
    }

    const statusPill = document.querySelector("#ticket-status-pill");
    statusPill.className = `pill ${getStatusClass(ticket.status)}`;
    statusPill.textContent = formatLabel(ticket.status ?? "-");

    const priorityPill = document.querySelector("#ticket-priority-pill");
    priorityPill.className = `pill ${getPriorityClass(ticket.priority)}`;
    priorityPill.textContent = formatLabel(ticket.priority ?? "-");

    updateCommentFormState(ticket);

    if (currentUser.role !== "CUSTOMER") {
        const isClosed = ticket.status === "CLOSED" || ticket.status === "RESOLVED";
        const isAssigned = Boolean(ticket.agentId);
        const isAssignedToCurrentUser = ticket.agentId === currentUser.id;
        const isAdmin = currentUser.role === "ADMIN";

        assignTicketBtn.disabled = isAssigned || ticket.status !== "OPEN";
        releaseTicketBtn.disabled = !isAssigned || isClosed || (!isAdmin && !isAssignedToCurrentUser);
    }
}

function updateCommentFormState(ticket) {
    const isCommentLocked = ticket.status === "CLOSED" || ticket.status === "RESOLVED";
    const commentTextarea = commentForm?.querySelector("textarea");
    const helperText = commentForm?.querySelector(".form-footer p");

    if (!commentTextarea || !createCommentBtn || !helperText) {
        return;
    }

    commentTextarea.disabled = isCommentLocked;
    createCommentBtn.disabled = isCommentLocked;
    helperText.textContent = isCommentLocked
        ? "Il ticket e chiuso o risolto: non e possibile aggiungere commenti."
        : "Massimo 1000 caratteri.";
}

function getTicketDetailUrl() {
    if (userRole === "CUSTOMER") {
        return "/api/v1/tickets";
    }

    return `/api/v1/agent/tickets/${ticketId}`;
}

function getTicketFromResponse(ticketData) {
    if (!Array.isArray(ticketData)) {
        return ticketData;
    }

    return ticketData.find((ticket) => String(ticket.id) === String(ticketId));
}

function renderComments(comments) {
    if (!commentList) {
        return;
    }

    if (comments.length === 0) {
        commentList.innerHTML = `
            <li class="comment-empty">
                Nessun commento presente.
            </li>
        `;
        return;
    }

    commentList.innerHTML = comments.map((comment) => `
        <li class="comment-item">
            <div class="comment-header">
                <strong>${escapeHtml(comment.authorFullName ?? "Autore non disponibile")}</strong>
                <span>${escapeHtml(formatDate(comment.createdAt))}</span>
            </div>
            <p>${escapeHtml(comment.content ?? "")}</p>
        </li>
    `).join("");
}

function formatDate(value) {
    if (!value) {
        return "-";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "-";
    }

    return new Intl.DateTimeFormat("it-IT", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    }).format(date);
}

function formatLabel(value) {
    const labels = {
        OPEN: "aperto",
        IN_PROGRESS: "in lavorazione",
        WAITING_FOR_CUSTOMER: "in attesa cliente",
        RESOLVED: "risolto",
        CLOSED: "chiuso",
        LOW: "bassa",
        MEDIUM: "media",
        HIGH: "alta",
        URGENT: "urgente",
        HARDWARE: "hardware",
        SOFTWARE: "software",
        NETWORK: "network",
        ACCOUNT: "account",
        OTHER: "altro"
    };

    return labels[value] ?? String(value).replaceAll("_", " ").toLowerCase();
}

function getPriorityClass(priority) {
    const classes = {
        LOW: "pill-priority-low",
        MEDIUM: "pill-priority-medium",
        HIGH: "pill-priority-high",
        URGENT: "pill-priority-urgent"
    };

    return classes[priority] ?? "pill-priority-medium";
}

function getStatusClass(status) {
    const classes = {
        OPEN: "pill-status-open",
        IN_PROGRESS: "pill-status-in-progress",
        WAITING_FOR_CUSTOMER: "pill-status-pending",
        RESOLVED: "pill-status-resolved",
        CLOSED: "pill-status-closed"
    };

    return classes[status] ?? "pill-status";
}

async function getErrorMessage(response, fallbackMessage) {
    try {
        const error = await response.json();
        return error.message ?? fallbackMessage;
    } catch {
        return fallbackMessage;
    }
}

function escapeHtml(value) {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll("\"", "&quot;")
        .replaceAll("'", "&#039;");
}
