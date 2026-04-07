// ==================== AGRI CONNECT X - BUYER DASHBOARD v2 ====================

const API_BASE = (window.location.hostname === "127.0.0.1" || window.location.hostname === "localhost")
    ? "http://localhost:5500"
    : "https://agriconnectx.onrender.com";

let currentUser = null;
let cart = [];

// ====================== API HELPERS ======================
async function apiRequest(method, url, body = null) {
    const token = localStorage.getItem("token");
    if (!token) {
        location.href = '/component/auth.html';
        return null;
    }

    const options = {
        method,
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        credentials: "include"
    };
    if (body) options.body = JSON.stringify(body);

    const res = await fetch(API_BASE + url, options);
    if (!res.ok) {
        if (res.status === 401) {
            localStorage.removeItem("token");
            location.href = '/component/auth.html';
            return null;
        }
        throw new Error(`API Error: ${res.status}`);
    }
    return res.json();
}

async function apiGet(url) { return apiRequest("GET", url); }
async function apiPost(url, body) { return apiRequest("POST", url, body); }

// ====================== LOAD USER ======================
async function loadCurrentUser() {
    try {
        const res = await apiGet("/api/auth/me");
        currentUser = res.user || res.data || res;
        document.getElementById("buyerName").textContent = currentUser.name || "Buyer";
        return currentUser;
    } catch (err) {
        console.error(err);
        location.href = '/component/auth.html';
        return null;
    }
}

// ====================== NAVIGATION ======================
function setupNavigation() {
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
            link.classList.add('active');

            const route = link.dataset.route;
            document.getElementById("pageTitle").textContent = link.textContent.trim();
            loadPage(route);
        });
    });

    document.getElementById("searchInput").addEventListener("input", debounce((e) => {
        if (document.querySelector('.nav-link.active').dataset.route === "marketplace") {
            loadMarketplace(e.target.value);
        }
    }, 300));
}

function debounce(func, delay) {
    let timeout;
    return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), delay);
    };
}

// ====================== PAGE LOADER ======================
async function loadPage(route) {
    const content = document.getElementById("appContent");
    content.innerHTML = `<div class="loading"><i class="fas fa-spinner fa-spin"></i><p>Loading...</p></div>`;

    if (!currentUser) return;

    switch (route) {
        case "marketplace":
            content.innerHTML = `
                <div class="filters">
                    <select id="categoryFilter" onchange="loadMarketplace(document.getElementById('searchInput').value)">
                        <option value="">All Categories</option>
                        <option value="grains">Grains & Cereals</option>
                        <option value="tubers">Tubers</option>
                        <option value="vegetables">Vegetables</option>
                        <option value="fruits">Fruits</option>
                    </select>
                </div>
                <div id="productGrid" class="product-grid"></div>
            `;
            loadMarketplace();
            break;

        case "orders":
            content.innerHTML = `<h2>My Orders</h2><div id="ordersTable" class="card">Loading orders...</div>`;
            loadBuyerOrders();
            break;

        case "wishlist":
            content.innerHTML = `<h2>My Wishlist</h2><div id="wishlistGrid" class="product-grid"></div>`;
            loadWishlist();
            break;

        default:
            content.innerHTML = `<div class="card"><h3>Coming Soon</h3></div>`;
    }
}

