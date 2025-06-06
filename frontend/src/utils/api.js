// src/utils/api.js

export const startScraper = async (raceUrl) => {
  return fetch('/api/start', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ race_url: raceUrl }),
  });
};
export const stopScraper = () => {
  return fetch('/api/stop', {
    method: 'POST',
  });
};

export const fetchRaceData = () => {
  return fetch('/api/data');
};

export async function getScraperStatus() {
  try {
    const res = await fetch('/api/status');
    return res.ok ? await res.json() : { scraper_running: false, stale: true };
  } catch {
    return { scraper_running: false, stale: true };
  }
}
