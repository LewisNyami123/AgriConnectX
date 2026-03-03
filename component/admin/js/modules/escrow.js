// modules/escrow.js
import { apiGet } from "./api.js";

export async function renderEscrow() {
  const res = await apiGet("/api/escrow"); // you’ll need a backend route
  const appContent = document.getElementById("appContent");

  if (!res.success) {
    appContent.innerHTML = "<p>Failed to load escrow data</p>";
    return;
  }

  appContent.innerHTML = `
    <h2>Escrow</h2>
    <p>Total Escrows: ${res.data.length}</p>
  `;
}