// modules/api.js
import { getToken } from "../state.js";

export async function apiGet(url) {
  const res = await fetch(`http://localhost:5500${url}`, {
    headers: { Authorization: `Bearer ${getToken()}` }
  });
  return res.json();
}

export async function apiPost(url, body) {
  const res = await fetch(`http://localhost:5500${url}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}`
    },
    body: JSON.stringify(body)
  });
  return res.json();
}