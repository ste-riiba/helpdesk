export function showToast(type, title, message) {
    let toastContainer = document.querySelector("#toast-container");

    if (!toastContainer) {
        toastContainer = document.createElement("div");
        toastContainer.id = "toast-container";
        toastContainer.className = "toast-container";
        toastContainer.setAttribute("aria-live", "polite");
        toastContainer.setAttribute("aria-atomic", "true");
        document.body.append(toastContainer);
    }

    const toast = document.createElement("button");
    toast.type = "button";
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <strong></strong>
        <span></span>
    `;

    toast.querySelector("strong").textContent = title;
    toast.querySelector("span").textContent = message;

    toast.addEventListener("click", () => {
        toast.remove();
    });

    toastContainer.append(toast);

    setTimeout(() => {
        toast.remove();
    }, 5000);
}
