import React, { useMemo } from 'react';
import RaceRow from './RaceRow';

function RaceTable({
  raceData,
  positionImproved,
  positionDropped,
  fastestLapHolderId,
  leaderId,
  visibleColumns
}) {
  const visibleKeys = useMemo(() => {
    if (!visibleColumns) return [];
    return Array.isArray(visibleColumns[0])
      ? visibleColumns.filter(col => col.visible).map(col => col.key)
      : visibleColumns;
  }, [visibleColumns]);

  const sortedRaceData = useMemo(() => {
    return [...raceData].sort((a, b) => a.position - b.position);
  }, [raceData]);

  return (
    <table className="min-w-full table-fixed text-white text-sm font-semibold">
      <thead className="bg-gradient-to-r from-black/80 via-gray-800/80 to-black/80 text-yellow-300 uppercase tracking-wider">
        <tr>
          {visibleKeys.includes('position') && <th className="w-[20px] bg-gray-900" />}
          {visibleKeys.includes('position') && <th className="px-0.5 py-1 text-center w-[20px] bg-gray-900">POS</th>}
          {visibleKeys.includes('display_number') && <th className="px-0.5 py-1 text-center w-[20px]">#</th>}
          {visibleKeys.includes('competitor') && <th className="px-2 py-1 text-left w-[100px]">COMPETITOR</th>}
          {visibleKeys.includes('laps') && <th className="px-1 py-1 text-center w-[20px]">LAPS</th>}
          {visibleKeys.includes('last_lap') && <th className="px-1 py-1 text-center w-[20px]">LAST LAP</th>}
          {visibleKeys.includes('difference') && <th className="px-1 py-1 text-center w-[20px]">DIFF</th>}
          {visibleKeys.includes('gap') && <th className="px-1 py-1 text-center w-[20px]">GAP</th>}
          {visibleKeys.includes('best_lap') && <th className="px-1 py-1 text-center w-[10px]">BEST LAP</th>}
        </tr>
      </thead>
      <tbody>
        {sortedRaceData.map((row) => {
          const rowKey = row.display_number;
          return (
            <RaceRow
              key={rowKey}
              row={row}
              visibleColumns={visibleKeys}
              improvedPosition={positionImproved[rowKey]}
              droppedPosition={positionDropped[rowKey]}
              isFastestLapHolder={rowKey === fastestLapHolderId}
              isLeader={rowKey === leaderId}
            />
          );
        })}
      </tbody>
    </table>
  );
}

export default React.memo(RaceTable);
