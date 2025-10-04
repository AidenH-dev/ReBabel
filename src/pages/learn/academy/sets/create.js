// pages/learn/vocabulary/create-new-set.js
import Head from "next/head";
import MainSidebar from "../../../../components/Sidebars/AcademySidebar";
import { withPageAuthRequired } from "@auth0/nextjs-auth0";
import Link from "next/link";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/router";
import { FaChevronDown, FaChevronUp } from "react-icons/fa";
import { FiPlus, FiX, FiCheck, FiAlertCircle } from "react-icons/fi";
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
    const [statusMessage, setStatusMessage] = useState("");
    const [statusType, setStatusType] = useState("");
    const [itemType, setItemType] = useState("vocabulary");
    const [showAdvanced, setShowAdvanced] = useState(false);

    // ----- Helpers -----
    const showStatus = useCallback((message, type = "info") => {
        setStatusMessage(message);
        setStatusType(type);
        setTimeout(() => {
            setStatusMessage("");
            setStatusType("");
        }, 3000);
    }, []);

    // ----- Forms -----
    const [singleForm, setSingleForm] = useState({
        english: "",
        kana: "",
        kanji: "",
        lexical_category: "",
        example_sentences: "",
        tags: ""
    });

    const [grammarForm, setGrammarForm] = useState({
        title: "",
        description: "",
        topic: "",
        notes: "",
        example_sentences: "",
        tags: ""
    });

    const handleSingleFormChange = (field, value) => {
        if (field === "kana" || field === "kanji") {
            setSingleForm(prev => ({ ...prev, [field]: toKana(value, { IMEMode: true }) }));
        } else {
            setSingleForm(prev => ({ ...prev, [field]: value }));
        }
    };

    const handleGrammarFormChange = (field, value) => {
        if (field === "title") {
            setGrammarForm(prev => ({ ...prev, [field]: toKana(value, { IMEMode: true }) }));
        } else {
            setGrammarForm(prev => ({ ...prev, [field]: value }));
        }
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
                    audio: ""
                }
            ]);
            setSingleForm({
                english: "",
                kana: "",
                kanji: "",
                lexical_category: "",
                example_sentences: "",
                tags: ""
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

    // ----- Transform data for API -----
    const transformDataForNewAPI = () => {
        const currentDate = new Date().toISOString();
        
        const setData = {
            owner: userProfile.sub,
            title: newSetName.trim(),
            description: "",
            date_created: currentDate,
            updated_at: currentDate,
            last_studied: currentDate,
            tags: []
        };

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
                    type: 'vocab',
                    english: item.english,
                    kana: item.kana,
                    kanji: item.kanji,
                    lexical_category: item.lexical_category,
                    example_sentences: item.example_sentences,
                    tags: item.tags ? item.tags.split(',').map(tag => tag.trim()).filter(tag => tag) : []
                };
            } else {
                let exampleSentences = [];
                if (item.example_sentences) {
                    const sentences = item.example_sentences.split('\n').filter(s => s.trim());
                    exampleSentences = sentences.map(sentence => ({
                        japanese: sentence.trim(),
                        english: ""
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
        <div className="flex h-screen bg-gray-50 dark:bg-[#141f25] overflow-hidden">
            <MainSidebar />

            <main className="ml-auto flex-1 overflow-y-auto px-4 sm:px-6 py-4">
                <Head>
                    <title>Create New Set</title>
                    <link rel="icon" href="/favicon.ico" />
                </Head>

                <div className="w-full max-w-4xl mx-auto">
                    {/* Header */}
                    <div className="mb-4">
                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-1">
                            <Link href="/learn/academy/sets" className="hover:text-[#e30a5f] transition-colors">
                                Sets
                            </Link>
                            <span>/</span>
                            <span className="text-gray-900 dark:text-white">Create New</span>
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Create New Set</h1>
                    </div>

                    {/* Set Name */}
                    <div className="bg-white dark:bg-[#1c2b35] rounded-lg shadow-sm border border-black/5 dark:border-white/10 p-4 mb-4">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Set Name *
                        </label>
                        <input
                            type="text"
                            value={newSetName}
                            onChange={(e) => setNewSetName(e.target.value)}
                            placeholder="e.g., JLPT N5 Vocabulary, Genki Lesson 3"
                            className="w-full bg-gray-50 dark:bg-[#0f1a1f] text-gray-900 dark:text-white px-4 py-2.5 rounded border border-black/10 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-[#e30a5f] placeholder-gray-500 dark:placeholder-gray-400"
                        />
                    </div>

                    {/* Add Item Form */}
                    <div className="bg-white dark:bg-[#1c2b35] rounded-lg shadow-sm border border-black/5 dark:border-white/10 p-4 mb-4">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                            Add  Item
                        </h2>
                        <div className="flex bg-gray-100 dark:bg-[#0f1a1f] rounded-lg p-1 w-fit mb-2">
                            <button
                                onClick={() => setItemType("vocabulary")}
                                className={`px-2 py-1 text-sm font-medium rounded-md transition-colors ${
                                    itemType === "vocabulary"
                                        ? "bg-[#e30a5f] text-white"
                                        : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                                }`}
                            >
                                Vocabulary
                            </button>
                            <button
                                onClick={() => setItemType("grammar")}
                                className={`px-2 py-1 text-sm font-medium rounded-md transition-colors ${
                                    itemType === "grammar"
                                        ? "bg-[#e30a5f] text-white"
                                        : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                                }`}
                            >
                                Grammar
                            </button>
                        </div>
                        <form onSubmit={handleAddSingleToProposed}>
                            {itemType === "vocabulary" ? (
                                <>
                                    {/* Essential Fields */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                                English *
                                            </label>
                                            <input
                                                type="text"
                                                value={singleForm.english}
                                                onChange={(e) => handleSingleFormChange("english", e.target.value)}
                                                placeholder="water, study, beautiful"
                                                className="w-full bg-gray-50 dark:bg-[#0f1a1f] text-gray-900 dark:text-white px-3 py-2 rounded border border-black/10 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-[#e30a5f]"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                                Kana * <span className="text-xs text-gray-500">(type romaji: ka → か)</span>
                                            </label>
                                            <input
                                                type="text"
                                                value={singleForm.kana}
                                                onChange={(e) => handleSingleFormChange("kana", e.target.value)}
                                                placeholder="mizu, benkyou, utsukushii"
                                                className="w-full bg-gray-50 dark:bg-[#0f1a1f] text-gray-900 dark:text-white px-3 py-2 rounded border border-black/10 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-[#e30a5f] font-japanese"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                                Kanji <span className="text-xs text-gray-500">(paste or type)</span>
                                            </label>
                                            <input
                                                type="text"
                                                value={singleForm.kanji}
                                                onChange={(e) => handleSingleFormChange("kanji", e.target.value)}
                                                placeholder="水, 勉強, 美しい"
                                                className="w-full bg-gray-50 dark:bg-[#0f1a1f] text-gray-900 dark:text-white px-3 py-2 rounded border border-black/10 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-[#e30a5f] font-japanese"
                                            />
                                        </div>
                                    </div>

                                    {/* Advanced Options Toggle */}
                                    <button
                                        type="button"
                                        onClick={() => setShowAdvanced(!showAdvanced)}
                                        className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-[#e30a5f] dark:hover:text-[#e30a5f] mb-3 transition-colors"
                                    >
                                        {showAdvanced ? <FaChevronUp className="w-3 h-3" /> : <FaChevronDown className="w-3 h-3" />}
                                        {showAdvanced ? "Hide" : "Show"} additional fields
                                    </button>

                                    {showAdvanced && (
                                        <div className="space-y-4 mb-4 pb-4 border-b border-black/5 dark:border-white/10">
                                            <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                                        Part of Speech
                                                    </label>
                                                    <select
                                                        value={singleForm.lexical_category}
                                                        onChange={(e) => handleSingleFormChange("lexical_category", e.target.value)}
                                                        className="w-full bg-gray-50 dark:bg-[#0f1a1f] text-gray-900 dark:text-white px-3 py-2 rounded border border-black/10 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-[#e30a5f]"
                                                    >
                                                        <option value="">Select...</option>
                                                        <option value="noun">Noun</option>
                                                        <option value="verb">Verb</option>
                                                        <option value="adjective">Adjective</option>
                                                        <option value="adverb">Adverb</option>
                                                        <option value="particle">Particle</option>
                                                        <option value="expression">Expression</option>
                                                    </select>
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                                    Example Sentences <span className="text-xs text-gray-500">(one per line)</span>
                                                </label>
                                                <textarea
                                                    rows={2}
                                                    value={singleForm.example_sentences}
                                                    onChange={(e) => handleSingleFormChange("example_sentences", e.target.value)}
                                                    placeholder="みずをのみます。&#10;I drink water."
                                                    className="w-full bg-gray-50 dark:bg-[#0f1a1f] text-gray-900 dark:text-white px-3 py-2 rounded border border-black/10 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-[#e30a5f] resize-none"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                                    Tags <span className="text-xs text-gray-500">(comma-separated)</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    value={singleForm.tags}
                                                    onChange={(e) => handleSingleFormChange("tags", e.target.value)}
                                                    placeholder="JLPT N5, Chapter 1, Common"
                                                    className="w-full bg-gray-50 dark:bg-[#0f1a1f] text-gray-900 dark:text-white px-3 py-2 rounded border border-black/10 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-[#e30a5f]"
                                                />
                                            </div>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <>
                                    {/* Grammar Essential Fields */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                                Title * <span className="text-xs text-gray-500">(type romaji or paste JP)</span>
                                            </label>
                                            <input
                                                type="text"
                                                value={grammarForm.title}
                                                onChange={(e) => handleGrammarFormChange("title", e.target.value)}
                                                placeholder="~ます, ~ている, Particle は"
                                                className="w-full bg-gray-50 dark:bg-[#0f1a1f] text-gray-900 dark:text-white px-3 py-2 rounded border border-black/10 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-[#e30a5f] font-japanese"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                                Topic
                                            </label>
                                            <input
                                                type="text"
                                                value={grammarForm.topic}
                                                onChange={(e) => handleGrammarFormChange("topic", e.target.value)}
                                                placeholder="Verb Forms, Particles, JLPT N5"
                                                className="w-full bg-gray-50 dark:bg-[#0f1a1f] text-gray-900 dark:text-white px-3 py-2 rounded border border-black/10 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-[#e30a5f]"
                                            />
                                        </div>
                                    </div>

                                    <div className="mb-4">
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                            Description
                                        </label>
                                        <textarea
                                            rows={2}
                                            value={grammarForm.description}
                                            onChange={(e) => handleGrammarFormChange("description", e.target.value)}
                                            placeholder="Brief explanation of this grammar pattern..."
                                            className="w-full bg-gray-50 dark:bg-[#0f1a1f] text-gray-900 dark:text-white px-3 py-2 rounded border border-black/10 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-[#e30a5f] resize-none"
                                        />
                                    </div>

                                    {/* Advanced Options Toggle */}
                                    <button
                                        type="button"
                                        onClick={() => setShowAdvanced(!showAdvanced)}
                                        className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-[#e30a5f] dark:hover:text-[#e30a5f] mb-3 transition-colors"
                                    >
                                        {showAdvanced ? <FaChevronUp className="w-3 h-3" /> : <FaChevronDown className="w-3 h-3" />}
                                        {showAdvanced ? "Hide" : "Show"} additional fields
                                    </button>

                                    {showAdvanced && (
                                        <div className="space-y-4 mb-4 pb-4 border-b border-black/5 dark:border-white/10">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                                    Notes
                                                </label>
                                                <input
                                                    type="text"
                                                    value={grammarForm.notes}
                                                    onChange={(e) => handleGrammarFormChange("notes", e.target.value)}
                                                    placeholder="Usage tips, exceptions, etc."
                                                    className="w-full bg-gray-50 dark:bg-[#0f1a1f] text-gray-900 dark:text-white px-3 py-2 rounded border border-black/10 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-[#e30a5f]"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                                    Example Sentences <span className="text-xs text-gray-500">(one per line)</span>
                                                </label>
                                                <textarea
                                                    rows={2}
                                                    value={grammarForm.example_sentences}
                                                    onChange={(e) => handleGrammarFormChange("example_sentences", e.target.value)}
                                                    placeholder="わたしはがくせいです。&#10;ほんをよみます。"
                                                    className="w-full bg-gray-50 dark:bg-[#0f1a1f] text-gray-900 dark:text-white px-3 py-2 rounded border border-black/10 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-[#e30a5f] resize-none"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                                    Tags <span className="text-xs text-gray-500">(comma-separated)</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    value={grammarForm.tags}
                                                    onChange={(e) => handleGrammarFormChange("tags", e.target.value)}
                                                    placeholder="JLPT N5, Basic, Important"
                                                    className="w-full bg-gray-50 dark:bg-[#0f1a1f] text-gray-900 dark:text-white px-3 py-2 rounded border border-black/10 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-[#e30a5f]"
                                                />
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}

                            <button
                                type="submit"
                                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium bg-[#e30a5f] text-white hover:opacity-90 transition-opacity"
                            >
                                <FiPlus className="w-4 h-4" /> Add to Set
                            </button>
                        </form>
                    </div>

                    {/* Items Preview */}
                    <div className="bg-white dark:bg-[#1c2b35] rounded-lg shadow-sm border border-black/5 dark:border-white/10 p-4 mb-4">
                        <div className="flex items-center justify-between mb-3">
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                                Items ({proposedItems.length})
                            </h2>
                            {proposedItems.length > 0 && (
                                <button
                                    onClick={() => setProposedItems([])}
                                    className="text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                                >
                                    Clear All
                                </button>
                            )}
                        </div>

                        {proposedItems.length > 0 ? (
                            <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
                                {proposedItems.map((item, idx) => (
                                    <div key={idx} className="flex items-center justify-between bg-gray-50 dark:bg-[#1d2a32] rounded p-2 group hover:bg-gray-100 dark:hover:bg-[#1f3340] transition-colors">
                                        <div className="flex-1 min-w-0">
                                            {item.type === "vocabulary" ? (
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium shrink-0">
                                                        V
                                                    </span>
                                                    <div className="flex-1 min-w-0 text-sm">
                                                        <span className="font-medium text-gray-900 dark:text-white">
                                                            {item.english || item.kana}
                                                        </span>
                                                        {item.kana && item.english && (
                                                            <span className="text-gray-600 dark:text-gray-400 font-japanese ml-2">
                                                                {item.kana}
                                                            </span>
                                                        )}
                                                        {item.kanji && (
                                                            <span className="text-gray-600 dark:text-gray-400 font-japanese ml-2">
                                                                ({item.kanji})
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 font-medium shrink-0">
                                                        G
                                                    </span>
                                                    <div className="flex-1 min-w-0 text-sm">
                                                        <span className="font-medium text-gray-900 dark:text-white font-japanese">
                                                            {item.title}
                                                        </span>
                                                        {item.description && (
                                                            <span className="text-gray-600 dark:text-gray-400 ml-2 truncate">
                                                                — {item.description}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                        <button
                                            onClick={() => handleRemoveProposedItem(idx)}
                                            className="ml-2 p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                                            aria-label="Remove item"
                                        >
                                            <FiX className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                                <p className="mb-1">No items added yet</p>
                                <p className="text-sm">Add vocabulary or grammar items above to get started</p>
                            </div>
                        )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center justify-end gap-3 mb-6">
                        <Link
                            href="/learn/academy/sets"
                            className="px-4 py-2.5 rounded-lg font-medium border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#1d2a32] transition-colors"
                        >
                            Cancel
                        </Link>
                        <button
                            onClick={handleSubmitAll}
                            disabled={!newSetName.trim() || proposedItems.length === 0 || isSubmitting}
                            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium bg-[#e30a5f] text-white hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? (
                                <>
                                    <span className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></span>
                                    Creating...
                                </>
                            ) : (
                                <>
                                    <FiCheck className="w-4 h-4" /> Create Set
                                </>
                            )}
                        </button>
                    </div>

                    {/* Status Message */}
                    {statusMessage && (
                        <div className="fixed bottom-8 right-8 left-auto w-80 flex justify-center">
                            <div className={`px-3 py-2 rounded border bg-white/95 dark:bg-[#1c2b35]/95 backdrop-blur-sm shadow-sm flex items-center gap-2 text-sm ${
                                statusType === "success" ? "border-green-500 text-green-700 dark:text-green-400" :
                                statusType === "error" ? "border-red-500 text-red-700 dark:text-red-400" :
                                "border-blue-500 text-blue-700 dark:text-blue-400"
                            }`}>
                                {statusType === "success" ? <FiCheck className="w-3.5 h-3.5" /> :
                                 statusType === "error" ? <FiX className="w-3.5 h-3.5" /> : 
                                 <FiAlertCircle className="w-3.5 h-3.5" />}
                                <span>{statusMessage}</span>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}

export const getServerSideProps = withPageAuthRequired();