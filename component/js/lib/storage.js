// export function setToken(accessToken){ localStorage.setItem('token', accessToken); }
// export function getToken(){ return localStorage.getItem('token'); }
// export function setUser(user){
//   if (user._id) localStorage.setItem('userId', user._id);
//   if (user.role) localStorage.setItem('userRole', user.role);
// }
// export function clearAuth(){
//   localStorage.removeItem('token');
//   localStorage.removeItem('userId');
//   localStorage.removeItem('userRole');
// }// lib/storage.js

// Save token
export function setToken(accessToken) {
  if (accessToken) {
    localStorage.setItem("token", accessToken);
  }
}

// Retrieve token
export function getToken() {
  const token = localStorage.getItem("token");
  console.log("getToken() returned:", token); // Debug log
  return token;
}
// Save user info
export function setUser(user) {
  if (user && user._id) {
    localStorage.setItem("userId", user._id);
  }
  if (user && user.role) {
    localStorage.setItem("userRole", user.role);
  }
}

// Retrieve user info
export function getUser() {
  const id = localStorage.getItem("userId");
  const role = localStorage.getItem("userRole");
  return id && role ? { _id: id, role } : null;
}

// Clear everything
export function clearAuth() {
  localStorage.removeItem("token");
  localStorage.removeItem("userId");
  localStorage.removeItem("userRole");
}