import { useEffect, useRef } from 'react';
import { socket } from '../lib/socketClient';

/**
 * Custom React hook for registering real-time socket event listeners.
 * Automatically synchronizes handlers with the latest React state closures,
 * preventing stale state bugs and cleaning up event listeners on unmount.
 * 
 * @param {Object.<string, Function>} events - Key-value map of event names to callback functions
 */
export function useSocketEvents(events) {
  const eventsRef = useRef(events);
  eventsRef.current = events;

  const eventKeys = events ? Object.keys(events).sort().join(',') : '';

  useEffect(() => {
    if (!eventsRef.current) return;
    const eventNames = Object.keys(eventsRef.current);
    const handlersMap = {};

    eventNames.forEach((eventName) => {
      const handler = (...args) => {
        if (eventsRef.current && typeof eventsRef.current[eventName] === 'function') {
          eventsRef.current[eventName](...args);
        }
      };
      handlersMap[eventName] = handler;
      socket.on(eventName, handler);
    });

    return () => {
      Object.entries(handlersMap).forEach(([eventName, handler]) => {
        socket.off(eventName, handler);
      });
    };
  }, [eventKeys]);
}
