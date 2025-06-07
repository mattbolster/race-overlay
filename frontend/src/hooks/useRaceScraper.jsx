import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
const socket = io(BASE_URL, {
  transports: ['websocket'],
});

export function useRaceScraper() {
  const [raceData, setRaceData] = useState([]);
  const [connected, setConnected] = useState(false);
  const [positionImproved, setPositionImproved] = useState({});
  const [positionDropped, setPositionDropped] = useState({});
  const [fastestLapHolderId, setFastestLapHolderId] = useState(null);
  const [leaderId, setLeaderId] = useState(null);

  const prevPositionsRef = useRef({});
  const hasMounted = useRef(false);

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
      if (!Array.isArray(data)) {
        console.warn('[WebSocket] race_update payload was not an array.');
        return;
      }

      const improved = {};
      const dropped = {};
      const currentPositions = {};

      let fastestTime = Infinity;
      let fastestId = null;

      data.forEach((row) => {
        const id = row.display_number;
        const pos = parseInt(row.position, 10);
        currentPositions[id] = pos;

        if (hasMounted.current) {
          const prevPos = prevPositionsRef.current[id];
          if (prevPos !== undefined) {
            if (pos < prevPos) improved[id] = true;
            else if (pos > prevPos) dropped[id] = true;
          }
        }

        // Fastest lap logic with cleanup
        const lap = parseFloat((row.best_lap || '').replace(/[^\d.]/g, ''));
        if (!isNaN(lap) && lap < fastestTime) {
          fastestTime = lap;
          fastestId = id;
        }
      });

      if (!hasMounted.current) {
        hasMounted.current = true;
      }

      // Leader logic
      const leader = data.find(row => row.position === 1 || row.position === "1");
      const leaderId = leader?.display_number || null;

      setPositionImproved(improved);
      setPositionDropped(dropped);
      setFastestLapHolderId(fastestId);
      setLeaderId(leaderId);
      setRaceData(data);
      prevPositionsRef.current = currentPositions;
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('race_update');
    };
  }, []);

  return {
    raceData,
    connected,
    positionImproved,
    positionDropped,
    fastestLapHolderId,
    leaderId,
  };
}
