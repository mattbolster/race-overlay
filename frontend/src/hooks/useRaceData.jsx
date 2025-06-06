import { useState, useRef, useEffect } from 'react';
import { fetchRaceData } from './utils/api';

export function useRaceData(scraperStarted) {
  const [raceData, setRaceData] = useState([]);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!scraperStarted) return;

    const fetchData = async () => {
      const res = await fetchRaceData();
      if (res.ok) {
        const json = await res.json();
        setRaceData(json);
      }
    };

    fetchData();
    intervalRef.current = setInterval(fetchData, 5000);

    return () => clearInterval(intervalRef.current);
  }, [scraperStarted]);

  return raceData;
}
