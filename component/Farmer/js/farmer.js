const menuItems = document.querySelectorAll(".menu li");
const content = document.getElementById("appContent");
const pageTitle = document.getElementById("pageTitle");

/* API Helper */
const API_BASE =  window.location.hostname === "localhost"
    ? "http://localhost:5500"
    : "https://agriconnectx.onrender.com";
;

async function apiGet(url) {
  const token = localStorage.getItem("token");
  const res = await fetch(`${API_BASE}${url}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

async function apiPost(url, body) {
  const token = localStorage.getItem("token");
  const res = await fetch(`${API_BASE}${url}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(body)
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

/* ROUTER */
menuItems.forEach(item => {
  item.addEventListener("click", () => {
    document.querySelector(".menu li.active")?.classList.remove("active");
    item.classList.add("active");
    const route = item.dataset.route;
    pageTitle.textContent = item.textContent.trim();
    loadPage(route);
  });
});

/* PAGE LOADER */
async function loadPage(route) {
  switch(route) {
    case "overview":
      content.innerHTML = `
        <div class="cards">
          <div class="card"><h3>Total Sales</h3><p id="totalSales">Loading...</p></div>
          <div class="card"><h3>Active Orders</h3><p id="activeOrders">Loading...</p></div>
          <div class="card"><h3>Available Stock</h3><p id="availableStock">Loading...</p></div>
        </div>
        <div class="card"><h3>Sales Trend</h3><canvas id="farmerSalesChart"></canvas></div>
        <div class="card"><h3>Product Distribution</h3><canvas id="farmerProductChart"></canvas></div>
      `;
      try {
        const res = await apiGet("/api/products");
        document.getElementById("availableStock").textContent = `${res.data.length} Products`;
        // Example: active orders
        const orders = await apiGet("/api/orders/farmer/me");
        document.getElementById("activeOrders").textContent = orders.data.length;
        document.getElementById("totalSales").textContent = orders.data.reduce((sum,o)=>sum+o.amount,0) + " FCFA";

        // Charts
        setTimeout(() => {
          new Chart(document.getElementById("farmerSalesChart"), {
            type: "bar",
            data: {
              labels: ["Jan","Feb","Mar","Apr","May","Jun"],
              datasets: [{ label:"Sales", data:[400000,600000,500000,700000,800000,900000], backgroundColor:"#16a34a" }]
            }
          });
          new Chart(document.getElementById("farmerProductChart"), {
            type: "pie",
            data: {
              labels: res.data.map(p=>p.name),
              datasets: [{ data: res.data.map(p=>p.quantity), backgroundColor:["#15803d","#65a30d","#ca8a04","#2563eb","#dc2626"] }]
            }
          });
        },100);
      } catch(err) {
        content.innerHTML += `<p style="color:red;">Error loading overview: ${err.message}</p>`;
      }
    break;

    case "inventory":
      content.innerHTML = `
        <button class="btn btn-primary" onclick="showAddProductForm()">+ Add Product</button>
        <div id="addProductForm" style="display:none;" class="card">
          <h3>Add New Product</h3>
          <input type="text" id="productName" placeholder="Product Name">
          <input type="number" id="productQty" placeholder="Quantity">
          <input type="number" id="productPrice" placeholder="Price">
          <button class="btn btn-primary" onclick="addProduct()">Save</button>
        </div>
        <table class="table">
          <thead><tr><th>Product</th><th>Quantity</th><th>Price</th><th>Status</th></tr></thead>
          <tbody id="inventoryTable"></tbody>
        </table>
      `;
      loadInventory();
    break;

    case "orders":
      content.innerHTML = `
        <table class="table">
          <thead><tr><th>Order ID</th><th>Buyer</th><th>Status</th><th>Amount</th></tr></thead>
          <tbody id="ordersTable"></tbody>
        </table>
      `;
      loadOrders();
    break;

    case "wallet":
      content.innerHTML = `
        <div class="card">
          <h3>Available Balance</h3>
          <p id="walletBalance">Loading...</p>
          <button class="btn btn-primary">Withdraw</button>
        </div>
      `;
      // Placeholder until backend wallet route exists
      document.getElementById("walletBalance").textContent = "0 FCFA";
    break;

    case "profile":
      content.innerHTML = `
        <div class="card">
          <h3>Profile Settings</h3>
          <input type="text" placeholder="Farm Name">
          <input type="text" placeholder="Location">
          <button class="btn btn-primary">Save</button>
        </div>
      `;
    break;
  }
}

/* Inventory Functions */
function showAddProductForm() {
  document.getElementById("addProductForm").style.display = "block";
}

async function addProduct() {
  const name = document.getElementById("productName").value;
  const quantity = document.getElementById("productQty").value;
  const price = document.getElementById("productPrice").value;
  try {
    const res = await apiPost("/api/products", { name, quantity, price });
    if (res.success) {
      alert("Product added successfully!");
      loadInventory();
    }
  } catch(err) {
    alert("Error: " + err.message);
  }
}

async function loadInventory() {
  try {
    const res = await apiGet("/api/products");
    const tbody = document.getElementById("inventoryTable");
    tbody.innerHTML = res.data.map(p => `
      <tr>
        <td>${p.name}</td>
        <td>${p.quantity}</td>
        <td>${p.price} FCFA</td>
        <td>${p.status || "Available"}</td>
      </tr>
    `).join("");
  } catch(err) {
    content.innerHTML += `<p style="color:red;">Error loading inventory: ${err.message}</p>`;
  }
}

/* Orders Functions */
async function loadOrders() {
  try {
    const res = await apiGet("/api/orders/farmer/me");
    const tbody = document.getElementById("ordersTable");
    tbody.innerHTML = res.data.map(o => `
      <tr>
        <td>${o._id}</td>
        <td>${o.buyer?.name || "Unknown"}</td>
        <td>${o.status}</td>
        <td>${o.amount} FCFA</td>
      </tr>
    `).join("");
  } catch(err) {
    content.innerHTML += `<p style="color:red;">Error loading orders: ${err.message}</p>`;
  }
}

/* Logout */
document.getElementById("logoutBtn").addEventListener("click", () => {
  localStorage.removeItem("token");
  location.href = '/component/auth.html';
});

/* Default Load */
loadPage("overview");