import { io } from 'socket.io-client';

const getSocketUrl = () => {
  if (import.meta.env.VITE_SOCKET_URL) {
    return import.meta.env.VITE_SOCKET_URL;
  }
  if (typeof window !== 'undefined') {
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return 'https://mwt-ofc-management.onrender.com';
    }
    return window.location.origin;
  }
  return 'https://mwt-ofc-management.onrender.com';
};

export const socket = io(getSocketUrl(), {
  autoConnect: false,
  transports: ['websocket', 'polling']
});
