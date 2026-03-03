// router.js
import { renderDashboard } from "./modules/dashboard.js";
import { renderUsers } from "./modules/user.js";
import { renderProducts } from "./modules/product.js";
import { renderEscrow } from "./modules/escrow.js";
import { renderLogistics } from "./modules/logistics.js";
import { renderDisputes } from "./modules/dispute.js";

export function loadRoute(route) {
  switch (route) {
    case "dashboard": renderDashboard(); break;
    case "users": renderUsers(); break;
    case "products": renderProducts(); break;
    case "escrow": renderEscrow(); break;
    case "logistics": renderLogistics(); break;
    case "disputes": renderDisputes(); break;
    default: document.getElementById("appContent").innerHTML = "<h2>Not Found</h2>";
  }
}