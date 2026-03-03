// modules/dashboard.js
import { apiGet } from "./api.js";

export async function renderDashboard() {
  const stats = await apiGet("/api/analytics/admin");
  const appContent = document.getElementById("appContent");

  if (!stats.success) {
    appContent.innerHTML = "<p>Failed to load dashboard</p>";
    return;
  }

  const data = stats.data;
  appContent.innerHTML = `
    <h2>Admin Dashboard</h2>
    <div class="stats-grid">
      <div class="stat-card">Users: ${data.totalUsers}</div>
      <div class="stat-card">Farmers: ${data.totalFarmers}</div>
      <div class="stat-card">Buyers: ${data.totalBuyers}</div>
      <div class="stat-card">Products: ${data.totalProducts}</div>
      <div class="stat-card">Transactions: ${data.totalTransactions}</div>
      <div class="stat-card">Revenue: $${data.totalRevenue}</div>
    </div>
    <canvas id="revenueChart"></canvas>
    <canvas id="userGrowthChart"></canvas>
  `;

  // Example chart
  const ctx = document.getElementById("revenueChart").getContext("2d");
  new Chart(ctx, {
    type: "line",
    data: {
      labels: data.monthlyRevenue.map(r => r.month),
      datasets: [{ label: "Revenue", data: data.monthlyRevenue.map(r => r.revenue), borderColor: "green" }]
    }
  });
}