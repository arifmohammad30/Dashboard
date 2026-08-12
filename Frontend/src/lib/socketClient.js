import { io } from 'socket.io-client';

const SOCKET_URL = 'http://localhost:5000';

export const socket = io(SOCKET_URL, {
  autoConnect: true,
  reconnection: true,
});

// Global store for completed live sessions to ensure zero data loss on tab switches
const completedCache = new Map();
const historySubscribers = new Set();

export const getGlobalCompletedSessions = () => {
  return Array.from(completedCache.values()).reverse();
};

export const subscribeGlobalCompletedSessions = (callback) => {
  historySubscribers.add(callback);
  return () => historySubscribers.delete(callback);
};

const handleCompletedSession = (sessionObj) => {
  if (!sessionObj) return;
  const targetId = sessionObj.sessionId || sessionObj.id;
  if (!targetId) return;

  // Deduplicate and store
  completedCache.set(targetId, sessionObj);
  
  const currentList = getGlobalCompletedSessions();
  historySubscribers.forEach(cb => cb(currentList));
};

socket.on('session:stopped', (sessionObj) => {
  handleCompletedSession(sessionObj);
});

socket.on('session:updated', (sessionObj) => {
  if (sessionObj && sessionObj.status && sessionObj.status !== 'Ongoing') {
    handleCompletedSession(sessionObj);
  }
});
