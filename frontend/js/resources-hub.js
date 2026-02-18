// Resources Hub JavaScript

// DOM Elements
const weatherContainer = document.getElementById('weatherContainer');
const featuredResources = document.getElementById('featuredResources');
const categoryCards = document.querySelectorAll('.category-card');
const addResourceSection = document.getElementById('addResourceSection');
const resourceForm = document.getElementById('resourceForm');
const logoutBtn = document.getElementById('logoutBtn');

let currentUser = null;

// Initialize resources hub
document.addEventListener('DOMContentLoaded', function() {
    // Check authentication
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/login.html';
        return;
    }
    
    currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    
    // Show add resource section for admins and farmers
    if (currentUser.role === 'admin' || currentUser.role === 'farmer') {
        addResourceSection.style.display = 'block';
    }
    
    // Load initial data
    loadWeatherUpdates();
    loadFeaturedResources();
    
    // Add event listeners
    addEventListeners();
});

// Load weather updates
async function loadWeatherUpdates() {
    try {
        const response = await fetch('/api/resources/weather');
        const data = await response.json();
        
        if (response.ok) {
            displayWeather(data.data);
        } else {
            weatherContainer.innerHTML = '<p>Error loading weather updates. Please try again later.</p>';
        }
    } catch (error) {
        console.error('Error loading weather:', error);
        weatherContainer.innerHTML = '<p>Error loading weather updates. Please try again later.</p>';
    }
}

// Display weather updates
function displayWeather(weatherData) {
    weatherContainer.innerHTML = `
        <div class="weather-overview">
            <h3>Current Conditions in Cameroon</h3>
            <div class="current-weather">
                <div class="weather-item">
                    <i class="fas fa-cloud-sun"></i>
                    <div>
                        <h4>${weatherData.forecast[0].condition}</h4>
                        <p>${weatherData.forecast[0].temperature}</p>
                    </div>
                </div>
                <div class="weather-stats">
                    <div class="stat">
                        <i class="fas fa-tint"></i>
                        <span>${weatherData.forecast[0].humidity} Humidity</span>
                    </div>
                    <div class="stat">
                        <i class="fas fa-cloud-rain"></i>
                        <span>${weatherData.forecast[0].precipitation} Precipitation</span>
                    </div>
                </div>
            </div>
        </div>
        <div class="forecast-container">
            <h3>3-Day Forecast</h3>
            <div class="forecast-list">
                ${weatherData.forecast.slice(1).map(day => `
                    <div class="forecast-day">
                        <div class="date">${new Date(day.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</div>
                        <div class="condition"><i class="fas fa-${getWeatherIcon(day.condition)}"></i> ${day.condition}</div>
                        <div class="temp">${day.temperature}</div>
                    </div>
                `).join('')}
            </div>
        </div>
        <div class="weather-advisory">
            <h3>Farming Advisory</h3>
            <p>${weatherData.advisory}</p>
        </div>
    `;
}

// Helper function to get weather icon
function getWeatherIcon(condition) {
    if (condition.toLowerCase().includes('rain')) return 'cloud-rain';
    if (condition.toLowerCase().includes('sun')) return 'sun';
    if (condition.toLowerCase().includes('cloud')) return 'cloud';
    if (condition.toLowerCase().includes('storm')) return 'bolt';
    return 'cloud-sun';
}

// Load featured resources
async function loadFeaturedResources() {
    try {
        const response = await fetch('/api/resources/featured');
        const data = await response.json();
        
        if (response.ok) {
            displayFeaturedResources(data.data);
        } else {
            featuredResources.innerHTML = '<p>Error loading featured resources.</p>';
        }
    } catch (error) {
        console.error('Error loading featured resources:', error);
        featuredResources.innerHTML = '<p>Error loading featured resources.</p>';
    }
}

// Display featured resources
function displayFeaturedResources(resources) {
    featuredResources.innerHTML = '';
    
    if (resources.length === 0) {
        featuredResources.innerHTML = '<p>No featured resources available.</p>';
        return;
    }
    
    resources.forEach(resource => {
        const resourceElement = document.createElement('div');
        resourceElement.className = 'resource-card';
        resourceElement.innerHTML = `
            <div class="card-content">
                <h3>${resource.title}</h3>
                <p>${resource.content.substring(0, 150)}...</p>
                <div class="resource-meta">
                    <span class="category">${resource.category.replace('_', ' ')}</span>
                    <span class="author">By ${resource.authorName}</span>
                    <span class="date">${new Date(resource.createdAt).toLocaleDateString()}</span>
                </div>
            </div>
            <div class="card-footer">
                <div class="resource-stats">
                    <span><i class="fas fa-eye"></i> ${resource.views}</span>
                    <span><i class="fas fa-heart"></i> ${resource.likes.length}</span>
                </div>
                <button class="btn btn-outline view-resource" data-id="${resource._id}">Read More</button>
            </div>
        `;
        
        featuredResources.appendChild(resourceElement);
    });
    
    // Add event listeners to view buttons
    document.querySelectorAll('.view-resource').forEach(button => {
        button.addEventListener('click', function() {
            const resourceId = this.getAttribute('data-id');
            window.location.href = `/resource-details.html?id=${resourceId}`;
        });
    });
}

// Add event listeners
function addEventListeners() {
    // Category card clicks
    categoryCards.forEach(card => {
        card.addEventListener('click', function() {
            const category = this.getAttribute('data-category');
            window.location.href = `/resources-category.html?category=${category}`;
        });
    });
    
    // Resource form submission
    if (resourceForm) {
        resourceForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const formData = {
                title: document.getElementById('resourceTitle').value,
                category: document.getElementById('resourceCategory').value,
                content: document.getElementById('resourceContent').value,
                tags: document.getElementById('resourceTags').value.split(',').map(tag => tag.trim()).filter(tag => tag)
            };
            
            try {
                const token = localStorage.getItem('token');
                const response = await fetch('/api/resources', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(formData)
                });
                
                const data = await response.json();
                
                if (response.ok) {
                    alert('Resource submitted successfully!');
                    resourceForm.reset();
                    loadFeaturedResources(); // Refresh featured resources
                } else {
                    alert(data.message || 'Failed to submit resource');
                }
            } catch (error) {
                console.error('Error submitting resource:', error);
                alert('An error occurred while submitting the resource');
            }
        });
    }
    
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