// Resources JavaScript

// DOM Elements
const resourcesContainer = document.getElementById('resourcesContainer');
const resourceCategoryFilter = document.getElementById('resourceCategoryFilter');
const resourceSearch = document.getElementById('resourceSearch');
const applyResourceFiltersBtn = document.getElementById('applyResourceFilters');
const resourceCountSpan = document.getElementById('resourceCount');
const resourcePagination = document.getElementById('resourcePagination');
const resourceModal = document.getElementById('resourceModal');
const resourceDetailContent = document.getElementById('resourceDetailContent');
const weatherContainer = document.getElementById('weatherContainer');
const logoutBtn = document.getElementById('logoutBtn');
const dashboardBtn = document.getElementById('dashboardBtn');

let currentPage = 1;
let selectedResource = null;

// Load weather updates
async function loadWeatherUpdates() {
    try {
        const response = await fetch('/api/resources/weather');
        const data = await response.json();
        
        if (response.ok) {
            displayWeather(data.data);
        }
    } catch (error) {
        console.error('Error loading weather updates:', error);
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

// Load resources with filters
async function loadResources(page = 1) {
    try {
        // Build query string
        let queryString = `?page=${page}`;
        
        const category = resourceCategoryFilter.value;
        const search = resourceSearch.value;
        
        if (category && category !== 'all') {
            queryString += `&category=${category}`;
        }
        if (search) {
            queryString += `&search=${search}`;
        }
        
        const response = await fetch(`/api/resources${queryString}`);
        const data = await response.json();
        
        if (response.ok) {
            displayResources(data.data);
            updateResourcePagination(data.page, data.pages);
            resourceCountSpan.textContent = data.count;
        }
    } catch (error) {
        console.error('Error loading resources:', error);
    }
}

// Display resources in the container
function displayResources(resources) {
    resourcesContainer.innerHTML = '';
    
    if (resources.length === 0) {
        resourcesContainer.innerHTML = '<p class="no-resources">No resources found matching your criteria.</p>';
        return;
    }
    
    resources.forEach(resource => {
        const resourceCard = document.createElement('div');
        resourceCard.className = 'resource-card';
        resourceCard.innerHTML = `
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
                    <span><i class="fas fa-comment"></i> ${resource.comments.length}</span>
                </div>
                <button class="btn btn-outline view-resource" data-resource='${JSON.stringify(resource)}'>Read More</button>
            </div>
        `;
        
        resourcesContainer.appendChild(resourceCard);
    });
    
    // Add event listeners to buttons
    document.querySelectorAll('.view-resource').forEach(button => {
        button.addEventListener('click', function() {
            const resource = JSON.parse(this.getAttribute('data-resource'));
            showResourceDetails(resource);
        });
    });
}

// Show resource details in modal
function showResourceDetails(resource) {
    selectedResource = resource;
    
    resourceDetailContent.innerHTML = `
        <div class="resource-detail">
            <div class="resource-header">
                <h2>${resource.title}</h2>
                <div class="resource-meta">
                    <span class="category">${resource.category.replace('_', ' ')}</span>
                    <span class="author">By ${resource.authorName}</span>
                    <span class="date">${new Date(resource.createdAt).toLocaleDateString()}</span>
                </div>
            </div>
            <div class="resource-body">
                <p class="resource-content">${resource.content}</p>
                
                ${resource.media && resource.media.length > 0 ? `
                <div class="resource-media">
                    ${resource.media.map(media => `
                        ${media.type.includes('image') ? 
                            `<img src="${media.url}" alt="${media.caption || 'Resource image'}">` : 
                            `<a href="${media.url}" target="_blank">Download ${media.type}</a>`
                        }
                    `).join('')}
                </div>
                ` : ''}
                
                <div class="resource-stats-full">
                    <span><i class="fas fa-eye"></i> ${resource.views} views</span>
                    <span><i class="fas fa-heart"></i> ${resource.likes.length} likes</span>
                    <span><i class="fas fa-comment"></i> ${resource.comments.length} comments</span>
                </div>
                
                <div class="resource-actions">
                    <button class="btn btn-outline like-resource" data-resource-id="${resource._id}">
                        <i class="fas fa-heart"></i> ${resource.likes.some(like => 
                            JSON.parse(localStorage.getItem('user') || '{}')._id === like.user._id
                        ) ? 'Liked' : 'Like'}
                    </button>
                </div>
                
                <div class="comments-section">
                    <h4>Comments (${resource.comments.length})</h4>
                    <div class="comments-list">
                        ${resource.comments.map(comment => `
                            <div class="comment">
                                <div class="comment-author">${comment.user.firstName} ${comment.user.lastName}</div>
                                <div class="comment-text">${comment.comment}</div>
                                <div class="comment-date">${new Date(comment.createdAt).toLocaleDateString()}</div>
                            </div>
                        `).join('')}
                    </div>
                    
                    <div class="add-comment">
                        <textarea id="commentText" placeholder="Add a comment..."></textarea>
                        <button class="btn btn-primary add-comment-btn" data-resource-id="${resource._id}">Post Comment</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Add event listeners for like and comment functionality
    document.querySelector('.like-resource').addEventListener('click', function() {
        const resourceId = this.getAttribute('data-resource-id');
        toggleLike(resourceId);
    });
    
    document.querySelector('.add-comment-btn').addEventListener('click', function() {
        const resourceId = this.getAttribute('data-resource-id');
        const commentText = document.getElementById('commentText').value;
        addComment(resourceId, commentText);
    });
    
    resourceModal.style.display = 'block';
}

// Toggle like on a resource
async function toggleLike(resourceId) {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/resources/${resourceId}/like`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            // Reload the resource details to reflect the new like status
            showResourceDetails(selectedResource);
        } else {
            alert('Failed to like resource');
        }
    } catch (error) {
        console.error('Error liking resource:', error);
        alert('An error occurred while liking the resource');
    }
}

