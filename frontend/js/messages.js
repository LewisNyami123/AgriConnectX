// Messages JavaScript

// DOM Elements
const conversationsList = document.getElementById('conversationsList');
const chatMessages = document.getElementById('chatMessages');
const messageInput = document.getElementById('messageInput');
const sendButton = document.getElementById('sendButton');
const participantName = document.getElementById('participantName');
const participantStatus = document.getElementById('participantStatus');
const chatHeader = document.getElementById('chatHeader');
const searchConversations = document.getElementById('searchConversations');
const attachFile = document.getElementById('attachFile');
const sendOffer = document.getElementById('sendOffer');
const offerModal = document.getElementById('offerModal');
const offerForm = document.getElementById('offerForm');
const logoutBtn = document.getElementById('logoutBtn');
const dashboardBtn = document.getElementById('dashboardBtn');
const viewProfileBtn = document.getElementById('viewProfileBtn');

let currentUser = null;
let currentConversation = null;
let currentReceiver = null;

// Initialize messaging
document.addEventListener('DOMContentLoaded', function() {
    // Check authentication
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/login.html';
        return;
    }
    
    currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    
    // Load conversations
    loadConversations();
    
    // Add event listeners
    addEventListeners();
});

// Load conversations
async function loadConversations() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/messages/conversations', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        const data = await response.json();
        
        if (response.ok) {
            displayConversations(data.data);
        } else {
            console.error('Error loading conversations:', data.message);
        }
    } catch (error) {
        console.error('Error loading conversations:', error);
    }
}

// Display conversations
function displayConversations(conversations) {
    conversationsList.innerHTML = '';
    
    if (conversations.length === 0) {
        conversationsList.innerHTML = '<p class="no-conversations">No conversations yet.</p>';
        return;
    }
    
    conversations.forEach(conversation => {
        const otherParticipant = conversation.otherParticipant._id === currentUser._id 
            ? conversation.otherParticipant 
            : conversation.otherParticipant;
            
        const conversationElement = document.createElement('div');
        conversationElement.className = `conversation-item ${currentConversation === conversation.conversationId ? 'active' : ''}`;
        conversationElement.setAttribute('data-conversation-id', conversation.conversationId);
        conversationElement.setAttribute('data-receiver-id', otherParticipant._id);
        
        conversationElement.innerHTML = `
            <div class="conversation-preview">
                <img src="/assets/default-avatar.png" alt="Avatar" class="avatar">
                <div class="conversation-info">
                    <h4>${otherParticipant.firstName} ${otherParticipant.lastName}</h4>
                    <p class="preview-message">${conversation.latestMessage.message.substring(0, 50)}${conversation.latestMessage.message.length > 50 ? '...' : ''}</p>
                </div>
                <div class="conversation-meta">
                    <span class="timestamp">${formatTime(conversation.latestMessage.createdAt)}</span>
                    ${conversation.unreadCount > 0 ? `<span class="unread-count">${conversation.unreadCount}</span>` : ''}
                </div>
            </div>
        `;
        
        conversationsList.appendChild(conversationElement);
    });
    
    // Add event listeners to conversation items
    document.querySelectorAll('.conversation-item').forEach(item => {
        item.addEventListener('click', function() {
            const conversationId = this.getAttribute('data-conversation-id');
            const receiverId = this.getAttribute('data-receiver-id');
            openConversation(conversationId, receiverId);
        });
    });
}

// Open a conversation
async function openConversation(conversationId, receiverId) {
    currentConversation = conversationId;
    currentReceiver = receiverId;
    
    // Update active class
    document.querySelectorAll('.conversation-item').forEach(item => {
        item.classList.remove('active');
    });
    this.classList.add('active');
    
    // Load messages for this conversation
    await loadMessages(receiverId);
    
    // Mark messages as read
    markMessagesAsRead(conversationId);
}

// Load messages for a conversation
async function loadMessages(receiverId) {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/messages/${receiverId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        const data = await response.json();
        
        if (response.ok) {
            displayMessages(data.data);
            
            // Enable chat input
            messageInput.disabled = false;
            sendButton.disabled = false;
            
            // Scroll to bottom
            chatMessages.scrollTop = chatMessages.scrollHeight;
        } else {
            console.error('Error loading messages:', data.message);
        }
    } catch (error) {
        console.error('Error loading messages:', error);
    }
}

