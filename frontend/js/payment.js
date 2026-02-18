// Payment Processing JavaScript

// DOM Elements
const orderItems = document.getElementById('orderItems');
const subtotal = document.getElementById('subtotal');
const deliveryFee = document.getElementById('deliveryFee');
const totalAmount = document.getElementById('totalAmount');
const confirmAmount = document.getElementById('confirmAmount');
const paymentOptions = document.querySelectorAll('.payment-option');
const paymentForm = document.getElementById('paymentForm');
const phoneNumber = document.getElementById('phoneNumber');
const proceedPayment = document.getElementById('proceedPayment');
const paymentConfirmation = document.getElementById('paymentConfirmation');
const verifyPayment = document.getElementById('verifyPayment');
const cancelPayment = document.getElementById('cancelPayment');
const paymentStatus = document.getElementById('paymentStatus');
const statusMessage = document.getElementById('statusMessage');
const statusDescription = document.getElementById('statusDescription');
const logoutBtn = document.getElementById('logoutBtn');
const dashboardBtn = document.getElementById('dashboardBtn');

let selectedPaymentMethod = null;
let selectedTransactionId = null;
let orderData = null;

// Initialize payment page
document.addEventListener('DOMContentLoaded', function() {
    // Check authentication
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/login.html';
        return;
    }
    
    // Get transaction ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    selectedTransactionId = urlParams.get('transaction');
    
    if (!selectedTransactionId) {
        alert('No transaction specified');
        window.location.href = '/marketplace.html';
        return;
    }
    
    // Load order details
    loadOrderDetails();
    
    // Add event listeners
    addEventListeners();
});

// Load order details
async function loadOrderDetails() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/transactions/${selectedTransactionId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        orderData = await response.json();
        
        if (response.ok) {
            displayOrderDetails(orderData.data);
        } else {
            alert('Failed to load order details');
            window.location.href = '/marketplace.html';
        }
    } catch (error) {
        console.error('Error loading order details:', error);
        alert('Error loading order details');
        window.location.href = '/marketplace.html';
    }
}

// Display order details
function displayOrderDetails(transaction) {
    orderItems.innerHTML = '';
    
    transaction.products.forEach(item => {
        const orderItem = document.createElement('div');
        orderItem.className = 'order-item';
        orderItem.innerHTML = `
            <div class="item-info">
                <h4>${item.product.name}</h4>
                <p>${item.quantity} x FCFA ${item.unitPrice.toLocaleString()} per ${item.product.unit}</p>
            </div>
            <div class="item-price">
                FCFA ${(item.unitPrice * item.quantity).toLocaleString()}
            </div>
        `;
        
        orderItems.appendChild(orderItem);
    });
    
    // Calculate totals
    const subTotal = transaction.products.reduce((sum, item) => sum + item.totalPrice, 0);
    const deliveryFeeValue = 0; // For demo, delivery fee is 0
    
    subtotal.textContent = `FCFA ${subTotal.toLocaleString()}`;
    deliveryFee.textContent = `FCFA ${deliveryFeeValue.toLocaleString()}`;
    totalAmount.textContent = `FCFA ${(subTotal + deliveryFeeValue).toLocaleString()}`;
    confirmAmount.textContent = `FCFA ${(subTotal + deliveryFeeValue).toLocaleString()}`;
}