// Add comment to a resource
async function addComment(resourceId, commentText) {
    if (!commentText.trim()) {
        alert('Please enter a comment');
        return;
    }
    
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/resources/${resourceId}/comment`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ comment: commentText })
        });
        
        if (response.ok) {
            // Clear the comment input
            document.getElementById('commentText').value = '';
            // Reload the resource details to reflect the new comment
            showResourceDetails(selectedResource);
        } else {
            alert('Failed to add comment');
        }
    } catch (error) {
        console.error('Error adding comment:', error);
        alert('An error occurred while adding the comment');
    }
}

// Update resource pagination controls
function updateResourcePagination(currentPage, totalPages) {
    resourcePagination.innerHTML = '';
    
    if (totalPages <= 1) return;
    
    // Previous button
    if (currentPage > 1) {
        const prevBtn = document.createElement('button');
        prevBtn.className = 'btn btn-outline';
        prevBtn.textContent = 'Previous';
        prevBtn.addEventListener('click', () => {
            loadResources(currentPage - 1);
        });
        resourcePagination.appendChild(prevBtn);
    }
    
    // Page numbers
    for (let i = Math.max(1, currentPage - 2); i <= Math.min(totalPages, currentPage + 2); i++) {
        const pageBtn = document.createElement('button');
        pageBtn.className = `btn ${i === currentPage ? 'btn-primary' : 'btn-outline'}`;
        pageBtn.textContent = i;
        pageBtn.addEventListener('click', () => {
            loadResources(i);
        });
        resourcePagination.appendChild(pageBtn);
    }
    
    // Next button
    if (currentPage < totalPages) {
        const nextBtn = document.createElement('button');
        nextBtn.className = 'btn btn-outline';
        nextBtn.textContent = 'Next';
        nextBtn.addEventListener('click', () => {
            loadResources(currentPage + 1);
        });
        resourcePagination.appendChild(nextBtn);
    }
}

// Event listeners
applyResourceFiltersBtn.addEventListener('click', () => {
    currentPage = 1;
    loadResources(currentPage);
});

// Modal close button
document.querySelector('.close').addEventListener('click', function() {
    resourceModal.style.display = 'none';
});

// Close modal when clicking outside
window.addEventListener('click', function(event) {
    if (event.target === resourceModal) {
        resourceModal.style.display = 'none';
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
    loadWeatherUpdates();
    loadResources(currentPage);
    
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