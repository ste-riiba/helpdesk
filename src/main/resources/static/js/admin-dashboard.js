import {getToken} from "./auth-utils.js";
import {showToast} from "./toast.js";

const createUserBtn = document.querySelector("#open-create-user-modal");
const createUserModal = document.querySelector("#create-user-modal");
const createUserForm = document.querySelector("#create-user-form");
const closeModalBtns = document.querySelectorAll("[data-modal-close]");
const createUserModalBtn = document.querySelector("#create-user");

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

createUserBtn?.addEventListener("click", openModal);

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

async function createNewUser(e) {
    e.preventDefault();

    createUserModalBtn.disabled = true;

    const formData = new FormData(createUserForm);
    const token = getToken();

    if (!token) {
        return;
    }

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
    } catch (error) {
        showToast("error", "Utente non creato", error.message);
    } finally {
        createUserModalBtn.disabled = false;
    }
}

createUserForm?.addEventListener("submit", createNewUser);
