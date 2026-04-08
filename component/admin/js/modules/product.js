// modules/products.js
import { apiGet } from "./api.js";

export async function renderProducts(){

  const appContent = document.getElementById("appContent");

  const res = await apiGet("/api/products");

  if(!res.success){
    appContent.innerHTML = "<p>Failed to load products</p>";
    return;
  }

  const products = res.data;

  const topProducts = [...products]
  .sort((a,b)=> (b.revenue || 0) - (a.revenue || 0))
  .slice(0,5);

  appContent.innerHTML = `

  <div class="page-header">

    <h2>Products</h2>

    <button class="btn-primary" id="addProductBtn">
      <i class="fas fa-plus"></i> Add Product
    </button>

  </div>

  <div class="stats-row">

    <div class="stat-card">
      <h3>${products.length}</h3>
      <p>Total Products</p>
    </div>

  </div>


  <div class="table-container">

    <table class="data-table">

      <thead>
        <tr>
          <th>Name</th>
          <th>Category</th>
          <th>Price</th>
          <th>Revenue</th>
        </tr>
      </thead>

      <tbody>

        ${products.map(p => `
          
          <tr>

            <td>${p.title}</td>

            <td>${p.category}</td>

            <td>$${p.price}</td>

            <td>$${p.revenue || 0}</td>

          </tr>

        `).join("")}

      </tbody>

    </table>

  </div>


  <div class="top-products">

    <h3>Top Performing Products</h3>

    <ul>

      ${topProducts.map(p => `
        <li>
          ${p.title} — $${p.price || 0}
        </li>
      `).join("")}

    </ul>

  </div>

  `;

  document
  .getElementById("addProductBtn")
  .addEventListener("click", openAddProductModal);

}



function openAddProductModal(){

  const modal = `

  <div class="modal" id="productModal">

    <div class="modal-content">

      <div class="modal-header">

        <h3>Add Product</h3>

        <button class="close" id="closeProductModal">
          &times;
        </button>

      </div>

      <form id="addProductForm" enctype="multipart/form-data">

        <input type="text" name="name" placeholder="Product Name" required>

        <input type="text" name="category" placeholder="Category" required>

        <input type="number" name="price" placeholder="Price" required>

        <textarea name="description" placeholder="Description"></textarea>

        <input type="file" name="image">

        <button class="btn-primary full-btn">
          Add Product
        </button>

      </form>

    </div>

  </div>

  `;

  document.getElementById("addProductForm")?.addEventListener("submit", async (e)=>{
  e.preventDefault();
  const formData = new FormData(e.target);
  const res = await fetch("/api/products", {
    method: "POST",
    body: formData
  });
  const data = await res.json();
  if(data.success){
    alert("Product added!");
    document.getElementById("productModal").remove();
    renderProducts();
  } else {
    alert(data.message || "Failed to add product");
  }
});

}