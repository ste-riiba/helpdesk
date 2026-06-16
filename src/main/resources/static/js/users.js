import {getToken, logout} from "./auth-utils.js";
import {showToast} from "./toast.js";

const logoutBtn = document.querySelector(".logout-btn");
const usersTableBody = document.querySelector("#users-table-body");
const usersCount = document.querySelector("#users-count");
const searchInput = document.querySelector("#user-search");
const roleFilter = document.querySelector("#role-filter");
const statusFilter = document.querySelector("#status-filter");
const createUserBtn = document.querySelector("#open-create-user-modal");
const createUserModal = document.querySelector("#create-user-modal");
const createUserForm = document.querySelector("#create-user-form");
const closeModalBtns = document.querySelectorAll("[data-modal-close]");
const createUserSubmitBtn = document.querySelector("#create-user");

let users = [];

if (!sessionStorage.getItem("token") || sessionStorage.getItem("userRole") !== "ADMIN") {
    window.location.replace("/index.html");
}

logoutBtn?.addEventListener("click", (event) => {
    event.preventDefault();
    logout();
});

createUserBtn?.addEventListener("click", openModal);
createUserForm?.addEventListener("submit", createNewUser);

closeModalBtns.forEach((button) => {
    button.addEventListener("click", closeModal);
});

createUserModal?.addEventListener("click", (event) => {
    if (event.target === createUserModal) {
        closeModal();
    }
});

document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && createUserModal?.classList.contains("is-open")) {
        closeModal();
    }
});

[searchInput, roleFilter, statusFilter].forEach((field) => {
    field?.addEventListener("input", renderUsers);
});

async function loadUsers() {
    const token = getToken();

    if (!token) {
        return;
    }

    try {
        const response = await fetch("/api/v1/admin/users", {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error("Errore nel caricare gli utenti.");
        }

        users = await response.json();
        renderUsers();
    } catch (error) {
        showToast("error", "Utenti non caricati", error.message);
        usersTableBody.innerHTML = `<tr><td colspan="5">Impossibile caricare gli utenti.</td></tr>`;
    }
}

async function createNewUser(event) {
    event.preventDefault();

    const token = getToken();

    if (!token) {
        return;
    }

    const formData = new FormData(createUserForm);
    const newUser = {
        firstName: formData.get("firstName"),
        lastName: formData.get("lastName"),
        email: formData.get("email"),
        role: formData.get("role"),
        status: formData.get("status"),
        password: formData.get("password"),
        confirmPassword: formData.get("confirmPassword")
    };

    createUserSubmitBtn.disabled = true;

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
            throw new Error(await getErrorMessage(response, "Controlla i dati inseriti e riprova."));
        }

        closeModal();
        showToast("success", "Utente creato", "Il nuovo account e stato aggiunto correttamente.");
        await loadUsers();
    } catch (error) {
        showToast("error", "Utente non creato", error.message);
    } finally {
        createUserSubmitBtn.disabled = false;
    }
}

async function updateUserStatus(userId, action) {
    const token = getToken();

    if (!token) {
        return;
    }

    try {
        const response = await fetch(`/api/v1/admin/users/${userId}/${action}`, {
            method: "PUT",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error(await getErrorMessage(response, "Operazione non completata."));
        }

        showToast("success", "Utente aggiornato", "Lo stato dell'utente e stato aggiornato.");
        await loadUsers();
    } catch (error) {
        showToast("error", "Utente non aggiornato", error.message);
    }
}

function renderUsers() {
    const filteredUsers = getFilteredUsers();

    usersCount.textContent = filteredUsers.length;

    if (filteredUsers.length === 0) {
        usersTableBody.innerHTML = `<tr><td colspan="5">Nessun utente trovato.</td></tr>`;
        return;
    }

    usersTableBody.innerHTML = filteredUsers.map((user) => {
        const userId = user.id ?? user.userId ?? "";
        const fullName = getFullName(user);
        const email = user.email ?? "-";
        const role = user.role ?? "-";
        const status = user.status ?? "-";
        const isDisabled = status === "DISABLED";
        const isActive = status === "ACTIVE";

        return `
            <tr>
                <td>
                    <strong>${escapeHtml(fullName)}</strong>
                    <span>ID ${escapeHtml(userId || "-")}</span>
                </td>
                <td>${escapeHtml(email)}</td>
                <td><span class="pill ${getRoleClass(role)}">${escapeHtml(formatLabel(role))}</span></td>
                <td><span class="pill ${getStatusClass(status)}">${escapeHtml(formatLabel(status))}</span></td>
                <td>
                    <div class="row-actions">
                        <button class="secondary-button" type="button" data-user-action="activate" data-user-id="${escapeHtml(userId)}" ${isActive ? "disabled" : ""}>Attiva</button>
                        <button class="ghost-button danger-button" type="button" data-user-action="disable" data-user-id="${escapeHtml(userId)}" ${isDisabled ? "disabled" : ""}>Disabilita</button>
                    </div>
                </td>
            </tr>
        `;
    }).join("");

    usersTableBody.querySelectorAll("[data-user-action]").forEach((button) => {
        button.addEventListener("click", () => {
            updateUserStatus(button.dataset.userId, button.dataset.userAction);
        });
    });
}

function getFilteredUsers() {
    const query = searchInput?.value.trim().toLowerCase() ?? "";
    const selectedRole = roleFilter?.value ?? "";
    const selectedStatus = statusFilter?.value ?? "";

    return users.filter((user) => {
        const searchableText = [
            user.id,
            user.firstName,
            user.lastName,
            user.fullName,
            user.email
        ].join(" ").toLowerCase();

        const matchesSearch = !query || searchableText.includes(query);
        const matchesRole = !selectedRole || user.role === selectedRole;
        const matchesStatus = !selectedStatus || user.status === selectedStatus;

        return matchesSearch && matchesRole && matchesStatus;
    });
}

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

async function getErrorMessage(response, fallbackMessage) {
    try {
        const data = await response.json();

        return data.message ?? data.error ?? fallbackMessage;
    } catch {
        return fallbackMessage;
    }
}

function getFullName(user) {
    const fullName = `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim();

    return fullName || user.fullName || user.email || "Utente senza nome";
}

function formatLabel(value) {
    const labels = {
        ACTIVE: "attivo",
        PENDING: "in attesa",
        DISABLED: "disabilitato",
        CUSTOMER: "customer",
        AGENT: "agent",
        ADMIN: "admin"
    };

    return labels[value] ?? String(value).replaceAll("_", " ").toLowerCase();
}

function getStatusClass(status) {
    const classes = {
        ACTIVE: "pill-status-resolved",
        PENDING: "pill-status-pending",
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

function escapeHtml(value) {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll("\"", "&quot;")
        .replaceAll("'", "&#039;");
}

loadUsers();
