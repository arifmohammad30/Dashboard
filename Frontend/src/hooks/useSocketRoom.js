import { useEffect } from 'react';
import { subscribeToRoom, unsubscribeFromRoom } from '../lib/socketRoomManager';

/**
 * Custom React hook that binds a component lifecycle to a targeted WebSocket room.
 * Utilizes reference counting to ensure rooms stay active across multiple child tabs/components,
 * and automatically recovers room subscriptions upon network reconnection.
 * 
 * @param {string|null|undefined} roomName - The room identifier (e.g., 'chargepoint:cp_101', 'chargingstation:st_101')
 */
export function useSocketRoom(roomName) {
  useEffect(() => {
    if (!roomName) return;

    subscribeToRoom(roomName);

    return () => {
      unsubscribeFromRoom(roomName);
    };
  }, [roomName]);
}
