import React, { useEffect, useState, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import RaceTable from '../components/RaceTable';

function Overlay() {
    const location = useLocation();
    const query = new URLSearchParams(location.search);
    const columnsParam = query.get('columns');

    const [raceData, setRaceData] = useState([]);
    const [positionImproved, setPositionImproved] = useState({});
    const [positionDropped, setPositionDropped] = useState({});
    const [fastestLapHolderId, setFastestLapHolderId] = useState(null);
    const [leaderId, setLeaderId] = useState(null);

    useEffect(() => {
        fetch('/api/data')
            .then(res => res.json())
            .then(json => {
                if (Array.isArray(json)) {
                    setRaceData(json);
                    console.log('[Overlay] Fallback data loaded.');
                }
            })
            .catch(console.error);
    }, []);

    useEffect(() => {
        const channel = new BroadcastChannel('race_channel');
        const handleMessage = (event) => {
            if (event.data.type === 'race_update') {
                const payload = event.data.payload;
                setRaceData(payload.raceData);
                setPositionImproved(payload.positionImproved);
                setPositionDropped(payload.positionDropped);
                setFastestLapHolderId(payload.fastestLapHolderId);
                setLeaderId(payload.leaderId);
            }
        };

        channel.addEventListener('message', handleMessage);
        return () => {
            channel.removeEventListener('message', handleMessage);
            channel.close();
        };
    }, []);

    const visibleKeys = useMemo(() => {
        return columnsParam
            ? columnsParam.split(',')  // ✅ ensures array of strings
            : [];
    }, [columnsParam]);

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4">
            <div className="w-auto rounded-lg shadow-2xl bg-black/70 backdrop-blur-sm">
                <RaceTable
                    raceData={raceData}
                    positionImproved={positionImproved}
                    positionDropped={positionDropped}
                    fastestLapHolderId={fastestLapHolderId}
                    leaderId={leaderId}
                    visibleColumns={visibleKeys}
                />
            </div>
        </div>
    );
}

export default Overlay;
