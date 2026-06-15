import {getToken, logout} from "./auth-utils.js";
import {showToast} from "./toast.js";

const allowedRoles = ["ADMIN", "AGENT"];
const userRole = sessionStorage.getItem("userRole");

if (!sessionStorage.getItem("token") || !allowedRoles.includes(userRole)) {
    window.location.replace("/index.html");
}

const params = new URLSearchParams(window.location.search);
const ticketId = params.get("id");
const logoutBtn = document.querySelector(".logout-btn");
const assignTicketBtn = document.querySelector("#assign-ticket-btn");
const updateStatusBtn = document.querySelector("#update-status-btn");
const statusSelect = document.querySelector("#ticket-status-select");
const commentForm = document.querySelector("#comment-form");
const createCommentBtn = document.querySelector("#create-comment-btn");
const commentList = document.querySelector("#comment-list");

logoutBtn?.addEventListener("click", (event) => {
    event.preventDefault();
    logout();
});

assignTicketBtn?.addEventListener("click", assignTicketToMe);
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

        const ticketResponse = await fetch(`/api/v1/agent/tickets/${ticketId}`, {
            method: "GET",
            headers
        });

        const commentsResponse = await fetch(`/api/v1/tickets/${ticketId}/comments`, {
            method: "GET",
            headers
        });

        if (!ticketResponse.ok) {
            throw new Error(await getErrorMessage(ticketResponse, "Errore nel caricare il ticket."));
        }

        if (!commentsResponse.ok) {
            throw new Error(await getErrorMessage(commentsResponse, "Errore nel caricare i commenti."));
        }

        const ticket = await ticketResponse.json();
        const comments = await commentsResponse.json();

        renderTicket(ticket);
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

function renderTicket(ticket) {
    document.querySelector("#ticket-detail-code").textContent = `Ticket #${ticket.id}`;
    document.querySelector("#ticket-detail-title").textContent = ticket.title ?? "Ticket senza titolo";
    document.querySelector("#ticket-detail-description").textContent = ticket.description ?? "Nessuna descrizione.";
    document.querySelector("#ticket-category").textContent = formatLabel(ticket.category ?? "-");
    document.querySelector("#ticket-author").textContent = ticket.authorFullName ?? "-";
    document.querySelector("#ticket-agent").textContent = ticket.agentFullName ?? "Non assegnato";
    document.querySelector("#ticket-created-at").textContent = formatDate(ticket.createdAt);

    statusSelect.value = ticket.status ?? "OPEN";
    updateStatusBtn.disabled = false;

    const statusPill = document.querySelector("#ticket-status-pill");
    statusPill.className = `pill ${getStatusClass(ticket.status)}`;
    statusPill.textContent = formatLabel(ticket.status ?? "-");

    const priorityPill = document.querySelector("#ticket-priority-pill");
    priorityPill.className = `pill ${getPriorityClass(ticket.priority)}`;
    priorityPill.textContent = formatLabel(ticket.priority ?? "-");

    assignTicketBtn.disabled = Boolean(ticket.agentId) || ticket.status !== "OPEN";
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
