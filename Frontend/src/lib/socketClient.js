import { io } from 'socket.io-client';

const SOCKET_URL = 'http://localhost:5000';

// A single, shared socket instance for the entire application.
// This prevents multiple redundant connections to the server.
export const socket = io(SOCKET_URL, {
  autoConnect: true,
  reconnection: true,
});
