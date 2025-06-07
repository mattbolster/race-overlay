// useRaceScraper.jsx
import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const socket = io('http://localhost:5000');

export function useRaceScraper() {
  const [raceData, setRaceData] = useState([]);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    console.log('[WebSocket] Attempting to connect...');

    socket.on('connect', () => {
      console.log('[WebSocket] Connected to backend ✅');
      setConnected(true);
      socket.emit('client_ready'); // ✅ emit here safely
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
