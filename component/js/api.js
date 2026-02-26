import { getToken } from './lib/storage.js';
// const API_BASE = // config.js or directly in your script
window.API_BASE = "http://localhost:3000";


export async function post(path, body) {
  const headers = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body)
  });
  return res.json();
}