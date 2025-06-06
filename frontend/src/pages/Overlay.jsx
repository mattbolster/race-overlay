import React, { useState, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { useRaceScraper } from '../hooks/useRaceScraper';
import RaceTable from '../components/RaceTable';

function Overlay() {
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const columnsParam = queryParams.get('columns');

    const visibleColumns = useMemo(() => {
        const keys = columnsParam
            ? columnsParam.split(',')
            : ['position', 'display_number', 'competitor', 'laps', 'last_lap', 'difference', 'gap', 'best_lap'];

        return keys.map(key => ({ key, visible: true }));
    }, [columnsParam]);


    // 💥 Use live socket-powered scraper logic
    const {
        raceData,
        positionImproved,
        positionDropped,
        fastestLapHolderId,
        leaderId
    } = useRaceScraper(true); // Always true for the overlay

    return (
        <div
            className="min-h-screen flex flex-col items-center justify-center p-4"
            style={{
                backgroundImage: "url('/media/kart_test.jpg')",
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
            }}
        >
            <div className="w-auto rounded-lg shadow-2xl bg-gradient-to-r from-black/30 via-gray-800/50 to-black/100 backdrop-blur-sm border border-gray-700">
                <RaceTable
                    raceData={raceData}
                    positionImproved={positionImproved}
                    positionDropped={positionDropped}
                    fastestLapHolderId={fastestLapHolderId}
                    leaderId={leaderId}
                    visibleColumns={visibleColumns}
                />
            </div>
        </div>
    );
}

export default Overlay;
