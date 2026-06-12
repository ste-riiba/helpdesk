const loginForm = document.querySelector("#loginForm");
const loginMessage = document.querySelector("#loginMessage");

function setMessage(message, type) {
    loginMessage.textContent = message;
    loginMessage.className = `form-message ${type || ""}`.trim();
}

loginForm?.addEventListener("submit", async (event) => {
    event.preventDefault();

    const formData = new FormData(loginForm);
    const email = String(formData.get("email") || "").trim();
    const password = String(formData.get("password") || "");
    const submitButton = loginForm.querySelector("button[type='submit']");

    if (!email || !password) {
        setMessage("Inserisci email e password.", "error");
        return;
    }

    submitButton.disabled = true;
    setMessage("Controllo credenziali...", "");

    try {
        const response = await fetch("/api/v1/auth/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ email, password })
        });

        if (!response.ok) {
            throw new Error("Credenziali non valide.");
        }

        const user = await response.json();

        sessionStorage.setItem("token", user.token);
        sessionStorage.setItem("userEmail", user.email);
        sessionStorage.setItem("userRole", user.role);
        setMessage("Accesso riuscito.", "success");

        if (user.role === "ADMIN") {
            window.location.replace("/pages/admin-dashboard.html");
        } else {
            window.location.replace("/index.html");
        }
    } catch (error) {
        sessionStorage.removeItem("token");
        sessionStorage.removeItem("userEmail");
        sessionStorage.removeItem("userRole");
        setMessage(error.message || "Accesso non riuscito.", "error");
    } finally {
        submitButton.disabled = false;
    }
});
