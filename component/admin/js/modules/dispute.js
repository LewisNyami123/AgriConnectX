// modules/disputes.js
import { apiGet } from "./api.js";

export async function renderDisputes() {
  const res = await apiGet("/api/disputes"); // backend route needed
  const appContent = document.getElementById("appContent");

  if (!res.success) {
    appContent.innerHTML = "<p>Failed to load disputes data</p>";
    return;
  }

  appContent.innerHTML = `
    <h2>Disputes</h2>
    <p>Total Disputes: ${res.data.length}</p>
  `;
}