// Marketplace JavaScript

// DOM Elements
const productsContainer = document.getElementById('productsContainer');
const categoryFilter = document.getElementById('categoryFilter');
const locationFilter = document.getElementById('locationFilter');
const maxPriceFilter = document.getElementById('maxPriceFilter');
const searchFilter = document.getElementById('searchFilter');
const applyFiltersBtn = document.getElementById('applyFilters');
const productCountSpan = document.getElementById('productCount');
const paginationContainer = document.getElementById('pagination');
const productModal = document.getElementById('productModal');
const purchaseModal = document.getElementById('purchaseModal');
const productDetailContent = document.getElementById('productDetailContent');
const purchaseContent = document.getElementById('purchaseContent');
const purchaseForm = document.getElementById('purchaseForm');
const quantityInput = document.getElementById('quantity');
const totalPriceSpan = document.getElementById('totalPrice');
const logoutBtn = document.getElementById('logoutBtn');
const dashboardBtn = document.getElementById('dashboardBtn');

let currentPage = 1;
let selectedProduct = null;

// Load products with filters
async function loadProducts(page = 1) {
    try {
        // Build query string
        let queryString = `?page=${page}`;
        
        const category = categoryFilter.value;
        const location = locationFilter.value;
        const maxPrice = maxPriceFilter.value;
        const search = searchFilter.value;
        
        if (category && category !== 'all') {
            queryString += `&category=${category}`;
        }
        if (location) {
            queryString += `&location=${location}`;
        }
        if (maxPrice) {
            queryString += `&maxPrice=${maxPrice}`;
        }
        if (search) {
            queryString += `&keyword=${search}`;
        }
        
        const response = await fetch(`/api/products/search${queryString}`);
        const data = await response.json();
        
        if (response.ok) {
            displayProducts(data.data);
            updatePagination(data.page, data.pages);
            productCountSpan.textContent = data.count;
        }
    } catch (error) {
        console.error('Error loading products:', error);
    }
}

// Display products in the container
function displayProducts(products) {
    productsContainer.innerHTML = '';
    
    if (products.length === 0) {
        productsContainer.innerHTML = '<p class="no-products">No products found matching your criteria.</p>';
        return;
    }
    
    products.forEach(product => {
        const productCard = document.createElement('div');
        productCard.className = 'product-card';
        productCard.innerHTML = `
            <div class="card-image">
                ${product.images && product.images.length > 0 ? 
                    `<img src="${product.images[0]}" alt="${product.name}">` : 
                    `<i class="fas fa-leaf fa-3x"></i>`
                }
            </div>
            <div class="card-content">
                <h3>${product.name}</h3>
                <p>${product.description.substring(0, 100)}...</p>
                <div class="card-price">FCFA ${product.basePrice.toLocaleString()} per ${product.unit}</div>
                <div class="card-meta">
                    <span class="quality-grade">${product.qualityGrade || 'Standard'}</span>
                    <span class="availability">${product.quantityAvailable} available</span>
                </div>
            </div>
            <div class="card-footer">
                <span class="seller">${product.seller.farmName || product.seller.firstName}</span>
                <div class="card-actions">
                    <button class="btn btn-outline view-details" data-product='${JSON.stringify(product)}'>View Details</button>
                    <button class="btn btn-primary buy-now" data-product='${JSON.stringify(product)}'>Buy Now</button>
                </div>
            </div>
        `;
        
        productsContainer.appendChild(productCard);
    });
    
    // Add event listeners to buttons
    document.querySelectorAll('.view-details').forEach(button => {
        button.addEventListener('click', function() {
            const product = JSON.parse(this.getAttribute('data-product'));
            showProductDetails(product);
        });
    });
    
    document.querySelectorAll('.buy-now').forEach(button => {
        button.addEventListener('click', function() {
            const product = JSON.parse(this.getAttribute('data-product'));
            initiatePurchase(product);
        });
    });
}

// Show product details in modal
function showProductDetails(product) {
    selectedProduct = product;
    
    productDetailContent.innerHTML = `
        <div class="product-detail">
            <div class="product-images">
                ${product.images && product.images.length > 0 ? 
                    product.images.map(img => `<img src="${img}" alt="${product.name}">`).join('') :
                    '<i class="fas fa-leaf fa-5x"></i>'
                }
            </div>
            <div class="product-info">
                <h2>${product.name}</h2>
                <p class="product-description">${product.description}</p>
                <div class="product-specs">
                    <div class="spec">
                        <strong>Price:</strong> FCFA ${product.basePrice.toLocaleString()} per ${product.unit}
                    </div>
                    <div class="spec">
                        <strong>Category:</strong> ${product.category.replace('_', ' ')}
                    </div>
                    <div class="spec">
                        <strong>Availability:</strong> ${product.quantityAvailable} ${product.unit}${product.quantityAvailable > 1 ? 's' : ''}
                    </div>
                    <div class="spec">
                        <strong>Quality:</strong> ${product.qualityGrade || 'Standard'}
                    </div>
                    <div class="spec">
                        <strong>Harvest Date:</strong> ${new Date(product.harvestDate).toLocaleDateString()}
                    </div>
                    ${product.expiryDate ? 
                        `<div class="spec">
                            <strong>Expiry Date:</strong> ${new Date(product.expiryDate).toLocaleDateString()}
                        </div>` : ''
                    }
                </div>
                <div class="product-seller">
                    <h4>Sold by: ${product.seller.farmName || product.seller.firstName}</h4>
                    <button class="btn btn-primary contact-seller" data-seller='${JSON.stringify(product.seller)}'>
                        Contact Seller
                    </button>
                </div>
            </div>
        </div>
    `;
    
    // Add event listener for contact seller button
    document.querySelector('.contact-seller').addEventListener('click', function() {
        const seller = JSON.parse(this.getAttribute('data-seller'));
        contactSeller(seller._id);
    });
    
    productModal.style.display = 'block';
}

