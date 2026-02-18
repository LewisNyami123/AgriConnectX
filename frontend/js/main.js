// AgriConnectX Cameroon Frontend JavaScript

// DOM Elements
const loginBtn = document.getElementById('loginBtn');
const registerBtn = document.getElementById('registerBtn');
const authModal = document.getElementById('authModal');
const closeBtn = document.querySelector('.close');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const showRegisterLink = document.getElementById('showRegister');
const showLoginLink = document.getElementById('showLogin');
const roleSelect = document.getElementById('role');
const farmerFields = document.getElementById('farmerFields');
const productsContainer = document.getElementById('productsContainer');
const resourcesContainer = document.getElementById('resourcesContainer');

// Auth Modal Functions
function openAuthModal() {
    authModal.style.display = 'block';
}

function closeAuthModal() {
    authModal.style.display = 'none';
}

// Show/hide farmer fields based on role selection
roleSelect.addEventListener('change', function() {
    if (this.value === 'farmer') {
        farmerFields.style.display = 'block';
    } else {
        farmerFields.style.display = 'none';
    }
});

// Show register form
function showRegisterForm() {
    loginForm.classList.remove('active');
    registerForm.classList.add('active');
}

// Show login form
function showLoginForm() {
    registerForm.classList.remove('active');
    loginForm.classList.add('active');
}

// Event Listeners
loginBtn.addEventListener('click', openAuthModal);
registerBtn.addEventListener('click', () => {
    openAuthModal();
    showRegisterForm();
});

closeBtn.addEventListener('click', closeAuthModal);

showRegisterLink.addEventListener('click', function(e) {
    e.preventDefault();
    showRegisterForm();
});

showLoginLink.addEventListener('click', function(e) {
    e.preventDefault();
    showLoginForm();
});

// Close modal when clicking outside
window.addEventListener('click', function(event) {
    if (event.target === authModal) {
        closeAuthModal();
    }
});

// Form Submissionss
// Helper: API base URL
const API_BASE = 'http://localhost:3000';  // backend port

// Login
loginForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    try {
        const response = await fetch(`${API_BASE}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            alert(errorData.message || 'Login failed');
            return;
        }
        if (password.length < 6) {
         alert('Password must be at least 6 characters long');
        return;
        }

        const data = await response.json();
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));

        closeAuthModal();
        window.location.href = `http://127.0.0.1:5500/frontend/views/buyer-dashboard.html`;
    } catch (error) {
        console.error('Login error:', error);
        alert('An error occurred during login');
    }
});

// Register
registerForm.addEventListener('submit', async function(e) {
    e.preventDefault();

    const formData = {
        firstName: document.getElementById('firstName').value,
        lastName: document.getElementById('lastName').value,
        email: document.getElementById('registerEmail').value,
        password: document.getElementById('registerPassword').value,
        phone: document.getElementById('phone').value,
        role: document.getElementById('role').value
    };

    if (formData.role === 'farmer') {
        formData.farmName = document.getElementById('farmName').value;
        formData.farmLocation = document.getElementById('farmLocation').value;
    }

    try {
        const response = await fetch(`${API_BASE}/api/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            alert(errorData.message || 'Registration failed');
            return;
        }

        const data = await response.json();
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));

        closeAuthModal();
        if (data.user.role === 'farmer') {
            alert('Registration successful! Your account is pending admin approval.');
        } else {
            window.location.href = `/${data.user.role}-dashboard.html`;
        }
    } catch (error) {
        console.error('Registration error:', error);
        alert('An error occurred during registration');
    }
});

// Load products
async function loadProducts() {
    try {
        const response = await fetch(`${API_BASE}/api/products?limit=6`);
        if (!response.ok) return;

        const data = await response.json();
        if (data.data) {
            productsContainer.innerHTML = '';
            data.data.forEach(product => {
                const productCard = document.createElement('div');
                productCard.className = 'product-card';
                productCard.innerHTML = `
                    <div class="card-image">
                        <i class="fas fa-image fa-3x"></i>
                    </div>
                    <div class="card-content">
                        <h3>${product.name}</h3>
                        <p>${product.description.substring(0, 100)}...</p>
                        <div class="card-price">FCFA ${product.basePrice} per ${product.unit}</div>
                    </div>
                    <div class="card-footer">
                        <span class="seller">${product.seller.farmName || product.seller.firstName}</span>
                        <span class="category">${product.category}</span>
                    </div>
                `;
                productsContainer.appendChild(productCard);
            });
        }
    } catch (error) {
        console.error('Error loading products:', error);
    }
}

// Load resources
async function loadResources() {
    try {
        const response = await fetch(`${API_BASE}/api/resources?limit=6`);
        if (!response.ok) return;

        const data = await response.json();
        if (data.data) {
            resourcesContainer.innerHTML = '';
            data.data.forEach(resource => {
                const resourceCard = document.createElement('div');
                resourceCard.className = 'resource-card';
                resourceCard.innerHTML = `
                    <div class="card-content">
                        <h3>${resource.title}</h3>
                        <p>${resource.content.substring(0, 100)}...</p>
                        <div class="resource-meta">
                            <span class="category">${resource.category.replace('_', ' ')}</span>
                            <span class="author">${resource.authorName}</span>
                        </div>
                    </div>
                    <div class="card-footer">
                        <span><i class="fas fa-eye"></i> ${resource.views}</span>
                        <span><i class="fas fa-heart"></i> ${resource.likes.length}</span>
                    </div>
                `;
                resourcesContainer.appendChild(resourceCard);
            });
        }
    } catch (error) {
        console.error('Error loading resources:', error);
    }
}

// Check authentication status
function checkAuthStatus() {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    if (token) {
        // Update UI for logged in user
        loginBtn.textContent = user.firstName;
        loginBtn.href = `/${user.role}-dashboard.html`;
        registerBtn.style.display = 'none';
    }
}

// Initialize the page
document.addEventListener('DOMContentLoaded', function() {
    checkAuthStatus();
    loadProducts();
    loadResources();
});

// Mobile menu toggle
document.querySelector('.mobile-menu-btn').addEventListener('click', function() {
    const nav = document.querySelector('.nav ul');
    nav.style.display = nav.style.display === 'flex' ? 'none' : 'flex';
});