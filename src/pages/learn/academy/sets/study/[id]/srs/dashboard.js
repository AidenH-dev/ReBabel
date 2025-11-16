// pages/learn/academy/sets/study/[id]/srs/dashboard.js

/**
 * SRS Dashboard - Minimal Time Grid Week View
 *
 * Displays upcoming SRS items in a minimal custom-built weekly time grid.
 * Shows all items scheduled for review in a vertically scrollable
 * calendar view with hourly time slots.
 *
 * Responsibilities:
 * - Fetches SRS items from /api/database/v2/srs/set/[setId]
 * - Transforms scheduled items into grid positions
 * - Displays minimal custom time grid with borders
 * - Handles vertical scrolling for 24-hour view
 */

// ============================================================================
// IMPORTS
// ============================================================================

import Head from "next/head";
import MainSidebar from "@/components/Sidebars/AcademySidebar";
import {
    TimeGridWeek,
    useSrsTimeGrid,
} from "@/components/SRS/visuals/SrsTimeGrid";
import { withPageAuthRequired } from "@auth0/nextjs-auth0";
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { TbStack2 } from "react-icons/tb";

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function SRSDashboard() {
    const router = useRouter();
    const { id } = router.query;

    // ============================================================================
    // STATE MANAGEMENT
    // ============================================================================

    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [setTitle, setSetTitle] = useState("SRS Dashboard");
    const [debugInfo, setDebugInfo] = useState(null);

    // Use the SRS Time Grid controller hook for state management
    const { items, currentTime, weekDays, setApiItems } = useSrsTimeGrid();

    // ============================================================================
    // DATA FETCHING
    // ============================================================================

    useEffect(() => {
        if (!id) return;

        const fetchSrsItems = async () => {
            setIsLoading(true);
            setError(null);

            try {
                const response = await fetch(`/api/database/v2/srs/set/${id}`);

                if (!response.ok) {
                    throw new Error(`Failed to fetch SRS items: ${response.statusText}`);
                }

                const result = await response.json();

                if (!result.success || !result.data) {
                    throw new Error(result.error || "Failed to load SRS items");
                }

                console.log("SRS Result:", result);

                const apiData = result.data;
                console.log("SRS API Data:", apiData);
                const apiItems = apiData.items || [];
                const setTitleFromAPI = apiData.set.title || "No Title Found";
                setSetTitle(setTitleFromAPI);

                console.log("API Items count:", apiItems.length);
                console.log("Sample API Item:", apiItems[0]);

                // Store debug info
                setDebugInfo({
                    itemsCount: apiItems.length,
                    sampleItem: apiItems[0],
                    rawData: result,
                });

                // Transform items using the controller hook
                // All transformation logic (filtering, formatting, calculating next review dates) is handled by the hook
                setApiItems(apiItems);
            } catch (err) {
                console.error("Error fetching SRS items:", err);
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };

        fetchSrsItems();
    }, [id]);

    // ============================================================================
    // MAIN RENDER
    // ============================================================================

    const renderContent = () => {
        if (isLoading) {
            return (
                <div className="flex items-center justify-center h-full">
                    <div className="text-gray-600 dark:text-gray-400">Loading SRS items...</div>
                </div>
            );
        }

        if (error) {
            return (
                <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                        <div className="text-red-600 dark:text-red-400 font-semibold mb-2">
                            Error Loading SRS Dashboard
                        </div>
                        <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
                        <button
                            onClick={() => router.push(`/learn/academy/sets/study/${id}`)}
                            className="px-4 py-2 bg-[#e30a5f] text-white rounded-lg hover:bg-[#c00950] transition-colors"
                        >
                            Back to Set
                        </button>
                    </div>
                </div>
            );
        }

        // Debug: Show if items are loaded
        if (items.length === 0) {
            return (
                <div className="flex items-center justify-center h-full p-6">
                    <div className="text-center max-w-2xl">
                        <div className="text-gray-600 dark:text-gray-400 font-semibold mb-4">
                            No SRS items scheduled
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-500 mb-6">
                            There are no items due for review
                        </p>

                        {/*debugInfo && (
                            <div className="bg-gray-100 dark:bg-gray-900 rounded p-4 text-left text-xs font-mono overflow-auto max-h-96 border border-gray-300 dark:border-gray-700">
                                <div className="text-gray-700 dark:text-gray-300 mb-2">
                                    <strong>API Debug Info:</strong>
                                </div>
                                <div className="text-gray-600 dark:text-gray-400">
                                    <p>Items returned: {debugInfo.itemsCount}</p>
                                    <p className="mt-2">Sample item:</p>
                                    <pre className="bg-gray-200 dark:bg-gray-800 p-2 rounded overflow-auto text-xs">
                                        {JSON.stringify(debugInfo.sampleItem, null, 2)}
                                    </pre>
                                    <p className="mt-2">Full response:</p>
                                    <pre className="bg-gray-200 dark:bg-gray-800 p-2 rounded overflow-auto text-xs">
                                        {JSON.stringify(debugInfo.rawData, null, 2)}
                                    </pre>
                                </div>
                            </div>
                        )*/}
                    </div>
                </div>
            );
        }

        return (
            <div className="p-4 h-full">
                <TimeGridWeek
                    items={items}
                    currentTime={currentTime}
                    weekDays={weekDays}
                />
            </div>
        );
    };

    return (
        <div className="flex h-screen min-h-0 bg-gray-50 dark:bg-[#141f25]">
            {/* Left sidebar navigation */}
            <MainSidebar />

            {/* Main content area */}
            <main className="ml-auto flex-1 flex flex-col min-h-0 overflow-hidden">
                {/* Page metadata */}
                <Head>
                    <title>{setTitle} - SRS Dashboard</title>
                    <link rel="icon" href="/favicon.ico" />
                </Head>

                {/* Header */}
                <div className="border-b border-gray-300 dark:border-gray-700 px-6 py-4 bg-white dark:bg-[#1a2834] flex-shrink-0">
                    <div className="flex items-center justify-between">
                        <div className=" ">
                            <div className="flex items-center">
                                <button
                                    onClick={(e) => {
                                        router.push(`/learn/academy/sets/study/${id}`)
                                    }}
                                    className="hidden sm:flex mr-2 flex-1 items-center gap-2 px-3 py-1 bg-gradient-to-r from-gray-100 to-gray-50 dark:from-gray-700 dark:to-gray-600 rounded-lg border-2 border-gray-300 dark:border-gray-500 hover:border-gray-400 dark:hover:border-gray-400 hover:shadow-md transition-all hover:-translate-y-0.5 will-change-transform" // hover:border-gray-400 dark:hover:border-gray-400 hover:shadow-md transition-all hover:-translate-y-0.5 will-change-transform
                                >
                                    <TbStack2 className="text-gray-700 dark:text-gray-200 flex-shrink-0 text-lg" />
                                    <div className="flex-1 text-left flex items-center gap-1">
                                        <span className="text-md sm:text-lg text-gray-900 dark:text-white font-semibold">
                                            {setTitle}
                                        </span>
                                    </div>

                                </button>
                                <h1 className=" ml-10 sm:ml-0 text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                                    SRS Dashboard
                                </h1>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-xl sm:text-3xl font-bold text-[#e30a5f]">
                                {String(currentTime.getHours()).padStart(2, '0')}:{String(currentTime.getMinutes()).padStart(2, '0')}
                            </div>
                            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                                {currentTime.toLocaleDateString('en-US', {
                                    weekday: 'long',
                                    month: 'short',
                                    day: 'numeric',
                                })}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Calendar container - scrollable */}
                <div className="flex-1 min-h-0 overflow-hidden">
                    {renderContent()}
                </div>
                <div className="flex sm:hidden border-b border-gray-300 dark:border-gray-700 px-6 py-4 bg-white dark:bg-[#1a2834] flex-shrink-0">
                    <div className="flex sm:items-center justify-end sm:justify-between"></div>
                    <div className="">
                        <div className="flex items-center">
                            <button
                                onClick={(e) => {
                                }}
                                className="mr-2 flex-1 flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-gray-100 to-gray-50 dark:from-gray-700 dark:to-gray-600 rounded-lg border-2 border-gray-300 dark:border-gray-500 " // hover:border-gray-400 dark:hover:border-gray-400 hover:shadow-md transition-all hover:-translate-y-0.5 will-change-transform
                            >
                                <TbStack2 className="text-gray-700 dark:text-gray-200 flex-shrink-0 text-lg" />
                                <div className="flex-1 text-left flex items-center gap-1">
                                    <span className="text-md sm:text-lg text-gray-900 dark:text-white font-semibold">
                                        Return to {setTitle}
                                    </span>
                                </div>

                            </button>
                        </div>
                    </div>
                </div>
            </main >
        </div >
    );
}

// ============================================================================
// SERVER-SIDE AUTHENTICATION
// ============================================================================

// Protect this page - requires authentication via Auth0
export const getServerSideProps = withPageAuthRequired();