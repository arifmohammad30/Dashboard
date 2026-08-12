import { useEffect } from 'react';
import { socket } from '../lib/socketClient';


export function useSocketEvents(events) {
  useEffect(() => {

    Object.entries(events).forEach(([event, handler]) => {
      socket.on(event, handler);
    });


    return () => {
      Object.entries(events).forEach(([event, handler]) => {
        socket.off(event, handler);
      });
    };
  }, [events]);
}
