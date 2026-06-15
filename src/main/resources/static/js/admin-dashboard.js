import {getToken, logout} from "./auth-utils.js";
import {showToast} from "./toast.js";

const logoutBtn = document.querySelector(".logout-btn");
const createUserBtn = document.querySelector("#open-create-user-modal");
const createUserModal = document.querySelector("#create-user-modal");
const createUserForm = document.querySelector("#create-user-form");
const closeModalBtns = document.querySelectorAll("[data-modal-close]");
const createUserModalBtn = document.querySelector("#create-user");
const ticketTableBody = document.querySelector("#admin-ticket-table-body");
const userTableBody = document.querySelector("#admin-user-table-body");
const ticketTableCount = document.querySelector("#ticket-table-count");
const userTableCount = document.querySelector("#user-table-count");
const activityList = document.querySelector("#activity-list");

if (!sessionStorage.getItem("token") || sessionStorage.getItem("userRole") !== "ADMIN") {
    window.location.replace("/index.html");
}

createUserBtn?.addEventListener("click", openModal);

closeModalBtns.forEach((button) => {
    button.addEventListener("click", closeModal);
});

createUserModal?.addEventListener("click", (event) => {
    if (event.target === createUserModal) {
        closeModal();
    }
});

createUserForm?.addEventListener("submit", createNewUser);

logoutBtn?.addEventListener("click", (event) => {
    event.preventDefault();
    logout();
});

document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && createUserModal?.classList.contains("is-open")) {
        closeModal();
    }
});

function openModal() {
    createUserModal?.classList.add("is-open");
    createUserModal?.setAttribute("aria-hidden", "false");
    document.querySelector("#first-name")?.focus();
}

function closeModal() {
    createUserModal?.classList.remove("is-open");
    createUserModal?.setAttribute("aria-hidden", "true");
    createUserForm?.reset();
}

async function createNewUser(e) {
    e.preventDefault();

    const formData = new FormData(createUserForm);
    const token = getToken();

    if (!token) {
        return;
    }

    createUserModalBtn.disabled = true;

    const newUser = {
        firstName: formData.get("firstName"),
        lastName: formData.get("lastName"),
        email: formData.get("email"),
        role: formData.get("role"),
        status: formData.get("status"),
        password: formData.get("password"),
        confirmPassword: formData.get("confirmPassword")
    };

    try {
        const response = await fetch("/api/v1/admin/users", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify(newUser)
        });

        if (!response.ok) {
            throw new Error("Controlla i dati inseriti e riprova.");
        }

        createUserForm.reset();
        closeModal();
        showToast("success", "Utente creato", "Il nuovo account e stato aggiunto correttamente.");
        await loadDashboardData();
    } catch (error) {
        showToast("error", "Utente non creato", error.message);
    } finally {
        createUserModalBtn.disabled = false;
    }
}

async function loadDashboardData() {
    const openedTicketEl = document.querySelector("#num-opened-tickets");
    const openedTicketFromYDEl = document.querySelector("#num-ticket-from-yd");
    const ticketInProgressEl = document.querySelector("#num-ticket-in-progress");
    const assignedTicketPercentageEl = document.querySelector("#assigned-ticket-percentage");
    const activeUsersEl = document.querySelector("#num-active-users");
    const totalUsersEl = document.querySelector("#num-total-users");
    const unassignedTicketsEl = document.querySelector("#num-unassigned-tickets");

    const token = getToken();

    if (!token) {
        return;
    }

    try {
        const headers = {
            "Authorization": `Bearer ${token}`
        };

        const ticketResponse = await fetch("/api/v1/admin/tickets", {
            method: "GET",
            headers
        });

        const userResponse = await fetch("/api/v1/admin/users", {
            method: "GET",
            headers
        });

        const activityResponse = await fetch("/api/v1/admin/activity", {
            method: "GET",
            headers
        });

        if (!ticketResponse.ok) {
            throw new Error("Errore nel caricare i ticket.");
        }

        if (!userResponse.ok) {
            throw new Error("Errore nel caricare gli utenti.");
        }

        if (!activityResponse.ok) {
            throw new Error("Errore nel caricare gli aggiornamenti.");
        }

        const tickets = await ticketResponse.json();
        const users = await userResponse.json();
        const activities = await activityResponse.json();

        const numOpenTickets = tickets.filter((ticket) => ticket.status === "OPEN").length;
        const openTicketsFromYesterday = countOpenTicketsFromYesterday(tickets);
        const numInProgressTickets = tickets.filter((ticket) => ticket.status === "IN_PROGRESS").length;

        const activeTickets = tickets.filter((ticket) =>
            ticket.status !== "RESOLVED" && ticket.status !== "CLOSED"
        );
        const assignedActiveTickets = activeTickets.filter(isTicketAssigned).length;
        const unassignedActiveTickets = activeTickets.filter((ticket) => !isTicketAssigned(ticket)).length;
        const assignedPercentage = activeTickets.length === 0
            ? 0
            : Math.round((assignedActiveTickets / activeTickets.length) * 100);

        const activeUsers = users.filter((user) => user.status === "ACTIVE").length;

        openedTicketEl.textContent = numOpenTickets;
        openedTicketFromYDEl.textContent = openTicketsFromYesterday;
        ticketInProgressEl.textContent = numInProgressTickets;
        assignedTicketPercentageEl.textContent = `${assignedPercentage}%`;
        activeUsersEl.textContent = activeUsers;
        totalUsersEl.textContent = users.length;
        unassignedTicketsEl.textContent = unassignedActiveTickets;

        renderTicketTable(tickets);
        renderUserTable(users);
        renderActivities(activities);
    } catch (error) {
        showToast("error", "Dati non caricati", error.message);
    }
}

