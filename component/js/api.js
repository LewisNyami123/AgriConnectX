// api.js
import { getToken } from "./lib/storage.js";

const API_BASE = (window.location.hostname === "127.0.0.1")
  ? "http://localhost:5500"
  : "https://agriconnectx.onrender.com";

export async function apiGet(url) {
  const token = getToken();
  const res = await fetch(`${API_BASE}${url}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    credentials: "include"   // ✅ correct option for fetch
  });

  if (!res.ok) {
    throw new Error(`API error: ${res.status}`);
  }

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
    body: JSON.stringify(body),
    withCredentials:true
  });
  return res.json();
}