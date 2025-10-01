// pages/learn/vocabulary/create-new-set.js
import Head from "next/head";
import MainSidebar from "../../../components/Sidebars/MainSidebar";
import { withPageAuthRequired } from "@auth0/nextjs-auth0";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/router";

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
    const [proposedVocabulary, setProposedVocabulary] = useState([]);
    const [activeTab, setActiveTab] = useState("import"); // "import" | "single" | "bulk" | "search"
    const [statusMessage, setStatusMessage] = useState("");

    // ----- Import (Genki) -----
    const [genkiLesson, setGenkiLesson] = useState("");
    const [importChunk, setImportChunk] = useState([]);
    const [addEnglishChunk, setAddEnglishChunk] = useState("");
    const [addJapaneseChunk, setAddJapaneseChunk] = useState("");

    const handleImportChunk = async (lessonNumber) => {
        if (!lessonNumber) {
            setImportChunk([]);
            return;
        }
        try {
            const res = await fetch(`/api/fetch-vocabulary?lesson=${lessonNumber}`);
            if (!res.ok) throw new Error("Failed to fetch Genki vocabulary.");
            const data = await res.json();
            setImportChunk(data || []);
        } catch (error) {
            console.error("Error fetching Genki chunk:", error);
            setStatusMessage("Error fetching Genki vocabulary.");
        }
    };

    useEffect(() => {
        if (genkiLesson) handleImportChunk(genkiLesson);
    }, [genkiLesson]);

    const handleRemoveFromChunk = (index) => {
        setImportChunk((prev) => {
            const next = [...prev];
            next.splice(index, 1);
            return next;
        });
    };

    const handleAddToChunk = () => {
        if (!addEnglishChunk.trim() || !addJapaneseChunk.trim()) return;
        setImportChunk((prev) => [
            ...prev,
            { English: addEnglishChunk.trim(), Japanese: addJapaneseChunk.trim() },
        ]);
        setAddEnglishChunk("");
        setAddJapaneseChunk("");
    };

    const handleAddChunkToProposed = () => {
        if (!importChunk.length) {
            setStatusMessage("No items to add from the imported chunk.");
            return;
        }
        const itemsToAdd = importChunk.map((item) => ({
            English: item.English,
            Japanese:
                item["Japanese(Hiragana/Katakana)"] ||
                item["Japanese (Hiragana/Katakana)"] ||
                item.Japanese ||
                "",
        }));
        const valid = itemsToAdd.filter(
            (x) => x.English?.trim() && x.Japanese?.trim()
        );
        setProposedVocabulary((prev) => [...prev, ...valid]);
        setImportChunk([]);
        setGenkiLesson("");
        setStatusMessage(`${valid.length} item(s) added to your proposed list!`);
    };

    // ----- Single -----
    const [englishInput, setEnglishInput] = useState("");
    const [japaneseInput, setJapaneseInput] = useState("");

    const handleAddSingleToProposed = (e) => {
        e.preventDefault();
        if (!englishInput.trim() || !japaneseInput.trim()) {
            setStatusMessage("Please provide both English and Japanese terms.");
            return;
        }
        setProposedVocabulary((prev) => [
            ...prev,
            { English: englishInput.trim(), Japanese: japaneseInput.trim() },
        ]);
        setEnglishInput("");
        setJapaneseInput("");
        setStatusMessage("Single vocabulary item added in memory!");
    };

    // ----- Bulk -----
    const [bulkInput, setBulkInput] = useState("");
    const handleAddBulkToProposed = () => {
        if (!bulkInput.trim()) {
            setStatusMessage("Please provide some lines in bulk input.");
            return;
        }
        const lines = bulkInput.split("\n").filter((l) => l.trim());
        const items = [];
        for (const line of lines) {
            const [english, japanese] = line.split(",").map((s) => s.trim());
            if (english && japanese) items.push({ English: english, Japanese: japanese });
        }
        setProposedVocabulary((prev) => [...prev, ...items]);
        setBulkInput("");
        setStatusMessage(`${items.length} bulk item(s) added in memory!`);
    };

    // ----- Search -----
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState([]);

    const handleSearch = async () => {
        if (!searchQuery.trim()) {
            setStatusMessage("Please enter a search query.");
            return;
        }
        try {
            const res = await fetch(
                `/api/search-vocabulary?query=${encodeURIComponent(searchQuery)}`
            );
            if (!res.ok) throw new Error("Failed to fetch search results.");
            const data = await res.json();
            setSearchResults(data);
        } catch (error) {
            console.error("Error searching vocabulary:", error);
            setStatusMessage("Error searching vocabulary.");
        }
    };

    const addSearchResultToProposed = (item) => {
        const vocab = {
            English: item.English,
            Japanese: item["Japanese(Hiragana/Katakana)"] || item.Japanese || "",
        };
        setProposedVocabulary((prev) => [...prev, vocab]);
        setStatusMessage(`Added "${item.English}" to proposed list.`);
    };

    // ----- Submit -----
    const handleSubmitAll = async () => {
        if (!newSetName.trim()) {
            setStatusMessage("Please enter a name for your new set.");
            return;
        }
        if (!proposedVocabulary.length) {
            setStatusMessage("You have not added any vocabulary items yet.");
            return;
        }
        if (!userProfile) {
            setStatusMessage("User not authenticated.");
            return;
        }

        const payload = {
            setName: newSetName.trim(),
            userAuth0Id: userProfile.sub,
            items: proposedVocabulary,
        };

        try {
            const res = await fetch("/api/database/upload-user-set", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            if (!res.ok) {
                const err = await res.json();
                setStatusMessage("Error: " + err.error);
                return;
            }
            setStatusMessage(
                `Set "${newSetName}" created successfully with ${proposedVocabulary.length} items!`
            );
            router.push("/learn/vocabulary");
        } catch (error) {
            setStatusMessage("Error uploading set: " + error.message);
        }
    };

    const handleRemoveProposedItem = (index) => {
        setProposedVocabulary((prev) => {
            const next = [...prev];
            next.splice(index, 1);
            return next;
        });
    };

    // ----- Helpers -----
    const fixDateString = (s) => {
        if (!s) return s;
        let f = s.replace(" ", "T");
        f = f.replace(/(\.\d{3})\d+/, "$1");
        f = f.replace(/([+-]\d\d)$/, "$1:00");
        return f;
    };

    return (
        <div className="flex min-h-screen bg-[#141f25] text-white">
            {/* MainSidebar */}
            <MainSidebar />

            {/* Non-sidebar area with generous padding */}
            <main className="ml-auto flex-1 px-8 py-8 sm:px-10 sm:py-10 lg:px-12 lg:py-8">
                <Head>
                    <title>Create New Set</title>
                    <link rel="icon" href="/favicon.ico" />
                </Head>

                <div className="w-full max-w-5xl mx-auto">

                    {/* New Set Name */}
                    <section className="mb-4">
                        <label className="block mb-1 text-sm font-medium" htmlFor="newSetName">
                            New Set Name
                        </label>
                        <input
                            id="newSetName"
                            type="text"
                            value={newSetName}
                            onChange={(e) => setNewSetName(e.target.value)}
                            placeholder="e.g. 'My Lesson 5 Vocab'"
                            className="w-full sm:w-2/3 text-black rounded-md focus:outline-none px-3 py-2 text-sm"
                        />
                    </section>

                    {/* Wireframe Tab Selector (matches "My Sets / Groups" style) */}
                    <div className="border-b border-white/10 mb-2">
                        <div className="flex items-end gap-5 -mb-px h-9 text-sm">
                            {[
                                { key: "import", label: "Import Genki" },
                                { key: "single", label: "Add Single" },
                                { key: "bulk", label: "Add Bulk" },
                                { key: "search", label: "Search Vocabulary" },
                            ].map(({ key, label }) => (
                                <button
                                    key={key}
                                    onClick={() => setActiveTab(key)}
                                    className={`pb-2 pt-1 px-1 font-medium border-b-2 transition-colors focus:outline-none
                    ${activeTab === key
                                            ? "text-white border-[#e30a5f]"
                                            : "text-white/80 border-transparent hover:text-white hover:border-[#e30a5f]"}`}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Content Panel */}
                    <div className="rounded-lg shadow-lg bg-[#1c2b35] text-sm leading-6 h-[440px] overflow-hidden">
                        <div className="h-full overflow-y-auto p-4 sm:p-5" style={{ scrollbarGutter: 'stable' }}>

                            {/* Import */}
                            {activeTab === "import" && (
                                <div>

                                    <div className="mb-3">
                                        <label className="block mb-1 font-medium" htmlFor="genkiLesson">
                                            Select Genki Lesson
                                        </label>
                                        <select
                                            id="genkiLesson"
                                            value={genkiLesson}
                                            onChange={(e) => {
                                                const v = e.target.value;
                                                setGenkiLesson(v);
                                                if (!v) setImportChunk([]);
                                            }}
                                            className="w-full sm:w-1/2 text-black rounded-md focus:outline-none px-3 py-2 text-sm"
                                        >
                                            <option value="">-- No Lesson Selected --</option>
                                            {[...Array(12)].map((_, i) => {
                                                const n = i + 1;
                                                return (
                                                    <option key={n} value={n}>
                                                        Lesson {n}
                                                    </option>
                                                );
                                            })}
                                        </select>
                                    </div>

                                    {/* Imported list */}
                                    {importChunk.length > 0 && (
                                        <div className="mb-4">
                                            <div className="flex items-center justify-between mb-2">
                                                <h3 className="font-semibold">Imported Vocabulary</h3>
                                                <button
                                                    onClick={handleAddChunkToProposed}
                                                    className="inline-flex items-center rounded-md bg-green-600 hover:bg-green-500 px-3 py-1.5 text-sm"
                                                >
                                                    Add Imported
                                                </button>
                                            </div>

                                            <table className="w-full text-xs sm:text-sm border-collapse">
                                                <thead>
                                                    <tr className="border-b border-gray-500">
                                                        <th className="py-2 text-left">English</th>
                                                        <th className="py-2 text-left">Japanese</th>
                                                        <th className="py-2" />
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {importChunk.map((item, index) => {
                                                        const jp =
                                                            item["Japanese(Hiragana/Katakana)"] ||
                                                            item["Japanese (Hiragana/Katakana)"] ||
                                                            item.Japanese ||
                                                            "";
                                                        return (
                                                            <tr
                                                                key={index}
                                                                className="border-b border-gray-500 hover:bg-gray-600/60"
                                                            >
                                                                <td className="px-2 py-2">{item.English}</td>
                                                                <td className="px-2 py-2">{jp}</td>
                                                                <td className="px-2 py-2 text-right">
                                                                    <button
                                                                        onClick={() => handleRemoveFromChunk(index)}
                                                                        className="rounded bg-red-600 hover:bg-red-500 px-2 py-1 text-xs sm:text-sm"
                                                                    >
                                                                        Remove
                                                                    </button>
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>

                                            {/* Optional: add to chunk inline
                                        <div className="flex flex-wrap gap-2 mt-3">
                                        <input
                                            type="text"
                                            placeholder="English"
                                            value={addEnglishChunk}
                                            onChange={(e) => setAddEnglishChunk(e.target.value)}
                                            className="px-2 py-1 text-black rounded-md focus:outline-none w-full sm:w-1/2"
                                        />
                                        <input
                                            type="text"
                                            placeholder="Japanese"
                                            value={addJapaneseChunk}
                                            onChange={(e) => setAddJapaneseChunk(e.target.value)}
                                            className="px-2 py-1 text-black rounded-md focus:outline-none w-full sm:w-1/2"
                                        />
                                        <button
                                            onClick={handleAddToChunk}
                                            className="px-3 py-1.5 bg-blue-600 rounded hover:bg-blue-500"
                                        >
                                            + Add to Chunk
                                        </button>
                                        </div>
                                        */}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Single */}
                            {activeTab === "single" && (
                                <form onSubmit={handleAddSingleToProposed}>
                                    <div className="mb-3">
                                        <label className="block mb-1 font-medium" htmlFor="english">
                                            English
                                        </label>
                                        <input
                                            id="english"
                                            type="text"
                                            value={englishInput}
                                            onChange={(e) => setEnglishInput(e.target.value)}
                                            placeholder="Enter English term"
                                            className="w-full sm:w-2/3 text-black rounded-md focus:outline-none px-3 py-2 text-sm"
                                        />
                                    </div>
                                    <div className="mb-3">
                                        <label className="block mb-1 font-medium" htmlFor="japanese">
                                            Japanese
                                        </label>
                                        <input
                                            id="japanese"
                                            type="text"
                                            value={japaneseInput}
                                            onChange={(e) => setJapaneseInput(e.target.value)}
                                            placeholder="例: こんにちは"
                                            className="w-full sm:w-2/3 text-black rounded-md focus:outline-none px-3 py-2 text-sm"
                                        />
                                    </div>
                                    <button
                                        type="submit"
                                        className="inline-flex items-center rounded-md bg-green-600 hover:bg-green-500 px-3 py-1.5 text-sm"
                                    >
                                        Add
                                    </button>
                                </form>
                            )}

                            {/* Bulk */}
                            {activeTab === "bulk" && (
                                <div>
                                    <p className="text-xs sm:text-sm mb-2">
                                        Paste lines in the format: <i>English, Japanese</i>
                                    </p>
                                    <textarea
                                        rows={6}
                                        value={bulkInput}
                                        onChange={(e) => setBulkInput(e.target.value)}
                                        className="w-full text-black rounded-md focus:outline-none px-3 py-2 mb-3 text-sm"
                                        placeholder={`Example:\nhello, こんにちは\ngoodbye, さようなら`}
                                    />
                                    <button
                                        onClick={handleAddBulkToProposed}
                                        className="inline-flex items-center rounded-md bg-green-600 hover:bg-green-500 px-3 py-1.5 text-sm"
                                    >
                                        Add
                                    </button>
                                </div>
                            )}

                            {/* Search */}
                            {activeTab === "search" && (
                                <div>
                                    <div className="flex items-center mb-3">
                                        <input
                                            type="text"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            placeholder="Enter a word to search..."
                                            className="w-full sm:w-2/3 text-black rounded-md focus:outline-none px-3 py-2 text-sm"
                                        />
                                        <button
                                            onClick={handleSearch}
                                            className="ml-2 rounded-md bg-blue-600 hover:bg-blue-500 px-4 py-2 text-sm"
                                        >
                                            Search
                                        </button>
                                    </div>
                                    {searchResults?.length > 0 ? (
                                        <table className="w-full text-xs sm:text-sm border-collapse">
                                            <thead>
                                                <tr className="border-b border-gray-500">
                                                    <th className="py-2 text-left">English</th>
                                                    <th className="py-2 text-left">Japanese</th>
                                                    <th className="py-2" />
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {searchResults.map((item, index) => {
                                                    const jp =
                                                        item["Japanese(Hiragana/Katakana)"] ||
                                                        item.Japanese ||
                                                        "";
                                                    return (
                                                        <tr
                                                            key={index}
                                                            className="border-b border-gray-500 hover:bg-gray-600/60"
                                                        >
                                                            <td className="px-2 py-2">{item.English}</td>
                                                            <td className="px-2 py-2">{jp}</td>
                                                            <td className="px-2 py-2 text-right">
                                                                <button
                                                                    onClick={() => addSearchResultToProposed(item)}
                                                                    className="rounded bg-green-600 hover:bg-green-500 px-2 py-1 text-xs sm:text-sm"
                                                                >
                                                                    Add
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    ) : (
                                        <div className="text-center text-gray-300 text-sm">No search results to display.</div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Added Vocabulary Preview */}
                    {proposedVocabulary.length > 0 && (
                        <section className="mt-6">
                            <h2 className="text-lg font-semibold mb-2">Added Vocabulary</h2>
                            <table className="table-auto w-full border-collapse text-xs sm:text-sm">
                                <thead>
                                    <tr className="bg-gray-700 border-b border-gray-500">
                                        <th className="px-3 sm:px-4 py-2 text-left">English</th>
                                        <th className="px-3 sm:px-4 py-2 text-left">Japanese</th>
                                        <th className="px-3 sm:px-4 py-2 text-right">Remove</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {proposedVocabulary.map((item, idx) => (
                                        <tr key={idx} className="border-b border-gray-500 hover:bg-gray-600/60">
                                            <td className="px-3 sm:px-4 py-2">{item.English}</td>
                                            <td className="px-3 sm:px-4 py-2">{item.Japanese}</td>
                                            <td className="px-3 sm:px-4 py-2 text-right">
                                                <button
                                                    onClick={() => handleRemoveProposedItem(idx)}
                                                    className="rounded bg-red-600 hover:bg-red-500 px-2.5 py-1 text-xs sm:text-sm"
                                                >
                                                    X
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </section>
                    )}

                    {/* Submit & Exit */}
                    <section className="mt-2 text-center">
                        {statusMessage && (
                            <div className="mb-3 text-sm text-red-300">{statusMessage}</div>
                        )}
                        <div className="flex gap-3 justify-center">
                            <Link href="/learn/vocabulary">
                                <button className="px-5 py-2 bg-red-600 text-white rounded-md font-semibold hover:bg-red-500 transition-colors text-sm">
                                    Exit
                                </button>
                            </Link>
                            <button
                                onClick={handleSubmitAll}
                                className="px-5 py-2 bg-green-600 text-white rounded-md font-semibold hover:bg-green-500 transition-colors text-sm"
                            >
                                Create Set
                            </button>
                        </div>
                    </section>
                </div>
            </main>
        </div>
    );
}

export const getServerSideProps = withPageAuthRequired();




/*
          {/* (Optional) Lesson Selection at top 
          {availableLessons.length > 0 ? (
            <div className="mb-4">
              <label className="block mb-1 font-semibold" htmlFor="userLesson">
                Attach New Vocabulary to This Lesson:
              </label>
              <select
                id="userLesson"
                value={userLesson}
                onChange={(e) => setUserLesson(e.target.value)}
                className="w-full px-3 py-2 text-black rounded-md focus:outline-none"
              >
                <option value="">-- Select a Lesson --</option>
                {availableLessons.map((lessonItem) => (
                  <option key={lessonItem.id} value={lessonItem.id}>
                    {lessonItem.title}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <p className="mb-4 text-red-300">
              No user lessons found. Please create or configure lessons first.
            </p>
          )}*/