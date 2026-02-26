// public/js/messages.js
import { apiGet, apiPost, apiPut } from './api.js';
import { initSocket, joinConversation } from './socket.js';

function escapeHtml(s='') {
  return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

function getMyId() {
  return localStorage.getItem('userId') || '';
}

function makeConversationId(a, b) {
  return [a, b].sort().join('_');
}

export async function loadConversations(containerId='app') {
  const container = document.getElementById(containerId);
  container.innerHTML = '<div class="card">Loading conversations…</div>';
  try {
    const res = await apiGet('/messages/conversations/list?page=1&limit=50');
    const html = `
      <h2>Inbox</h2>
      <div class="grid">
        ${res.data.map(c => `
          <div class="card">
            <div class="small">${escapeHtml(c.otherParticipant?.firstName || 'Unknown')}</div>
            <div>${escapeHtml(c.latestMessage?.text || '')}</div>
            <div class="small">Unread: ${c.unreadCount || 0}</div>
            <a class="btn" href="/conversation.html?with=${c.otherParticipant?._id}">Open</a>
          </div>`).join('')}
      </div>`;
    container.innerHTML = html;
  } catch (err) {
    container.innerHTML = '<div class="card">Failed to load inbox</div>';
    console.error(err);
  }
}

export async function loadConversation(receiverId, containerId='app') {
  const container = document.getElementById(containerId);
  container.innerHTML = '<div class="card">Loading messages…</div>';
  try {
    const res = await apiGet(`/messages/${receiverId}?page=1&limit=200`);
    const messages = res.data;
    const listHtml = messages.map(m => `
      <div class="message ${m.sender._id === getMyId() ? 'me' : 'them'}">
        <div class="small">${escapeHtml(m.sender.firstName)}</div>
        <div>${escapeHtml(m.message)}</div>
        <div class="small">${new Date(m.createdAt).toLocaleString()}</div>
      </div>`).join('');
    container.innerHTML = `<div class="card message-list" id="msgList">${listHtml}</div>
      <div class="card composer">
        <textarea id="msgText" rows="2" placeholder="Write a message"></textarea>
        <button id="sendBtn" class="btn">Send</button>
      </div>`;
    initSocket();
    const convId = makeConversationId(getMyId(), receiverId);
    joinConversation(convId);
    window.addEventListener('socket:newMessage', (e) => {
      const msg = e.detail;
      if (msg.conversationId === convId) appendMessage(msg);
    });
    document.getElementById('sendBtn').addEventListener('click', async () => {
      const text = document.getElementById('msgText').value.trim();
      if (!text) return;
      try {
        await apiPost(`/messages/${receiverId}`, { message: text });
        document.getElementById('msgText').value = '';
      } catch (err) {
        alert('Send failed');
      }
    });
    // mark as read
    await apiPut(`/messages/read/${convId}`, {});
  } catch (err) {
    container.innerHTML = '<div class="card">Failed to load conversation</div>';
    console.error(err);
  }
}

function appendMessage(m) {
  const list = document.getElementById('msgList');
  if (!list) return;
  const div = document.createElement('div');
  div.className = `message ${m.sender._id === getMyId() ? 'me' : 'them'}`;
  div.innerHTML = `<div class="small">${escapeHtml(m.sender.firstName)}</div><div>${escapeHtml(m.message)}</div><div class="small">${new Date(m.createdAt).toLocaleString()}</div>`;
  list.appendChild(div);
  list.scrollTop = list.scrollHeight;
}
