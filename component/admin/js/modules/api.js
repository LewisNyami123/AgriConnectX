// modules/api.js
import { getToken } from "../state.js";
const API_BASE =  window.location.hostname === "localhost"
    ? "http://localhost:5500"
    : "https://agriconnectx.onrender.com";
export async function apiGet(url) {
  const res = await fetch(`${API_BASE}${url}`, {
    headers: { Authorization: `Bearer ${getToken()}` }
  });
  return res.json();
}

export async function apiPost(url, body) {
  const res = await fetch(`${API_BASE}${url}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}`
    },
    body: JSON.stringify(body)
  });
  return res.json();
}