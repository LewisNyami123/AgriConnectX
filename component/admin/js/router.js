import { state } from "./state.js";
import { renderDashboard } from "./modules/dashboard.js";
import { renderUsers } from "./modules/users.js";
import { renderProducts } from "./modules/products.js";
import { renderEscrow } from "./modules/escrow.js";
import { renderLogistics } from "./modules/logistics.js";
import { renderDisputes } from "./modules/disputes.js";

export function loadRoute(route){
    state.currentRoute = route;

    const content = document.getElementById("appContent");
    const title = document.getElementById("pageTitle");

    content.innerHTML = "";

    switch(route){
        case "dashboard":
            title.innerText = "Dashboard";
            renderDashboard(content);
case "dashboard":
  content.innerHTML = `
    <div class="cards">
      <div class="card">
        <h3>Total Users</h3>
        <p>1,245</p>
      </div>
      <div class="card">
        <h3>Total Transactions</h3>
        <p>3,890</p>
      </div>
      <div class="card">
        <h3>Revenue (FCFA)</h3>
        <p>12,500,000</p>
      </div>
    </div>

    <div class="card">
      <h3>Monthly Revenue</h3>
      <canvas id="adminRevenueChart"></canvas>
    </div>

    <div class="card">
      <h3>User Distribution</h3>
      <canvas id="adminUserChart"></canvas>
    </div>
  `;

  setTimeout(() => {
    new Chart(document.getElementById("adminRevenueChart"), {
      type: "line",
      data: {
        labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
        datasets: [{
          label: "Revenue",
          data: [2000000, 2500000, 3000000, 4000000, 3500000, 5000000],
          borderColor: "#16a34a",
          fill: true
        }]
      }
    });

    new Chart(document.getElementById("adminUserChart"), {
      type: "doughnut",
      data: {
        labels: ["Farmers", "Buyers", "Transporters"],
        datasets: [{
          data: [500, 600, 145],
          backgroundColor: ["#22c55e", "#2563eb", "#f59e0b"]
        }]
      }
    });
  }, 100);
break;        case "users":
            title.innerText = "User Management";
            renderUsers(content);
            break;
        case "products":
            title.innerText = "Product Management";
            renderProducts(content);
            break;
        case "escrow":
            title.innerText = "Escrow Control";
            renderEscrow(content);
            break;
        case "logistics":
            title.innerText = "Logistics Tracking";
            renderLogistics(content);
            break;
        case "disputes":
            title.innerText = "Dispute Resolution";
            renderDisputes(content);
            break;
    }
}