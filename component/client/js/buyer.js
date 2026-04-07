// ==================== AGRI CONNECT X - PROFESSIONAL BUYER DASHBOARD ====================

const API_BASE = (window.location.hostname === "127.0.0.1" || window.location.hostname === "localhost")
    ? "http://localhost:5500"
    : "https://agriconnectx.onrender.com";

let currentUser = null;
let cart = [];                    // Local cart for better UX (can sync with backend later)

// ====================== API HELPERS ======================
async function apiRequest(method, url, body = null) {
    const token = localStorage.getItem("token");
    if (!token) {
        location.href = '/component/auth.html';
        return;
    }

    const options = {
        method: method,
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
        },
        credentials: "include"
    };

    if (body) options.body = JSON.stringify(body);

    const res = await fetch(API_BASE + url, options);

    if (!res.ok) {
        if (res.status === 401) {
            localStorage.removeItem("token");
            location.href = '/component/auth.html';
        }
        throw new Error(`API Error: ${res.status}`);
    }
    return res.json();
}

async function apiGet(url) { return apiRequest("GET", url); }
async function apiPost(url, body) { return apiRequest("POST", url, body); }

// ====================== LOAD CURRENT USER ======================
async function loadCurrentUser() {
    try {
        const res = await apiGet("/api/me");
        currentUser = res.data || res;
        document.getElementById("buyerName").textContent = currentUser.name || "Buyer";
    } catch (err) {
        console.error("Failed to load user", err);
        location.href = '/component/auth.html';
    }
}

// ====================== NAVIGATION ======================
function setupNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');

            const route = link.dataset.route;
            document.getElementById("pageTitle").textContent = link.textContent.trim();
            loadPage(route);
        });
    });

    // Live search
    const searchInput = document.getElementById("searchInput");
    searchInput.addEventListener("input", debounce((e) => {
        if (document.querySelector('.nav-link.active').dataset.route === "marketplace") {
            loadMarketplace(e.target.value);
        }
    }, 300));
}

// Simple debounce helper
function debounce(func, delay) {
    let timeout;
    return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), delay);
    };
}

// ====================== MAIN PAGE LOADER ======================
async function loadPage(route) {
    const content = document.getElementById("appContent");
    content.innerHTML = `<div class="loading"><i class="fas fa-spinner fa-spin"></i><p>Loading ${route}...</p></div>`;

    switch (route) {

        case "marketplace":
            content.innerHTML = `
                <div class="filters">
                    <select id="categoryFilter" onchange="loadMarketplace(document.getElementById('searchInput').value)">
                        <option value="">All Categories</option>
                        <option value="grains">Grains & Cereals</option>
                        <option value="tubers">Tubers (Cassava, Yam)</option>
                        <option value="vegetables">Vegetables</option>
                        <option value="fruits">Fruits</option>
                        <option value="legumes">Legumes & Beans</option>
                    </select>
                </div>
                <div id="productGrid" class="product-grid"></div>
            `;
            loadMarketplace();
            break;

        case "orders":
            content.innerHTML = `
                <h2>My Orders</h2>
                <table class="table">
                    <thead>
                        <tr><th>Order ID</th><th>Farmer</th><th>Items</th><th>Total</th><th>Status</th><th>Date</th></tr>
                    </thead>
                    <tbody id="ordersTable"></tbody>
                </table>
            `;
            loadBuyerOrders();
            break;

        case "wishlist":
            content.innerHTML = `
                <h2>My Wishlist</h2>
                <div id="wishlistGrid" class="product-grid"></div>
            `;
            loadWishlist();
            break;

        case "messages":
            content.innerHTML = `
                <div class="card">
                    <h3>Messages from Farmers</h3>
                    <p>No new messages at the moment.</p>
                </div>
            `;
            break;

        case "profile":
            content.innerHTML = `
                <div class="card">
                    <h3>Buyer Profile</h3>
                    <input type="text" id="buyerFullName" placeholder="Full Name" value="${currentUser?.name || ''}">
                    <input type="text" id="buyerLocation" placeholder="Delivery Location" value="${currentUser?.location || ''}">
                    <input type="tel" placeholder="Phone Number">
                    <button class="btn-primary" onclick="saveBuyerProfile()">Save Changes</button>
                </div>
            `;
            break;

        default:
            content.innerHTML = `<div class="card"><h3>Feature coming soon...</h3></div>`;
    }
}