function countOpenTicketsFromYesterday(tickets) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);

    return tickets.filter((ticket) => {
        const createdAt = new Date(ticket.createdAt);

        return ticket.status === "OPEN" && createdAt >= yesterday;
    }).length;
}

function renderTicketTable(tickets) {
    if (!ticketTableBody) {
        return;
    }

    const manageableTickets = tickets.filter((ticket) =>
        ticket.status !== "RESOLVED" && ticket.status !== "CLOSED"
    );

    ticketTableCount.textContent = manageableTickets.length;

    if (manageableTickets.length === 0) {
        ticketTableBody.innerHTML = `<tr><td colspan="6">Nessun ticket da gestire.</td></tr>`;
        return;
    }

    ticketTableBody.innerHTML = manageableTickets.map((ticket) => {
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

    ticketTableBody.querySelectorAll("[data-ticket-id]").forEach((row) => {
        row.addEventListener("click", () => {
            window.location.href = `/pages/ticket-detail.html?id=${row.dataset.ticketId}`;
        });
    });
}

function renderUserTable(users) {
    if (!userTableBody) {
        return;
    }

    userTableCount.textContent = users.length;

    if (users.length === 0) {
        userTableBody.innerHTML = `<tr><td colspan="4">Nessun utente trovato.</td></tr>`;
        return;
    }

    userTableBody.innerHTML = users.map((user) => {
        const fullName = getFullName(user);
        const email = user.email ?? "-";
        const role = user.role ?? "-";
        const status = user.status ?? "-";

        return `
            <tr>
                <td>
                    <strong>${escapeHtml(fullName)}</strong>
                    <span>${escapeHtml(formatLabel(role))}</span>
                </td>
                <td>${escapeHtml(email)}</td>
                <td><span class="pill ${getRoleClass(role)}">${escapeHtml(formatLabel(role))}</span></td>
                <td><span class="pill ${getStatusClass(status)}">${escapeHtml(formatLabel(status))}</span></td>
            </tr>
        `;
    }).join("");
}

function renderActivities(activities) {
    if (!activityList) {
        return;
    }

    if (activities.length === 0) {
        activityList.innerHTML = `
            <li>
                <span class="activity-dot"></span>
                <div>
                    <strong>Nessun aggiornamento recente</strong>
                    <span>Le nuove attivita compariranno qui.</span>
                </div>
            </li>
        `;
        return;
    }

    activityList.innerHTML = activities.map((activity) => {
        const title = activity.title ?? "Aggiornamento";
        const description = activity.description ?? "";
        const author = activity.authorFullName ?? "Autore non disponibile";
        const createdAt = formatDate(activity.createdAt);
        const type = activity.type ?? "";
        const dotClass = getActivityDotClass(type);

        return `
            <li>
                <span class="activity-dot ${dotClass}"></span>
                <div>
                    <strong>${escapeHtml(title)}</strong>
                    <span>${escapeHtml(description)}</span>
                    <span>${escapeHtml(author)} &middot; ${escapeHtml(createdAt)}</span>
                </div>
            </li>
        `;
    }).join("");
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

function getFullName(user) {
    const fullName = `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim();

    return fullName || user.fullName || user.email || "Utente senza nome";
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
        PENDING: "in attesa",
        RESOLVED: "risolto",
        CLOSED: "chiuso",
        LOW: "bassa",
        MEDIUM: "media",
        HIGH: "alta",
        URGENT: "urgente",
        ACTIVE: "attivo",
        DISABLED: "disabilitato",
        CUSTOMER: "customer",
        AGENT: "agent",
        ADMIN: "admin"
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
        PENDING: "pill-status-pending",
        RESOLVED: "pill-status-resolved",
        CLOSED: "pill-status-closed",
        ACTIVE: "pill-status-resolved",
        DISABLED: "pill-status-closed"
    };

    return classes[status] ?? "pill-status";
}

function getRoleClass(role) {
    const classes = {
        ADMIN: "pill-role-admin",
        AGENT: "pill-role-agent",
        CUSTOMER: "pill-role-customer"
    };

    return classes[role] ?? "pill-role-customer";
}

function getActivityDotClass(type) {
    if (type.startsWith("USER")) {
        return "activity-dot-user";
    }

    if (type === "TICKET_CLOSED") {
        return "activity-dot-closed";
    }

    if (type.startsWith("TICKET")) {
        return "activity-dot-ticket";
    }

    return "";
}

function escapeHtml(value) {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll("\"", "&quot;")
        .replaceAll("'", "&#039;");
}

loadDashboardData();
