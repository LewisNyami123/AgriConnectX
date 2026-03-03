// auth.js
import { apiPost } from "./api.js";
import { setToken, setUser } from "./lib/storage.js";
//Login function
export async function login(email, password) {
  const res = await apiPost("/api/auth/login", { email, password });
  if (res.success && res.accessToken) {
    setToken(res.accessToken);
     console.log("Saved token:", res.accessToken);
    setUser(res.user);
    setUser(res.user.id )
    return res.user;
   
  }
  throw new Error(res.message || "Login failed");
}

// REGISTER
async function register(payload) {
  const res = await post('/api/auth/register', payload);
  if (res.success) return res.user;
  throw new Error(res.message || 'Registration failed');
}

document.addEventListener('DOMContentLoaded', () => {
  // Switch forms
  document.getElementById('showRegister').addEventListener('click', e => {
    e.preventDefault();
    document.getElementById('loginForm').classList.remove('active');
    document.getElementById('registerForm').classList.add('active');
  });
  document.getElementById('showLogin').addEventListener('click', e => {
    e.preventDefault();
    document.getElementById('registerForm').classList.remove('active');
    document.getElementById('loginForm').classList.add('active');
  });

  // Show farmer fields if role=farmer
  document.getElementById('role').addEventListener('change', e => {
    document.getElementById('farmerFields').style.display =
      e.target.value === 'farmer' ? 'block' : 'none';
  });

  // Login form submit
  document.getElementById('loginForm').addEventListener('submit', async e => {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value.trim();
    try {
      const user = await login(email, password);
      // redirect based on role
      if (user.role === 'admin') location.href = './admin/admin.html';
      else if (user.role === 'farmer') location.href = './Farmer/farmer.html';
      else location.href = '/component/client/buyer.html';
    } catch (err) {
      alert(err.message);
    }
  });

  // Register form submit
  document.getElementById('registerForm').addEventListener('submit', async e => {
    e.preventDefault();
    const payload = {
      firstName: document.getElementById('firstName').value.trim(),
      lastName: document.getElementById('lastName').value.trim(),
      email: document.getElementById('registerEmail').value.trim(),
      phone: document.getElementById('phone').value.trim(),
      password: document.getElementById('registerPassword').value.trim(),
      role: document.getElementById('role').value,
      farmName: document.getElementById('farmName').value.trim(),
      farmLocation: document.getElementById('farmLocation').value.trim()
    };
    try {
      await register(payload);
      alert('Registration successful, please login');
      document.getElementById('registerForm').classList.remove('active');
      document.getElementById('loginForm').classList.add('active');
    } catch (err) {
      alert(err.message);
    }
  });
});