import { useEffect, useRef } from 'react';
import { socket } from '../lib/socketClient';


export function useSocketEvents(events) {
  const eventsRef = useRef(events);
  eventsRef.current = events;

  useEffect(() => {
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
  }, []);
}
