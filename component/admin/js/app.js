// app.js
import { loadRoute } from "./router.js";
// import { getToken, getUser } from "./state.js";

// Sidebar navigation
document.querySelectorAll(".menu li").forEach(item => {
  item.addEventListener("click", () => {
    document.querySelectorAll(".menu li").forEach(i => i.classList.remove("active"));
    item.classList.add("active");

    const route = item.getAttribute("data-route");
    loadRoute(route); // load the selected route
  });
});

// Load dashboard by default
loadRoute("dashboard");