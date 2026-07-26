import { useEffect } from 'react';
import { socket } from '../lib/socketClient';

/**
 * A custom hook to manage socket.io events cleanly, ensuring
 * that event listeners are bound on mount and unbound on unmount
 * to prevent duplicate listeners and memory leaks.
 * 
 * @param {Object} events - An object mapping event names to handler functions.
 */
export function useSocketEvents(events) {
  useEffect(() => {
    // Bind all events
    Object.entries(events).forEach(([event, handler]) => {
      socket.on(event, handler);
    });

    // Unbind on cleanup
    return () => {
      Object.entries(events).forEach(([event, handler]) => {
        socket.off(event, handler);
      });
    };
  }, [events]);
}
