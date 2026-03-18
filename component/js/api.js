// api.js
import { getToken } from "./lib/storage.js";

const API_BASE =  window.location.hostname === "localhost"
    ? "http://localhost:5500"
    : "https://agriconnectx.onrender.com";
;
export async function apiGet(url) {
  const token = getToken();
  const res = await fetch(`${API_BASE}${url}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    }
  });
  return res.json();
}


export async function apiPost(url, body) {
  const token = getToken();
  const res = await fetch(`${API_BASE}${url}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: JSON.stringify(body)
  });
  return res.json();
}