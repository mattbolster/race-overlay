import { useRef, useEffect, useState, useMemo } from 'react';
import { io } from 'socket.io-client';
import {
  getFastestLapAndLeader,
  getPositionChanges,
} from '../utils/raceUtils';

export function useRaceScraper(scraperStarted) {
  const socketRef = useRef(null);

  const [raceData, setRaceData] = useState([]);
  const [positionImproved, setPositionImproved] = useState({});
  const [positionDropped, setPositionDropped] = useState({});
  const prevPositionsRef = useRef({});

  useEffect(() => {
    if (!scraperStarted) return; // 👈 Do nothing if not started yet

    console.log('[WebSocket] Attempting to connect...');
    socketRef.current = io('http://127.0.0.1:5000', {
      transports: ['websocket'],
      path: '/socket.io',
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 20000,
    });

    const socket = socketRef.current;

    socket.on('connect', () => {
      console.log('[WebSocket] Connected to backend ✅');
      socket.emit('ready'); // ✅ Backend will now emit to us
      console.log('[WebSocket] Sent ready event ✅');
    });

    socket.on('disconnect', () => {
      console.warn('[WebSocket] Disconnected from backend ❌');
    });

    const handleUpdate = (message) => {
      console.log('[WebSocket] Received race_update:', message);
      const newData = message?.data;
      if (!newData || !Array.isArray(newData)) return;

      setRaceData(newData);

      const { improved, dropped } = getPositionChanges(newData, prevPositionsRef.current);
      setPositionImproved(improved);
      setPositionDropped(dropped);
    };

    socket.on('race_update', handleUpdate);
    socket.on('connect_error', (err) => console.error('[WebSocket] Connect error:', err));
    socket.on('error', (err) => console.error('[WebSocket] Socket error:', err));

    console.log('[WebSocket] Subscribed to race_update');

    return () => {
      socket.off('race_update', handleUpdate);
      socket.disconnect();
      console.log('[WebSocket] Cleaned up connection 🚿');
    };
  }, [scraperStarted]); // 👈 now depends on scraperStarted

  const { fastestId: fastestLapHolderId, leaderId } = useMemo(
    () => getFastestLapAndLeader(raceData),
    [raceData]
  );

  return {
    raceData,
    positionImproved,
    positionDropped,
    fastestLapHolderId,
    leaderId,
  };
}
