// modules/disputes.js

import { apiGet, apiPost } from "./api.js";

export async function renderDisputes(){

  const appContent = document.getElementById("appContent");

  const res = await apiGet("/api/analytics/disputes");

  if(!res.success){
    appContent.innerHTML = "<p>Failed to load disputes data</p>";
    return;
  }

  const disputes = res.data;

  appContent.innerHTML = `

  <div class="page-header">
    <h2>Dispute Management</h2>
  </div>

  <div class="stats-row">
    <div class="stat-card">
      <h3>${disputes.length}</h3>
      <p>Total Disputes</p>
    </div>
  </div>

  <div class="table-container">

    <table class="data-table">

      <thead>
        <tr>
          <th>Transaction</th>
          <th>Reason</th>
          <th>Status</th>
          <th>Date</th>
          <th>Action</th>
        </tr>
      </thead>

      <tbody>

        ${disputes.map(d => `

          <tr>

            <td>${d.transaction || "N/A"}</td>

            <td>${d.reason}</td>

            <td>
              <span class="status-${d.status}">
                ${d.status}
              </span>
            </td>

            <td>
              ${new Date(d.createdAt).toLocaleDateString()}
            </td>

            <td>

              ${
                d.status === "open"
                ?
                `<button class="btn-success"
                   onclick="resolveDispute('${d._id}')">
                   Resolve
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


/* Resolve Dispute */

window.resolveDispute = async function(id){

  const confirmResolve = confirm("Mark this dispute as resolved?");

  if(!confirmResolve) return;

  const res = await apiPost(`/api/admin/disputes/resolve/${id}`, {});

  if(res.success){

    alert("Dispute resolved");

    renderDisputes();

  }else{

    alert(res.message || "Failed to resolve");

  }

}