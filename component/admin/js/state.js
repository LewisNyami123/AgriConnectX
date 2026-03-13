// state.js

let token = localStorage.getItem("token") || null;
let user = JSON.parse(localStorage.getItem("user")) || null;

// TOKEN
export function setToken(t) {
    token = t;
    if (t) {
        localStorage.setItem("token", t);
    } else {
        localStorage.removeItem("token");
    }
}

export function getToken() {
    return token;
}

// USER
export function setUser(u) {
    user = u;
    if (u) {
        localStorage.setItem("user", JSON.stringify(u));
    } else {
        localStorage.removeItem("user");
    }
}

export function getUser() {
    return user;
}

// LOGOUT HELPER
export function logout() {
    token = null;
    user = null;
    localStorage.removeItem("token");
    localStorage.removeItem("user");
}