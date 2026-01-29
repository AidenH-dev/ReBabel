import Head from "next/head";
import AcademySidebar from "@/components/Sidebars/AcademySidebar";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { withPageAuthRequired } from "@auth0/nextjs-auth0";
import { useRouter } from "next/router";
import { FaPlus } from "react-icons/fa";
import { FiSearch, FiGrid, FiList, FiPlay, FiExternalLink } from "react-icons/fi";
import { LuTextCursorInput } from "react-icons/lu";
import { BeginnerPackPopup } from "@/components/popups/sets/newUserPopup";
import { LuAlarmClock } from "react-icons/lu";
import ConfigPanelView from "@/components/Practice/Premium/Features/Translate/Configuration/views/ConfigPanelView";
import CardSwapCustomItemModal from "@/components/Practice/Premium/Features/Translate/Configuration/views/CardSwapCustomItemModal";
import { usePremium } from "@/contexts/PremiumContext";

export default function VocabularyDashboard() {
    // Premium context for session gating
    const { canStartSession, sessionsRemaining, dailyLimit, isPremium, incrementSessionCount } = usePremium();

    // Tabs: "srs" | "translate" | "groups"
    const [activeTab, setActiveTab] = useState("translate");

    // Search inputs
    const [searchSets, setSearchSets] = useState("");

    // UI state
    const [sortKey, setSortKey] = useState("recent"); // recent | az | size
    const [view, setView] = useState("grid"); // grid | list
    const [showAll, setShowAll] = useState(false);

    const [userProfile, setUserProfile] = useState(null);
    const [recentsSets, setRecentsSets] = useState([]);
    const [isLoadingSets, setIsLoadingSets] = useState(true);

    const [showBeginnerPopup, setShowBeginnerPopup] = useState(false);

    // Selection state for translate practice
    // POOLS - What's available to practice from
    const [grammarPool, setGrammarPool] = useState({
        sets: [],           // Array of set objects { id, name, set_type, item_num }
        items: [],          // Array of individual items added (from database or manual entry)
    });

    const [vocabPool, setVocabPool] = useState({
        sets: [],
        items: [],
    });

    // FOCAL POINTS - Specific items user wants to focus on (from pools)
    const [grammarFocalPoints, setGrammarFocalPoints] = useState([]); // Array of item IDs
    const [vocabFocalPoints, setVocabFocalPoints] = useState([]);     // Array of item IDs

    // Card swap modal state
    const [showCustomItemModal, setShowCustomItemModal] = useState({
        vocabulary: false,
        grammar: false
    });

    const router = useRouter();
    const searchRef = useRef(null);

    // Keyboard: focus search with '/'
    useEffect(() => {
        const onKey = (e) => {
            if (e.key === "/" && !e.metaKey && !e.ctrlKey && !e.altKey) {
                e.preventDefault();
                searchRef.current?.focus();
            }
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, []);

    // Fetch the Auth0 user profile on mount.
    useEffect(() => {
        const fetchUserProfile = async () => {
            try {
                const response = await fetch("/api/auth/me");
                const profile = await response.json();
                setUserProfile(profile);
            } catch (error) {
                console.error("Error fetching user profile:", error);
            }
        };
        fetchUserProfile();
    }, []);

    // Once the user profile is loaded, fetch the user sets from Supabase.
    useEffect(() => {
        const fetchUserSets = async () => {
            if (!(userProfile && userProfile.sub)) return;
            setIsLoadingSets(true);
            try {
                const response = await fetch(
                    `/api/database/v2/sets/retrieve-list/${encodeURIComponent(userProfile.sub)}`
                );

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const result = await response.json();

                if (!result.success) {
                    throw new Error(result.error || "Failed to fetch user sets");
                }

                const formattedData = result.data.sets.map((record) => ({
                    id: record.entity_id,
                    name: record.data.title || "Untitled Set",
                    item_num: record.data.item_num,
                    date: record.data.date_created || record.data.updated_at,
                    path: `/learn/academy/set/study/${record.entity_id}`,
                    set_type: record.data.set_type || null,
                }));

                formattedData.sort((a, b) => new Date(b.date) - new Date(a.date));
                setRecentsSets(formattedData);
            } catch (error) {
                console.error("Error fetching user sets:", error);
                setRecentsSets([]);
            } finally {
                setIsLoadingSets(false);
            }
        };
        fetchUserSets();
    }, [userProfile]);

    useEffect(() => {
        if (!isLoadingSets && recentsSets.length === 0 && userProfile) {
            setShowBeginnerPopup(true);
        }
    }, [isLoadingSets, recentsSets, userProfile]);

    // Helpers
    const fixDateString = (dateString) => {
        if (!dateString) return dateString;
        let fixed = dateString.replace(" ", "T");
        fixed = fixed.replace(/(\.\d{3})\d+/, "$1");
        fixed = fixed.replace(/([+-]\d\d)$/, "$1:00");
        return fixed;
    };

    const formatDate = (dateString) => {
        if (!dateString) return "Unknown date";
        const d = new Date(fixDateString(dateString));
        return isNaN(d)
            ? "Unknown date"
            : new Intl.DateTimeFormat("en-US", {
                month: "short",
                day: "2-digit",
                year: "numeric",
            }).format(d);
    };

    // Derived views
    const filteredSets = recentsSets.filter((s) =>
        s.name.toLowerCase().includes(searchSets.toLowerCase())
    );

    const sortedSets = [...filteredSets].sort((a, b) => {
        if (sortKey === "az") return a.name.localeCompare(b.name);
        if (sortKey === "size") return (b.item_num || 0) - (a.item_num || 0);
        return new Date(b.date) - new Date(a.date);
    });

    const visibleSets = showAll ? sortedSets : sortedSets.slice(0, 8);

    // Selection handlers for translate practice

    // Open custom item modal (triggered by plus button)
    const handleOpenAddModal = (category) => {
        setShowCustomItemModal(prev => ({
            ...prev,
            [category]: true
        }));
    };

    // Handle set selection from react-select dropdown
    const handleSelectSet = async (setId, category) => {
        if (!setId) return;

        try {
            // Find the set from recentsSets
            const selectedSet = recentsSets.find(s => s.id === setId);
            if (!selectedSet) return;

            // Add to appropriate pool
            if (category === 'grammar') {
                setGrammarPool(prev => ({
                    ...prev,
                    sets: [...prev.sets, selectedSet]
                }));
            } else {
                setVocabPool(prev => ({
                    ...prev,
                    sets: [...prev.sets, selectedSet]
                }));
            }
        } catch (error) {
            console.error("Error selecting set:", error);
        }
    };

    // Confirm custom item from card swap modal
    const handleConfirmCustomItems = (items, category) => {
        if (category === 'grammar') {
            setGrammarPool(prev => ({
                ...prev,
                items: [...prev.items, ...items]
            }));
        } else {
            setVocabPool(prev => ({
                ...prev,
                items: [...prev.items, ...items]
            }));
        }

        setShowCustomItemModal(prev => ({
            ...prev,
            [category]: false
        }));
    };

    // Remove set from pool
    const handleRemoveSet = (setId, category) => {
        if (category === 'grammar') {
            setGrammarPool(prev => ({
                ...prev,
                sets: prev.sets.filter(s => s.id !== setId)
            }));
        } else {
            setVocabPool(prev => ({
                ...prev,
                sets: prev.sets.filter(s => s.id !== setId)
            }));
        }
    };

    // Remove individual item from pool
    const handleRemoveItem = (itemId, category) => {
        if (category === 'grammar') {
            setGrammarPool(prev => ({
                ...prev,
                items: prev.items.filter(i => i.id !== itemId)
            }));
            // Remove from focal points by comparing objects
            setGrammarFocalPoints(prev => prev.filter(fp =>
                !(fp.id === itemId || (fp.title && fp.title === itemId))
            ));
        } else {
            setVocabPool(prev => ({
                ...prev,
                items: prev.items.filter(i => i.id !== itemId)
            }));
            setVocabFocalPoints(prev => prev.filter(fp =>
                !(fp.id === itemId || (fp.english && fp.english === itemId))
            ));
        }
    };

    // Add focal point tag
    const handleAddFocalPoint = (item, category) => {
        if (category === 'grammar') {
            setGrammarFocalPoints(prev => {
                // Check if already exists (compare by content for custom items)
                const exists = prev.some(fp =>
                    (fp.id && item.id && fp.id === item.id) ||
                    (fp.title === item.title && fp.description === item.description)
                );
                if (exists || prev.length >= 2) return prev;
                return [...prev, item]; // Store FULL OBJECT
            });
        } else {
            setVocabFocalPoints(prev => {
                const exists = prev.some(fp =>
                    (fp.id && item.id && fp.id === item.id) ||
                    (fp.english === item.english && fp.kana === item.kana)
                );
                if (exists || prev.length >= 10) return prev;
                return [...prev, item]; // Store FULL OBJECT
            });
        }
    };

    // Remove focal point tag
    const handleRemoveFocalPoint = (itemId, category) => {
        if (category === 'grammar') {
            setGrammarFocalPoints(prev => prev.filter(fp => {
                // Match by ID if both have IDs, otherwise match by content
                if (fp.id && itemId) return fp.id !== itemId;
                return !(fp.title === itemId || fp.id === itemId);
            }));
        } else {
            setVocabFocalPoints(prev => prev.filter(fp => {
                if (fp.id && itemId) return fp.id !== itemId;
                return !(fp.english === itemId || fp.id === itemId);
            }));
        }
    };

    // Shuffle: randomly pick max focal points from each pool
    const handleShuffleFocalPoints = () => {
        const shuffleAndPick = (arr, max) => {
            const shuffled = [...arr].sort(() => Math.random() - 0.5);
            return shuffled.slice(0, max);
        };

        setVocabFocalPoints(shuffleAndPick(poolItems.vocab, 10));
        setGrammarFocalPoints(shuffleAndPick(poolItems.grammar, 2));
    };

    // Clear all pools and focal points
    const handleClearAll = () => {
        setGrammarPool({ sets: [], items: [] });
        setVocabPool({ sets: [], items: [] });
        setGrammarFocalPoints([]);
        setVocabFocalPoints([]);
    };

    // Helper: Get all pool items (need to fetch from sets)
    const [poolItems, setPoolItems] = useState({ grammar: [], vocab: [] });

    useEffect(() => {
        const fetchPoolItems = async () => {
            try {
                // Fetch grammar pool items
                const grammarSetPromises = grammarPool.sets.map(set =>
                    fetch(`/api/database/v2/sets/retrieve-set/${set.id}`).then(r => r.json())
                );
                const grammarSetResults = await Promise.all(grammarSetPromises);

                const grammarItems = [...grammarPool.items];
                grammarSetResults.forEach(result => {
                    if (result.success) {
                        const items = result.data.data.items || [];
                        grammarItems.push(...items.filter(i => i.type === 'grammar'));
                    }
                });

                // Fetch vocab pool items
                const vocabSetPromises = vocabPool.sets.map(set =>
                    fetch(`/api/database/v2/sets/retrieve-set/${set.id}`).then(r => r.json())
                );
                const vocabSetResults = await Promise.all(vocabSetPromises);

                const vocabItems = [...vocabPool.items];
                vocabSetResults.forEach(result => {
                    if (result.success) {
                        const items = result.data.data.items || [];
                        vocabItems.push(...items.filter(i => i.type === 'vocabulary' || i.type === 'vocab'));
                    }
                });

                setPoolItems({ grammar: grammarItems, vocab: vocabItems });
            } catch (error) {
                console.error("Error fetching pool items:", error);
            }
        };

        if (grammarPool.sets.length > 0 || vocabPool.sets.length > 0) {
            fetchPoolItems();
        } else {
            setPoolItems({ grammar: grammarPool.items, vocab: vocabPool.items });
        }
    }, [grammarPool, vocabPool]);

    // Start practice session
    const handleStartPractice = async () => {
        try {
            // Check session limit
            if (!canStartSession) {
                alert(`You've used all ${dailyLimit} session${dailyLimit > 1 ? 's' : ''} for today. ${isPremium ? '' : 'Upgrade to Premium for 5 sessions per day!'}`);
                return;
            }

            // Validation
            if (grammarFocalPoints.length === 0 && vocabFocalPoints.length === 0) {
                alert("Select at least one focal point to practice");
                return;
            }

            setIsLoadingSets(true);

            // Use poolItems which already has all items combined from the useEffect
            // Prepare config object with full pool data and focal points
            const config = {
                pools: {
                    grammar: poolItems.grammar,
                    vocab: poolItems.vocab
                },
                focalPoints: {
                    grammar: grammarFocalPoints,  // Already full objects after Phase 1
                    vocab: vocabFocalPoints
                },
                sessionLength: 10
            };

            // Store config in sessionStorage before navigation
            sessionStorage.setItem('translate-practice-config', JSON.stringify(config));

            // Increment session count (optimistic update)
            incrementSessionCount();

            // Start session in database
            try {
                await fetch('/api/analytics/user/sessions/start', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ sessionType: 'translate' })
                });
            } catch (e) {
                console.error('Failed to record session start:', e);
            }

            // Navigate to session with simple query param
            router.push({
                pathname: '/learn/academy/practice/translate/session',
                query: { sessionLength: config.sessionLength }
            });

        } catch (error) {
            console.error("Error preparing session:", error);
            alert("Failed to start practice session. Please try again.");
        } finally {
            setIsLoadingSets(false);
        }
    };

    return (
        <div className="flex flex-row h-screen overflow-hidden bg-white dark:bg-[#141f25] text-[#222] dark:text-white">
            {/* Sidebar */}
            <AcademySidebar />

            {/* Main */}
            <main className="ml-auto flex-1 flex h-screen overflow-y-auto bg-gray-50 dark:bg-[#141f25] px-6 sm:px-10 mt-10 sm:mt-0">
                <div className="w-full flex min-h-full mx-5">
                    <div className="w-full max-w-6xl mx-auto py-8">
                        <BeginnerPackPopup
                            isOpen={showBeginnerPopup}
                            onClose={() => setShowBeginnerPopup(false)}
                            onImport={() => {
                                // After successful import, reload to show the new sets
                                window.location.reload();
                            }}
                            userProfile={userProfile}
                        />

                        <Head>
                            <title>Sets</title>
                            <link rel="icon" href="/favicon.ico" />
                        </Head>

                        {/* Top tabs */}
                        <div className="w-full">
                            <div className="border-b border-black/5 dark:border-white/10">
                                <div className="flex items-end gap-6 -mb-px h-10">
                                    <button
                                        onClick={() => setActiveTab("translate")}
                                        className={`pb-2 pt-1 px-1 text-sm font-medium focus:outline-none border-b-2 transition-colors
                                            ${activeTab === "translate"
                                                ? "text-[#e30a5f] border-[#e30a5f]"
                                                : "text-black/70 dark:text-white/80 border-transparent hover:text-black dark:hover:text-white hover:border-[#e30a5f]"
                                            }`}
                                    >
                                        <span className="inline-flex items-center gap-2">
                                            <LuTextCursorInput className="text-xl" />
                                            Translate
                                        </span>
                                    </button>
                                    <button
                                        onClick={() => setActiveTab("QuickTime")}
                                        className={`pb-2 pt-1 px-1 text-sm font-medium focus:outline-none border-b-2 transition-colors
                                            ${activeTab === "QuickTime"
                                                ? "text-[#e30a5f] border-[#e30a5f]"
                                                : "text-black/70 dark:text-white/80 border-transparent hover:text-black dark:hover:text-white hover:border-[#e30a5f]"
                                            }`}
                                    >
                                        <span className="inline-flex items-center gap-2">
                                            <LuAlarmClock className="text-xl" />
                                            QuickTime
                                        </span>
                                    </button>

                                </div>
                            </div>
                        </div>

                        {/* Content panel */}
                        <div className="w-full">
                            <section className="mt-3 rounded-2xl shadow-sm bg-white dark:bg-[#1c2b35] border border-black/5 dark:border-white/5 p-4 sm:p-6">
                                {/* Translate (formerly Sets) */}
                                {activeTab === "translate" && (
                                    <div className="flex flex-col gap-4">
                                        <div className="flex items-center justify-between">
                                            <h2 className="text-lg font-semibold tracking-tight text-[#0f1a1f] dark:text-white flex-1">
                                                Practice Scope
                                            </h2>
                                            <div className={`text-xs px-3 py-1.5 rounded-full ${sessionsRemaining > 0 ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'}`}>
                                                {sessionsRemaining}/{dailyLimit} sessions left today
                                            </div>
                                        </div>
                                        {/* Configuration Panel */}
                                        <ConfigPanelView
                                            grammarPool={grammarPool}
                                            vocabPool={vocabPool}
                                            grammarFocalPoints={grammarFocalPoints}
                                            vocabFocalPoints={vocabFocalPoints}
                                            poolItems={poolItems}
                                            canStart={
                                                (grammarPool.sets.length > 0 || grammarPool.items.length > 0) &&
                                                (vocabPool.sets.length > 0 || vocabPool.items.length > 0) &&
                                                (grammarFocalPoints.length > 0 || vocabFocalPoints.length > 0)
                                            }
                                            validationMessage={
                                                (grammarPool.sets.length === 0 && grammarPool.items.length === 0) ? "Please add grammar sets or items" :
                                                (vocabPool.sets.length === 0 && vocabPool.items.length === 0) ? "Please add vocabulary sets or items" :
                                                (grammarFocalPoints.length === 0 && vocabFocalPoints.length === 0) ? "Select at least one focal point to practice" :
                                                null
                                            }
                                            onOpenAddModal={handleOpenAddModal}
                                            onRemoveSet={handleRemoveSet}
                                            onRemoveItem={handleRemoveItem}
                                            onAddFocalPoint={handleAddFocalPoint}
                                            onRemoveFocalPoint={handleRemoveFocalPoint}
                                            onShuffle={handleShuffleFocalPoints}
                                            onClearAll={handleClearAll}
                                            onStartPractice={handleStartPractice}
                                            availableSets={recentsSets}
                                            onSelectSet={handleSelectSet}
                                        />


                                    </div>
                                )}
                            </section>

                            {/* Floating action button on mobile */}
                            {activeTab === "translate" && (
                                <button
                                    onClick={() => router.push("/learn/academy/sets/create")}
                                    className="sm:hidden fixed bottom-6 left-6 z-10 shadow-lg rounded-full p-4 bg-[#e30a5f] text-white focus:outline-none focus:ring-2 focus:ring-white/60"
                                    aria-label="Create new set"
                                >
                                    <FaPlus />
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </main>

            {/* Custom Item Card Swap Modals - Fixed Overlay */}
            {showCustomItemModal.vocabulary && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
                    <div className="bg-white dark:bg-[#1c2b35] rounded-xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
                        <div className="relative min-h-[400px] p-6">
                            <CardSwapCustomItemModal
                                category="vocabulary"
                                onConfirm={(items) => handleConfirmCustomItems(items, 'vocabulary')}
                                onClose={() => setShowCustomItemModal(prev => ({ ...prev, vocabulary: false }))}
                            />
                        </div>
                    </div>
                </div>
            )}
            {showCustomItemModal.grammar && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
                    <div className="bg-white dark:bg-[#1c2b35] rounded-xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
                        <div className="relative min-h-[400px] p-6">
                            <CardSwapCustomItemModal
                                category="grammar"
                                onConfirm={(items) => handleConfirmCustomItems(items, 'grammar')}
                                onClose={() => setShowCustomItemModal(prev => ({ ...prev, grammar: false }))}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function SetCard({ set, formatDate, isSelected, onSelect }) {
    const getTypeIndicator = () => {
        if (set.set_type === "vocab") {
            return { label: "Vocab", colorClass: "bg-blue-100 dark:bg-blue-900/30" };
        } else if (set.set_type === "grammar") {
            return { label: "Grammar", colorClass: "bg-green-100 dark:bg-green-900/30 " };
        } else {
            return { label: "V & G", colorClass: "bg-purple-100 dark:bg-purple-900/30" };
        }
    };

    const typeIndicator = getTypeIndicator();

    return (
        <div className={`group rounded-lg border ${isSelected ? 'border-[#e30a5f] ring-2 ring-[#e30a5f]/20' : 'border-black/5 dark:border-white/10'} bg-gray-50 dark:bg-[#1d2a32] p-3 transition-all hover:shadow-sm hover:-translate-y-px focus-within:ring-2 focus-within:ring-[#e30a5f] relative`}>
            {/* Checkbox */}
            <input
                type="checkbox"
                checked={isSelected}
                onChange={(e) => onSelect(set.id, e.target.checked)}
                className="absolute top-3 left-3 w-4 h-4 rounded border-gray-300 text-[#e30a5f] focus:ring-[#e30a5f] cursor-pointer"
            />

            <div className="flex items-start justify-between gap-3 ml-6">
                <div className="min-w-0 flex-1">
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white line-clamp-2">
                        {set.name}
                    </h4>
                </div>
                <span className="text-[11px] whitespace-nowrap text-black/60 dark:text-white/60">
                    {formatDate(set.date)}
                </span>
            </div>

            <div className="mt-1 flex items-center justify-between ml-6">
                <p className="text-xs text-black/60 dark:text-white/60">{set.item_num} Items</p>
                <div className={`text-xs px-2 py-1 rounded-full font-medium ${typeIndicator.colorClass}`}>
                    {typeIndicator.label}
                </div>
            </div>

            <div className="mt-3 ml-6 flex items-center gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                <Link
                    href={`/learn/academy/sets/study/${set.id}/quiz`}
                    className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md bg-black/5 dark:bg-white/10 hover:opacity-90"
                >
                    <FiPlay /> Study
                </Link>
                <Link
                    href={`/learn/academy/sets/study/${set.id}`}
                    className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md bg-black/5 dark:bg-white/10 hover:opacity-90"
                >
                    <FiExternalLink /> Open
                </Link>
            </div>
        </div>
    );
}

function SetRow({ set, formatDate, isSelected, onSelect }) {
    const getTypeIndicator = () => {
        if (set.set_type === "vocab") {
            return { label: "Vocab", colorClass: "bg-blue-100 dark:bg-blue-900/30" };
        } else if (set.set_type === "grammar") {
            return { label: "Grammar", colorClass: "bg-green-100 dark:bg-green-900/30 " };
        } else {
            return { label: "V & G", colorClass: "bg-purple-100 dark:bg-purple-900/30" };
        }
    };

    const typeIndicator = getTypeIndicator();

    return (
        <div className={`flex items-center justify-between gap-3 ${isSelected ? 'bg-[#e30a5f]/5' : 'bg-white/70 dark:bg-white/[0.02]'} px-3 py-2`}>
            {/* Checkbox */}
            <input
                type="checkbox"
                checked={isSelected}
                onChange={(e) => onSelect(set.id, e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-[#e30a5f] focus:ring-[#e30a5f] cursor-pointer"
            />

            <div className="min-w-0 flex-1">
                <div className="text-sm font-medium text-gray-900 dark:text-white truncate">{set.name}</div>
                <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-black/60 dark:text-white/60">{set.item_num} Items</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${typeIndicator.colorClass}`}>
                        {typeIndicator.label}
                    </span>
                </div>
            </div>

            <div className="hidden sm:block text-[11px] text-black/60 dark:text-white/60 whitespace-nowrap">
                {formatDate(set.date)}
            </div>

            <div className="flex items-center gap-2">
                <Link
                    href={`/learn/academy/sets/study/${set.id}/quiz`}
                    className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md bg-black/5 dark:bg-white/10 hover:opacity-90"
                >
                    <FiPlay /> Study
                </Link>
                <Link
                    href={`/learn/academy/sets/study/${set.id}`}
                    className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md bg-black/5 dark:bg-white/10 hover:opacity-90"
                >
                    <FiExternalLink /> Open
                </Link>
            </div>
        </div>
    );
}

export const getServerSideProps = withPageAuthRequired();
