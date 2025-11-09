import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { FaArrowRight, FaPlus, FaCheck } from 'react-icons/fa';
import { LuRepeat } from "react-icons/lu";
import { MdDashboard } from 'react-icons/md';
import { PiClockClockwiseBold } from 'react-icons/pi';

export default function SRSDashboard({ setId }) {
    const router = useRouter();
    const [stats, setStats] = useState({
        dueNow: 0,
        learnNew: 0,
        totalSRItems: 0
    });
    const [loading, setLoading] = useState(true);
    const [loadingNewItems, setLoadingNewItems] = useState(true);
    const [error, setError] = useState(null);
    const [newItemsError, setNewItemsError] = useState(null);

    // Fetch due now items
    useEffect(() => {
        const fetchDueCount = async () => {
            if (!setId) {
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                setError(null);
                const response = await fetch(`/api/database/v2/srs/set/due/${setId}`);

                if (!response.ok) {
                    throw new Error(`Failed to fetch due items: ${response.statusText}`);
                }

                const data = await response.json();

                if (data.success && data.data?.items) {
                    setStats(prevStats => ({
                        ...prevStats,
                        dueNow: data.data.items.length,
                        totalSRItems: data.data.items.length
                    }));
                }
            } catch (err) {
                console.error('Error fetching due count:', err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchDueCount();
    }, [setId]);

    // Fetch new items count
    useEffect(() => {
        const fetchNewItemsCount = async () => {
            if (!setId) {
                setLoadingNewItems(false);
                return;
            }

            try {
                setLoadingNewItems(true);
                setNewItemsError(null);
                // Use a limit of 1 to check if there are ANY new items available
                const response = await fetch(`/api/database/v2/srs/set/learn/${setId}?limit=1`);

                if (!response.ok) {
                    throw new Error(`Failed to fetch new items: ${response.statusText}`);
                }

                const data = await response.json();

                if (data.success && data.data?.items) {
                    // Fetch with limit of 5 (capped display)
                    const countResponse = await fetch(`/api/database/v2/srs/set/learn/${setId}?limit=5`);
                    const countData = await countResponse.json();

                    if (countData.success && countData.data?.items) {
                        setStats(prevStats => ({
                            ...prevStats,
                            learnNew: countData.data.items.length
                        }));
                    }
                } else {
                    // No new items available
                    setStats(prevStats => ({
                        ...prevStats,
                        learnNew: 0
                    }));
                }
            } catch (err) {
                console.error('Error fetching new items count:', err);
                setNewItemsError(err.message);
                setStats(prevStats => ({
                    ...prevStats,
                    learnNew: 0
                }));
            } finally {
                setLoadingNewItems(false);
            }
        };

        fetchNewItemsCount();
    }, [setId]);

    const handleDueNowClick = () => {
        if (stats.dueNow > 0) {
            router.push(`/learn/academy/sets/study/${setId}/srs/due-now`);
        }
    };

    const handleLearnNewClick = () => {
        router.push(`/learn/academy/sets/study/${setId}/srs/learn-new?limit=5`);
    };

    const handleDashboardClick = () => {
        console.log('Opening SRS Dashboard...');
        // Open in new window or navigate
        window.open('/srs/dashboard', '_blank');
    };

    return (
        <div
            className="mb-3 w-full h-full group relative p-3  bg-white dark:bg-[#1c2b35] rounded-lg border border-black/5 dark:border-white/10 transition-all cursor-pointer shadow-sm flex flex-col"
        >
            <div className="flex items-center gap-2 text-xl text-gray-900 dark:text-white font-semibold mb-4">
                <PiClockClockwiseBold />
                <span>Spaced Repition</span>
            </div>
            <div className="flex gap-3 flex-1">
                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-3 sm:w-1/2">
                    {/* Due Now */}
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            handleDueNowClick();
                        }}
                        className="flex flex-col items-start justify-center gap-0.5 px-4 py-2 bg-gradient-to-r from-[#e30a5f] to-[#c1084d] rounded-lg text-white hover:shadow-lg transition-all hover:-translate-y-0.5 will-change-transform disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={loading || error}
                    >
                        <div className="font-medium text-sm">Due Now</div>
                        <div className="text-2xl font-bold flex items-center">
                            {loading ? '-' : error ? '0' : stats.dueNow}
                            <LuRepeat className="ml-1.5 text-2xl opacity-70 transform-none" />
                        </div>
                        {error && <div className="text-xs opacity-75">Error loading</div>}
                    </button>

                    {/* Learn New */}
                    {stats.learnNew === 0 && !loadingNewItems ? (
                        <div className="flex flex-col items-start justify-center gap-0.5 px-4 py-2 bg-gradient-to-r from-[#667eea] to-[#764ba2] rounded-lg border-2 border-green-500 text-green-500">
                            <div className="font-medium text-sm">Learn New</div>
                            <div className="text-2xl font-bold flex items-center">{loadingNewItems ? '-' : stats.learnNew}<FaPlus className="ml-1.5 text-xl opacity-70 transform-none" /></div>

                        </div>
                    ) : (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                handleLearnNewClick();
                            }}
                            className="flex flex-col items-start justify-center gap-0.5 px-4 py-2 bg-gradient-to-r from-[#667eea] to-[#764ba2] rounded-lg text-white hover:shadow-lg transition-all hover:-translate-y-0.5 will-change-transform"
                        >
                            <div className="font-medium text-sm">Learn New</div>
                            <div className="text-2xl font-bold flex items-center">{loadingNewItems ? '-' : stats.learnNew}<FaPlus className="ml-1.5 text-xl opacity-70 transform-none" /></div>
                        </button>
                    )}
                </div>

                {/* Open Dashboard Button */}
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        handleDashboardClick();
                    }}
                    className="flex-1 flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-gray-100 to-gray-50 dark:from-gray-700 dark:to-gray-600 rounded-lg border-2 border-gray-300 dark:border-gray-500 hover:border-gray-400 dark:hover:border-gray-400 hover:shadow-md transition-all hover:-translate-y-0.5 min-w-0 will-change-transform"
                >
                    <MdDashboard className="w-8 h-8 text-gray-700 dark:text-gray-200 flex-shrink-0" />
                    <div className="flex-1 text-left min-w-0">
                        <div className="text-md hidden sm:block text-gray-900 dark:text-white font-semibold">
                            Open Dashboard
                        </div>

                    </div>
                    <FaArrowRight className="w-5 h-5 text-gray-500 dark:text-gray-300 flex-shrink-0" />
                </button>
            </div>
        </div>
    );
}