// ==================== AGRI CONNECT X - PROFESSIONAL FARMER DASHBOARD ====================

const API_BASE = window.location.hostname === "127.0.0.1" 
    ? "http://localhost:5500" 
    : "https://agriconnectx.onrender.com";

let currentUser = null;

// ====================== API HELPER ======================
async function apiRequest(method, url, body = null) {
    const token = localStorage.getItem("token");
    if (!token) {
        console.warn("No token found - Redirecting to login");
        location.href = '/component/auth.html';
        return null;
    }

    const res = await fetch(`${API_BASE}${url}`, {
        method,
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
        },
        credentials: "include",
        body: body ? JSON.stringify(body) : null
    });

    if (!res.ok) {
        if (res.status === 401) {
            console.warn("Token expired or invalid");
            localStorage.removeItem("token");
            location.href = '/component/auth.html';
            return null;
        }
        throw new Error(`HTTP ${res.status}`);
    }
    return res.json();
}

async function apiGet(url) { return apiRequest("GET", url); }
async function apiPost(url, body) { return apiRequest("POST", url, body); }

// ====================== LOAD CURRENT USER ======================
async function loadCurrentUser() {
    const token = localStorage.getItem("token");
    if (!token) {
        location.href = '/component/auth.html';
        return null;
    }

    try {
        const res = await apiGet("/api/auth/me");     // Note: you used /api/auth/me in your route

        currentUser = res.user || res.data || res;

        if (!currentUser || !currentUser.role) {
            throw new Error("Invalid user data from /api/me");
        }

        // Update topbar
        document.getElementById("farmerName").textContent = 
            currentUser.name || 
            `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim() || 
            currentUser.farmName || "Farmer";

        document.getElementById("farmerLocation").textContent = 
            currentUser.location || currentUser.farmLocation || "Centre Region, CM";

        console.log("✅ Farmer loaded successfully:", currentUser.role);
        return currentUser;
    } catch (err) {
        console.error("❌ loadCurrentUser failed:", err);
        
        if (err.message.includes("401") || String(err).includes("Unauthorized")) {
            localStorage.removeItem("token");
            location.href = '/component/auth.html';
        } else {
            document.getElementById("appContent").innerHTML = `
                <div class="card" style="text-align:center; color:orange; padding:30px;">
                    <h3>Failed to load dashboard</h3>
                    <p>Could not connect to server. Please try again.</p>
                    <button onclick="location.reload()">Retry</button>
                </div>`;
        }
        return null;
    }
}

// ====================== MENU SETUP ======================
function setupMenu() {
    document.querySelectorAll(".menu li").forEach(item => {
        item.addEventListener("click", () => {
            document.querySelectorAll(".menu li").forEach(li => li.classList.remove("active"));
            item.classList.add("active");
            
            const route = item.dataset.route;
            document.getElementById("pageTitle").textContent = item.textContent.trim();
            loadPage(route);
        });
    });
}

// ====================== MAIN PAGE LOADER ======================
async function loadPage(route) {
    const content = document.getElementById("appContent");
    content.innerHTML = `<div class="loading">Loading ${route}...</div>`;

    if (!currentUser) {
        content.innerHTML = `<p style="color:red;">Session expired. <a href="/component/auth.html">Login again</a>.</p>`;
        return;
    }

    switch (route) {

        case "overview":
            content.innerHTML = `
                <div class="cards grid-4">
                    <div class="card"><h3>Total Sales</h3><p id="totalSales" class="big">0 FCFA</p></div>
                    <div class="card"><h3>Active Orders</h3><p id="activeOrders" class="big">0</p></div>
                    <div class="card"><h3>Available Stock</h3><p id="stockCount" class="big">0</p></div>
                    <div class="card"><h3>Pending Payment</h3><p id="pendingPayment" class="big">0 FCFA</p></div>
                </div>
                <div class="row">
                    <div class="card half"><h3>Sales Trend (Last 6 Months)</h3><canvas id="salesChart"></canvas></div>
                    <div class="card half"><h3>Top Products</h3><canvas id="productChart"></canvas></div>
                </div>
                <div class="card">
                    <h3>Recent Orders</h3>
                    <table class="table"><tbody id="recentOrders"></tbody></table>
                </div>
            `;

            try {
                const [productsRes, ordersRes] = await Promise.all([
                    apiGet("/api/products"),
                    apiGet("/api/order")
                ]);

                document.getElementById("stockCount").textContent = productsRes.data?.length || 0;
                document.getElementById("activeOrders").textContent = 
                    (ordersRes.data || []).filter(o => o.status !== "Delivered").length;
                document.getElementById("totalSales").textContent = 
                    (ordersRes.data || []).reduce((sum, o) => sum + (o.amount || 0), 0) + " FCFA";

                // Sales Trend Chart
                new Chart(document.getElementById("salesChart"), {
                    type: "line",
                    data: {
                        labels: ["Jan","Feb","Mar","Apr","May","Jun"],
                        datasets: [{ 
                            label: "Sales (FCFA)", 
                            data: [320000,480000,650000,520000,890000,1250000], 
                            borderColor: "#16a34a", 
                            tension: 0.4 
                        }]
                    }
                });

                // Product Distribution Chart
                new Chart(document.getElementById("productChart"), {
                    type: "doughnut",
                    data: {
                        labels: (productsRes.data || []).slice(0,5).map(p => p.title || "Product"),
                        datasets: [{ 
                            data: (productsRes.data || []).slice(0,5).map(p => p.quantity), 
                            backgroundColor: ["#15803d","#4ade80","#eab308","#f97316","#ef4444"] 
                        }]
                    }
                });

                // Recent Orders
                document.getElementById("recentOrders").innerHTML = 
                    (ordersRes.data || []).slice(0,5).map(o => `
                        <tr>
                            <td>#${o._id?.slice(-6) || 'N/A'}</td>
                            <td>${o.buyer?.name || "Customer"}</td>
                            <td>${o.status || "Pending"}</td>
                            <td>${o.amount || 0} FCFA</td>
                        </tr>
                    `).join("");
            } catch (err) {
                console.error(err);
                content.innerHTML += `<p style="color:orange;">Some data could not be loaded</p>`;
            }
            break;

      case "inventory":
    content.innerHTML = `
        <div class="action-bar">
            <button class="btn btn-primary" onclick="showAddProductForm()">+ Add New Produce</button>
        </div>
        
        <!-- Clean Add Product Form -->
        <div id="addProductForm" class="add-product-form" style="display:none;">
            <h3>Add New Farm Produce</h3>
            
            <div class="form-group">
                <label>Product Title <span class="required">*</span></label>
                <input type="text" id="productTitle" placeholder="e.g. Yellow Maize, Fresh Tomatoes" required>
            </div>
            
            <div class="form-row">
                <div class="form-group">
                    <label>Quantity <span class="required">*</span></label>
                    <input type="number" id="productQty" placeholder="100" min="1" required>
                </div>
                <div class="form-group">
                    <label>Unit</label>
                    <select id="productUnit">
                        <option value="kg">Kilograms (kg)</option>
                        <option value="bag">Bags</option>
                        <option value="piece">Pieces</option>
                        <option value="crate">Crates</option>
                    </select>
                </div>
            </div>
            
            <div class="form-group">
                <label>Price per unit (FCFA) <span class="required">*</span></label>
                <input type="number" id="productPrice" placeholder="450" min="1" required>
            </div>
            
            <div class="form-group">
                <label>Category</label>
                <select id="productCategory">
                    <option value="grains">Grains & Cereals</option>
                    <option value="tubers">Tubers (Cassava, Yam)</option>
                    <option value="vegetables">Vegetables</option>
                    <option value="fruits">Fruits</option>
                    <option value="legumes">Legumes & Beans</option>
                </select>
            </div>
            
            <div class="form-group">
                <label>Description</label>
                <textarea id="productDescription" rows="3" placeholder="Short description of the produce (optional)"></textarea>
            </div>
            
            <div class="form-group">
                <label>Upload Image (optional)</label>
                <input type="file" id="productImage" accept="image/*">
                <small>Recommended: Clear photo of the produce (JPG/PNG, max 5MB)</small>
            </div>
            
            <div class="form-actions">
                <button class="btn btn-primary" onclick="addProduct()">Save Product</button>
                <button class="btn btn-secondary" onclick="hideAddProductForm()">Cancel</button>
            </div>
        </div>

        <!-- Inventory Table -->
        <div class="inventory-section">
            <h3>My Farm Produce</h3>
            <table class="table" id="inventoryTable">
                <thead>
                    <tr>
                        <th>Product</th>
                        <th>Quantity</th>
                        <th>Price</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody></tbody>
            </table>
        </div>
    `;
    loadInventory();
    break;
    content.innerHTML = `
        <div class="action-bar">
            <button class="btn btn-primary" onclick="showAddProductForm()">+ Add New Product</button>
        </div>
        
        <div id="addProductForm" class="card" style="display:none;">
            <h3>Add New Farm Produce</h3>
            
            <div class="form-group">
                <label>Product Title *</label>
                <input type="text" id="productTitle" placeholder="e.g. Yellow Maize, Fresh Tomatoes" required>
            </div>
            
            <div class="form-row">
                <div class="form-group half">
                    <label>Quantity *</label>
                    <input type="number" id="productQty" placeholder="100" min="1" required>
                </div>
                <div class="form-group half">
                    <label>Unit</label>
                    <select id="productUnit">
                        <option value="kg">kg</option>
                        <option value="bag">bag</option>
                        <option value="piece">piece</option>
                        <option value="crate">crate</option>
                    </select>
                </div>
            </div>
            
            <div class="form-group">
                <label>Price per unit (FCFA) *</label>
                <input type="number" id="productPrice" placeholder="450" min="1" required>
            </div>
            
            <div class="form-group">
                <label>Category</label>
                <select id="productCategory">
                    <option value="grains">Grains & Cereals</option>
                    <option value="tubers">Tubers</option>
                    <option value="vegetables">Vegetables</option>
                    <option value="fruits">Fruits</option>
                </select>
            </div>
            
            <div class="form-group">
                <label>Description</label>
                <textarea id="productDescription" rows="3" placeholder="Brief description..."></textarea>
            </div>
            
            <!-- Image Upload -->
            <div class="form-group">
                <label>Upload Product Image</label>
                <input type="file" id="productImage" accept="image/*">
                <small style="display:block; margin-top:5px; color:#666;">Recommended: JPG or PNG, max 5MB</small>
            </div>
            
            <button class="btn btn-primary" onclick="addProduct()">Save Product</button>
            <button class="btn" onclick="hideAddProductForm()">Cancel</button>
        </div>

        <table class="table">
            <thead><tr><th>Product</th><th>Quantity</th><th>Price</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody id="inventoryTable"></tbody>
        </table>
    `;
    loadInventory();
    break;
    content.innerHTML = `
        <div class="action-bar">
            <button class="btn btn-primary" onclick="showAddProductForm()">+ Add New Product</button>
        </div>
        
        <div id="addProductForm" class="card" style="display:none;">
            <h3>Add New Farm Produce</h3>
            
            <div class="form-group">
                <label>Product Title *</label>
                <input type="text" id="productTitle" placeholder="e.g. Yellow Maize, Fresh Cassava" required>
            </div>
            
            <div class="form-row">
                <div class="form-group half">
                    <label>Quantity *</label>
                    <input type="number" id="productQty" placeholder="100" min="1" required>
                </div>
                <div class="form-group half">
                    <label>Unit</label>
                    <select id="productUnit">
                        <option value="kg">kg</option>
                        <option value="bag">bag</option>
                        <option value="piece">piece</option>
                    </select>
                </div>
            </div>
            
            <div class="form-group">
                <label>Price per unit (FCFA) *</label>
                <input type="number" id="productPrice" placeholder="450" min="1" required>
            </div>
            
            <button class="btn btn-primary" onclick="addProduct()">Save Product</button>
            <button class="btn" onclick="hideAddProductForm()">Cancel</button>
        </div>

        <table class="table">
            <thead><tr><th>Product</th><th>Quantity</th><th>Price</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody id="inventoryTable"></tbody>
        </table>
    `;
    loadInventory();
    break;
//    content.innerHTML = `
//         <div class="action-bar">
//             <button class="btn btn-primary" onclick="showAddProductForm()">+ Add New Product</button>
//         </div>
//         <div id="addProductForm" class="card" style="display:none;">
//             <h3>Add New Farm Produce</h3>
            
//             <div class="form-group">
//                 <label>Product Title</label>
//                 <input type="text" id="productTitle" placeholder="e.g. Yellow Maize, Fresh Cassava" required>
//             </div>
            
//             <div class="form-row">
//                 <div class="form-group half">
//                     <label>Quantity</label>
//                     <input type="number" id="productQty" placeholder="100" required>
//                 </div>
//                 <div class="form-group half">
//                     <label>Unit</label>
//                     <select id="productUnit">
//                         <option value="kg">Kilograms (kg)</option>
//                         <option value="bag">Bags</option>
//                         <option value="piece">Pieces</option>
//                         <option value="crate">Crates</option>
//                     </select>
//                 </div>
//             </div>
            
//             <div class="form-group">
//                 <label>Price per unit (FCFA)</label>
//                 <input type="number" id="productPrice" placeholder="450" required>
//             </div>
            
//             <div class="form-group">
//                 <label>Category</label>
//                 <select id="productCategory">
//                     <option value="grains">Grains & Cereals</option>
//                     <option value="tubers">Tubers (Cassava, Yam)</option>
//                     <option value="vegetables">Vegetables</option>
//                     <option value="fruits">Fruits</option>
//                     <option value="legumes">Legumes & Beans</option>
//                 </select>
//             </div>
            
//             <div class="form-group">
//                 <label>Description</label>
//                 <textarea id="productDescription" rows="3" placeholder="Brief description of the produce..."></textarea>
//             </div>
            
//             <button class="btn btn-primary" onclick="addProduct()">Save Product</button>
//             <button class="btn" onclick="hideAddProductForm()">Cancel</button>
//         </div>

//         <table class="table">
//             <thead><tr><th>Product</th><th>Quantity</th><th>Price</th><th>Status</th><th>Actions</th></tr></thead>
//             <tbody id="inventoryTable"></tbody>
//         </table>
//     `;
//     loadInventory();
//     break;
        case "orders":
            content.innerHTML = `
                <h2>Incoming Orders</h2>
                <table class="table">
                    <thead><tr><th>Order ID</th><th>Buyer</th><th>Product</th><th>Qty</th><th>Amount</th><th>Status</th><th>Action</th></tr></thead>
                    <tbody id="ordersTable"></tbody>
                </table>
            `;
            loadOrders();
            break;

        case "wallet":
            content.innerHTML = `
                <div class="card">
                    <h3>Available Balance</h3>
                    <p id="balance" class="balance-amount">248,750 FCFA</p>
                    <button class="btn btn-success" onclick="initiateWithdraw()">Withdraw to Mobile Money</button>
                </div>
                <div class="card">
                    <h3>Recent Transactions</h3>
                    <table class="table"><tbody id="transactionTable"></tbody></table>
                </div>
            `;
            break;

        case "analytics":
            content.innerHTML = `<div class="card"><h3>Sales Analytics</h3><canvas id="analyticsChart" height="120"></canvas></div>`;
            setTimeout(() => {
                new Chart(document.getElementById("analyticsChart"), {
                    type: "bar",
                    data: {
                        labels: ["Maize","Cassava","Beans","Groundnut","Plantain"],
                        datasets: [{ label: "Revenue", data: [450000,320000,180000,250000,210000], backgroundColor: "#16a34a" }]
                    }
                });
            }, 300);
            break;

        case "advisory":
            content.innerHTML = `
                <div class="card">
                    <h3>Weather & Crop Advisory - Centre Region</h3>
                    <p><strong>Today:</strong> 28°C • Light Rain • Good for planting maize</p>
                    <p><strong>Tip:</strong> Apply fertilizer on your cassava field this week.</p>
                </div>
            `;
            break;

        case "messages":
            content.innerHTML = `<div class="card"><h3>Messages from Buyers</h3><p>No new messages yet.</p></div>`;
            break;

        case "profile":
            content.innerHTML = `
                <div class="card">
                    <h3>Farm Profile</h3>
                    <input type="text" id="farmName" placeholder="Farm Name" value="${currentUser?.farmName || ''}">
                    <input type="text" id="location" placeholder="Location" value="${currentUser?.location || ''}">
                    <button class="btn btn-primary" onclick="saveProfile()">Update Profile</button>
                </div>
            `;
            break;

        default:
            content.innerHTML = `<div class="card"><h3>Page Under Construction</h3></div>`;
    }
}

