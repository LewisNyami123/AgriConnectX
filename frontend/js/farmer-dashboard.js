// Farmer Dashboard JavaScript

// DOM Elements
const farmerName = document.getElementById('farmerName');
const productsCount = document.getElementById('productsCount');
const salesCount = document.getElementById('salesCount');
const earnings = document.getElementById('earnings');
const rating = document.getElementById('rating');
const productsList = document.getElementById('productsList');
const ordersList = document.getElementById('ordersList');
const notificationsList = document.getElementById('notificationsList');
const notificationCount = document.getElementById('notificationCount');
const addProductBtn = document.getElementById('addProductBtn');
const productModal = document.getElementById('productModal');
const productForm = document.getElementById('productForm');
const productModalTitle = document.getElementById('productModalTitle');
const logoutBtn = document.getElementById('logoutBtn');
const profileBtn = document.getElementById('profileBtn');

let currentUser = null;
let editingProduct = null;

// Initialize dashboard
document.addEventListener('DOMContentLoaded', function() {
    // Check authentication
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/login.html';
        return;
    }
    
    currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    
    if (currentUser.role !== 'farmer') {
        // Redirect if not a farmer
        window.location.href = `/${currentUser.role}-dashboard.html`;
        return;
    }
    
    // Set farmer name
    farmerName.textContent = currentUser.firstName;
    
    // Load dashboard data
    loadDashboardStats();
    loadProducts();
    loadRecentOrders();
    loadNotifications();
});

// Load dashboard statistics
async function loadDashboardStats() {
    try {
        const token = localStorage.getItem('token');
        
        // Load products count
        const productsResponse = await fetch('/api/products', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        const productsData = await productsResponse.json();
        if (productsResponse.ok) {
            productsCount.textContent = productsData.count;
        }
        
        // Load transactions for sales stats
        const transactionsResponse = await fetch('/api/transactions/my-transactions', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        const transactionsData = await transactionsResponse.json();
        if (transactionsResponse.ok) {
            // Calculate sales stats
            let totalSales = 0;
            let totalEarnings = 0;
            
            transactionsData.data.forEach(transaction => {
                if (transaction.seller.toString() === currentUser._id) {
                    totalSales += transaction.products.reduce((sum, product) => sum + product.quantity, 0);
                    totalEarnings += transaction.totalAmount;
                }
            });
            
            salesCount.textContent = totalSales;
            earnings.textContent = `FCFA ${totalEarnings.toLocaleString()}`;
        }
        
        // Calculate average rating
        // This would typically come from the user profile
        rating.textContent = currentUser.ratings ? currentUser.ratings.average.toFixed(1) : '0.0';
    } catch (error) {
        console.error('Error loading dashboard stats:', error);
    }
}

// Load farmer's products
async function loadProducts() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/products', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        const data = await response.json();
        
        if (response.ok) {
            displayProducts(data.data);
        }
    } catch (error) {
        console.error('Error loading products:', error);
    }
}

