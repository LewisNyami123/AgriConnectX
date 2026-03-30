/* =====================================================
AGRI CONNECT X BUYER DASHBOARD CONTROLLER
===================================================== */

/* DOM */
const menuItems = document.querySelectorAll(".menu li[data-route]");
const content = document.getElementById("appContent");
const pageTitle = document.getElementById("pageTitle");
const cartCount = document.getElementById("cartCount");

/* Charts */
let orderChart;
let spendingChart;

/* =====================================================
API CONFIG
===================================================== */

const API_BASE = (window.location.hostname === "127.0.0.1" || window.location.hostname === "localhost")
  ? "http://localhost:5500"
  : "https://agriconnectx.onrender.com";

/* =====================================================
API HELPERS
===================================================== */

async function apiGet(url) {
  const token = localStorage.getItem("token");

  const res = await fetch(API_BASE + url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });

  if (!res.ok) throw new Error("API error");

  return res.json();
}

async function apiPost(url, data) {
  const token = localStorage.getItem("token");

  const res = await fetch(API_BASE + url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  return res.json();
}

async function apiDelete(url) {
  const token = localStorage.getItem("token");

  const res = await fetch(API_BASE + url, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return res.json();
}

/* =====================================================
ROUTER
===================================================== */

menuItems.forEach((item) => {
  item.addEventListener("click", () => {
    document.querySelector(".menu li.active")?.classList.remove("active");
    item.classList.add("active");

    const route = item.dataset.route;
    pageTitle.textContent = item.textContent.trim();

    loadPage(route);
  });
});

async function loadPage(route) {
  try {
    switch (route) {
      case "overview":
        await loadOverview();
        break;

      case "products":
        await loadProducts();
        break;

      case "orders":
        await loadOrders();
        break;

      case "tracking":
        await loadTracking();
        break;

      case "wishlist":
        await loadWishlist();
        break;

      case "messages":
        await loadNotifications();
        break;

      case "wallet":
        loadWallet();
        break;

      case "profile":
        loadProfile();
        break;
    }
  } catch (err) {
    content.innerHTML = `<p>⚠️ Failed to load page</p>`;
    console.error(err);
  }
}

/* =====================================================
PRODUCTS
===================================================== */

async function loadProducts() {
  const res = await apiGet("/api/products");

  if (!res.success) return;

  const products = res.data;

  let html = `
  <div class="products-grid">
  `;

  products.forEach((p) => {
    html += `
    <div class="product-card">

      <img src="${p.images?.[0]?.url || "https://picsum.photos/300"}">

      <h3>${p.title}</h3>

      <p>${p.description}</p>

      <p>Stock: ${p.quantity}</p>

      <h4>${p.price} FCFA</h4>

      <button class="btn-cart" data-id="${p._id}">
      Add To Cart
      </button>

      <button class="btn-wishlist" data-id="${p._id}">
      Wishlist
      </button>

    </div>
    `;
  });

  html += `</div>`;

  content.innerHTML = html;
}

/* =====================================================
CART
===================================================== */

async function addToCart(productId) {
  const res = await apiPost("/api/cart", { productId, quantity: 1 });

  if (res.success) {
    updateCartCount();
    alert("Added to cart");
  }
}

async function updateCartCount() {
  const res = await apiGet("/api/cart");

  if (res.success) {
    cartCount.textContent = res.data.items.length();
  }
}

/* =====================================================
WISHLIST
===================================================== */

async function addWishlist(productId) {
  const res = await apiPost("/api/wishlist", { productId });

  if (res.success) {
    alert("Added to wishlist");
  }
}

async function loadWishlist() {
  const res = await apiGet("/api/wishlist");

  if (!res.success) return;

  let html = `<h2>Wishlist</h2><div class="products-grid">`;

  res.data.forEach((p) => {
    html += `
      <div class="product-card">
        <img src="${p.images?.[0]?.url}">
        <h3>${p.title}</h3>
        <h4>${p.price} FCFA</h4>
      </div>
    `;
  });

  html += "</div>";

  content.innerHTML = html;
}

/* =====================================================
ORDERS
===================================================== */

async function loadOrders() {
  const res = await apiGet("/api/orders");

  if (!res.success) return;

  let html = `
  <table class="table">

  <thead>
  <tr>
  <th>ID</th>
  <th>Status</th>
  <th>Total</th>
  </tr>
  </thead>

  <tbody>
  `;

  res.data.forEach((o) => {
    html += `
      <tr>
        <td>${o._id}</td>
        <td>${o.status}</td>
        <td>${o.total} FCFA</td>
      </tr>
    `;
  });

  html += "</tbody></table>";

  content.innerHTML = html;
}

/* =====================================================
TRACKING
===================================================== */

async function loadTracking() {
  const res = await apiGet("/api/orders");

  if (!res.success) return;

  let html = `<h3>Shipment Tracking</h3>`;

  res.data.forEach((o) => {
    html += `
    <p>
    Order ${o._id} → ${o.status}
    </p>
    `;
  });

  content.innerHTML = html;
}

/* =====================================================
NOTIFICATIONS
===================================================== */

async function loadNotifications() {
  const res = await apiGet("/api/notifications");

  if (!res.success) return;

  let html = `<h3>Notifications</h3>`;

  res.data.forEach((n) => {
    html += `
    <div class="card">
    ${n.message}
    </div>
    `;
  });

  content.innerHTML = html;
}

/* =====================================================
OVERVIEW DASHBOARD
===================================================== */

async function loadOverview() {
  const res = await apiGet("/api/orders");

  if (!res.success) return;

  const orders = res.data;

  content.innerHTML = `
  <div class="card">
  <h3>Total Orders</h3>
  <p>${orders.length}</p>
  </div>

  <div class="card">
  <canvas id="buyerOrderChart"></canvas>
  </div>
  `;

  const ctx = document.getElementById("buyerOrderChart");

  if (orderChart) orderChart.destroy();

  orderChart = new Chart(ctx, {
    type: "line",
    data: {
      labels: ["Jan","Feb","Mar","Apr","May"],
      datasets: [
        {
          label: "Orders",
          data: [2,5,3,6,4],
          borderColor: "#2563eb",
        },
      ],
    },
  });
}

/* =====================================================
PROFILE
===================================================== */

function loadProfile() {
  content.innerHTML = `
  <div class="card">

  <h3>Profile</h3>

  <input placeholder="Company name">

  <input placeholder="Location">

  <button class="btn-primary">Save</button>

  </div>
  `;
}

/* =====================================================
WALLET
===================================================== */

function loadWallet() {
  content.innerHTML = `
  <div class="card">

  <h3>Wallet</h3>

  <p>Balance: 0 FCFA</p>

  <button>Top Up</button>

  </div>
  `;
}

/* =====================================================
EVENT DELEGATION
===================================================== */

document.addEventListener("click", (e) => {
  if (e.target.classList.contains("btn-cart")) {
    addToCart(e.target.dataset.id);
  }

  if (e.target.classList.contains("btn-wishlist")) {
    addWishlist(e.target.dataset.id);
  }
});

/* =====================================================
LOGOUT
===================================================== */

document.getElementById("logoutBtn").onclick = () => {
  localStorage.removeItem("token");
  location.href = "/component/auth.html";
  alert("logout successful");
};

/* =====================================================
INIT
===================================================== */

updateCartCount();

loadPage("products");