// Add event listeners
function addEventListeners() {
    // Payment option selection
    paymentOptions.forEach(option => {
        option.addEventListener('click', function() {
            // Remove active class from all options
            paymentOptions.forEach(opt => opt.classList.remove('active'));
            
            // Add active class to clicked option
            this.classList.add('active');
            
            // Store selected payment method
            selectedPaymentMethod = this.getAttribute('data-method');
            
            // Show payment form
            paymentForm.style.display = 'block';
        });
    });
    
    // Proceed to payment
    proceedPayment.addEventListener('click', function() {
        if (!selectedPaymentMethod) {
            alert('Please select a payment method');
            return;
        }
        
        if (!phoneNumber.value.trim()) {
            alert('Please enter your phone number');
            return;
        }
        
        // Validate phone number format
        const phoneRegex = /^\+?237[6-9]\d{7}$/;
        if (!phoneRegex.test(phoneNumber.value.replace(/\s+/g, ''))) {
            alert('Please enter a valid Cameroonian phone number (e.g., +237 612 345 678)');
            return;
        }
        
        // Show confirmation screen
        paymentForm.style.display = 'none';
        paymentConfirmation.style.display = 'block';
    });
    
    // Verify payment
    verifyPayment.addEventListener('click', function() {
        // Show payment processing status
        paymentConfirmation.style.display = 'none';
        paymentStatus.style.display = 'block';
        
        // Update status message
        statusMessage.textContent = 'Verifying Payment...';
        statusDescription.textContent = 'Checking with payment provider...';
        
        // Simulate payment verification
        verifyMobileMoneyPayment();
    });
    
    // Cancel payment
    cancelPayment.addEventListener('click', function() {
        paymentConfirmation.style.display = 'none';
        paymentForm.style.display = 'block';
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
    
    // Mobile menu toggle
    document.querySelector('.mobile-menu-btn').addEventListener('click', function() {
        const nav = document.querySelector('.nav ul');
        nav.style.display = nav.style.display === 'flex' ? 'none' : 'flex';
    });
}

// Verify mobile money payment
async function verifyMobileMoneyPayment() {
    try {
        const token = localStorage.getItem('token');
        
        // Initiate payment with the selected method
        const initiateResponse = await fetch('/api/transactions/initiate-payment', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                amount: parseFloat(totalAmount.textContent.replace(/[^\d.]/g, '')),
                paymentMethod: selectedPaymentMethod,
                phoneNumber: phoneNumber.value.replace(/\s+/g, ''),
                transactionId: selectedTransactionId
            })
        });
        
        const initiateData = await initiateResponse.json();
        
        if (initiateResponse.ok) {
            // Update status
            statusMessage.textContent = 'Payment Initiated';
            statusDescription.textContent = 'Waiting for your confirmation on your phone...';
            
            // Simulate delay for user to confirm on phone
            setTimeout(async () => {
                statusMessage.textContent = 'Verifying Confirmation...';
                statusDescription.textContent = 'Checking if payment was confirmed on your phone...';
                
                // Verify payment
                const verifyResponse = await fetch('/api/transactions/verify-payment', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        paymentReference: initiateData.data.paymentReference,
                        transactionId: selectedTransactionId
                    })
                });
                
                const verifyData = await verifyResponse.json();
                
                if (verifyResponse.ok) {
                    statusMessage.innerHTML = '<i class="fas fa-check-circle success-icon"></i> Payment Successful!';
                    statusDescription.innerHTML = `
                        <p>Transaction completed successfully!</p>
                        <p>Reference: ${verifyData.data.paymentReference}</p>
                        <p>Redirecting to order details...</p>
                    `;
                    
                    // Redirect after delay
                    setTimeout(() => {
                        window.location.href = `/order-details.html?transaction=${selectedTransactionId}`;
                    }, 3000);
                } else {
                    statusMessage.innerHTML = '<i class="fas fa-times-circle error-icon"></i> Payment Failed';
                    statusDescription.innerHTML = `
                        <p>${verifyData.message || 'Payment verification failed'}</p>
                        <button class="btn btn-primary" onclick="window.location.reload()">Try Again</button>
                    `;
                }
            }, 5000); // Simulate 5 seconds for user to confirm on phone
        } else {
            statusMessage.innerHTML = '<i class="fas fa-times-circle error-icon"></i> Payment Failed';
            statusDescription.innerHTML = `
                <p>${initiateData.message || 'Failed to initiate payment'}</p>
                <button class="btn btn-primary" onclick="window.location.reload()">Try Again</button>
            `;
        }
    } catch (error) {
        console.error('Error verifying payment:', error);
        statusMessage.innerHTML = '<i class="fas fa-times-circle error-icon"></i> Payment Error';
        statusDescription.innerHTML = `
            <p>An error occurred during payment processing</p>
            <button class="btn btn-primary" onclick="window.location.reload()">Try Again</button>
        `;
    }
}