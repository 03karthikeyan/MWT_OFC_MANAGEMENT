import { io } from 'socket.io-client';

const SOCKET_URL = window.location.hostname === 'localhost'
  ? 'http://192.168.29.30:5000'
  : window.location.origin;

export const socket = io(SOCKET_URL, {
  autoConnect: false,
});
