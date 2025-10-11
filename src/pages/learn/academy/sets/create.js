// pages/learn/vocabulary/create-new-set.js
import Head from "next/head";
import MainSidebar from "../../../../components/Sidebars/AcademySidebar";
import { withPageAuthRequired } from "@auth0/nextjs-auth0";
import Link from "next/link";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/router";
import { FaPlus, FaTimes, FaCheck, FaTrash, FaSearch, FaFileImport, FaKeyboard, FaListUl } from "react-icons/fa";
import { FiSearch, FiUpload, FiPlus, FiX, FiCheck, FiAlertCircle } from "react-icons/fi";
import { toKana } from "wanakana";

export default function CreateNewSet() {
    const router = useRouter();

    // ----- User Profile -----
    const [userProfile, setUserProfile] = useState(null);
    useEffect(() => {
        const fetchUserProfile = async () => {
            try {
                const response = await fetch("/api/auth/me");
                const profile = await response.json();
                console.log(profile)
                setUserProfile(profile);
            } catch (error) {
                console.error("Error fetching user profile:", error);
            }
        };
        fetchUserProfile();
    }, []);

    // ----- State -----
    const [newSetName, setNewSetName] = useState("");
    const [proposedItems, setProposedItems] = useState([]);
    const [grammarTitleInputType, setGrammarTitleInputType] = useState("english"); // "english" | "kana"
    const [activeTab, setActiveTab] = useState("single");
    const [statusMessage, setStatusMessage] = useState("");
    const [statusType, setStatusType] = useState(""); // "success" | "error" | "info"
    const [itemType, setItemType] = useState("vocabulary"); // "vocabulary" | "grammar"

    // ----- Helpers -----
    const showStatus = useCallback((message, type = "info") => {
        setStatusMessage(message);
        setStatusType(type);
        setTimeout(() => {
            setStatusMessage("");
            setStatusType("");
        }, 3000);
    }, []);

    // ----- Import (Genki) -----
    const [genkiLesson, setGenkiLesson] = useState("");
    const [importChunk, setImportChunk] = useState([]);

    const handleImportChunk = useCallback(async (lessonNumber) => {
        if (!lessonNumber) {
            setImportChunk([]);
            return;
        }
        try {
            const res = await fetch(`/api/fetch-vocabulary?lesson=${lessonNumber}`);
            if (!res.ok) throw new Error("Failed to fetch Genki vocabulary.");
            const data = await res.json();
            setImportChunk(data || []);
            showStatus(`Loaded ${data.length} items from Genki Lesson ${lessonNumber}`, "success");
        } catch (error) {
            console.error("Error fetching Genki chunk:", error);
            showStatus("Error fetching Genki vocabulary.", "error");
        }
    }, [showStatus]);

    useEffect(() => {
        if (genkiLesson) handleImportChunk(genkiLesson);
    }, [genkiLesson, handleImportChunk]);

    const handleRemoveFromChunk = (index) => {
        setImportChunk((prev) => {
            const next = [...prev];
            next.splice(index, 1);
            return next;
        });
    };

    const handleAddChunkToProposed = () => {
        if (!importChunk.length) {
            showStatus("No items to add from the imported chunk.", "error");
            return;
        }
        const itemsToAdd = importChunk.map((item) => ({
            type: "vocabulary",
            english: item.English || "",
            kana: item["Japanese(Hiragana/Katakana)"] || item["Japanese (Hiragana/Katakana)"] || item.Japanese || "",
            kanji: "",
            lexical_category: "",
            example_sentences: "",
            tags: "",
            audio: ""
        }));
        const valid = itemsToAdd.filter(
            (x) => x.english?.trim() && x.kana?.trim()
        );
        setProposedItems((prev) => [...prev, ...valid]);
        setImportChunk([]);
        setGenkiLesson("");
        showStatus(`Added ${valid.length} items to your set!`, "success");
    };

    // ----- Single -----
    const [singleForm, setSingleForm] = useState({
        english: "",
        kana: "",
        kanji: "",
        lexical_category: "",
        example_sentences: "",
        tags: "",
        audio: ""
    });

    // ----- Grammar Form -----
    const [grammarForm, setGrammarForm] = useState({
        title: "",
        description: "",
        topic: "",
        notes: "",
        example_sentences: "",
        tags: ""
    });

    // Handler for set name
    const handleSetNameChange = (e) => {
        setNewSetName(e.target.value);
    };

    const handleSingleFormChange = (field, value) => {
        // Apply wanakana conversion for kana and kanji fields
        if (field === "kana" || field === "kanji") {
            setSingleForm(prev => ({ ...prev, [field]: toKana(value, { IMEMode: true }) }));
        } else {
            setSingleForm(prev => ({ ...prev, [field]: value }));
        }
    };

    const handleGrammarFormChange = (field, value) => {
        // Apply wanakana conversion for title field when in kana mode
        if (field === "title" && grammarTitleInputType === "kana") {
            setGrammarForm(prev => ({ ...prev, [field]: toKana(value, { IMEMode: true }) }));
        } else {
            setGrammarForm(prev => ({ ...prev, [field]: value }));
        }
    };

    // Handle switching grammar title input type - clear field to prevent mixed input
    const handleGrammarTitleTypeSwitch = (type) => {
        setGrammarTitleInputType(type);
        setGrammarForm(prev => ({ ...prev, title: "" }));
    };

    const handleAddSingleToProposed = (e) => {
        e.preventDefault();

        if (itemType === "vocabulary") {
            if (!singleForm.english.trim() && !singleForm.kana.trim()) {
                showStatus("Please provide at least English or Kana.", "error");
                return;
            }
            setProposedItems((prev) => [
                ...prev,
                {
                    type: "vocabulary",
                    english: singleForm.english.trim(),
                    kana: singleForm.kana.trim(),
                    kanji: singleForm.kanji.trim(),
                    lexical_category: singleForm.lexical_category.trim(),
                    example_sentences: singleForm.example_sentences.trim(),
                    tags: singleForm.tags.trim(),
                    audio: singleForm.audio.trim()
                }
            ]);
            setSingleForm({
                english: "",
                kana: "",
                kanji: "",
                lexical_category: "",
                example_sentences: "",
                tags: "",
                audio: ""
            });
        } else {
            if (!grammarForm.title.trim()) {
                showStatus("Please provide a title for the grammar item.", "error");
                return;
            }
            setProposedItems((prev) => [
                ...prev,
                {
                    type: "grammar",
                    title: grammarForm.title.trim(),
                    description: grammarForm.description.trim(),
                    topic: grammarForm.topic.trim(),
                    notes: grammarForm.notes.trim(),
                    example_sentences: grammarForm.example_sentences.trim(),
                    tags: grammarForm.tags.trim()
                }
            ]);
            setGrammarForm({
                title: "",
                description: "",
                topic: "",
                notes: "",
                example_sentences: "",
                tags: ""
            });
        }

        showStatus("Item added to set!", "success");
    };

    // ----- Bulk -----
    const [bulkInput, setBulkInput] = useState("");
    const handleAddBulkToProposed = () => {
        if (!bulkInput.trim()) {
            showStatus("Please provide some lines in bulk input.", "error");
            return;
        }
        const lines = bulkInput.split("\n").filter((l) => l.trim());
        const items = [];

        for (const line of lines) {
            const parts = line.split(",").map((s) => s.trim());
            if (parts.length >= 2) {
                if (itemType === "vocabulary") {
                    items.push({
                        type: "vocabulary",
                        english: parts[0] || "",
                        kana: parts[1] || "",
                        kanji: parts[2] || "",
                        lexical_category: parts[3] || "",
                        example_sentences: parts[4] || "",
                        tags: parts[5] || "",
                        audio: parts[6] || ""
                    });
                } else {
                    items.push({
                        type: "grammar",
                        title: parts[0] || "",
                        description: parts[1] || "",
                        topic: parts[2] || "",
                        notes: parts[3] || "",
                        example_sentences: parts[4] || "",
                        tags: parts[5] || ""
                    });
                }
            }
        }
        setProposedItems((prev) => [...prev, ...items]);
        setBulkInput("");
        showStatus(`Added ${items.length} items to set!`, "success");
    };

    // ----- Search -----
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);

    const handleSearch = async () => {
        if (!searchQuery.trim()) {
            showStatus("Please enter a search query.", "error");
            return;
        }
        setIsSearching(true);
        try {
            const res = await fetch(
                `/api/search-vocabulary?query=${encodeURIComponent(searchQuery)}`
            );
            if (!res.ok) throw new Error("Failed to fetch search results.");
            const data = await res.json();
            setSearchResults(data);
            if (data.length === 0) {
                showStatus("No results found for your search.", "info");
            }
        } catch (error) {
            console.error("Error searching vocabulary:", error);
            showStatus("Error searching vocabulary.", "error");
        } finally {
            setIsSearching(false);
        }
    };

    const addSearchResultToProposed = (item) => {
        const vocab = {
            type: "vocabulary",
            english: item.English || "",
            kana: item["Japanese(Hiragana/Katakana)"] || item.Japanese || "",
            kanji: "",
            lexical_category: "",
            example_sentences: "",
            tags: "",
            audio: ""
        };
        setProposedItems((prev) => [...prev, vocab]);
        showStatus(`Added "${item.English}" to set!`, "success");
    };

    // ----- Helper function to transform data for new API -----
    const transformDataForNewAPI = () => {
        const currentDate = new Date().toISOString();

        // Create set object
        const setData = {
            owner: userProfile.sub,
            title: newSetName.trim(),
            description: "", // Could add a description field to the form if needed
            date_created: currentDate,
            updated_at: currentDate,
            last_studied: currentDate,
            tags: [] // Could extract from items or add a separate field
        };

        // Transform items
        const transformedItems = proposedItems.map(item => {
            const baseItem = {
                owner: userProfile.sub,
                known_status: 'unknown',
                srs_level: 0,
                srs_reviewed_last: null,
                audio: item.audio || ""
            };

            if (item.type === "vocabulary") {
                return {
                    ...baseItem,
                    type: 'vocab', // Note: changed from "vocabulary" to "vocab"
                    english: item.english,
                    kana: item.kana,
                    kanji: item.kanji,
                    lexical_category: item.lexical_category,
                    example_sentences: item.example_sentences,
                    tags: item.tags ? item.tags.split(',').map(tag => tag.trim()).filter(tag => tag) : []
                };
            } else {
                // Grammar item - handle example_sentences differently
                let exampleSentences = [];
                if (item.example_sentences) {
                    // Assume each line is a sentence, split by newline
                    const sentences = item.example_sentences.split('\n').filter(s => s.trim());
                    exampleSentences = sentences.map(sentence => ({
                        japanese: sentence.trim(),
                        english: "" // Could be enhanced to parse if format is "JP | EN"
                    }));
                }

                return {
                    ...baseItem,
                    type: 'grammar',
                    title: item.title,
                    description: item.description,
                    topic: item.topic,
                    notes: item.notes,
                    example_sentences: exampleSentences,
                    tags: item.tags ? item.tags.split(',').map(tag => tag.trim()).filter(tag => tag) : []
                };
            }
        });

        return {
            set: setData,
            items: transformedItems
        };
    };

    // ----- Submit -----
    const [isSubmitting, setIsSubmitting] = useState(false);
    const handleSubmitAll = async () => {
        if (!newSetName.trim()) {
            showStatus("Please enter a name for your new set.", "error");
            return;
        }
        if (!proposedItems.length) {
            showStatus("You have not added any items yet.", "error");
            return;
        }
        if (!userProfile) {
            showStatus("User not authenticated.", "error");
            return;
        }

        const payload = transformDataForNewAPI();

        setIsSubmitting(true);
        try {
            const res = await fetch("/api/database/v2/sets/create", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            const responseData = await res.json();

            if (!res.ok) {
                showStatus("Error: " + (responseData.error || responseData.message || "Unknown error"), "error");
                return;
            }

            if (responseData.success) {
                showStatus(`Set "${newSetName}" created successfully!`, "success");
                setTimeout(() => {
                    router.push("/learn/academy/sets");
                }, 1000);
            } else {
                showStatus("Error: " + (responseData.error || "Failed to create set"), "error");
            }
        } catch (error) {
            console.error("Error creating set:", error);
            showStatus("Error uploading set: " + error.message, "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleRemoveProposedItem = (index) => {
        setProposedItems((prev) => {
            const next = [...prev];
            next.splice(index, 1);
            return next;
        });
    };

    return (
        <div className="flex min-h-screen bg-gray-50 dark:bg-[#141f25]">
            <MainSidebar />

            <main className="ml-auto flex-1 px-4 sm:px-6 py-4">
                <Head>
                    <title>Create New Set</title>
                    <link rel="icon" href="/favicon.ico" />
                </Head>

                <div className="w-full max-w-6xl mx-auto">
                    {/* Header */}
                    <div className="mb-3">
                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-1">
                            <Link href="/learn/academy/sets" className="hover:text-[#e30a5f] transition-colors">
                                Set
                            </Link>
                            <span>/</span>
                            <span className="text-gray-900 dark:text-white">Create New Set</span>
                        </div>
                        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Create New Set</h1>
                    </div>

                    {/* Set Name & Counter */}
                    <div className="bg-white dark:bg-[#1c2b35] rounded-lg shadow-sm border border-black/5 dark:border-white/10 p-3 mb-4">
                        <div className="flex gap-3 items-center">
                            <div className="flex-1">
                                <input
                                    type="text"
                                    value={newSetName}
                                    onChange={handleSetNameChange}
                                    placeholder="Set name (e.g., 'JLPT N5 Vocabulary')"
                                    className="w-full bg-gray-50 dark:bg-[#0f1a1f] text-gray-900 dark:text-white px-3 py-2 rounded text-sm border border-black/10 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-[#e30a5f] placeholder-gray-500 dark:placeholder-gray-400"
                                />
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                                {proposedItems.length} items
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                        {/* Left Column - Input Methods */}
                        <div className="lg:col-span-2">
                            <div className="bg-white dark:bg-[#1c2b35] rounded-lg shadow-sm border border-black/5 dark:border-white/10">
                                {/* Tab Navigation */}
                                <div className="border-b border-black/5 dark:border-white/10 px-4 mt-2">
                                    <div className="flex items-center justify-between">
                                        <div className="flex gap-4 -mb-px h-10">
                                            {[
                                                { key: "single", label: "Add Single", icon: <FiPlus className="w-3 h-3" /> },
                                                //{ key: "bulk", label: "Bulk", icon: <FaListUl className="w-3 h-3" /> },
                                                //{ key: "search", label: "Search", icon: <FiSearch className="w-3 h-3" /> },
                                            ].map(({ key, label, icon }) => (
                                                <button
                                                    key={key}
                                                    onClick={() => setActiveTab(key)}
                                                    className={`pb-2 pt-1 px-1 text-sm font-medium focus:outline-none border-b-2 transition-colors flex items-center gap-1.5
                                                       ${activeTab === key
                                                            ? "text-[#e30a5f] border-[#e30a5f]"
                                                            : "text-gray-600 dark:text-gray-400 border-transparent hover:text-gray-900 dark:hover:text-white"}`}
                                                >
                                                    {icon}
                                                    {label}
                                                </button>
                                            ))}
                                        </div>

                                        {/* Type Toggle */}
                                        <div className="flex items-center gap-2 pb-2">
                                            <span className="text-xs text-gray-600 dark:text-gray-400">Type:</span>
                                            <div className="flex bg-gray-100 dark:bg-[#0f1a1f] rounded-md p-0.5">
                                                <button
                                                    onClick={() => setItemType("vocabulary")}
                                                    className={`px-2 py-1 text-xs font-medium rounded transition-colors ${itemType === "vocabulary"
                                                        ? "bg-[#e30a5f] text-white"
                                                        : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                                                        }`}
                                                >
                                                    Vocabulary
                                                </button>
                                                <button
                                                    onClick={() => setItemType("grammar")}
                                                    className={`px-2 py-1 text-xs font-medium rounded transition-colors ${itemType === "grammar"
                                                        ? "bg-[#e30a5f] text-white"
                                                        : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                                                        }`}
                                                >
                                                    Grammar
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Tab Content */}
                                <div className="p-4">
                                    {/* Single Tab */}
                                    {activeTab === "single" && (
                                        <form onSubmit={handleAddSingleToProposed}>
                                            {itemType === "vocabulary" ? (
                                                <>
                                                    <div className="grid grid-cols-2 gap-3 mb-3">
                                                        <div>
                                                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                                English
                                                            </label>
                                                            <input
                                                                type="text"
                                                                value={singleForm.english}
                                                                onChange={(e) => handleSingleFormChange("english", e.target.value)}
                                                                placeholder="English term"
                                                                className="w-full bg-gray-50 dark:bg-[#0f1a1f] text-gray-900 dark:text-white px-2 py-1.5 rounded text-sm border border-black/10 dark:border-white/10 focus:outline-none focus:ring-1 focus:ring-[#e30a5f]"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                                Kana <span className="text-gray-500 dark:text-gray-400">(type in romaji)</span>
                                                            </label>
                                                            <input
                                                                type="text"
                                                                value={singleForm.kana}
                                                                onChange={(e) => handleSingleFormChange("kana", e.target.value)}
                                                                placeholder="ka → か, shi → し"
                                                                className="w-full bg-gray-50 dark:bg-[#0f1a1f] text-gray-900 dark:text-white px-2 py-1.5 rounded text-sm border border-black/10 dark:border-white/10 focus:outline-none focus:ring-1 focus:ring-[#e30a5f] font-japanese"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                                Kanji <span className="text-gray-500 dark:text-gray-400">(Please Paste The Entry)</span>
                                                            </label>
                                                            <input
                                                                type="text"
                                                                value={singleForm.kanji}
                                                                onChange={(e) => handleSingleFormChange("kanji", e.target.value)}
                                                                placeholder="kanji → かんじ"
                                                                className="w-full bg-gray-50 dark:bg-[#0f1a1f] text-gray-900 dark:text-white px-2 py-1.5 rounded text-sm border border-black/10 dark:border-white/10 focus:outline-none focus:ring-1 focus:ring-[#e30a5f] font-japanese"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                                Category
                                                            </label>
                                                            <select
                                                                value={singleForm.lexical_category}
                                                                onChange={(e) => handleSingleFormChange("lexical_category", e.target.value)}
                                                                className="w-full bg-gray-50 dark:bg-[#0f1a1f] text-gray-900 dark:text-white px-2 py-1.5 rounded text-sm border border-black/10 dark:border-white/10 focus:outline-none focus:ring-1 focus:ring-[#e30a5f]"
                                                            >
                                                                <option value="">Select category</option>
                                                                <option value="noun">Noun</option>
                                                                <option value="verb">Verb</option>
                                                                <option value="adjective">Adjective</option>
                                                                <option value="adverb">Adverb</option>
                                                                <option value="particle">Particle</option>
                                                                <option value="expression">Expression</option>
                                                            </select>
                                                        </div>
                                                    </div>
                                                    <div className="grid grid-cols-1 gap-3 mb-3">
                                                        <div>
                                                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                                Example Sentences
                                                            </label>
                                                            <textarea
                                                                rows={2}
                                                                value={singleForm.example_sentences}
                                                                onChange={(e) => handleSingleFormChange("example_sentences", e.target.value)}
                                                                placeholder="Example sentences (one per line)"
                                                                className="w-full bg-gray-50 dark:bg-[#0f1a1f] text-gray-900 dark:text-white px-2 py-1.5 rounded text-sm border border-black/10 dark:border-white/10 focus:outline-none focus:ring-1 focus:ring-[#e30a5f] resize-none"
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-3 mb-3">
                                                        <div>
                                                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                                Tags
                                                            </label>
                                                            <input
                                                                type="text"
                                                                value={singleForm.tags}
                                                                onChange={(e) => handleSingleFormChange("tags", e.target.value)}
                                                                placeholder="tag1, tag2, tag3"
                                                                className="w-full bg-gray-50 dark:bg-[#0f1a1f] text-gray-900 dark:text-white px-2 py-1.5 rounded text-sm border border-black/10 dark:border-white/10 focus:outline-none focus:ring-1 focus:ring-[#e30a5f]"
                                                            />
                                                        </div>
                                                        {/*
                                                        <div>
                                                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                                Audio URL
                                                            </label>
                                                            <input
                                                                type="text"
                                                                value={singleForm.audio}
                                                                onChange={(e) => handleSingleFormChange("audio", e.target.value)}
                                                                placeholder="https://..."
                                                                className="w-full bg-gray-50 dark:bg-[#0f1a1f] text-gray-900 dark:text-white px-2 py-1.5 rounded text-sm border border-black/10 dark:border-white/10 focus:outline-none focus:ring-1 focus:ring-[#e30a5f]"
                                                            />
                                                        </div> */}
                                                    </div>
                                                </>
                                            ) : (
                                                <>
                                                    <div className="grid grid-cols-2 gap-3 mb-3">
                                                        <div>
                                                            <label className=" text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center justify-between">
                                                                <span>Title * (enter only in jp or eng) {grammarForm.title && (
                                                                    <span className="text-[10px] text-gray-500 dark:text-gray-400 ml-1">
                                                                        ({grammarTitleInputType === "kana" ? "Kana" : "English"})
                                                                    </span>
                                                                )}</span>
                                                                <div className="flex gap-0.5">
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleGrammarTitleTypeSwitch("english")}
                                                                        className={`px-1 py-0.5 text-[10px] rounded transition-colors ${grammarTitleInputType === "english"
                                                                                ? "bg-[#e30a5f] text-white"
                                                                                : "text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400"
                                                                            }`}
                                                                    >
                                                                        En
                                                                    </button>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleGrammarTitleTypeSwitch("kana")}
                                                                        className={`px-1 py-0.5 text-[10px] rounded transition-colors ${grammarTitleInputType === "kana"
                                                                                ? "bg-[#e30a5f] text-white"
                                                                                : "text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400"
                                                                            }`}
                                                                    >
                                                                        あ
                                                                    </button>
                                                                </div>
                                                            </label>
                                                            <input
                                                                type="text"
                                                                value={grammarForm.title}
                                                                onChange={(e) => handleGrammarFormChange("title", e.target.value)}
                                                                placeholder={grammarTitleInputType === "kana"
                                                                    ? "Type in romaji: ka → か, shi → し"
                                                                    : "Grammar pattern name"}
                                                                className={`w-full bg-gray-50 dark:bg-[#0f1a1f] text-gray-900 dark:text-white px-2 py-1.5 rounded text-sm border border-black/10 dark:border-white/10 focus:outline-none focus:ring-1 focus:ring-[#e30a5f] ${grammarTitleInputType === "kana" ? "font-japanese" : ""
                                                                    }`}
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                                Topic
                                                            </label>
                                                            <input
                                                                type="text"
                                                                value={grammarForm.topic}
                                                                onChange={(e) => handleGrammarFormChange("topic", e.target.value)}
                                                                placeholder="e.g., N5, JLPT, Particles"
                                                                className="w-full bg-gray-50 dark:bg-[#0f1a1f] text-gray-900 dark:text-white px-2 py-1.5 rounded text-sm border border-black/10 dark:border-white/10 focus:outline-none focus:ring-1 focus:ring-[#e30a5f]"
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="grid grid-cols-1 gap-3 ">
                                                        <div>
                                                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                                Description
                                                            </label>
                                                            <textarea
                                                                rows={2}
                                                                value={grammarForm.description}
                                                                onChange={(e) => handleGrammarFormChange("description", e.target.value)}
                                                                placeholder="Brief explanation of the grammar pattern"
                                                                className="w-full bg-gray-50 dark:bg-[#0f1a1f] text-gray-900 dark:text-white px-2 py-1.5 rounded text-sm border border-black/10 dark:border-white/10 focus:outline-none focus:ring-1 focus:ring-[#e30a5f] resize-none"
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="grid grid-cols-1 gap-3 mb-2">
                                                        <div>
                                                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                                Notes
                                                            </label>
                                                            <input
                                                                type="text"
                                                                value={grammarForm.notes}
                                                                onChange={(e) => handleGrammarFormChange("notes", e.target.value)}
                                                                placeholder="Additional notes, usage tips, etc."
                                                                className="w-full bg-gray-50 dark:bg-[#0f1a1f] text-gray-900 dark:text-white px-2 py-1.5 rounded text-sm border border-black/10 dark:border-white/10 focus:outline-none focus:ring-1 focus:ring-[#e30a5f]"
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="grid grid-cols-1 gap-3 mb-2">
                                                        <div>
                                                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                                Example Sentences
                                                            </label>
                                                            <textarea
                                                                rows={2}
                                                                value={grammarForm.example_sentences}
                                                                onChange={(e) => handleGrammarFormChange("example_sentences", e.target.value)}
                                                                placeholder="Example sentences (one per line)"
                                                                className="w-full bg-gray-50 dark:bg-[#0f1a1f] text-gray-900 dark:text-white px-2 py-1.5 rounded text-sm border border-black/10 dark:border-white/10 focus:outline-none focus:ring-1 focus:ring-[#e30a5f] resize-none"
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="grid grid-cols-1 gap-3 mb-3">
                                                        <div>
                                                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                                Tags
                                                            </label>
                                                            <input
                                                                type="text"
                                                                value={grammarForm.tags}
                                                                onChange={(e) => handleGrammarFormChange("tags", e.target.value)}
                                                                placeholder="tag1, tag2, tag3"
                                                                className="w-full bg-gray-50 dark:bg-[#0f1a1f] text-gray-900 dark:text-white px-2 py-1.5 rounded text-sm border border-black/10 dark:border-white/10 focus:outline-none focus:ring-1 focus:ring-[#e30a5f]"
                                                            />
                                                        </div>
                                                    </div>
                                                </>
                                            )}

                                            <button
                                                type="submit"
                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-medium bg-[#e30a5f] text-white hover:opacity-95 transition-opacity"
                                            >
                                                <FiPlus className="w-3 h-3" /> Add to Set
                                            </button>
                                        </form>
                                    )}

                                    {/* Search Tab */}
                                    {activeTab === "search" && (
                                        <div>
                                            <div className="flex gap-2 mb-4">
                                                <input
                                                    type="text"
                                                    value={searchQuery}
                                                    onChange={(e) => setSearchQuery(e.target.value)}
                                                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                                                    placeholder="Search vocabulary..."
                                                    className="flex-1 bg-gray-50 dark:bg-[#0f1a1f] text-gray-900 dark:text-white px-2 py-1.5 rounded text-sm border border-black/10 dark:border-white/10 focus:outline-none focus:ring-1 focus:ring-[#e30a5f]"
                                                />
                                                <button
                                                    onClick={handleSearch}
                                                    disabled={isSearching}
                                                    className="px-3 py-1.5 rounded text-sm font-medium bg-[#e30a5f] text-white hover:opacity-95 transition-opacity disabled:opacity-50"
                                                >
                                                    {isSearching ? "..." : "Search"}
                                                </button>
                                            </div>

                                            {searchResults.length > 0 ? (
                                                <div className="border border-black/5 dark:border-white/10 rounded overflow-hidden max-h-48 overflow-y-auto">
                                                    {searchResults.map((item, index) => {
                                                        const jp = item["Japanese(Hiragana/Katakana)"] || item.Japanese || "";
                                                        return (
                                                            <div key={index} className="flex items-center justify-between px-3 py-2 border-b border-black/5 dark:border-white/10 last:border-b-0 hover:bg-gray-50 dark:hover:bg-[#1d2a32]">
                                                                <div className="flex-1 min-w-0">
                                                                    <div className="text-sm font-medium text-gray-900 dark:text-white truncate">{item.English}</div>
                                                                    <div className="text-xs text-gray-600 dark:text-gray-400 font-japanese">{jp}</div>
                                                                </div>
                                                                <button
                                                                    onClick={() => addSearchResultToProposed(item)}
                                                                    className="ml-2 px-2 py-1 rounded text-xs font-medium bg-green-600 text-white hover:bg-green-700 transition-colors"
                                                                >
                                                                    Add
                                                                </button>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            ) : searchQuery && !isSearching ? (
                                                <div className="text-center py-8 text-gray-500 dark:text-gray-400 text-sm">
                                                    No results for &quot;{searchQuery}&quot;
                                                </div>
                                            ) : (
                                                <div className="text-center py-8 text-gray-500 dark:text-gray-400 text-sm">
                                                    Search our vocabulary library
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Right Column - Preview */}
                        <div className="lg:col-span-1">
                            <div className="bg-white dark:bg-[#1c2b35] rounded-lg shadow-sm border border-black/5 dark:border-white/10 p-4">
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                                        Preview ({proposedItems.length})
                                    </h3>
                                    {proposedItems.length > 0 && (
                                        <button
                                            onClick={() => setProposedItems([])}
                                            className="text-xs text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                                        >
                                            Clear
                                        </button>
                                    )}
                                </div>

                                {proposedItems.length > 0 ? (
                                    <div className="space-y-2 max-h-96 overflow-y-auto">
                                        {proposedItems.map((item, idx) => (
                                            <div key={idx} className="bg-gray-50 dark:bg-[#1d2a32] rounded p-2 text-xs">
                                                <div className="flex items-start justify-between">
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className={`inline-block w-2 h-2 rounded-full ${item.type === "vocabulary" ? "bg-blue-500" : "bg-green-500"
                                                                }`}></span>
                                                            <span className="text-xs text-gray-500 dark:text-gray-400 uppercase">
                                                                {item.type}
                                                            </span>
                                                        </div>

                                                        {item.type === "vocabulary" ? (
                                                            <>
                                                                <div className="font-medium text-gray-900 dark:text-white truncate">
                                                                    {item.english || item.kana}
                                                                </div>
                                                                {item.kana && item.english && (
                                                                    <div className="text-gray-600 dark:text-gray-400 font-japanese truncate">
                                                                        {item.kana}
                                                                    </div>
                                                                )}
                                                                {item.kanji && (
                                                                    <div className="text-gray-600 dark:text-gray-400 font-japanese truncate">
                                                                        {item.kanji}
                                                                    </div>
                                                                )}
                                                                {item.lexical_category && (
                                                                    <div className="text-gray-500 dark:text-gray-500 truncate">
                                                                        {item.lexical_category}
                                                                    </div>
                                                                )}
                                                            </>
                                                        ) : (
                                                            <>
                                                                <div className="font-medium text-gray-900 dark:text-white truncate">
                                                                    {item.title}
                                                                </div>
                                                                {item.description && (
                                                                    <div className="text-gray-600 dark:text-gray-400 truncate">
                                                                        {item.description}
                                                                    </div>
                                                                )}
                                                                {item.topic && (
                                                                    <div className="text-gray-500 dark:text-gray-500 truncate">
                                                                        {item.topic}
                                                                    </div>
                                                                )}
                                                            </>
                                                        )}
                                                    </div>
                                                    <button
                                                        onClick={() => handleRemoveProposedItem(idx)}
                                                        className="ml-2 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                                                    >
                                                        <FiX className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-8 text-gray-500 dark:text-gray-400 text-sm">
                                        No items added yet
                                    </div>
                                )}
                            </div>
                            {/* Action Buttons */}
                            <div className="mt-4 flex items-center justify-left">
                                <Link
                                    href="/learn/academy/sets"
                                    className="inline-flex items-center mr-4 gap-2 px-3 py-2 rounded text-sm font-medium border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#1d2a32] transition-colors"
                                >
                                    Cancel
                                </Link>
                                <button
                                    onClick={handleSubmitAll}
                                    disabled={!newSetName.trim() || proposedItems.length === 0 || isSubmitting}
                                    className="inline-flex items-center gap-2 px-4 py-2 rounded text-sm font-medium bg-[#e30a5f] text-white hover:opacity-95 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <span className="inline-block animate-spin rounded-full h-3 w-3 border-b-2 border-white"></span>
                                            Creating...
                                        </>
                                    ) : (
                                        <>
                                            <FiCheck className="w-4 h-4" /> Create Set
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Status Message */}
                    {statusMessage && (
                        <div className={`mt-3 px-3 py-2 rounded flex items-center gap-2 text-sm ${statusType === "success" ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300" :
                            statusType === "error" ? "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300" :
                                "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300"
                            }`}>
                            {statusType === "success" ? <FiCheck className="w-4 h-4" /> :
                                statusType === "error" ? <FiX className="w-4 h-4" /> : <FiAlertCircle className="w-4 h-4" />}
                            <span className="font-medium">{statusMessage}</span>
                        </div>
                    )}


                </div>
            </main>
        </div>
    );
}