// ====================== MARKETPLACE ======================
async function loadMarketplace(searchTerm = "") {
    try {
        const res = await apiGet("/api/products");
        let products = res.data || [];

        if (searchTerm) {
            products = products.filter(p => 
                (p.title || p.name || "").toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        const grid = document.getElementById("productGrid");
        if (!grid) return;

        if (products.length === 0) {
            grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:80px;color:#666;">
                <h3>No products yet</h3>
                <p>Farmers are adding fresh produce. Check back soon!</p>
            </div>`;
            return;
        }

        grid.innerHTML = products.map(p => {
            const imgUrl = p.images && p.images.length ? (p.images[0].url || p.images[0]) : 'https://picsum.photos/300/220?random=' + p._id;
            return `
                <div class="product-card">
                    <div class="product-image">
                        <img src="${imgUrl}" alt="${p.title}">
                    </div>
                    <h4>${p.title}</h4>
                    <p class="price">${p.price} FCFA</p>
                    <p class="stock">${p.quantity} available</p>
                    <p class="seller">by ${p.seller?.farmName || 'Farmer'}</p>
                    <div class="product-actions">
                        <button class="btn-cart" onclick="addToCart('${p._id}', '${p.title}', ${p.price})">Add to Cart</button>
                        <button class="btn-view" onclick="viewProductDetail('${p._id}')">View Details</button>
                    </div>
                </div>
            `;
        }).join("");
    } catch (err) {
        console.error(err);
    }
}

// ====================== PRODUCT DETAIL MODAL ======================
let currentProduct = null;

function viewProductDetail(productId) {
    // For now we simulate - later fetch full details
    // In real app, you can call apiGet(`/api/products/${productId}`)

    currentProduct = { _id: productId }; // placeholder

    const modalHTML = `
        <div id="productModal" class="modal">
            <div class="modal-content">
                <span class="close-modal" onclick="closeModal()">×</span>
                <div class="modal-body">
                    <div class="modal-image">
                        <img src="https://picsum.photos/600/400?random=${productId}" alt="Product">
                    </div>
                    <div class="modal-info">
                        <h2>Product Details</h2>
                        <p><strong>Price:</strong> <span id="modalPrice">--- FCFA</span></p>
                        <p><strong>Stock:</strong> <span id="modalStock">---</span></p>
                        <p><strong>Seller:</strong> Local Farmer</p>
                        
                        <div class="quantity-selector">
                            <button onclick="changeQuantity(-1)">-</button>
                            <span id="modalQty">1</span>
                            <button onclick="changeQuantity(1)">+</button>
                        </div>

                        <button class="btn-cart big" onclick="addCurrentToCart()">Add to Cart</button>
                    </div>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

function closeModal() {
    const modal = document.getElementById("productModal");
    if (modal) modal.remove();
}

let modalQuantity = 1;

function changeQuantity(amount) {
    modalQuantity = Math.max(1, modalQuantity + amount);
    document.getElementById("modalQty").textContent = modalQuantity;
}

function addCurrentToCart() {
    if (!currentProduct) return;
    addToCart(currentProduct._id, "Selected Product", 1500); // placeholder price
    closeModal();
}

// ====================== CART SYSTEM (Improved) ======================
function addToCart(productId, name, price) {
    const existing = cart.find(item => item.productId === productId);
    if (existing) {
        existing.quantity += 1;
    } else {
        cart.push({ productId, name, price, quantity: 1 });
    }
    updateCartCount();
    showToast(`✅ ${name} added to cart`);
}

function updateCartCount() {
    const countEl = document.getElementById("cartCount");
    if (countEl) countEl.textContent = cart.reduce((sum, i) => sum + i.quantity, 0);
}

function showCart() {
    if (cart.length === 0) {
        alert("Your cart is empty!");
        return;
    }

    let total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

    let html = `<h2>Your Cart</h2><div class="cart-items">`;
    cart.forEach((item, index) => {
        html += `
            <div class="cart-item">
                <span>${item.name}</span>
                <span>${item.quantity} × ${item.price} FCFA</span>
                <button onclick="removeFromCart(${index})">Remove</button>
            </div>`;
    });
    html += `</div><h3>Total: ${total} FCFA</h3><button onclick="checkout()" class="btn-cart big">Proceed to Checkout</button>`;

    const modal = document.createElement("div");
    modal.className = "modal";
    modal.innerHTML = `<div class="modal-content">${html}<span class="close-modal" onclick="this.parentElement.parentElement.remove()">×</span></div>`;
    document.body.appendChild(modal);
}

function removeFromCart(index) {
    cart.splice(index, 1);
    showCart();
    updateCartCount();
}

function checkout() {
    alert("🎉 Thank you! Your order has been placed.\n\n(This is a demo - full checkout coming soon)");
    cart = [];
    updateCartCount();
    document.querySelectorAll('.modal').forEach(m => m.remove());
}

// ====================== UTILITIES ======================
function showToast(message) {
    const toast = document.createElement("div");
    toast.className = "toast";
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

// ====================== LOGOUT ======================
document.getElementById("logoutBtn").addEventListener("click", () => {
    if (confirm("Logout?")) {
        localStorage.removeItem("token");
        location.href = "/component/auth.html";
    }
});

// ====================== INIT ======================
async function initBuyerDashboard() {
    await loadCurrentUser();
    setupNavigation();
    updateCartCount();
    document.querySelector('[data-route="marketplace"]').classList.add("active");
    loadPage("marketplace");
}

initBuyerDashboard();

// Global functions
window.addToCart = addToCart;
window.viewProductDetail = viewProductDetail;
window.closeModal = closeModal;
window.changeQuantity = changeQuantity;
window.addCurrentToCart = addCurrentToCart;
window.showCart = showCart;
window.removeFromCart = removeFromCart;
window.checkout = checkout;