export function getToken() {
    const token = sessionStorage.getItem("token");

    if (!token) {
        window.location.replace("/pages/login.html");
        return null;
    }

    return token;
}

export function logout() {
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("userEmail");
    sessionStorage.removeItem("userRole");
    window.location.replace("/pages/login.html");
}