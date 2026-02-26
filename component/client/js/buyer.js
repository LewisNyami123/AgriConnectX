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
        <h3>Total Orders</h3>
        <p>56</p>
      </div>
      <div class="card">
        <h3>Pending Deliveries</h3>
        <p>8</p>
      </div>
      <div class="card">
        <h3>Wallet Balance</h3>
        <p>1,200,000 FCFA</p>
      </div>
    </div>

    <div class="card">
      <h3>Order History</h3>
      <canvas id="buyerOrderChart"></canvas>
    </div>

    <div class="card">
      <h3>Spending Breakdown</h3>
      <canvas id="buyerSpendingChart"></canvas>
    </div>
  `;

  setTimeout(() => {
    new Chart(document.getElementById("buyerOrderChart"), {
      type: "line",
      data: {
        labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
        datasets: [{
          label: "Orders",
          data: [5, 8, 10, 7, 12, 14],
          borderColor: "#2563eb",
          fill: true
        }]
      }
    });

    new Chart(document.getElementById("buyerSpendingChart"), {
      type: "doughnut",
      data: {
        labels: ["Cocoa", "Vegetables", "Grains"],
        datasets: [{
          data: [500000, 300000, 400000],
          backgroundColor: ["#1d4ed8", "#16a34a", "#f59e0b"]
        }]
      }
    });
  }, 100);
break;

    case "products":
      content.innerHTML = `
        <div class="card">
          <h3>Search Products</h3>
          <input type="text" placeholder="Search by product name">
          <select>
            <option>All Regions</option>
            <option>North</option>
            <option>West</option>
            <option>South</option>
          </select>
          <button class="btn btn-primary">Search</button>
        </div>

        <table class="table">
          <thead>
            <tr>
              <th>Product</th>
              <th>Farmer</th>
              <th>Price</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody id="productTable"></tbody>
        </table>
      `;
    break;

    case "orders":
      content.innerHTML = `
        <table class="table">
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Product</th>
              <th>Status</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody id="ordersTable"></tbody>
        </table>
      `;
    break;

    case "bids":
      content.innerHTML = `
        <div class="card">
          <h3>Create Bulk Request</h3>
          <input type="text" placeholder="Product Name">
          <input type="number" placeholder="Quantity">
          <button class="btn btn-primary">Submit Request</button>
        </div>
      `;
    break;

    case "tracking":
      content.innerHTML = `
        <div class="card">
          <h3>Live Shipment Tracking</h3>
          <p>Tracking data will appear here.</p>
        </div>
      `;
    break;

    case "wallet":
      content.innerHTML = `
        <div class="card">
          <h3>Wallet Balance</h3>
          <p>0 FCFA</p>
          <button class="btn btn-primary">Top Up</button>
        </div>
      `;
    break;

    case "messages":
      content.innerHTML = `
        <div class="card">
          <h3>Messages</h3>
          <p>No new messages</p>
        </div>
      `;
    break;

    case "profile":
      content.innerHTML = `
        <div class="card">
          <h3>Profile Settings</h3>
          <input type="text" placeholder="Company Name">
          <input type="text" placeholder="Location">
          <button class="btn btn-primary">Save</button>
        </div>
      `;
    break;
  }
}

/* Default Load */
loadPage("overview");