// ====================== INVENTORY FUNCTIONS ======================
// Replace your current loadInventory() with this
async function loadInventory() {
    try {
        console.log("🔄 Fetching products for farmer inventory...");
        
        // For testing, let's call the endpoint and see exactly what comes back
        const res = await apiGet("/api/products");
        
        console.log("✅ Full response from /api/products:", res);
        console.log("📦 Products array:", res.data);

        const tbody = document.getElementById("inventoryTable");
        if (!tbody) return;

        const products = res.data || [];

        if (products.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" style="text-align:center; padding:40px; color:#666;">
                        No products found yet.<br>
                        <small>Check that products have isActive: true and isVerified: true</small>
                    </td>
                </tr>`;
            return;
        }

        tbody.innerHTML = products.map(p => `
            <tr>
                <td>${p.title || 'Untitled Product'}</td>
                <td>${p.quantity || 0} ${p.unit || ''}</td>
                <td>${p.price || 0} FCFA</td>
                <td><span class="status available">${p.isActive ? "Available" : "Inactive"}</span></td>
                <td>
                    <button onclick="editProduct('${p._id}')">Edit</button>
                    <button onclick="deleteProduct('${p._id}')">Delete</button>
                </td>
            </tr>
        `).join("");

    } catch (err) {
        console.error("❌ Load Inventory Error:", err);
        const tbody = document.getElementById("inventoryTable");
        if (tbody) {
            tbody.innerHTML = `<tr><td colspan="5" style="color:red; text-align:center;">Failed to load products. Check console.</td></tr>`;
        }
    }
}
function showAddProductForm() {
    const form = document.getElementById("addProductForm");
    if (form) form.style.display = "block";
}

function hideAddProductForm() {
    const form = document.getElementById("addProductForm");
    if (form) form.style.display = "none";
}
// Replace your current addProduct() with this
// Updated addProduct() with image upload
async function addProduct() {
    const title = document.getElementById("productTitle").value.trim();
    const quantity = parseFloat(document.getElementById("productQty").value);
    const price = parseFloat(document.getElementById("productPrice").value);
    const description = document.getElementById("productDescription").value.trim() || `${title} - Fresh farm produce`;
    const unit = document.getElementById("productUnit").value;
    const category = document.getElementById("productCategory").value;
    const imageFile = document.getElementById("productImage").files[0];

    if (!title) return alert("Product Title is required!");
    if (!quantity || quantity <= 0) return alert("Valid Quantity is required!");
    if (!price || price <= 0) return alert("Valid Price is required!");

    try {
        const formData = new FormData();
        formData.append("title", title);
        formData.append("description", description);
        formData.append("price", price);
        formData.append("quantity", quantity);
        formData.append("unit", unit);
        formData.append("category", category);
        formData.append("currency", "XAF");
        formData.append("isActive", "true");
        formData.append("isVerified", "true");

        if (imageFile) {
            formData.append("images", imageFile);   // Important: name must match backend
        }

        console.log("Uploading product with image...");

        const res = await fetch(`${API_BASE}/api/products`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`
            },
            credentials: "include",
            body: formData
        });

        const result = await res.json();

        if (result.success) {
            alert("✅ Product added successfully with image!");
            hideAddProductForm();
            loadInventory();
        } else {
            alert("Failed: " + (result.message || "Unknown error"));
        }
    } catch (err) {
        console.error("Upload error:", err);
        alert("Error uploading product: " + (err.message || "Please check console"));
    }
}
// Helper functions
function showAddProductForm() {
    document.getElementById("addProductForm").style.display = "block";
}

