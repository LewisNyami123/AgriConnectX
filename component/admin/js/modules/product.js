// modules/products.js
import { apiGet } from "./api.js";

export async function renderProducts() {
  const res = await apiGet("/api/analytics/products");
  const appContent = document.getElementById("appContent");

  if (!res.success) {
    appContent.innerHTML = "<p>Failed to load product analytics</p>";
    return;
  }

  const data = res.data;
  appContent.innerHTML = `
    <h2>Product Analytics</h2>
    <p>Total Products: ${data.totalProducts}</p>
    <h3>Top Products</h3>
    <ul>
      ${data.topProducts.map(p => `<li>${p.name} - Revenue: $${p.revenue}</li>`).join('')}
    </ul>
  `;
}