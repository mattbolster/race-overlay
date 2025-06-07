import React, { useState, useEffect, useMemo, useRef } from 'react';
import { NotificationDialogue } from './components/NotificationDialogue';
import { CustomSpinner } from './components/Spinner';
import ColumnVisibilityDropdown from './components/ColumnVisibilityDropdown';
import { startScraper, stopScraper } from './utils/api';
import { validateUrl } from './utils/raceUtils';
import { useRaceScraper } from './hooks/useRaceScraper';
import toast from 'react-hot-toast';
import RaceTable from './components/RaceTable';
import { getScraperStatus } from './utils/api';


const OVERLAY_PATH = '/overlay';

function FullUI() {
    const [raceUrl, setRaceUrl] = useState('');
    const [scraperStarted, setScraperStarted] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [hasRaceData, setHasRaceData] = useState(false);

    const [columns, setColumns] = useState(() => ([
        { key: 'position', label: 'Position', visible: true },
        { key: 'display_number', label: '#', visible: true },
        { key: 'competitor', label: 'Competitor', visible: true },
        { key: 'laps', label: 'Laps', visible: true },
        { key: 'last_lap', label: 'Last Lap', visible: true },
        { key: 'difference', label: 'Difference', visible: true },
        { key: 'gap', label: 'Gap', visible: true },
        { key: 'best_lap', label: 'Best Lap', visible: true },
    ]));

    const visibleKeys = useMemo(
        () => columns.filter(col => col.visible).map(col => col.key),
        [columns]
    );

    const handleToggleColumn = (index) => {
        setColumns(prev =>
            prev.map((col, i) =>
                i === index ? { ...col, visible: !col.visible } : col
            )
        );
    };

    const {
        raceData = [],
        positionImproved = {},
        positionDropped = {},
        fastestLapHolderId,
        leaderId,
    } = useRaceScraper(scraperStarted);

    useEffect(() => {
        if (Array.isArray(raceData) && raceData.length > 0) {
            setHasRaceData(true);
            setLoading(false);
        }
    }, [raceData]);

    // ✅ Efficient race update broadcasting
    const lastBroadcast = useRef('');
    useEffect(() => {
        if (!raceData.length) return;

        const channel = new BroadcastChannel('race_channel');
        const currentData = JSON.stringify(raceData);

        if (currentData !== lastBroadcast.current) {
            lastBroadcast.current = currentData;

            channel.postMessage({
                type: 'race_update',
                payload: {
                    raceData,
                    positionImproved,
                    positionDropped,
                    fastestLapHolderId,
                    leaderId,
                },
            });
        }

        return () => channel.close();
    }, [raceData, positionImproved, positionDropped, fastestLapHolderId, leaderId]);

    useEffect(() => {
        getScraperStatus()
            .then((json) => {
                if (json.scraper_running) {
                    setScraperStarted(true);
                }
            })
            .catch((err) => console.error('[FullUI] Status check failed', err));
    }, []);

    // ✅ Unified cleanup for unmount + refresh
    useEffect(() => {
        const cleanup = async () => {
            if (scraperStarted) await stopScraper();
        };
        window.addEventListener("beforeunload", cleanup);
        return () => {
            window.removeEventListener("beforeunload", cleanup);
            cleanup();
        };
    }, [scraperStarted]);

    const startScraperHandler = async () => {
        if (!validateUrl(raceUrl)) {
            toast.error('Please enter a valid Speedhive live timing URL.');
            return;
        }

        setHasRaceData(false);
        setLoading(true);

        try {
            await stopScraper();
            const res = await startScraper(raceUrl);
            const json = await res.json();

            if (res.ok) {
                setScraperStarted(true);
                setModalOpen(true);
                toast.success('Scraper started!');
            } else {
                toast.error(json?.error || 'Failed to start scraper.');
                setLoading(false);
            }
        } catch (err) {
            console.error('[FullUI] Start error:', err);
            toast.error('Error starting scraper.');
            setLoading(false);
        }
    };

    const stopScraperHandler = async () => {
        try {
            const res = await stopScraper();
            if (res.ok) {
                setScraperStarted(false);
                toast.success('Scraper stopped.');
            } else {
                toast.error('Failed to stop scraper.');
            }
        } catch (err) {
            console.error('[FullUI] Stop error:', err);
            toast.error('Error stopping scraper.');
        }
    };

    const openOverlayWithColumns = () => {
        const params = new URLSearchParams({ columns: visibleKeys.join(',') });
        window.open(`${OVERLAY_PATH}?${params.toString()}`, '_blank');
    };

    const totalLaps = useMemo(() => {
        return raceData.reduce((max, row) => {
            const laps = parseInt(row.laps, 10);
            return !isNaN(laps) && laps > max ? laps : max;
        }, 0);
    }, [raceData]);

    const updatedRaceData = useMemo(() => {
        return raceData.map(row => {
            const laps = parseInt(row.laps, 10);
            const lapProgress = parseFloat(row.lap_progress);
            return {
                ...row,
                has_finished:
                    !isNaN(laps) &&
                    laps >= totalLaps &&
                    (!lapProgress || lapProgress === 0),
            };
        });
    }, [raceData, totalLaps]);


    return (
        <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-6">
            <h2 className="text-2xl font-bold mb-6">Race Overlay</h2>

            {!scraperStarted ? (
                <div className="bg-white shadow p-6 rounded-lg space-y-4 w-full max-w-md">
                    <input
                        type="text"
                        value={raceUrl}
                        onChange={(e) => setRaceUrl(e.target.value)}
                        placeholder="Enter race URL"
                        className="border px-3 py-2 rounded w-full"
                        disabled={loading}
                    />
                    <button
                        onClick={startScraperHandler}
                        disabled={loading}
                        className={`px-4 py-2 rounded w-full text-white ${loading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
                    >
                        {loading ? 'Starting...' : 'Start Scraper'}
                    </button>
                </div>
            ) : (
                <div className="bg-white shadow p-6 rounded-lg space-y-4 w-full max-w-5xl">
                    {!hasRaceData ? (
                        <div className="flex items-center gap-3">
                            <p className="text-gray-700 font-medium">Waiting for race data...</p>
                            <CustomSpinner />
                        </div>
                    ) : (
                        <>
                            <div className="flex flex-wrap gap-3">
                                <button
                                    onClick={stopScraperHandler}
                                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
                                >
                                    Stop Scraper
                                </button>

                                <button
                                    onClick={openOverlayWithColumns}
                                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
                                >
                                    Launch Overlay
                                </button>
                            </div>

                            <ColumnVisibilityDropdown columns={columns} onToggle={handleToggleColumn} />
                            <div className="w-auto rounded-lg shadow-2xl bg-gradient-to-r from-black/30 via-gray-800/50 to-black/100 backdrop-blur-sm border border-gray-700">
                                <RaceTable
                                    raceData={updatedRaceData}
                                    positionImproved={positionImproved}
                                    positionDropped={positionDropped}
                                    fastestLapHolderId={fastestLapHolderId}
                                    leaderId={leaderId}
                                    visibleColumns={visibleKeys}
                                />
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>
    );
}

export default FullUI;
