// modules/escrow.js

import { apiGet, apiPost } from "./api.js";

export async function renderEscrow() {

  const appContent = document.getElementById("appContent");

  const res = await apiGet("/api/analytics/escrow");

  if (!res.success) {
    appContent.innerHTML = "<p>Failed to load escrow data</p>";
    return;
  }

  const escrows = res.data;

  appContent.innerHTML = `

  <div class="page-header">
    <h2>Escrow Management</h2>
  </div>

  <div class="stats-row">

    <div class="stat-card">
      <h3>${escrows.length}</h3>
      <p>Total Escrows</p>
    </div>

  </div>

  <div class="table-container">

    <table class="data-table">

      <thead>
        <tr>
          <th>Transaction</th>
          <th>Amount</th>
          <th>Status</th>
          <th>Date</th>
          <th>Action</th>
        </tr>
      </thead>

      <tbody>

        ${escrows.map(e => `

          <tr>

            <td>${e.transaction || "N/A"}</td>

            <td>$${e.amount}</td>

            <td>
              <span class="status-${e.status}">
                ${e.status}
              </span>
            </td>

            <td>
              ${new Date(e.createdAt).toLocaleDateString()}
            </td>

            <td>

              ${
                e.status === "pending"
                ?
                `<button class="btn-success"
                   onclick="releaseEscrow('${e._id}')">
                   Release
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



/* Release Escrow */

window.releaseEscrow = async function(escrowId){

  const confirmRelease = confirm("Release funds to farmer?");

  if(!confirmRelease) return;

  const res = await apiPost(`/api/admin/escrow/release/${escrowId}`, {});

  if(res.success){

    alert("Funds released");

    renderEscrow();

  }else{

    alert(res.message || "Release failed");

  }

}