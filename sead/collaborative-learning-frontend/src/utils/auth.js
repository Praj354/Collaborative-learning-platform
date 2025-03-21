// Save JWT Token to Local Storage
export function saveToken(token) {
    localStorage.setItem("jwtToken", token);
}

// Retrieve JWT Token from Local Storage
export function getToken() {
    return localStorage.getItem("jwtToken");
}

// Remove JWT Token (for Logout)
export function removeToken() {
    localStorage.removeItem("jwtToken");
}
