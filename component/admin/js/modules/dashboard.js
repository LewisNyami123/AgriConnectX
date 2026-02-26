export function renderDashboard(container){
    container.innerHTML = `
        <div class="cards">
            <div class="card">
                <h3>Total Farmers</h3>
                <h2 id="totalFarmers">Loading...</h2>
            </div>
            <div class="card">
                <h3>Total Buyers</h3>
                <h2 id="totalBuyers">Loading...</h2>
            </div>
            <div class="card">
                <h3>Active Orders</h3>
                <h2 id="activeOrders">Loading...</h2>
            </div>
        </div>
    `;
}