// Display messages
function displayMessages(messages) {
    chatMessages.innerHTML = '';
    
    if (messages.length === 0) {
        chatMessages.innerHTML = '<p class="no-messages">No messages yet. Start a conversation!</p>';
        return;
    }
    
    messages.forEach(message => {
        const messageElement = document.createElement('div');
        const isCurrentUserSender = message.sender._id === currentUser._id;
        
        messageElement.className = `message ${isCurrentUserSender ? 'sent' : 'received'}`;
        
        messageElement.innerHTML = `
            <div class="message-content">
                <div class="message-text">${message.message}</div>
                <div class="message-meta">
                    <span class="timestamp">${formatTime(message.createdAt)}</span>
                    ${message.isOffer ? '<span class="offer-badge">Offer</span>' : ''}
                </div>
            </div>
        `;
        
        chatMessages.appendChild(messageElement);
    });
    
    // Scroll to bottom
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Send a message
async function sendMessage() {
    const messageText = messageInput.value.trim();
    
    if (!messageText) return;
    if (!currentReceiver) {
        alert('Please select a conversation first');
        return;
    }
    
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/messages/${currentReceiver}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                message: messageText,
                messageType: 'text'
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            // Clear input and reload messages
            messageInput.value = '';
            await loadMessages(currentReceiver);
        } else {
            alert(data.message || 'Failed to send message');
        }
    } catch (error) {
        console.error('Error sending message:', error);
        alert('An error occurred while sending the message');
    }
}

// Mark messages as read
async function markMessagesAsRead(conversationId) {
    try {
        const token = localStorage.getItem('token');
        await fetch(`/api/messages/read/${conversationId}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        // Reload conversations to update unread counts
        loadConversations();
    } catch (error) {
        console.error('Error marking messages as read:', error);
    }
}

// Send an offer
async function sendOfferMessage(offerDetails) {
    if (!currentReceiver) {
        alert('Please select a conversation first');
        return;
    }
    
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/messages/${currentReceiver}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                message: `I'd like to make an offer for ${offerDetails.productName}: ${offerDetails.quantity} units at FCFA ${offerDetails.pricePerUnit} each.`,
                messageType: 'text',
                isOffer: true,
                offerDetails: {
                    productId: offerDetails.productId,
                    quantity: parseInt(offerDetails.quantity),
                    unitPrice: parseFloat(offerDetails.pricePerUnit),
                    totalPrice: parseFloat(offerDetails.pricePerUnit) * parseInt(offerDetails.quantity),
                    notes: offerDetails.notes
                }
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            // Close modal and reload messages
            offerModal.style.display = 'none';
            await loadMessages(currentReceiver);
        } else {
            alert(data.message || 'Failed to send offer');
        }
    } catch (error) {
        console.error('Error sending offer:', error);
        alert('An error occurred while sending the offer');
    }
}

// Format time for display
function formatTime(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);
  
    if (diffInHours < 24) {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
        return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
}

// Add event listeners
function addEventListeners() {
    // Send message on button click
    sendButton.addEventListener('click', sendMessage);
    
    // Send message on Enter key
    messageInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });
    
    // Search conversations
    searchConversations.addEventListener('input', function() {
        // TODO: Implement search functionality
    });
    
    // Send offer button
    sendOffer.addEventListener('click', function() {
        offerModal.style.display = 'block';
    });
    
    // Offer form submission
    offerForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const offerDetails = {
            productName: document.getElementById('offerProduct').selectedOptions[0].text,
            productId: document.getElementById('offerProduct').value,
            quantity: document.getElementById('offerQuantity').value,
            pricePerUnit: document.getElementById('offerPrice').value,
            notes: document.getElementById('offerNotes').value
        };
        
        sendOfferMessage(offerDetails);
    });
    
    // Modal close button
    document.querySelector('.close').addEventListener('click', function() {
        offerModal.style.display = 'none';
    });
    
    // Close modal when clicking outside
    window.addEventListener('click', function(event) {
        if (event.target === offerModal) {
            offerModal.style.display = 'none';
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
        if (currentUser.role) {
            window.location.href = `/${currentUser.role}-dashboard.html`;
        } else {
            window.location.href = '/login.html';
        }
    });
    
    // View profile button
    viewProfileBtn.addEventListener('click', function() {
        if (currentReceiver) {
            window.location.href = `/profile.html?user=${currentReceiver}`;
        }
    });
    
    // Mobile menu toggle
    document.querySelector('.mobile-menu-btn').addEventListener('click', function() {
        const nav = document.querySelector('.nav ul');
        nav.style.display = nav.style.display === 'flex' ? 'none' : 'flex';
    });
}