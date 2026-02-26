// public/js/auth.js
document.addEventListener('DOMContentLoaded', () => {
  const loginBtn = document.getElementById('loginBtn');
  if (!loginBtn) return;
  const token = localStorage.getItem('token');
  loginBtn.textContent = token ? 'Logout' : 'Login';
  loginBtn.addEventListener('click', async () => {
    if (localStorage.getItem('token')) {
      localStorage.removeItem('token');
      localStorage.removeItem('userId');
      location.reload();
      return;
    }
    const email = prompt('Email');
    const password = prompt('Password');
    if (!email || !password) return alert('Cancelled');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'Login failed');
      localStorage.setItem('token', data.token);
      if (data.user && data.user._id) localStorage.setItem('userId', data.user._id);
      location.reload();
    } catch (err) {
      alert('Login failed');
    }
  });
});