// Display products in the list
function displayProducts(products) {
    productsList.innerHTML = '';
    
    if (products.length === 0) {
        productsList.innerHTML = '<p class="no-products">No products found. Add your first product!</p>';
        return;
    }
    
    products.forEach(product => {
        const productElement = document.createElement('div');
        productElement.className = 'product-item';
        productElement.innerHTML = `
            <div class="product-info">
                <h4>${product.name}</h4>
                <p class="product-category">${product.category.replace('_', ' ')}</p>
                <p class="product-price">FCFA ${product.basePrice.toLocaleString()} per ${product.unit}</p>
                <p class="product-stock">Stock: ${product.quantityAvailable} ${product.unit}${product.quantityAvailable > 1 ? 's' : ''}</p>
            </div>
            <div class="product-actions">
                <button class="btn btn-outline edit-product" data-product='${JSON.stringify(product)}'>
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-danger delete-product" data-id="${product._id}">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        
        productsList.appendChild(productElement);
    });
    
    // Add event listeners for edit and delete buttons
    document.querySelectorAll('.edit-product').forEach(button => {
        button.addEventListener('click', function() {
            const product = JSON.parse(this.getAttribute('data-product'));
            openEditProductModal(product);
        });
    });
    
    document.querySelectorAll('.delete-product').forEach(button => {
        button.addEventListener('click', function() {
            const productId = this.getAttribute('data-id');
            deleteProduct(productId);
        });
    });
}

// Open add/edit product modal
function openEditProductModal(product = null) {
    editingProduct = product;
    
    if (product) {
        // Edit mode
        productModalTitle.textContent = 'Edit Product';
        document.getElementById('productName').value = product.name;
        document.getElementById('productDescription').value = product.description;
        document.getElementById('productCategory').value = product.category;
        document.getElementById('productUnit').value = product.unit;
        document.getElementById('productPrice').value = product.basePrice;
        document.getElementById('productQuantity').value = product.quantityAvailable;
        document.getElementById('productQuality').value = product.qualityGrade || 'standard';
    } else {
        // Add mode
        productModalTitle.textContent = 'Add New Product';
        document.getElementById('productName').value = '';
        document.getElementById('productDescription').value = '';
        document.getElementById('productCategory').value = '';
        document.getElementById('productUnit').value = 'kg';
        document.getElementById('productPrice').value = '';
        document.getElementById('productQuantity').value = '';
        document.getElementById('productQuality').value = 'standard';
    }
    
    productModal.style.display = 'block';
}

// Load recent orders
async function loadRecentOrders() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/transactions/my-transactions', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        const data = await response.json();
        
        if (response.ok) {
            displayRecentOrders(data.data.slice(0, 5)); // Show last 5 orders
        }
    } catch (error) {
        console.error('Error loading recent orders:', error);
    }
}

// Display recent orders
function displayRecentOrders(orders) {
    ordersList.innerHTML = '';
    
    if (orders.length === 0) {
        ordersList.innerHTML = '<p class="no-orders">No recent orders.</p>';
        return;
    }
    
    orders.forEach(order => {
        if (order.seller.toString() !== currentUser._id) return; // Only show orders where user is seller
        
        const orderElement = document.createElement('div');
        orderElement.className = 'order-item';
        orderElement.innerHTML = `
            <div class="order-info">
                <h4>Order #${order.transactionId.substring(0, 8)}</h4>
                <p class="order-buyer">Buyer: ${order.buyer.firstName} ${order.buyer.lastName}</p>
                <p class="order-date">${new Date(order.createdAt).toLocaleDateString()}</p>
                <p class="order-total">Total: FCFA ${order.totalAmount.toLocaleString()}</p>
                <p class="order-status status-${order.paymentStatus}">${order.paymentStatus}</p>
            </div>
        `;
        
        ordersList.appendChild(orderElement);
    });
}

// Load notifications
async function loadNotifications() {
    try {
        // For demo purposes, showing static notifications
        const notifications = [
            { id: 1, message: 'Your account has been approved by admin', date: new Date(), read: false },
            { id: 2, message: 'New order received for tomatoes', date: new Date(Date.now() - 86400000), read: true },
            { id: 3, message: 'Weather advisory: Expect rain tomorrow', date: new Date(Date.now() - 172800000), read: true }
        ];
        
        displayNotifications(notifications);
    } catch (error) {
        console.error('Error loading notifications:', error);
    }
}

// Display notifications
function displayNotifications(notifications) {
    notificationsList.innerHTML = '';
    
    if (notifications.length === 0) {
        notificationsList.innerHTML = '<p class="no-notifications">No notifications.</p>';
        notificationCount.textContent = '0';
        return;
    }
    
    // Count unread notifications
    const unreadCount = notifications.filter(n => !n.read).length;
    notificationCount.textContent = unreadCount;
    
    notifications.forEach(notification => {
        const notificationElement = document.createElement('div');
        notificationElement.className = `notification-item ${!notification.read ? 'unread' : ''}`;
        notificationElement.innerHTML = `
            <div class="notification-content">
                <p>${notification.message}</p>
                <span class="notification-date">${new Date(notification.date).toLocaleDateString()}</span>
            </div>
        `;
        
        notificationsList.appendChild(notificationElement);
    });
}

// Delete product
async function deleteProduct(productId) {
    if (!confirm('Are you sure you want to delete this product?')) {
        return;
    }
    
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/products/${productId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            // Reload products
            loadProducts();
            loadDashboardStats();
        } else {
            alert('Failed to delete product');
        }
    } catch (error) {
        console.error('Error deleting product:', error);
        alert('An error occurred while deleting the product');
    }
}

// Submit product form
productForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const productData = {
        name: document.getElementById('productName').value,
        description: document.getElementById('productDescription').value,
        category: document.getElementById('productCategory').value,
        unit: document.getElementById('productUnit').value,
        basePrice: parseFloat(document.getElementById('productPrice').value),
        quantityAvailable: parseInt(document.getElementById('productQuantity').value),
        qualityGrade: document.getElementById('productQuality').value
    };
    
    try {
        const token = localStorage.getItem('token');
        
        if (editingProduct) {
            // Update existing product
            const response = await fetch(`/api/products/${editingProduct._id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(productData)
            });
            
            if (response.ok) {
                alert('Product updated successfully!');
                productModal.style.display = 'none';
                loadProducts();
                loadDashboardStats();
            } else {
                alert('Failed to update product');
            }
        } else {
            // Create new product
            const response = await fetch('/api/products', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(productData)
            });
            
            if (response.ok) {
                alert('Product added successfully!');
                productModal.style.display = 'none';
                loadProducts();
                loadDashboardStats();
            } else {
                alert('Failed to add product');
            }
        }
    } catch (error) {
        console.error('Error submitting product:', error);
        alert('An error occurred while saving the product');
    }
});

// Event listeners
addProductBtn.addEventListener('click', () => {
    openEditProductModal();
});

// Modal close button
document.querySelector('.close').addEventListener('click', function() {
    productModal.style.display = 'none';
});

// Close modal when clicking outside
window.addEventListener('click', function(event) {
    if (event.target === productModal) {
        productModal.style.display = 'none';
    }
});

// Logout functionality
logoutBtn.addEventListener('click', function(e) {
    e.preventDefault();
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/';
});

// Profile button functionality
profileBtn.addEventListener('click', function(e) {
    e.preventDefault();
    window.location.href = '/profile.html';
});

// Mobile menu toggle
document.querySelector('.mobile-menu-btn').addEventListener('click', function() {
    const nav = document.querySelector('.nav ul');
    nav.style.display = nav.style.display === 'flex' ? 'none' : 'flex';
});