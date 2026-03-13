// modules/logistics.js

import { apiGet, apiPost } from "./api.js";

export async function renderLogistics(){

  const appContent = document.getElementById("appContent");

  const res = await apiGet("/api/analytics/logistics");

  if(!res.success){
    appContent.innerHTML = "<p>Failed to load logistics data</p>";
    return;
  }

  const logistics = res.data;

  appContent.innerHTML = `

  <div class="page-header">
    <h2>Logistics Management</h2>
  </div>

  <div class="stats-row">
    <div class="stat-card">
      <h3>${logistics.length}</h3>
      <p>Total Deliveries</p>
    </div>
  </div>

  <div class="table-container">

    <table class="data-table">

      <thead>
        <tr>
          <th>Transaction</th>
          <th>Transporter</th>
          <th>Status</th>
          <th>Date</th>
          <th>Action</th>
        </tr>
      </thead>

      <tbody>

        ${logistics.map(l => `

          <tr>

            <td>${l.transaction || "N/A"}</td>

            <td>${l.transporter || "Not Assigned"}</td>

            <td>
              <span class="status-${l.status}">
                ${l.status}
              </span>
            </td>

            <td>
              ${new Date(l.createdAt).toLocaleDateString()}
            </td>

            <td>

              ${
                l.status === "pending"
                ?
                `<button class="btn-primary"
                   onclick="updateDelivery('${l._id}','in-transit')">
                   Ship
                 </button>`
                :
                l.status === "in-transit"
                ?
                `<button class="btn-success"
                   onclick="updateDelivery('${l._id}','delivered')">
                   Deliver
                 </button>`
                :
                "-"
              }

            </td>

          </tr>

        `).join("")}

      </tbody>

    </table>

  </div>

  `;

}


/* Update Delivery Status */

window.updateDelivery = async function(id, status){

  const res = await apiPost(`/api/admin/logistics/update/${id}`, { status });

  if(res.success){

    alert("Delivery updated");

    renderLogistics();

  }else{

    alert(res.message || "Update failed");

  }

}