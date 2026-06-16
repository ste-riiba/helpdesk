import {getRole, getToken, logout} from "./auth-utils.js";
import {showToast} from "./toast.js";

const logoutBtn = document.querySelector(".logout-btn");
const ticketForm = document.querySelector(".ticket-form");
const ticketListEl = document.querySelector(".ticket-list");
const summaryEl = document.querySelector(".summary-card");
const submitTicketBtn = document.querySelector("#submit-ticket-btn");
const ticketStatusFilter = document.querySelector("#ticket-status-filter");

let myTickets = [];

ticketStatusFilter?.addEventListener("input", renderTickets);

function renderTickets() {
    const tickets = getVisibleTickets();

    if (myTickets.length === 0) {
        ticketListEl.innerHTML = `
            <article class="ticket-empty">
                <strong>Nessun ticket trovato.</strong>
                <span>Quando apri una richiesta, comparirà qui.</span>
            </article>
        `;
        updateTicketSummary(0);
        return;
    }

    if (tickets.length === 0) {
        ticketListEl.innerHTML = `
            <article class="ticket-empty">
                <strong>Nessun ticket con questo stato.</strong>
                <span>Cambia filtro per vedere altre richieste.</span>
            </article>
        `;
        updateTicketSummary(0);
        return;
    }

    updateTicketSummary(tickets.length);

    ticketListEl.innerHTML = tickets.map((ticket) => `
        <article class="ticket-item clickable-ticket" data-ticket-id="${escapeHtml(ticket.id ?? "")}">
            <div class="ticket-item-header">
                <div>
                    <h3>${escapeHtml(ticket.title ?? "Ticket senza titolo")}</h3>
                    <p>${escapeHtml(ticket.description ?? "Nessuna descrizione.")}</p>
                </div>
                <span class="pill ${getStatusClass(ticket.status)}">${escapeHtml(formatLabel(ticket.status ?? "-"))}</span>
            </div>
            <div class="ticket-meta">
                <span class="pill ${getPriorityClass(ticket.priority)}">${escapeHtml(formatLabel(ticket.priority ?? "-"))}</span>
                <span class="pill">${escapeHtml(formatLabel(ticket.category ?? "-"))}</span>
            </div>
        </article>
    `).join("");

    ticketListEl.querySelectorAll("[data-ticket-id]").forEach((ticketItem) => {
        ticketItem.addEventListener("click", () => {
            window.location.href = `/pages/ticket-detail.html?id=${ticketItem.dataset.ticketId}`;
        });
    });
}

function getVisibleTickets() {
    const selectedStatus = ticketStatusFilter?.value ?? "";

    return [...myTickets]
        .filter((ticket) => !selectedStatus || ticket.status === selectedStatus)
        .sort((a, b) => getTime(b.createdAt) - getTime(a.createdAt));
}

function updateTicketSummary(ticketCount) {
    summaryEl.innerHTML = `
        <span class="summary-value">${ticketCount}</span>
        <span>Richieste visualizzate</span>
    `;
}

async function getMyTickets() {
    const token = getToken();

    if (!token) {
        window.location.replace("/pages/login.html");
        return;
    }

    try {
        const response = await fetch("/api/v1/tickets", {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error("Non sono riuscito a recuperare le tue richieste.");
        }

        myTickets = await response.json();
        renderTickets();
    } catch (error) {
        showToast("error", "Ticket non caricati", error.message);
    }
}

async function createTicket(event) {
    event.preventDefault();

    const token = getToken();
    const role = getRole();

    if (!token) {
        return;
    }

    if (!role) {
        return;
    }

    const formData = new FormData(ticketForm);
    const ticket = {
        title: formData.get("title"),
        category: formData.get("category"),
        priority: formData.get("priority"),
        description: formData.get("description")
    };

    submitTicketBtn.disabled = true;

    try {
        if (role !== "CUSTOMER") {
            throw new Error("Solo i clienti possono aprire un ticket");
        }

        const response = await fetch("/api/v1/tickets", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify(ticket)
        });

        if (!response.ok) {
            throw new Error("Controlla i dati inseriti e riprova.");
        }

        ticketForm.reset();
        await getMyTickets();
        showToast("success", "Ticket creato", "Ticket aperto correttamente.");
    } catch (error) {
        showToast("error", "Ticket non creato", error.message);
    } finally {
        submitTicketBtn.disabled = false;
    }
}

function redirect() {
    const token = getToken();
    const role = getRole();

    if (!token || !role) {
        return true;
    }

    if (role === "ADMIN") {
        window.location.replace("/pages/admin-dashboard.html");
        return true;
    }

    if (role === "AGENT") {
        window.location.replace("/pages/tickets.html");
        return true;
    }

    return false;
}

ticketForm?.addEventListener("submit", createTicket);

logoutBtn?.addEventListener("click", (event) => {
    event.preventDefault();
    logout();
});

if (!redirect()) {
    getMyTickets();
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

function getTime(value) {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return 0;
    }

    return date.getTime();
}

function escapeHtml(value) {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll("\"", "&quot;")
        .replaceAll("'", "&#039;");
}
