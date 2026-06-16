import {getToken, logout} from "./auth-utils.js";
import {showToast} from "./toast.js";

const logoutBtn = document.querySelector(".logout-btn");
const usersNavLink = document.querySelector("#users-nav-link");
const ticketsTableBody = document.querySelector("#tickets-table-body");
const ticketsCount = document.querySelector("#tickets-count");
const searchInput = document.querySelector("#ticket-search");
const statusFilter = document.querySelector("#status-filter");
const priorityFilter = document.querySelector("#priority-filter");
const assignmentFilter = document.querySelector("#assignment-filter");

let tickets = [];

const userRole = sessionStorage.getItem("userRole");

if (!sessionStorage.getItem("token") || !["ADMIN", "AGENT"].includes(userRole)) {
    window.location.replace("/index.html");
}

if (userRole !== "ADMIN") {
    usersNavLink?.remove();
}

logoutBtn?.addEventListener("click", (event) => {
    event.preventDefault();
    logout();
});

[searchInput, statusFilter, priorityFilter, assignmentFilter].forEach((field) => {
    field?.addEventListener("input", renderTickets);
});

async function loadTickets() {
    const token = getToken();

    if (!token) {
        return;
    }

    try {
        const response = await fetch("/api/v1/agent/tickets", {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error("Errore nel caricare i ticket.");
        }

        tickets = await response.json();
        renderTickets();
    } catch (error) {
        showToast("error", "Ticket non caricati", error.message);
        ticketsTableBody.innerHTML = `<tr><td colspan="6">Impossibile caricare i ticket.</td></tr>`;
    }
}

function renderTickets() {
    const filteredTickets = getFilteredTickets();

    ticketsCount.textContent = filteredTickets.length;

    if (filteredTickets.length === 0) {
        ticketsTableBody.innerHTML = `<tr><td colspan="6">Nessun ticket trovato.</td></tr>`;
        return;
    }

    ticketsTableBody.innerHTML = filteredTickets.map((ticket) => {
        const ticketId = ticket.id ?? ticket.ticketId ?? "";
        const title = ticket.title ?? ticket.subject ?? "Ticket senza titolo";
        const requester = getRequesterName(ticket);
        const category = ticket.category ?? "-";
        const priority = ticket.priority ?? "-";
        const status = ticket.status ?? "-";
        const assignee = getAssigneeName(ticket);
        const createdAt = formatDate(ticket.createdAt);

        return `
            <tr class="clickable-row" data-ticket-id="${escapeHtml(ticketId)}">
                <td>
                    <strong>#${escapeHtml(ticketId)} ${escapeHtml(title)}</strong>
                    <span>${escapeHtml(requester)}</span>
                </td>
                <td>${escapeHtml(category)}</td>
                <td><span class="pill ${getPriorityClass(priority)}">${escapeHtml(formatLabel(priority))}</span></td>
                <td><span class="pill ${getStatusClass(status)}">${escapeHtml(formatLabel(status))}</span></td>
                <td>${escapeHtml(assignee)}</td>
                <td>${escapeHtml(createdAt)}</td>
            </tr>
        `;
    }).join("");

    ticketsTableBody.querySelectorAll("[data-ticket-id]").forEach((row) => {
        row.addEventListener("click", () => {
            window.location.href = `/pages/ticket-detail.html?id=${row.dataset.ticketId}`;
        });
    });
}

function getFilteredTickets() {
    const query = searchInput?.value.trim().toLowerCase() ?? "";
    const selectedStatus = statusFilter?.value ?? "";
    const selectedPriority = priorityFilter?.value ?? "";
    const selectedAssignment = assignmentFilter?.value ?? "";

    return tickets.filter((ticket) => {
        const searchableText = [
            ticket.id,
            ticket.title,
            ticket.subject,
            ticket.description,
            ticket.category,
            getRequesterName(ticket),
            getAssigneeName(ticket)
        ].join(" ").toLowerCase();

        const matchesSearch = !query || searchableText.includes(query);
        const matchesStatus = !selectedStatus || ticket.status === selectedStatus;
        const matchesPriority = !selectedPriority || ticket.priority === selectedPriority;
        const assigned = isTicketAssigned(ticket);
        const matchesAssignment = !selectedAssignment
            || (selectedAssignment === "assigned" && assigned)
            || (selectedAssignment === "unassigned" && !assigned);

        return matchesSearch && matchesStatus && matchesPriority && matchesAssignment;
    });
}

function getRequesterName(ticket) {
    return ticket.authorFullName
        ?? ticket.requesterFullName
        ?? ticket.customerFullName
        ?? ticket.userFullName
        ?? ticket.createdByFullName
        ?? "Richiedente non disponibile";
}

function getAssigneeName(ticket) {
    if (ticket.agentFullName) {
        return ticket.agentFullName;
    }

    if (ticket.assigneeFullName) {
        return ticket.assigneeFullName;
    }

    if (ticket.agentId || ticket.assigneeId) {
        return `ID ${ticket.agentId ?? ticket.assigneeId}`;
    }

    return "Non assegnato";
}

function isTicketAssigned(ticket) {
    return ticket.agentId != null
        || ticket.assigneeId != null
        || Boolean(ticket.agentFullName)
        || Boolean(ticket.assigneeFullName);
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
        URGENT: "urgente"
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

function escapeHtml(value) {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll("\"", "&quot;")
        .replaceAll("'", "&#039;");
}

loadTickets();
