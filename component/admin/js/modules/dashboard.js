// modules/dashboard.js
import { apiGet } from "./api.js";

export async function renderDashboard() {

  const appContent = document.getElementById("appContent");

  try {

    const stats = await apiGet("/api/analytics/admin");

    if (!stats.success) {
      appContent.innerHTML = "<p>Failed to load dashboard</p>";
      return;
    }

    const datas = stats.data;

    appContent.innerHTML = `
    
      <div class="dashboard-header">
        <h2>Admin Overview</h2>
        <p>System statistics and performance</p>
      </div>

      <div class="stats-grid">

        <div class="stat-card">
          <i class="fas fa-users"></i>
          <div>
            <h3>${datas.totalUsers}</h3>
            <p>Total Users</p>
          </div>
        </div>

        <div class="stat-card">
          <i class="fas fa-tractor"></i>
          <div>
            <h3>${datas.totalFarmers}</h3>
            <p>Farmers</p>
          </div>
        </div>

        <div class="stat-card">
          <i class="fas fa-shopping-cart"></i>
          <div>
            <h3>${datas.totalBuyers}</h3>
            <p>Buyers</p>
          </div>
        </div>

        <div class="stat-card">
          <i class="fas fa-box"></i>
          <div>
            <h3>${datas.totalProducts}</h3>
            <p>Products</p>
          </div>
        </div>

        <div class="stat-card">
          <i class="fas fa-exchange-alt"></i>
          <div>
            <h3>${datas.totalTransactions}</h3>
            <p>Transactions</p>
          </div>
        </div>

        <div class="stat-card revenue">
          <i class="fas fa-dollar-sign"></i>
          <div>
            <h3>${datas.totalRevenue}FCFA</h3>
            <p>Total Revenue</p>
          </div>
        </div>

      </div>


      <div class="charts-grid">

        <div class="chart-card">
          <h3>Revenue</h3>
          <canvas id="revenueChart"></canvas>
        </div>

        <div class="chart-card">
          <h3>User Growth</h3>
          <canvas id="userGrowthChart"></canvas>
        </div>

      </div>

    `;

    /* ---------------- Revenue Chart ---------------- */

    const revenueCanvas = document.getElementById("revenueChart");

    if (revenueCanvas) {

      new Chart(revenueCanvas, {
        type: "bar",
        data: {
          labels: ["Revenue"],
          datasets: [{
            label: "Revenue",
            data: [datas.totalRevenue > 0 ? datas.totalRevenue : 0.1],
            backgroundColor: "rgba(46, 204, 113, 0.7)"
          }]
        },
        options: {
          responsive: true,
          plugins: {
            legend: { display: false }
          },
          scales: {
            y: { beginAtZero: true }
          }
        }
      });

    }


    /* ---------------- User Growth Chart ---------------- */

    const userCanvas = document.getElementById("userGrowthChart");

    if (userCanvas && datas.userGrowth) {

      new Chart(userCanvas, {
        type: "line",
        data: {
          labels: datas.userGrowth.map(u => u.month),
          datasets: [{
            label: "Users",
            data: datas.userGrowth.map(u => u.count),
            borderColor: "#3498db",
            backgroundColor: "rgba(52,152,219,0.2)",
            fill: true
          }]
        },
        options: {
          responsive: true,
          scales: {
            y: { beginAtZero: true }
          }
        }
      });

    }

  } catch (err) {

    console.error("Dashboard error:", err);

    appContent.innerHTML = `
      <div class="error">
        <h3>Dashboard Error</h3>
        <p>Unable to load analytics</p>
      </div>
    `;

  }

}