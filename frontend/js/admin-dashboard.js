// Admin Dashboard JavaScript

// DOM Elements
const adminName = document.getElementById('adminName');
const totalUsers = document.getElementById('totalUsers');
const farmersCount = document.getElementById('farmersCount');
const totalOrders = document.getElementById('totalOrders');
const totalRevenue = document.getElementById('totalRevenue');
const pendingFarmersList = document.getElementById('pendingFarmersList');
const activeSessions = document.getElementById('activeSessions');
const todaysTransactions = document.getElementById('todaysTransactions');
const uptime = document.getElementById('uptime');
const dbStatus = document.getElementById('dbStatus');
const recentActivity = document.getElementById('recentActivity');
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
    
    if (currentUser.role !== 'admin') {
        // Redirect if not an admin
        window.location.href = `/${currentUser.role}-dashboard.html`;
        return;
    }
    
    // Set admin name
    adminName.textContent = currentUser.firstName;
    
    // Load dashboard data
    loadDashboardStats();
    loadPendingFarmers();
    loadSystemOverview();
    loadRecentActivity();
});

// Load dashboard statistics
async function loadDashboardStats() {
    try {
        const token = localStorage.getItem('token');
        
        // Load total users
        const usersResponse = await fetch('/api/users', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        const usersData = await usersResponse.json();
        if (usersResponse.ok) {
            totalUsers.textContent = usersData.count;
        }
        
        // Load farmers count
        const farmersResponse = await fetch('/api/users/farmers', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        const farmersData = await farmersResponse.json();
        if (farmersResponse.ok) {
            farmersCount.textContent = farmersData.count;
        }
        
        // Load transactions for revenue stats
        const transactionsResponse = await fetch('/api/transactions', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        const transactionsData = await transactionsResponse.json();
        if (transactionsResponse.ok) {
            totalOrders.textContent = transactionsData.count;
            
            // Calculate total revenue
            let revenue = 0;
            transactionsData.data.forEach(transaction => {
                if (transaction.paymentStatus === 'completed') {
                    revenue += transaction.totalAmount;
                }
            });
            
            totalRevenue.textContent = `FCFA ${revenue.toLocaleString()}`;
        }
    } catch (error) {
        console.error('Error loading dashboard stats:', error);
    }
}

// Load pending farmers for approval
async function loadPendingFarmers() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/users/farmers', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        const data = await response.json();
        
        if (response.ok) {
            // Filter farmers that are not approved
            const pendingFarmers = data.data.filter(farmer => !farmer.isApproved);
            displayPendingFarmers(pendingFarmers);
        }
    } catch (error) {
        console.error('Error loading pending farmers:', error);
    }
}

// Display pending farmers
function displayPendingFarmers(farmers) {
    pendingFarmersList.innerHTML = '';
    
    if (farmers.length === 0) {
        pendingFarmersList.innerHTML = '<p class="no-pending">No pending farmers for approval.</p>';
        return;
    }
    
    farmers.forEach(farmer => {
        const farmerElement = document.createElement('div');
        farmerElement.className = 'pending-farmer-item';
        farmerElement.innerHTML = `
            <div class="farmer-info">
                <h4>${farmer.firstName} ${farmer.lastName}</h4>
                <p class="farmer-email">${farmer.email}</p>
                <p class="farmer-phone">${farmer.phone}</p>
                <p class="farmer-farm">${farmer.farmName || 'Farm not specified'}</p>
                ${farmer.idVerification && farmer.idVerification.verified ? 
                    '<span class="verification-badge verified">Verified</span>' : 
                    '<span class="verification-badge pending">Pending Verification</span>'
                }
            </div>
            <div class="farmer-actions">
                <button class="btn btn-success approve-farmer" data-id="${farmer._id}">
                    Approve
                </button>
                <button class="btn btn-outline view-details" data-id="${farmer._id}">
                    View Details
                </button>
            </div>
        `;
        
        pendingFarmersList.appendChild(farmerElement);
    });
    
    // Add event listeners for approve buttons
    document.querySelectorAll('.approve-farmer').forEach(button => {
        button.addEventListener('click', function() {
            const farmerId = this.getAttribute('data-id');
            approveFarmer(farmerId);
        });
    });
    
    // Add event listeners for view details buttons
    document.querySelectorAll('.view-details').forEach(button => {
        button.addEventListener('click', function() {
            const farmerId = this.getAttribute('data-id');
            viewFarmerDetails(farmerId);
        });
    });
}

// Approve a farmer
async function approveFarmer(farmerId) {
    if (!confirm('Are you sure you want to approve this farmer?')) {
        return;
    }
    
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/users/approve/${farmerId}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        const data = await response.json();
        
        if (response.ok) {
            alert('Farmer approved successfully!');
            loadPendingFarmers(); // Refresh the list
            loadDashboardStats(); // Update stats
        } else {
            alert(data.message || 'Failed to approve farmer');
        }
    } catch (error) {
        console.error('Error approving farmer:', error);
        alert('An error occurred while approving the farmer');
    }
}

// View farmer details
function viewFarmerDetails(farmerId) {
    // Redirect to farmer details page
    window.location.href = `/farmer-details.html?id=${farmerId}`;
}

// Load system overview
async function loadSystemOverview() {
    try {
        // For demo purposes, showing static data
        activeSessions.textContent = '42';
        todaysTransactions.textContent = '15';
        uptime.textContent = '99.9%';
        
        // Simulate database status check
        setTimeout(() => {
            dbStatus.className = 'status-green';
            dbStatus.textContent = 'Operational';
        }, 1000);
    } catch (error) {
        console.error('Error loading system overview:', error);
    }
}

// Load recent activity
async function loadRecentActivity() {
    try {
        // For demo purposes, showing static activity
        const activities = [
            { id: 1, action: 'New user registered', user: 'John Doe', time: new Date(Date.now() - 3600000) },
            { id: 2, action: 'Farmer approved', user: 'Jane Smith', time: new Date(Date.now() - 7200000) },
            { id: 3, action: 'New product listed', user: 'Bob Johnson', time: new Date(Date.now() - 10800000) },
            { id: 4, action: 'Order completed', user: 'Alice Williams', time: new Date(Date.now() - 14400000) },
            { id: 5, action: 'System backup completed', user: 'System', time: new Date(Date.now() - 18000000) }
        ];
        
        displayRecentActivity(activities);
    } catch (error) {
        console.error('Error loading recent activity:', error);
    }
}

// Display recent activity
function displayRecentActivity(activities) {
    recentActivity.innerHTML = '';
    
    if (activities.length === 0) {
        recentActivity.innerHTML = '<p class="no-activity">No recent activity.</p>';
        return;
    }
    
    activities.forEach(activity => {
        const activityElement = document.createElement('div');
        activityElement.className = 'activity-item';
        activityElement.innerHTML = `
            <div class="activity-info">
                <p class="activity-action">${activity.action}</p>
                <p class="activity-user">by ${activity.user}</p>
                <p class="activity-time">${formatTimeAgo(activity.time)}</p>
            </div>
        `;
        
        recentActivity.appendChild(activityElement);
    });
}

// Helper function to format time ago
function formatTimeAgo(date) {
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) {
        return `${diffInSeconds}s ago`;
    } else if (diffInSeconds < 3600) {
        return `${Math.floor(diffInSeconds / 60)}m ago`;
    } else if (diffInSeconds < 86400) {
        return `${Math.floor(diffInSeconds / 3600)}h ago`;
    } else {
        return `${Math.floor(diffInSeconds / 86400)}d ago`;
    }
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