function hideAddProductForm() {
    document.getElementById("addProductForm").style.display = "none";
}
// ====================== ORDERS ======================
async function loadOrders() {
    try {
        const res = await apiGet("/api/order");
        const tbody = document.getElementById("ordersTable");
        tbody.innerHTML = (res.data || []).map(o => `
            <tr>
                <td>#${o._id?.slice(-6) || 'N/A'}</td>
                <td>${o.buyer?.name || "Unknown"}</td>
                <td>${o.items?.[0]?.name || "Product"}</td>
                <td>${o.quantity || 1}</td>
                <td>${o.amount} FCFA</td>
                <td><span class="status ${o.status?.toLowerCase() || 'pending'}">${o.status || "Pending"}</span></td>
                <td><button onclick="updateOrderStatus('${o._id}')">Update Status</button></td>
            </tr>
        `).join("");
    } catch (err) {
        console.error(err);
    }
}

// Placeholder functions
function editProduct(id) { alert(`Edit product ${id} - Coming soon`); }
function deleteProduct(id) { if(confirm("Delete this product?")) alert(`Product ${id} deleted`); }
function updateOrderStatus(id) { alert(`Update status for order ${id}`); }
function saveProfile() { alert("✅ Farm profile updated!"); }
function initiateWithdraw() { alert("Withdrawal request initiated."); }

// ====================== LOGOUT ======================
document.getElementById("logoutBtn").addEventListener("click", () => {
    localStorage.removeItem("token");
    location.href = '/component/auth.html';
    alert("✅ Logged out successfully");
});

// ====================== INITIALIZE ======================
async function initFarmerDashboard() {
    console.log("🚀 Initializing Farmer Dashboard...");
    
    const user = await loadCurrentUser();
    if (!user) return;

    setupMenu();
    loadPage("overview");
}

initFarmerDashboard();