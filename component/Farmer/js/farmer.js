const menuItems = document.querySelectorAll(".menu li");
const content = document.getElementById("appContent");
const pageTitle = document.getElementById("pageTitle");

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
function loadPage(route) {
  switch(route) {

    case "overview":
  content.innerHTML = `
    <div class="cards">
      <div class="card">
        <h3>Total Sales</h3>
        <p>3,200,000 FCFA</p>
      </div>
      <div class="card">
        <h3>Active Orders</h3>
        <p>12</p>
      </div>
      <div class="card">
        <h3>Available Stock</h3>
        <p>5 Tons</p>
      </div>
    </div>

    <div class="card">
      <h3>Sales Trend</h3>
      <canvas id="farmerSalesChart"></canvas>
    </div>

    <div class="card">
      <h3>Product Distribution</h3>
      <canvas id="farmerProductChart"></canvas>
    </div>
  `;

  setTimeout(() => {
    new Chart(document.getElementById("farmerSalesChart"), {
      type: "bar",
      data: {
        labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
        datasets: [{
          label: "Sales",
          data: [400000, 600000, 500000, 700000, 800000, 900000],
          backgroundColor: "#16a34a"
        }]
      }
    });

    new Chart(document.getElementById("farmerProductChart"), {
      type: "pie",
      data: {
        labels: ["Cocoa", "Cassava", "Maize"],
        datasets: [{
          data: [40, 30, 30],
          backgroundColor: ["#15803d", "#65a30d", "#ca8a04"]
        }]
      }
    });
  }, 100);
break;

    case "inventory":
      content.innerHTML = `
        <button class="btn btn-primary" onclick="addProduct()">+ Add Product</button>

        <table class="table">
          <thead>
            <tr>
              <th>Product</th>
              <th>Quantity</th>
              <th>Price</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody id="inventoryTable"></tbody>
        </table>
      `;
    break;

    case "orders":
      content.innerHTML = `
        <table class="table">
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Buyer</th>
              <th>Status</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody id="ordersTable"></tbody>
        </table>
      `;
    break;

    case "wallet":
      content.innerHTML = `
        <div class="card">
          <h3>Available Balance</h3>
          <p id="walletBalance">0 FCFA</p>
          <button class="btn btn-primary">Withdraw</button>
        </div>
      `;
    break;

    case "advisory":
      content.innerHTML = `
        <div class="card">
          <h3>Weather Forecast</h3>
          <p>Loading weather data...</p>
        </div>
        <div class="card">
          <h3>Pest Alerts</h3>
          <p>No current threats.</p>
        </div>
      `;
    break;

    case "messages":
      content.innerHTML = `
        <div class="card">
          <h3>Inbox</h3>
          <p>No new messages</p>
        </div>
      `;
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

/* Default Load */
loadPage("overview");