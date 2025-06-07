import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFlagCheckered } from '@fortawesome/free-solid-svg-icons';
import React from 'react';

function RaceRow({
  row,
  visibleColumns,
  improvedPosition,
  droppedPosition,
  isFastestLapHolder,
  isLeader,
}) {
  const baseHighlight = isFastestLapHolder
    ? 'bg-purple-500/30'
    : isLeader
    ? 'bg-yellow-300/30'
    : '';

  const animateHighlight = improvedPosition
    ? 'bg-green-400/30'
    : droppedPosition
    ? 'bg-red-400/30'
    : '';

  const textColor = isFastestLapHolder ? 'text-purple-300' : 'text-white';

  const showCheckeredFlag =
    row.has_finished && (!row.lap_progress || row.lap_progress === 0);

  return (
    <motion.tr
      layout
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      transition={{ duration: 0.5 }}
      className={`${baseHighlight} ${animateHighlight} transition-colors duration-500 ease-in-out`}
    >
      {/* Icon (flag or position change) */}
      {visibleColumns.includes('position') && (
        <td className={`px-1 text-center w-[30px] ${textColor}`}>
          {showCheckeredFlag ? (
            <FontAwesomeIcon icon={faFlagCheckered} className="text-white text-xl" />
          ) : improvedPosition ? (
            <span className="text-green-500 text-xl font-bold">▲</span>
          ) : droppedPosition ? (
            <span className="text-red-500 text-xl font-bold">▼</span>
          ) : null}
        </td>
      )}

      {/* Position number + progress bar */}
      {visibleColumns.includes('position') && (
        <td className={`px-0.1 py-1 text-center relative ${textColor}`}>
          <div className="absolute inset-0 bg-black/40" />
          <span className="relative z-10">{row.position}</span>
          {typeof row.lap_progress === 'number' && (
            <div
              className="absolute bottom-0 left-0 h-[3px] bg-green-500"
              style={{ width: `${row.lap_progress}%` }}
            />
          )}
        </td>
      )}

      {visibleColumns.includes('display_number') && (
        <td className={`px-0.1 py-1 text-center ${textColor}`}>
          {row.display_number}
        </td>
      )}
      {visibleColumns.includes('competitor') && (
        <td className={`px-2 py-1 truncate overflow-hidden whitespace-nowrap ${textColor}`}>
          {row.competitor}
        </td>
      )}
      {visibleColumns.includes('laps') && (
        <td className={`px-1 py-1 text-center ${textColor}`}>
          {row.laps}
        </td>
      )}
      {visibleColumns.includes('last_lap') && (
        <td className={`px-1 py-1 text-center ${textColor}`}>
          {row.last_lap}
        </td>
      )}
      {visibleColumns.includes('difference') && (
        <td className={`px-1 py-1 text-center ${textColor}`}>
          {row.difference}
        </td>
      )}
      {visibleColumns.includes('gap') && (
        <td className={`px-1 py-1 text-center ${textColor}`}>
          {row.gap}
        </td>
      )}
      {visibleColumns.includes('best_lap') && (
        <td className={`px-1 py-1 text-center ${textColor}`}>
          {row.best_lap}
        </td>
      )}
    </motion.tr>
  );
}

export default React.memo(RaceRow);
