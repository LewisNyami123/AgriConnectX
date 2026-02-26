// public/js/products.js
import { apiGet } from './api.js';

function escapeHtml(s='') {
  return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

export async function renderProducts(containerId = 'app', page = 1) {
  const container = document.getElementById(containerId);
  container.innerHTML = '<div class="card">Loading products…</div>';
  try {
    const res = await apiGet(`/products?page=${page}&limit=12`);
    const html = `
      <div class="header-row">
        <h2>Products</h2>
        <div class="small">Total: ${res.total || res.count || 0}</div>
      </div>
      <div class="grid">
        ${res.data.map(p => `
          <div class="card">
            <div class="product-title">${escapeHtml(p.title || p.name)}</div>
            <div class="small">Seller: ${escapeHtml(p.seller?.farmName || p.seller?.firstName || '—')}</div>
            <div class="small">Price: ${escapeHtml(String(p.price || p.basePrice || '—'))} ${escapeHtml(p.currency || '')}</div>
            <a class="btn" href="/product.html?id=${p._id}">View</a>
          </div>`).join('')}
      </div>
    `;
    container.innerHTML = html;
  } catch (err) {
    container.innerHTML = `<div class="card">Failed to load products</div>`;
    console.error(err);
  }
}
