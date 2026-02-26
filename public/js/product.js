// public/js/product.js
import { apiGet } from './api.js';

function escapeHtml(s='') {
  return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

export async function renderProduct(id, containerId='productCard') {
  const container = document.getElementById(containerId);
  container.innerHTML = '<div class="card">Loading product…</div>';
  try {
    const res = await apiGet(`/products/${id}`);
    const p = res.data;
    const html = `
      <div class="card">
        <div class="header-row">
          <h2>${escapeHtml(p.title || p.name)}</h2>
          <div class="small">Price: ${escapeHtml(String(p.price || p.basePrice || '—'))} ${escapeHtml(p.currency || '')}</div>
        </div>
        <div class="small">Seller: ${escapeHtml(p.seller?.farmName || p.seller?.firstName || '—')}</div>
        <p>${escapeHtml(p.description || '')}</p>
        <div class="small">Location: ${escapeHtml(p.location?.region || '—')}</div>
        <div class="footer-note">Contact seller to negotiate price via Messages.</div>
      </div>
    `;
    container.innerHTML = html;
  } catch (err) {
    container.innerHTML = `<div class="card">Failed to load product</div>`;
    console.error(err);
  }
}
