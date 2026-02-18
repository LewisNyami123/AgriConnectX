// Buyer Dashboard JavaScript

// DOM Elements
const buyerName = document.getElementById('buyerName');
const ordersCount = document.getElementById('ordersCount');
const itemsCount = document.getElementById('itemsCount');
const spent = document.getElementById('spent');
const rating = document.getElementById('rating');
const ordersList = document.getElementById('ordersList');
const favoritesList = document.getElementById('favoritesList');
const notificationsList = document.getElementById('notificationsList');
const notificationCount = document.getElementById('notificationCount');
const logoutBtn = document.getElementById('logoutBtn');
const profileBtn = document.getElementById('profileBtn');

let currentUser = null;

// Initialize dashboard
document.addEventListener('DOMContentLoaded', function() {
    // Check authentication
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/login.html';
        return;
    }
    
    currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    
    if (currentUser.role !== 'buyer') {
        // Redirect if not a buyer
        window.location.href = `/${currentUser.role}-dashboard.html`;
        return;
    }
    
    // Set buyer name
    buyerName.textContent = currentUser.firstName;
    
    // Load dashboard data
    loadDashboardStats();
    loadRecentOrders();
    loadFavorites();
    loadNotifications();
});

// Load dashboard statistics
async function loadDashboardStats() {
    try {
        const token = localStorage.getItem('token');
        
        // Load transactions for purchase stats
        const transactionsResponse = await fetch('/api/transactions/my-transactions', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        const transactionsData = await transactionsResponse.json();
        
        if (transactionsResponse.ok) {
            let totalOrders = 0;
            let totalItems = 0;
            let totalSpent = 0;
            
            transactionsData.data.forEach(transaction => {
                if (transaction.buyer.toString() === currentUser._id) {
                    totalOrders++;
                    totalItems += transaction.products.reduce((sum, product) => sum + product.quantity, 0);
                    totalSpent += transaction.totalAmount;
                }
            });
            
            ordersCount.textContent = totalOrders;
            itemsCount.textContent = totalItems;
            spent.textContent = `FCFA ${totalSpent.toLocaleString()}`;
        }
        
        // Calculate average rating
        rating.textContent = currentUser.ratings ? currentUser.ratings.average.toFixed(1) : '0.0';
    } catch (error) {
        console.error('Error loading dashboard stats:', error);
    }
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
        if (order.buyer.toString() !== currentUser._id) return; // Only show orders where user is buyer
        
        const orderElement = document.createElement('div');
        orderElement.className = 'order-item';
        orderElement.innerHTML = `
            <div class="order-info">
                <h4>Order #${order.transactionId.substring(0, 8)}</h4>
                <p class="order-seller">From: ${order.seller.farmName || order.seller.firstName}</p>
                <p class="order-date">${new Date(order.createdAt).toLocaleDateString()}</p>
                <p class="order-total">Total: FCFA ${order.totalAmount.toLocaleString()}</p>
                <p class="order-status status-${order.paymentStatus}">${order.paymentStatus}</p>
            </div>
        `;
        
        ordersList.appendChild(orderElement);
    });
}

// Load favorite products (simulated for now)
async function loadFavorites() {
    try {
        // For demo purposes, showing some sample favorites
        const favorites = [
            { _id: '1', name: 'Fresh Tomatoes', price: 350, unit: 'kg', category: 'vegetables', seller: 'John Doe Farm' },
            { _id: '2', name: 'Bananas', price: 250, unit: 'bunch', category: 'fruits', seller: 'Green Valley Farm' },
            { _id: '3', name: 'Rice', price: 1200, unit: 'kg', category: 'grains', seller: 'Golden Fields Farm' }
        ];
        
        displayFavorites(favorites);
    } catch (error) {
        console.error('Error loading favorites:', error);
    }
}

// Display favorite products
function displayFavorites(favorites) {
    favoritesList.innerHTML = '';
    
    if (favorites.length === 0) {
        favoritesList.innerHTML = '<p class="no-favorites">No favorite products.</p>';
        return;
    }
    
    favorites.forEach(product => {
        const productElement = document.createElement('div');
        productElement.className = 'favorite-item';
        productElement.innerHTML = `
            <div class="favorite-info">
                <h4>${product.name}</h4>
                <p class="favorite-seller">By ${product.seller}</p>
                <p class="favorite-price">FCFA ${product.price.toLocaleString()} per ${product.unit}</p>
            </div>
            <div class="favorite-actions">
                <button class="btn btn-primary buy-again" data-id="${product._id}">
                    Buy Again
                </button>
            </div>
        `;
        
        favoritesList.appendChild(productElement);
    });
    
    // Add event listeners for buy again buttons
    document.querySelectorAll('.buy-again').forEach(button => {
        button.addEventListener('click', function() {
            const productId = this.getAttribute('data-id');
            // Redirect to product detail page
            window.location.href = `/product.html?id=${productId}`;
        });
    });
}

// Load notifications
async function loadNotifications() {
    try {
        // For demo purposes, showing static notifications
        const notifications = [
            { id: 1, message: 'Order #TXN12345 delivered successfully', date: new Date(), read: false },
            { id: 2, message: 'New products available from your favorite seller', date: new Date(Date.now() - 86400000), read: true },
            { id: 3, message: 'Special discount on rice and grains this week', date: new Date(Date.now() - 172800000), read: true }
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