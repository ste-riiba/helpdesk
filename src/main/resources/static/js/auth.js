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

    const basicAuth = btoa(`${email}:${password}`);

    submitButton.disabled = true;
    setMessage("Controllo credenziali...", "");

    try {
        const response = await fetch("/api/v1/users/me", {
            method: "GET",
            headers: {
                "Authorization": `Basic ${basicAuth}`
            }
        });

        if (!response.ok) {
            throw new Error("Credenziali non valide.");
        }

        sessionStorage.setItem("basicAuth", basicAuth);
        sessionStorage.setItem("userEmail", email);
        setMessage("Accesso riuscito.", "success");
        window.location.replace("../index.html");
    } catch (error) {
        sessionStorage.removeItem("basicAuth");
        sessionStorage.removeItem("userEmail");
        setMessage(error.message || "Accesso non riuscito.", "error");
    } finally {
        submitButton.disabled = false;
    }
});
