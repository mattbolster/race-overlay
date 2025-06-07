import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';


const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
const socket = io(BASE_URL, {
  transports: ['websocket'],
});

export function useRaceScraper() {
  const [raceData, setRaceData] = useState([]);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    console.log('[WebSocket] Attempting to connect...');

    socket.on('connect', () => {
      console.log('[WebSocket] Connected to backend ✅');
      setConnected(true);
      socket.emit('client_ready');
    });

    socket.on('disconnect', () => {
      console.log('[WebSocket] Disconnected ❌');
      setConnected(false);
    });

    socket.on('race_update', (data) => {
      console.log('[WebSocket] Received race_update:', data);
      if (Array.isArray(data)) {
        setRaceData(data);
      } else {
        console.warn('[WebSocket] race_update payload was not an array.');
      }
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('race_update');
    };
  }, []);

  return { raceData, connected };
}
