// state.js
let token = null;
let user = null;

export function setToken(t) { token = t; }
export function getToken() { return token; }

export function setUser(u) { user = u; }
export function getUser() { return user; }