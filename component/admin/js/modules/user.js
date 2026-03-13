// modules/users.js

import { apiGet, apiPost } from "./api.js";

export async function renderUsers() {

  const appContent = document.getElementById("appContent");

  const res = await apiGet("/api/users");

  if (!res.success) {
    appContent.innerHTML = "<p>Failed to load users</p>";
    return;
  }

  const users = res.data;

  appContent.innerHTML = `

  <div class="page-header">
      <h2>Users</h2>

      <button class="btn-primary" id="addUserBtn">
        <i class="fas fa-plus"></i> Add User
      </button>
  </div>

  <div class="table-container">

    <table class="data-table">

      <thead>
        <tr>
          <th>Name</th>
          <th>Email</th>
          <th>Role</th>
          <th>Status</th>
          <th>Action</th>
        </tr>
      </thead>

      <tbody>

        ${users.map(user => `

          <tr>

            <td>${user.firstName} ${user.lastName}</td>

            <td>${user.email}</td>

            <td>
              <span class="role-badge">${user.role}</span>
            </td>

            <td>
              <span class="${user.isApproved ? "status-approved" : "status-pending"}">
                ${user.isApproved ? "Approved" : "Pending"}
              </span>
            </td>

            <td class="action-buttons">

              ${
                user.role === "farmer" && !user.isApproved
                ?
                `<button class="btn-success" onclick="approveFarmer('${user._id}')">
                  Approve
                 </button>`
                : ""
              }

              <button class="btn-edit" onclick="editUser('${user._id}')">
                Edit
              </button>

              <button class="btn-danger" onclick="deleteUser('${user._id}')">
                Delete
              </button>

            </td>

          </tr>

        `).join("")}

      </tbody>

    </table>

  </div>

  `;

  /* Add user button */

  document.getElementById("addUserBtn")
  .addEventListener("click", openAddUserModal);

}

function openAddUserModal(){

  const modal = `

  <div id="addUserModal" class="modal">

    <div class="modal-content">

      <div class="modal-header">

        <h3>Add New User</h3>

        <button class="close" id="closeModal">&times;</button>

      </div>

      <form id="addUserForm">

        <input type="text" placeholder="First Name" required>

        <input type="text" placeholder="Last Name" required>

        <input type="email" placeholder="Email" required>

        <select required>
          <option value="">Role</option>
          <option value="farmer">Farmer</option>
          <option value="buyer">Buyer</option>
          <option value="admin">Admin</option>
        </select>

        <button class="btn-primary full-btn">
          Save User
        </button>

      </form>

    </div>

  </div>

  `;

  document.body.insertAdjacentHTML("beforeend", modal);

  document.getElementById("closeModal").onclick = () => {
    document.getElementById("addUserModal").remove();
  }

}

/* Approve Farmer */

window.approveFarmer = async function(userId){

  const res = await apiPost(`/api/admin/approve/${userId}`, {});

  if(res.success){

    alert("Farmer Approved");

    renderUsers();

  }else{

    alert(res.message || "Approval failed");

  }

}
window.deleteUser = async function(userId){

  const confirmDelete = confirm("Are you sure you want to delete this user?");

  if(!confirmDelete) return;

  const res = await apiPost(`/api/admin/users/delete/${userId}`, {});

  if(res.success){

    alert("User deleted");

    renderUsers();

  }else{

    alert(res.message || "Delete failed");

  }

};
window.editUser = async function(userId){

  const firstName = prompt("Enter new first name");
  const lastName = prompt("Enter new last name");

  if(!firstName || !lastName) return;

  const res = await apiPost(`/api/admin/users/edit/${userId}`, {
    firstName,
    lastName
  });

  if(res.success){

    alert("User updated");

    renderUsers();

  }else{

    alert(res.message || "Update failed");

  }

};