import { useEffect, useRef } from 'react';
import { socket } from '../lib/socketClient';



export function useSocketRoom(roomName) {
  const previousRoomRef = useRef(null);

  useEffect(() => {
    if (!roomName) return;

    // Leave previous room if changed
    if (previousRoomRef.current && previousRoomRef.current !== roomName) {
      console.log(`[Socket.io Client] Leaving room: ${previousRoomRef.current}`);
      socket.emit('leave:room', previousRoomRef.current);
    }

    // Join new room
    console.log(`[Socket.io Client] Joining room: ${roomName}`);
    socket.emit('join:room', roomName);
    previousRoomRef.current = roomName;

    return () => {
      if (previousRoomRef.current) {
        console.log(`[Socket.io Client] Unsubscribing / Leaving room: ${previousRoomRef.current}`);
        socket.emit('leave:room', previousRoomRef.current);
        previousRoomRef.current = null;
      }
    };
  }, [roomName]);
}
