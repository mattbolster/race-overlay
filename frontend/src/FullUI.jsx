import React, { useState, useEffect, useRef, useMemo } from 'react';
import { NotificationDialogue } from './components/NotificationDialogue';
import { CustomSpinner } from './components/Spinner';
import ColumnVisibilityDropdown from './components/ColumnVisibilityDropdown';
import { startScraper, stopScraper } from './utils/api';
import { validateUrl } from './utils/raceUtils';
import { useRaceScraper } from './hooks/useRaceScraper';
import toast from 'react-hot-toast';
import RaceTable from './components/RaceTable';

const OVERLAY_PATH = '/overlay';

function FullUI() {
    const [raceUrl, setRaceUrl] = useState('');
    const [scraperStarted, setScraperStarted] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    const [columns, setColumns] = useState([
        { key: 'position', label: 'Position', visible: true },
        { key: 'display_number', label: '#', visible: true },
        { key: 'competitor', label: 'Competitor', visible: true },
        { key: 'laps', label: 'Laps', visible: true },
        { key: 'last_lap', label: 'Last Lap', visible: true },
        { key: 'difference', label: 'Difference', visible: true },
        { key: 'gap', label: 'Gap', visible: true },
        { key: 'best_lap', label: 'Best Lap', visible: true },
    ]);

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
        raceData,
        positionImproved,
        positionDropped,
        fastestLapHolderId,
        leaderId,
    } = useRaceScraper(scraperStarted);


    useEffect(() => {
        fetch('http://127.0.0.1:5000/api/status')
            .then((res) => res.json())
            .then((json) => {
                if (json.scraper_running) {
                    console.log('[FullUI] Scraper already running, setting scraperStarted = true');
                    setScraperStarted(true);
                }
            })
            .catch((err) => console.error('[FullUI] Failed to check scraper status', err));
    }, []);



    useEffect(() => {
        const handleBeforeUnload = async () => {
            if (scraperStarted) await stopScraper();
        };

        window.addEventListener("beforeunload", handleBeforeUnload);
        return () => {
            window.removeEventListener("beforeunload", handleBeforeUnload);
        };
    }, [scraperStarted]);

    const startScraperHandler = async () => {
        if (!validateUrl(raceUrl)) {
            toast.error('Please enter a valid URL.');
            return;
        }

        setLoading(true);
        try {
            const res = await startScraper(raceUrl);
            console.log('[FullUI] startScraper response:', res);

            let json = {};
            try {
                json = await res.json();
                console.log('[FullUI] Parsed JSON:', json);
            } catch (err) {
                console.warn('[FullUI] Failed to parse JSON from startScraper response.', err);
            }

            if (res.ok) {
                setScraperStarted(true);  // ✅ Ensure WebSocket starts
                setModalOpen(true);
                toast.success('Scraper started!');
            } else {
                toast.error(json?.error || 'Failed to start scraper.');
            }
        } catch (err) {
            console.error('[FullUI] Start error:', err);
            toast.error('Error starting scraper.');
        } finally {
            setLoading(false);
        }
    };

    const openOverlayWithColumns = () => {
        const params = new URLSearchParams({ columns: visibleKeys.join(',') });
        window.open(`${OVERLAY_PATH}?${params.toString()}`, '_blank');
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

    console.log('[FullUI] raceData:', raceData);

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
                <div className="bg-white shadow p-6 rounded-lg space-y-4 w-full max-w-5xl background: ">
                    {raceData.length === 0 ? (
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
                                    raceData={raceData}
                                    positionImproved={positionImproved}
                                    positionDropped={positionDropped}
                                    fastestLapHolderId={fastestLapHolderId}
                                    leaderId={leaderId}
                                    visibleColumns={visibleColumns}
                                />
                            </div>

                        </>
                    )}
                </div>
            )}

            <NotificationDialogue open={modalOpen} onClose={() => setModalOpen(false)} />
        </div>
    );
}

export default FullUI;