// Initiate purchase process
function initiatePurchase(product) {
    selectedProduct = product;
    quantityInput.value = 1;
    calculateTotal();
    
    purchaseContent.querySelector('h3').textContent = `Purchase ${product.name}`;
    
    purchaseModal.style.display = 'block';
}

// Calculate total price
function calculateTotal() {
    if (selectedProduct) {
        const quantity = parseInt(quantityInput.value) || 1;
        const total = selectedProduct.basePrice * quantity;
        totalPriceSpan.textContent = `FCFA ${total.toLocaleString()}`;
    }
}

// Update pagination controls
function updatePagination(currentPage, totalPages) {
    paginationContainer.innerHTML = '';
    
    if (totalPages <= 1) return;
    
    // Previous button
    if (currentPage > 1) {
        const prevBtn = document.createElement('button');
        prevBtn.className = 'btn btn-outline';
        prevBtn.textContent = 'Previous';
        prevBtn.addEventListener('click', () => {
            loadProducts(currentPage - 1);
        });
        paginationContainer.appendChild(prevBtn);
    }
    
    // Page numbers
    for (let i = Math.max(1, currentPage - 2); i <= Math.min(totalPages, currentPage + 2); i++) {
        const pageBtn = document.createElement('button');
        pageBtn.className = `btn ${i === currentPage ? 'btn-primary' : 'btn-outline'}`;
        pageBtn.textContent = i;
        pageBtn.addEventListener('click', () => {
            loadProducts(i);
        });
        paginationContainer.appendChild(pageBtn);
    }
    
    // Next button
    if (currentPage < totalPages) {
        const nextBtn = document.createElement('button');
        nextBtn.className = 'btn btn-outline';
        nextBtn.textContent = 'Next';
        nextBtn.addEventListener('click', () => {
            loadProducts(currentPage + 1);
        });
        paginationContainer.appendChild(nextBtn);
    }
}

// Contact seller function
function contactSeller(sellerId) {
    // In a real implementation, this would open a chat or direct message
    alert(`Contacting seller with ID: ${sellerId}`);
    // For now, redirect to a messaging page
    window.location.href = `/messages.html?seller=${sellerId}`;
}

// Handle purchase form submission
purchaseForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    if (!selectedProduct) {
        alert('No product selected for purchase');
        return;
    }
    
    const quantity = parseInt(quantityInput.value);
    const deliveryAddress = document.getElementById('deliveryAddress').value;
    
    if (quantity <= 0) {
        alert('Please enter a valid quantity');
        return;
    }
    
    if (!deliveryAddress.trim()) {
        alert('Please enter a delivery address');
        return;
    }
    
    // Create order
    const orderData = {
        products: [{
            product: selectedProduct._id,
            quantity: quantity,
            unitPrice: selectedProduct.basePrice,
            totalPrice: selectedProduct.basePrice * quantity
        }],
        totalAmount: selectedProduct.basePrice * quantity,
        paymentMethod: 'mtn_momo', // Default to MTN MoMo
        deliveryAddress: {
            street: deliveryAddress
        }
    };
    
    try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/transactions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(orderData)
        });
        
        const data = await response.json();
        
        if (response.ok) {
            alert('Order placed successfully! Redirecting to payment...');
            // Redirect to payment page
            window.location.href = `/payment.html?transaction=${data.data._id}`;
        } else {
            alert(data.message || 'Failed to place order');
        }
    } catch (error) {
        console.error('Purchase error:', error);
        alert('An error occurred while placing your order');
    }
});

// Event listeners
applyFiltersBtn.addEventListener('click', () => {
    currentPage = 1;
    loadProducts(currentPage);
});

// Quantity input change
quantityInput.addEventListener('input', calculateTotal);

// Modal close buttons
document.querySelectorAll('.close').forEach(closeBtn => {
    closeBtn.addEventListener('click', function() {
        productModal.style.display = 'none';
        purchaseModal.style.display = 'none';
    });
});

// Close modals when clicking outside
window.addEventListener('click', function(event) {
    if (event.target === productModal) {
        productModal.style.display = 'none';
    }
    if (event.target === purchaseModal) {
        purchaseModal.style.display = 'none';
    }
});

// Logout functionality
logoutBtn.addEventListener('click', function(e) {
    e.preventDefault();
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/';
});

// Dashboard button functionality
dashboardBtn.addEventListener('click', function(e) {
    e.preventDefault();
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (user.role) {
        window.location.href = `/${user.role}-dashboard.html`;
    } else {
        window.location.href = '/login.html';
    }
});

// Initialize the page
document.addEventListener('DOMContentLoaded', function() {
    loadProducts(currentPage);
    
    // Check authentication status
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/login.html';
    }
});

// Mobile menu toggle
document.querySelector('.mobile-menu-btn').addEventListener('click', function() {
    const nav = document.querySelector('.nav ul');
    nav.style.display = nav.style.display === 'flex' ? 'none' : 'flex';
});