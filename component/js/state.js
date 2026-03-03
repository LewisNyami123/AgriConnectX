// state.js
let token = null;
let user = null;

// Save token after login
export function setToken(t) {
  token = t;
  localStorage.setItem("token", t); // optional: persist in browser
}

// Retrieve token for API calls
export function getToken() {
  if (!token) {
    token = localStorage.getItem("token"); // reload if page refreshed
  }
  return token;
}

// Save user info
export function setUser(u) {
  user = u;
  localStorage.setItem("user", JSON.stringify(u));
}

// Retrieve user info
export function getUser() {
  if (!user) {
    const stored = localStorage.getItem("user");
    if (stored) user = JSON.parse(stored);
  }
  return user;
}