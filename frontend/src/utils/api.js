// src/utils/api.js

export const startScraper = async (raceUrl) => {
  return fetch('/api/start', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ race_url: raceUrl }),
  });
};
export async function stopScraper() {
  try {
    const res = await fetch('http://127.0.0.1:5000/api/stop', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    return res;
  } catch (err) {
    console.error('[API] Failed to stop scraper:', err);
    return { ok: false };
  }
}


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
