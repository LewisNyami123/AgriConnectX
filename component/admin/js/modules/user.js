// modules/users.js
import { apiGet, apiPost } from "./api.js";

export async function renderUsers() {
  const res = await apiGet("/api/users"); // you’ll need a backend route to list users
  const appContent = document.getElementById("appContent");

  if (!res.success) {
    appContent.innerHTML = "<p>Failed to load users</p>";
    return;
  }

  appContent.innerHTML = `
    <h2>Users</h2>
    <table class="data-table">
      <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Action</th></tr></thead>
      <tbody>
        ${res.data.map(user => `
          <tr>
            <td>${user.firstName} ${user.lastName}</td>
            <td>${user.email}</td>
            <td>${user.role}</td>
            <td>${user.isApproved ? "Approved" : "Pending"}</td>
            <td>
              ${user.role === "farmer" && !user.isApproved ? 
                `<button onclick="approveFarmer('${user._id}')">Approve</button>` : ""}
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

// Approve farmer
window.approveFarmer = async function(userId) {
  const res = await apiPost(`/api/admin/approve/${userId}`, {});
  if (res.success) {
    alert("Farmer approved!");
    renderUsers(); // reload list
  } else {
    alert(res.message || "Approval failed");
  }
};