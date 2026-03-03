// modules/logistics.js
import { apiGet } from "./api.js";

export async function renderLogistics() {
  const res = await apiGet("/api/logistics"); // backend route needed
  const appContent = document.getElementById("appContent");

  if (!res.success) {
    appContent.innerHTML = "<p>Failed to load logistics data</p>";
    return;
  }

  appContent.innerHTML = `
    <h2>Logistics</h2>
    <p>Total Logistics: ${res.data.length}</p>
  `;
}