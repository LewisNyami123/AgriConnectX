// Analytics Dashboard JavaScript

// DOM Elements
const totalSales = document.getElementById('totalSales');
const totalRevenue = document.getElementById('totalRevenue');
const transactionCount = document.getElementById('transactionCount');
const customerCount = document.getElementById('customerCount');
const transactionsList = document.getElementById('transactionsList');
const logoutBtn = document.getElementById('logoutBtn');

let currentUser = null;
let monthlyChart = null;
let topPerformersChart = null;
let categoryChart = null;

// Initialize analytics
document.addEventListener('DOMContentLoaded', function() {
    // Check authentication
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/login.html';
        return;
    }
    
    currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    
    // Load analytics data
    loadAnalyticsData();
    
    // Add event listeners
    addEventListeners();
});

// Load analytics data
async function loadAnalyticsData() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/analytics/user', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        const data = await response.json();
        
        if (response.ok) {
            updateStats(data.data);
            renderCharts(data.data);
            renderRecentTransactions(data.data.recentTransactions || []);
        } else {
            console.error('Error loading analytics:', data.message);
        }
    } catch (error) {
        console.error('Error loading analytics:', error);
    }
}

// Update statistics
function updateStats(analyticsData) {
    if (currentUser.role === 'farmer') {
        totalSales.textContent = analyticsData.totalSales || 0;
        totalRevenue.textContent = `FCFA ${(analyticsData.totalEarnings || 0).toLocaleString()}`;
        transactionCount.textContent = analyticsData.recentTransactions ? analyticsData.recentTransactions.length : 0;
        customerCount.textContent = analyticsData.recentTransactions 
            ? new Set(analyticsData.recentTransactions.map(t => t.buyer._id)).size 
            : 0;
    } else if (currentUser.role === 'buyer') {
        totalSales.textContent = analyticsData.totalPurchases || 0;
        totalRevenue.textContent = `FCFA ${(analyticsData.totalSpent || 0).toLocaleString()}`;
        transactionCount.textContent = analyticsData.transactionCount || 0;
        customerCount.textContent = analyticsData.recentTransactions 
            ? new Set(analyticsData.recentTransactions.map(t => t.seller._id)).size 
            : 0;
    }
}

// Render charts
function renderCharts(analyticsData) {
    // Monthly Performance Chart
    renderMonthlyChart(analyticsData);
    
    // Top Performers Chart
    renderTopPerformersChart(analyticsData);
    
    // Category Distribution Chart
    renderCategoryChart(analyticsData);
}

