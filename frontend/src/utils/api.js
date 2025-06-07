// src/utils/api.js

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

export const startScraper = async (raceUrl) => {
  return fetch(`${BASE_URL}/api/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ race_url: raceUrl }),
  });
};

export const stopScraper = async () => {
  try {
    const res = await fetch(`${BASE_URL}/api/stop`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    return res;
  } catch (err) {
    console.error('[API] Failed to stop scraper:', err);
    return { ok: false };
  }
};

export const fetchRaceData = async () => {
  return fetch(`${BASE_URL}/api/data`);
};

export const getScraperStatus = async () => {
  try {
    const res = await fetch(`${BASE_URL}/api/status`);
    return res.ok ? await res.json() : { scraper_running: false, stale: true };
  } catch {
    return { scraper_running: false, stale: true };
  }
};
