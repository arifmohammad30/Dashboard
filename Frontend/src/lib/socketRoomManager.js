import { socket } from './socketClient';

/**
 * Active room subscription counts.
 * Map<roomName: string, count: number>
 */
const roomCounts = new Map();

/**
 * Subscribes a component to a targeted WebSocket room.
 * Implements reference counting so multiple mounted components/tabs sharing the same room
 * do not cause premature room departure when one unmounts.
 * 
 * @param {string} roomName - The unique room identifier (e.g., 'chargepoint:cp_101', 'chargingstation:st_101')
 */
export function subscribeToRoom(roomName) {
  if (!roomName || typeof roomName !== 'string') return;
  const trimmed = roomName.trim();
  if (!trimmed) return;

  const currentCount = roomCounts.get(trimmed) || 0;
  roomCounts.set(trimmed, currentCount + 1);

  // Emit join only on the first subscriber transition (0 -> 1)
  if (currentCount === 0 && socket.connected) {
    socket.emit('join:room', trimmed);
  }
}

/**
 * Unsubscribes a component from a targeted WebSocket room.
 * Emits leave:room to the backend ONLY when the last subscriber unmounts.
 * 
 * @param {string} roomName - The unique room identifier to leave
 */
export function unsubscribeFromRoom(roomName) {
  if (!roomName || typeof roomName !== 'string') return;
  const trimmed = roomName.trim();
  if (!trimmed) return;

  const currentCount = roomCounts.get(trimmed) || 0;

  if (currentCount <= 1) {
    roomCounts.delete(trimmed);
    if (socket.connected) {
      socket.emit('leave:room', trimmed);
    }
  } else {
    roomCounts.set(trimmed, currentCount - 1);
  }
}

/**
 * Auto-recovery on WebSocket reconnection.
 * When the socket reconnects, the server assigns a new socket ID with 0 joined rooms.
 * This listener automatically re-joins all currently active rooms on reconnect.
 */
socket.on('connect', () => {
  for (const roomName of roomCounts.keys()) {
    socket.emit('join:room', roomName);
  }
});

/**
 * Returns a list of currently active subscribed rooms (useful for diagnostics and testing).
 */
export function getActiveRooms() {
  return Array.from(roomCounts.keys());
}