// Render monthly performance chart
function renderMonthlyChart(analyticsData) {
    const ctx = document.getElementById('monthlyChart').getContext('2d');
    
    if (monthlyChart) {
        monthlyChart.destroy();
    }
    
    let labels = [];
    let data = [];
    
    if (currentUser.role === 'farmer') {
        labels = analyticsData.monthlySales ? analyticsData.monthlySales.map(m => m.month) : [];
        data = analyticsData.monthlySales ? analyticsData.monthlySales.map(m => m.earnings) : [];
    } else if (currentUser.role === 'buyer') {
        labels = analyticsData.monthlyPurchases ? analyticsData.monthlyPurchases.map(m => m.month) : [];
        data = analyticsData.monthlyPurchases ? analyticsData.monthlyPurchases.map(m => m.spent) : [];
    }
    
    monthlyChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: currentUser.role === 'farmer' ? 'Revenue (FCFA)' : 'Spent (FCFA)',
                data: data,
                borderColor: '#2d5016',
                backgroundColor: 'rgba(45, 80, 22, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.3
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

// Render top performers chart
function renderTopPerformersChart(analyticsData) {
    const ctx = document.getElementById('topPerformersChart').getContext('2d');
    
    if (topPerformersChart) {
        topPerformersChart.destroy();
    }
    
    if (currentUser.role === 'farmer' && analyticsData.topProducts) {
        const labels = analyticsData.topProducts.map(p => p.name);
        const data = analyticsData.topProducts.map(p => p.revenue);
        
        topPerformersChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Revenue (FCFA)',
                    data: data,
                    backgroundColor: 'rgba(74, 124, 89, 0.7)',
                    borderColor: 'rgba(74, 124, 89, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    } else if (currentUser.role === 'admin' && analyticsData.topSellers) {
        // Admin-specific chart
        const labels = analyticsData.topSellers.map(s => s.name);
        const data = analyticsData.topSellers.map(s => s.totalSales);
        
        topPerformersChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Total Sales (FCFA)',
                    data: data,
                    backgroundColor: 'rgba(74, 124, 89, 0.7)',
                    borderColor: 'rgba(74, 124, 89, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    } else {
        // Show a placeholder if no data
        document.getElementById('topPerformersChart').parentElement.innerHTML = '<p>No top performer data available</p>';
    }
}

// Render category distribution chart
function renderCategoryChart(analyticsData) {
    const ctx = document.getElementById('categoryChart').getContext('2d');
    
    if (categoryChart) {
        categoryChart.destroy();
    }
    
    if (currentUser.role === 'farmer' && analyticsData.categoryDistribution) {
        const labels = Object.keys(analyticsData.categoryDistribution);
        const data = labels.map(label => analyticsData.categoryDistribution[label].revenue);
        
        categoryChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels.map(label => label.replace('_', ' ')),
                datasets: [{
                    data: data,
                    backgroundColor: [
                        'rgba(45, 80, 22, 0.7)',
                        'rgba(74, 124, 89, 0.7)',
                        'rgba(143, 185, 168, 0.7)',
                        'rgba(248, 249, 250, 0.7)',
                        'rgba(52, 58, 64, 0.7)'
                    ],
                    borderColor: [
                        'rgba(45, 80, 22, 1)',
                        'rgba(74, 124, 89, 1)',
                        'rgba(143, 185, 168, 1)',
                        'rgba(248, 249, 250, 1)',
                        'rgba(52, 58, 64, 1)'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false
            }
        });
    } else {
        // Show a placeholder if no data
        document.getElementById('categoryChart').parentElement.innerHTML = '<p>No category distribution data available</p>';
    }
}

// Render recent transactions
function renderRecentTransactions(transactions) {
    transactionsList.innerHTML = '';
    
    if (transactions.length === 0) {
        transactionsList.innerHTML = '<p class="no-transactions">No recent transactions.</p>';
        return;
    }
    
    transactions.slice(0, 5).forEach(transaction => {
        const transactionElement = document.createElement('div');
        transactionElement.className = 'transaction-item';
        
        let partnerName = '';
        let partnerType = '';
        
        if (currentUser.role === 'farmer') {
            partnerName = `${transaction.buyer.firstName} ${transaction.buyer.lastName}`;
            partnerType = 'Buyer';
        } else if (currentUser.role === 'buyer') {
            partnerName = transaction.seller.farmName || `${transaction.seller.firstName} ${transaction.seller.lastName}`;
            partnerType = 'Seller';
        }
        
        transactionElement.innerHTML = `
            <div class="transaction-info">
                <h4>Order #${transaction.transactionId.substring(0, 8)}</h4>
                <p class="partner">${partnerType}: ${partnerName}</p>
                <p class="transaction-date">${new Date(transaction.createdAt).toLocaleDateString()}</p>
            </div>
            <div class="transaction-amount">
                <p class="amount">FCFA ${transaction.totalAmount.toLocaleString()}</p>
                <p class="status status-${transaction.paymentStatus}">${transaction.paymentStatus}</p>
            </div>
        `;
        
        transactionsList.appendChild(transactionElement);
    });
}

// Add event listeners
function addEventListeners() {
    // Logout functionality
    logoutBtn.addEventListener('click', function(e) {
        e.preventDefault();
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/';
    });
    
    // Mobile menu toggle
    document.querySelector('.mobile-menu-btn').addEventListener('click', function() {
        const nav = document.querySelector('.nav ul');
        nav.style.display = nav.style.display === 'flex' ? 'none' : 'flex';
    });
}

// Refresh data periodically
setInterval(loadAnalyticsData, 300000); // Refresh every 5 minutes