export function setToken(token){ localStorage.setItem('token', token); }
export function getToken(){ return localStorage.getItem('token'); }
export function setUser(user){
  if (user._id) localStorage.setItem('userId', user._id);
  if (user.role) localStorage.setItem('userRole', user.role);
}
export function clearAuth(){
  localStorage.removeItem('token');
  localStorage.removeItem('userId');
  localStorage.removeItem('userRole');
}