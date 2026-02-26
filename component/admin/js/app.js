import { loadRoute } from "./router.js";

document.querySelectorAll(".menu li").forEach(item=>{
    item.addEventListener("click", ()=>{
        document.querySelectorAll(".menu li").forEach(i=>i.classList.remove("active"));
        item.classList.add("active");

        const route = item.getAttribute("data-route");
        loadRoute(route);
    });
});

loadRoute("dashboard");

// Modal Elements
const userModal = document.getElementById("addUserModal");
const usersMenu = document.getElementById("usersMenu");
const closeUserModal = document.getElementById("closeUserModal");

// Open Modal
usersMenu.addEventListener("click", () => {
  userModal.classList.add("active");
});

// Close Modal
closeUserModal.addEventListener("click", () => {
  userModal.classList.remove("active");
});

// Close if clicking outside content
window.addEventListener("click", (e) => {
  if (e.target === userModal) {
    userModal.classList.remove("active");
  }
});