const logoutBtn = document.querySelector(".logout-btn");
const ticketForm = document.querySelector(".ticket-form");
const ticketListEl = document.querySelector(".ticket-list");
const summaryEl = document.querySelector(".summary-card");

ticketForm?.addEventListener("submit", async (e) => {
    e.preventDefault();

    const formData = new FormData(ticketForm);
    const basicAuth = sessionStorage.getItem("basicAuth");

    if (!basicAuth) {
        window.location.replace("/pages/login.html");
        return;
    }

    const ticket = {
        title: formData.get("title"),
        category: formData.get("category"),
        priority: formData.get("priority"),
        description: formData.get("description")

    }

    const response = await fetch("/api/v1/tickets", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Basic ${basicAuth}`
        },
        body: JSON.stringify(ticket)
    });

    if (!response.ok) {
        alert("Errore")
        return;
    }

    console.log("ticket creato");
    ticketForm.reset();
    getMyTickets();
})

async function getMyTickets() {
    const basicAuth = sessionStorage.getItem("basicAuth");

    if (!basicAuth) {
        window.location.replace("/pages/login.html");
        return;
    }

    const response = await fetch("/api/v1/tickets", {
        method: "GET",
        headers: {
            "Authorization": `Basic ${basicAuth}`
        }
    });

    if (!response.ok) {
        alert("error");
        return;
    }

    const tickets = await response.json();

    if (tickets.length === 0) {
        ticketListEl.innerHTML = `
        <article class="ticket-empty">
            <strong>Nessun ticket trovato.</strong>
            <span>Quando apri una richiesta, comparirà qui.</span>
        </article>
    `;
        return;
    }


    summaryEl.innerHTML = ""
    summaryEl.insertAdjacentHTML("afterbegin", `<span class="summary-value">Tickets aperti: ${tickets.length}</span>
<span></span>`);

    ticketListEl.innerHTML = "";

    ticketListEl.innerHTML = tickets.map(t => `
    <article class="ticket-item">
                <div class="ticket-item-header">
                    <div>
                        <h3>${t.title}</h3>
                        <p>${t.description}</p>
                    </div>
                    <span class="pill pill-status">${t.status}</span>
                </div>
                <div class="ticket-meta">
                    <span class="pill pill-priority">${t.priority}</span>
                    <span class="pill">${t.category}</span>
                </div>
            </article>`).join("");

    console.log(tickets);
}

logoutBtn?.addEventListener("click", () => {
    sessionStorage.removeItem("basicAuth");
    sessionStorage.removeItem("userEmail");
    window.location.replace("/pages/login.html");
});

getMyTickets();
