export function validateUrl(url) {
  try {
    const parsed = new URL(url);
    return (
      parsed.hostname === 'speedhive.mylaps.com' &&
      parsed.pathname.includes('/livetiming/')
    );
  } catch {
    return false;
  }
}


export const getFastestLapAndLeader = (data) => {
  let bestLap = Infinity;
  let fastestId = null;
  let leaderId = null;

  data.forEach((row) => {
    const key = row.display_number;
    if (!isNaN(row.best_lap) && Number(row.best_lap) < bestLap) {
      bestLap = Number(row.best_lap);
      fastestId = key;
    }
    if (row.position === 1) leaderId = key;
  });

  return { fastestId, leaderId };
};


export const getPositionChanges = (data, prev) => {
  const improved = {};
  const dropped = {};

  data.forEach((row) => {
    const key = row.display_number;
    const prevPos = prev[key];

    if (prevPos !== undefined) {
      if (row.position < prevPos) improved[key] = true;
      else if (row.position > prevPos) dropped[key] = true;
    }

    prev[key] = row.position;
  });

  return { improved, dropped };
};


export const isRaceDataEqual = (a, b) => JSON.stringify(a) === JSON.stringify(b);
