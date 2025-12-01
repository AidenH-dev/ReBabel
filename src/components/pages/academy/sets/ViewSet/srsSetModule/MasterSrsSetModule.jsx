import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { FaPlus, FaCheck } from 'react-icons/fa';
import { FaArrowRight } from 'react-icons/fa6';
import { LuRepeat } from "react-icons/lu";
import { PiClockClockwiseBold } from 'react-icons/pi';
import { IoSettingsSharp } from 'react-icons/io5';
import { TbSettings } from 'react-icons/tb';

export default function SRSDashboard({ setId, setData}) {
    const router = useRouter();
    const [stats, setStats] = useState({
        dueNow: 0,
        learnNew: 0,
        totalSRItems: 0,
        totalSetItems: 0,
        completedItems: 0
    });
    const [loading, setLoading] = useState(true);
    const [loadingNewItems, setLoadingNewItems] = useState(true);
    const [loadingSetCompletion, setLoadingSetCompletion] = useState(true);
    const [error, setError] = useState(null);
    const [newItemsError, setNewItemsError] = useState(null);
    const [nextDueTime, setNextDueTime] = useState(null);
    const [countdown, setCountdown] = useState('');
    const [learnNewLeftLimit, setLearnNewLeftLimit] = useState(0);

    // SRS time intervals for each level (matching API backend)
    const SRS_TIME_FACTORS = {
        1: 10 * 60 * 1000,        // 10 minutes
        2: 1 * 24 * 60 * 60 * 1000,   // 1 day
        3: 3 * 24 * 60 * 60 * 1000,   // 3 days
        4: 7 * 24 * 60 * 60 * 1000,   // 7 days
        5: 14 * 24 * 60 * 60 * 1000,  // 14 days
        6: 30 * 24 * 60 * 60 * 1000,  // 30 days
        7: 60 * 24 * 60 * 60 * 1000,  // 60 days
        8: 120 * 24 * 60 * 60 * 1000, // 120 days
        9: 180 * 24 * 60 * 60 * 1000, // 180 days (6 months)
    };

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

    // Fetch new items count and total items
    useEffect(() => {
        const fetchNewItemsCount = async () => {
            if (!setId) {
                setLoadingNewItems(false);
                return;
            }

            try {
                setLoadingNewItems(true);
                setNewItemsError(null);

                console.log('SET TYPE RESPONSE:',  setData.set_type);

                // First, check the daily learning limit
                const dayLimitResponse = await fetch(
                    `/api/database/v2/srs/set/learn/day-limit/${setId}?limit=5&vocab_or_grammar=${setData.set_type}`
                );

                if (!dayLimitResponse.ok) {
                    throw new Error(`Failed to fetch daily limit: ${dayLimitResponse.statusText}`);
                }

                const dayLimitData = await dayLimitResponse.json();

                if (!dayLimitData.success) {
                    throw new Error(dayLimitData.error || 'Failed to check daily limit');
                }

                // Check if daily limit has been reached
                const learnNewLeft = dayLimitData.data?.learn_new_left || 0;
                setLearnNewLeftLimit(learnNewLeft);

                if (learnNewLeft <= 0) {
                    // Daily limit reached, show 0 items available
                    setStats(prevStats => ({
                        ...prevStats,
                        learnNew: 0
                    }));
                    setNewItemsError('Daily learning limit reached. Come back tomorrow!');
                } else {
                    // Use a limit of 1 to check if there are ANY new items available
                    const response = await fetch(`/api/database/v2/srs/set/learn/${setId}?limit=1`);

                    if (!response.ok) {
                        throw new Error(`Failed to fetch new items: ${response.statusText}`);
                    }

                    const data = await response.json();

                    if (data.success && data.data?.items) {
                        // Fetch with limit of 5 (capped display) but respecting daily limit
                        const fetchLimit = Math.min(5, learnNewLeft);
                        const countResponse = await fetch(`/api/database/v2/srs/set/learn/${setId}?limit=${fetchLimit}`);
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

    // Calculate next due time from all items in the set
    useEffect(() => {
        const calculateNextDueTime = async () => {
            if (!setId) {
                return;
            }

            try {
                // Fetch all items in the set to calculate next due time
                const response = await fetch(`/api/database/v2/srs/set/${setId}`);

                if (!response.ok) {
                    setNextDueTime(null);
                    return;
                }

                const data = await response.json();

                if (!data.success || !data.data?.items || !Array.isArray(data.data.items)) {
                    setNextDueTime(null);
                    return;
                }

                let earliestDueTime = null;

                // Calculate when each item will be due and find the earliest
                for (const item of data.data.items) {
                    if (!item.srs || !item.srs.time_created || !item.srs.srs_level) {
                        continue;
                    }

                    const srsLevel = parseInt(item.srs.srs_level, 10);
                    const timeFactor = SRS_TIME_FACTORS[srsLevel];

                    if (!timeFactor) {
                        continue;
                    }

                    const timeCreated = new Date(item.srs.time_created);
                    const dueTime = new Date(timeCreated.getTime() + timeFactor);

                    if (!earliestDueTime || dueTime < earliestDueTime) {
                        earliestDueTime = dueTime;
                    }
                }

                setNextDueTime(earliestDueTime);
            } catch (err) {
                console.error('Error calculating next due time:', err);
                setNextDueTime(null);
            }
        };

        calculateNextDueTime();
    }, [setId]);

    // Fetch full set data to calculate accurate completion progress
    useEffect(() => {
        const fetchSetCompletion = async () => {
            if (!setId) {
                setLoadingSetCompletion(false);
                return;
            }

            try {
                setLoadingSetCompletion(true);
                const response = await fetch(`/api/database/v2/srs/set/${setId}`);

                if (!response.ok) {
                    throw new Error(`Failed to fetch set data: ${response.statusText}`);
                }

                const data = await response.json();

                if (data.success && data.data?.items && Array.isArray(data.data.items)) {
                    const totalItems = data.data.items.length;
                    // Count items that have an srs property (completed/started items)
                    const completedItems = data.data.items.filter(item => item.srs).length;
                    console.log('Set Completion:', completedItems, '/', totalItems);
                    setStats(prevStats => ({
                        ...prevStats,
                        totalSetItems: totalItems,
                        completedItems: completedItems
                    }));
                }
            } catch (err) {
                console.error('Error fetching set completion data:', err);
            } finally {
                setLoadingSetCompletion(false);
            }
        };

        fetchSetCompletion();
    }, [setId]);

    // Update countdown every second
    useEffect(() => {
        if (!nextDueTime) {
            setCountdown('--:--');
            return;
        }

        const updateCountdown = () => {
            const now = new Date();
            const diff = nextDueTime - now;

            if (diff <= 0) {
                setCountdown('0h 0m');
                return;
            }

            const hours = Math.floor(diff / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

            setCountdown(`${hours}h ${minutes}m`);
        };

        updateCountdown();
        const interval = setInterval(updateCountdown, 1000);

        return () => clearInterval(interval);
    }, [nextDueTime]);

    const handleDueNowClick = () => {
        if (stats.dueNow > 0) {
            router.push(`/learn/academy/sets/study/${setId}/srs/due-now`);
        }
    };

    const handleLearnNewClick = () => {
        if (learnNewLeftLimit > 0) {
            const limitToUse = Math.min(5, learnNewLeftLimit);
            router.push(`/learn/academy/sets/study/${setId}/srs/learn-new?limit=${limitToUse}`);
        }
    };

    const handleDashboardClick = () => {
        console.log('Opening SRS Dashboard...');
        // Open in new window or navigate
        router.push(`/learn/academy/sets/study/${setId}/srs/dashboard`);
    };

    const handleSettingsClick = () => {
        console.log('Opening SRS Settings...');
        // TODO: Navigate to settings page
    };

    return (
        <div
            className="sm:mb-3 w-full h-fit sm:h-40 group relative p-3 bg-white dark:bg-[#1c2b35] rounded-lg border border-black/5 dark:border-white/10 transition-all shadow-sm flex flex-col"
        >
            {/* SRS Dashboard Button - replaces "Spaced Repetition" heading */}
            <div className="flex gap-2 mb-2">
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        handleDashboardClick();
                    }}
                    className="flex-1 flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-gray-100 to-gray-50 dark:from-gray-700 dark:to-gray-600 rounded-lg border-2 border-gray-300 dark:border-gray-500 hover:border-gray-400 dark:hover:border-gray-400 hover:shadow-md transition-all hover:-translate-y-0.5 will-change-transform" 
                >
                    <PiClockClockwiseBold className="text-gray-700 dark:text-gray-200 flex-shrink-0 text-lg" />
                    <div className="flex-1 text-left flex items-center gap-1">
                        <span className="text-md sm:text-lg text-gray-900 dark:text-white font-semibold">
                            SRS Dashboard
                        </span>
                        {countdown && (
                            <span className="sm:pl-1 text-xs sm:text-sm text-gray-600 dark:text-gray-400 font-medium">
                                Next due in: <span className='text-green-500'>{countdown}</span>
                            </span>
                        )}
                    </div>
                    <FaArrowRight className="w-5 h-5 text-gray-500 dark:text-gray-300 flex-shrink-0" />
                </button>

                {/* Settings Button 
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        handleSettingsClick();
                    }}
                    className="flex-shrink-0 flex items-center justify-center p-2 sm:p-2.5 bg-gray-100 shadow-sm dark:bg-gray-700 rounded-lg transition-all hover:-translate-y-0.5 will-change-transform"
                    title="SRS Settings"
                >
                    <TbSettings className="h-6 w-6 sm:w-full sm:h-full text-gray-700 dark:text-gray-200" />
                </button>*/}
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
                        className="h-full flex flex-col items-start justify-center gap-0.5 px-4 py-2 bg-gradient-to-r from-[#e30a5f] to-[#c1084d] rounded-lg text-white hover:shadow-lg transition-all hover:-translate-y-0.5 will-change-transform disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={loading || error}
                    >
                        <div className="hidden sm:inline font-medium text-sm">Due Now</div>
                        <div className="text-2xl font-bold flex items-center">
                            {loading ? '-' : error ? '0' : stats.dueNow}
                            <LuRepeat className="ml-1.5 text-2xl opacity-70 transform-none" />
                        </div>
                        {error && <div className="text-xs opacity-75">Error loading</div>}
                    </button>

                    {/* Learn New */}
                    {(stats.learnNew === 0 || learnNewLeftLimit === 0) && !loadingNewItems ? (
                        <div className="h-full flex flex-col items-start justify-center gap-0.5 px-4 py-2 bg-gradient-to-r from-[#667eea] to-[#764ba2] rounded-lg border-2 border-green-500 text-green-500">
                            <div className="hidden sm:flex font-medium text-sm">Learn New</div>
                            <div className="text-2xl font-bold flex items-center">{loadingNewItems ? '-' : stats.learnNew}<FaPlus className="ml-1.5 text-xl opacity-70 transform-none" /></div>

                        </div>
                    ) : (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                handleLearnNewClick();
                            }}
                            className="h-full flex flex-col items-start justify-center gap-0.5 px-4 py-2 bg-gradient-to-r from-[#667eea] to-[#764ba2] rounded-lg text-white hover:shadow-lg transition-all hover:-translate-y-0.5 will-change-transform disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={learnNewLeftLimit === 0}
                        >
                            <div className="hidden sm:flex font-medium text-sm">Learn New</div>
                            <div className="text-2xl font-bold flex items-center">{loadingNewItems ? '-' : stats.learnNew}<FaPlus className="ml-1.5 text-xl opacity-70 transform-none" /></div>
                        </button>
                    )}
                </div>

                {/* Set Completion Progress */}
                <div className="flex-1 bg-gray-50 dark:bg-[#1d2a32] rounded-lg border border-black/5 dark:border-white/10 p-3 flex flex-col justify-between">
                    <div className="text-xs text-gray-600 dark:text-gray-400 font-medium mb-1">
                        Learn New Completed
                    </div>

                    {/* Progress Bar and Count - Inline */}
                    <div className="flex-1 flex items-center gap-3">
                        {/* Completion Text */}
                        <div className="flex-shrink-0">
                            <span className="text-sm font-semibold text-gray-900 dark:text-white">
                                {stats.totalSetItems > 0 ? `${stats.completedItems}/${stats.totalSetItems}` : '0/0'}
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">
                                ({stats.totalSetItems > 0 ? Math.round((stats.completedItems / stats.totalSetItems) * 100) : 0}%)
                            </span>
                        </div>

                        {/* Progress Bar */}
                        <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                            <div
                                className="bg-gradient-to-r from-[#e30a5f] to-[#c1084d] h-full rounded-full transition-all duration-300"
                                style={{
                                    width: `${stats.totalSetItems > 0 ? ((stats.completedItems / stats.totalSetItems) * 100) : 0}%`
                                }}
                            ></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}