// ====================== MARKETPLACE ======================
async function loadMarketplace(searchTerm = "") {
    try {
        const res = await apiGet("/api/products");
        let products = res.data || [];

        if (searchTerm) {
            products = products.filter(p => 
                p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                p.description?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        const grid = document.getElementById("productGrid");
        if (!grid) return;

        grid.innerHTML = products.map(p => `
            <div class="product-card">
                <div class="product-image">
                    <img src="${p.images?.[0]?.url || p.image || 'https://picsum.photos/300/200?random=' + p._id}" 
                         alt="${p.name || p.title}">
                </div>
                <h4>${p.name || p.title}</h4>
                <p class="price">${p.price} FCFA</p>
                <p class="stock">${p.quantity} available</p>
                <div class="product-actions">
                    <button class="btn-cart" onclick="addToCart('${p._id}', '${p.name || p.title}', ${p.price})">
                        Add to Cart
                    </button>
                    <button class="btn-wishlist" onclick="addToWishlist('${p._id}')">❤️</button>
                </div>
            </div>
        `).join("");
    } catch (err) {
        console.error("Failed to load marketplace", err);
    }
}

// ====================== CART ======================
function addToCart(productId, name, price) {
    const existing = cart.find(item => item.productId === productId);
    if (existing) {
        existing.quantity += 1;
    } else {
        cart.push({ productId, name, price, quantity: 1 });
    }

    updateCartCount();
    // Optional: show toast
    showToast(`✅ ${name} added to cart`);
}

function updateCartCount() {
    const countEl = document.getElementById("cartCount");
    if (countEl) countEl.textContent = cart.reduce((sum, item) => sum + item.quantity, 0);
}

function showCart() {
    if (cart.length === 0) {
        alert("Your cart is empty!");
        return;
    }

    let total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    let message = "Your Cart:\n\n";

    cart.forEach(item => {
        message += `${item.name} × ${item.quantity} = ${item.price * item.quantity} FCFA\n`;
    });

    message += `\nTotal: ${total} FCFA\n\nProceed to checkout?`;

    if (confirm(message)) {
        alert("🎉 Order placed successfully! (Full checkout coming soon)");
        cart = [];
        updateCartCount();
    }
}

// Make showCart available globally for onclick in HTML
window.showCart = showCart;

// ====================== WISHLIST ======================
async function addToWishlist(productId) {
    try {
        await apiPost("/api/wishlist", { productId });
        showToast("❤️ Added to wishlist");
    } catch (err) {
        alert("Failed to add to wishlist");
    }
}

async function loadWishlist() {
    try {
        const res = await apiGet("/api/wishlist");
        const grid = document.getElementById("wishlistGrid");

        if (!res.data || res.data.length === 0) {
            grid.innerHTML = "<p>Your wishlist is empty.</p>";
            return;
        }

        grid.innerHTML = res.data.map(p => `
            <div class="product-card">
                <img src="${p.images?.[0]?.url || 'https://picsum.photos/300'}">
                <h4>${p.name || p.title}</h4>
                <p>${p.price} FCFA</p>
            </div>
        `).join("");
    } catch (err) {
        console.error(err);
    }
}

// ====================== ORDERS ======================
async function loadBuyerOrders() {
    try {
        const res = await apiGet("/api/orders");   // or /api/order depending on your backend
        const tbody = document.getElementById("ordersTable");

        if (!res.data || res.data.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6">No orders yet.</td></tr>`;
            return;
        }

        tbody.innerHTML = res.data.map(o => `
            <tr>
                <td>#${o._id.slice(-8)}</td>
                <td>${o.seller?.name || "Local Farmer"}</td>
                <td>${o.items ? o.items.map(i => i.name).join(", ") : "Products"}</td>
                <td>${o.total || o.amount} FCFA</td>
                <td><span class="status ${o.status?.toLowerCase() || 'pending'}">${o.status || "Pending"}</span></td>
                <td>${new Date(o.createdAt || Date.now()).toLocaleDateString()}</td>
            </tr>
        `).join("");
    } catch (err) {
        console.error("Failed to load orders", err);
    }
}

// ====================== PROFILE ======================
function saveBuyerProfile() {
    const name = document.getElementById("buyerFullName").value;
    const location = document.getElementById("buyerLocation").value;

    alert(`✅ Profile updated!\nName: ${name}\nLocation: ${location}`);
    // Later: send to backend with apiPut("/api/profile", { name, location })
}

// ====================== UTILITIES ======================
function showToast(message) {
    const toast = document.createElement("div");
    toast.style.cssText = `
        position: fixed; bottom: 20px; right: 20px; background: #16a34a; color: white;
        padding: 12px 20px; border-radius: 8px; z-index: 10000; box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    `;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => toast.remove(), 3000);
}

// ====================== LOGOUT ======================
document.getElementById("logoutBtn").addEventListener("click", () => {
    localStorage.removeItem("token");
    location.href = "/component/auth.html";
});

// ====================== INITIALIZATION ======================
async function initBuyerDashboard() {
    await loadCurrentUser();
    setupNavigation();
    updateCartCount();

    // Start on Marketplace (as per your HTML default)
    document.querySelector('[data-route="marketplace"]').classList.add("active");
    loadPage("marketplace");
}

initBuyerDashboard();

// Make some functions globally available for inline onclick
window.addToCart = addToCart;
window.addToWishlist = addToWishlist;
window.showCart = showCart;
window.loadMarketplace = loadMarketplace;
window.saveBuyerProfile = saveBuyerProfile;