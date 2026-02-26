// public/js/socket.js
let socket = null;

export function initSocket() {
  if (socket) return socket;
  const token = localStorage.getItem('token');
  // socket.io client must be loaded globally (CDN) as io
  socket = io(window.location.origin, { auth: { token } });

  socket.on('connect', () => console.log('socket connected', socket.id));
  socket.on('disconnect', (reason) => console.log('socket disconnected', reason));
  socket.on('newMessage', (msg) => {
    window.dispatchEvent(new CustomEvent('socket:newMessage', { detail: msg }));
  });
  socket.on('notification', (n) => {
    window.dispatchEvent(new CustomEvent('socket:notification', { detail: n }));
  });

  return socket;
}

export function joinConversation(convId) {
  if (!socket) initSocket();
  socket.emit('joinConversation', convId);
}
