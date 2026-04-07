// ==================== AGRI CONNECT X - AUTHENTICATION ====================

import { apiPost } from "./api.js";
import { setToken, setUser } from "./lib/storage.js";

// DOM Elements
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const googleLoginBtn = document.getElementById('googleLoginBtn');
const googleRegisterBtn = document.getElementById('googleRegisterBtn');

// Toggle between Login & Register
document.getElementById('showRegister').addEventListener('click', (e) => {
    e.preventDefault();
    loginForm.classList.remove('active');
    registerForm.classList.add('active');
});

document.getElementById('showLogin').addEventListener('click', (e) => {
    e.preventDefault();
    registerForm.classList.remove('active');
    loginForm.classList.add('active');
});

// Show farmer fields when role = farmer
document.getElementById('role').addEventListener('change', (e) => {
    document.getElementById('farmerFields').style.display = 
        e.target.value === 'farmer' ? 'block' : 'none';
});

// ====================== LOGIN ======================
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value.trim();

    if (!email || !password) {
        alert("Please enter email and password");
        return;
    }

    try {
        const res = await apiPost("/api/auth/login", { email, password });

        if (res.success && res.accessToken) {
            setToken(res.accessToken);
            setUser(res.user);

            alert("✅ Login successful!");

            redirectBasedOnRole(res.user.role);
        } else {
            throw new Error(res.message || "Login failed");
        }
    } catch (err) {
        alert("❌ " + err.message);
    }
});

// ====================== REGISTER ======================
registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const payload = {
        firstName: document.getElementById('firstName').value.trim(),
        lastName: document.getElementById('lastName').value.trim(),
        email: document.getElementById('registerEmail').value.trim(),
        phone: document.getElementById('phone').value.trim(),
        password: document.getElementById('registerPassword').value.trim(),
        role: document.getElementById('role').value,
    };

    // Add farmer-specific fields
    if (payload.role === 'farmer') {
        payload.farmName = document.getElementById('farmName').value.trim();
        payload.farmLocation = document.getElementById('farmLocation').value.trim();
    }

    try {
        const res = await apiPost("/api/auth/register", payload);

        if (res.success) {
            alert("🎉 Account created successfully! Please login.");
            registerForm.classList.remove('active');
            loginForm.classList.add('active');
        } else {
            throw new Error(res.message || "Registration failed");
        }
    } catch (err) {
        alert("❌ " + err.message);
    }
});

// ====================== GOOGLE SIGN IN ======================
async function handleGoogleSignIn(isRegister = false) {
    // TODO: Replace this with real Google OAuth (Firebase or your backend)
    // For now, we simulate it and let the backend handle Google login

    try {
        // In real implementation, you would get idToken from Google
        // For simulation, we send a flag to backend
        const res = await apiPost("/api/auth/google", {
            isRegister: isRegister,
            // idToken: googleIdToken   // ← Real implementation will send this
        });

        if (res.success && res.accessToken) {
            setToken(res.accessToken);
            setUser(res.user);

            alert(`✅ ${isRegister ? 'Account created' : 'Logged in'} with Google!`);
            redirectBasedOnRole(res.user.role);
        } else {
            throw new Error(res.message || "Google sign in failed");
        }
    } catch (err) {
        alert("Google sign in failed: " + err.message);
        console.error(err);
    }
}

// Attach Google buttons
googleLoginBtn.addEventListener('click', () => handleGoogleSignIn(false));
googleRegisterBtn.addEventListener('click', () => handleGoogleSignIn(true));

// ====================== ROLE-BASED REDIRECT ======================
function redirectBasedOnRole(role) {
    if (role === 'admin') {
        location.href = './admin/admin.html';
    } else if (role === 'farmer') {
        location.href = './Farmer/farmer.html';     // adjust path if needed
    } else if (role === 'buyer') {
        location.href = '/component/client/buyer.html';
    } else {
        location.href = 'index.html'; // fallback
    }
}

// ====================== INIT ======================
document.addEventListener('DOMContentLoaded', () => {
    // Show login by default
    loginForm.classList.add('active');
    
    // Optional: Check if already logged in
    const token = localStorage.getItem('token'); // or however you check in storage
    if (token) {
        console.log("User already logged in - redirecting...");
        // You can add auto-redirect logic here using /api/me
    }
});