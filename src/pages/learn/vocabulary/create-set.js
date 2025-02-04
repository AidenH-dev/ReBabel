// pages/learn/vocabulary/create-new-set.js
import Link from "next/link";
import Head from "next/head";
import Sidebar from "../../../components/Sidebar";
import { withPageAuthRequired } from "@auth0/nextjs-auth0";
import { useState, useEffect } from "react";
import { useRouter } from "next/router";

export default function CreateNewSet() {
    const router = useRouter();

    // ------------------------- User Profile -------------------------
    const [userProfile, setUserProfile] = useState(null);

    useEffect(() => {
        // Fetch user profile from Auth0 or mock API
        const fetchUserProfile = async () => {
            try {
                const response = await fetch("/api/auth/me"); // Auth0 endpoint to get user profile
                const profile = await response.json();
                setUserProfile(profile);
            } catch (error) {
                console.error("Error fetching user profile:", error);
            }
        };

        fetchUserProfile();
    }, []);

    // ------------------------- State -------------------------
    // Name of the new set
    const [newSetName, setNewSetName] = useState("");

    // Proposed vocabulary items (in-memory array)
    const [proposedVocabulary, setProposedVocabulary] = useState([]);

    // Tabs
    const [activeTab, setActiveTab] = useState("import");
    // Possible values: "import", "single", "bulk", "search"

    // Status / feedback
    const [statusMessage, setStatusMessage] = useState("");

    // ------------------------- For Importing Genki -------------------------
    const [genkiLesson, setGenkiLesson] = useState("");
    const [importChunk, setImportChunk] = useState([]);
    // Fields to add a custom item to the chunk
    const [addEnglishChunk, setAddEnglishChunk] = useState("");
    const [addJapaneseChunk, setAddJapaneseChunk] = useState("");

    // ------------------------- For Single Addition -------------------------
    const [englishInput, setEnglishInput] = useState("");
    const [japaneseInput, setJapaneseInput] = useState("");

    // ------------------------- For Bulk Addition -------------------------
    const [bulkInput, setBulkInput] = useState("");

    // ------------------------- For Search Vocabulary -------------------------
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState([]);

    // ------------------------- 1) Import from Genki (in-memory) -------------------------
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

    // Whenever genkiLesson changes, fetch the chunk
    useEffect(() => {
        if (genkiLesson) {
            handleImportChunk(genkiLesson);
        }
    }, [genkiLesson]);

    // Remove an item from the currently imported chunk
    const handleRemoveFromChunk = (index) => {
        setImportChunk((prev) => {
            const newChunk = [...prev];
            newChunk.splice(index, 1);
            return newChunk;
        });
    };

    // Add a custom item into the chunk
    const handleAddToChunk = () => {
        if (!addEnglishChunk.trim() || !addJapaneseChunk.trim()) return;
        setImportChunk((prev) => [
            ...prev,
            {
                English: addEnglishChunk.trim(),
                Japanese: addJapaneseChunk.trim(),
            },
        ]);
        setAddEnglishChunk("");
        setAddJapaneseChunk("");
    };

    // Add entire chunk to proposedVocabulary (in memory)
    const handleAddChunkToProposed = () => {
        if (!importChunk.length) {
            setStatusMessage("No items to add from the imported chunk.");
            return;
        }

        // Convert each chunk item to the unified structure
        const itemsToAdd = importChunk.map((item) => ({
            English: item.English,
            Japanese:
                item["Japanese(Hiragana/Katakana)"] ||
                item.Japanese ||
                item["Japanese (Hiragana/Katakana)"] ||
                "",
        }));

        // Filter out any empty pairs, just in case
        const validItems = itemsToAdd.filter(
            (x) => x.English && x.English.trim() && x.Japanese && x.Japanese.trim()
        );

        // Update proposedVocabulary
        setProposedVocabulary((prev) => [...prev, ...validItems]);

        // Clear chunk + genkiLesson
        setImportChunk([]);
        setGenkiLesson("");
        setStatusMessage(`${validItems.length} item(s) added to your proposed list!`);
    };

    // ------------------------- 2) Handle Single Item (in memory) -------------------------
    const handleAddSingleToProposed = (e) => {
        e.preventDefault();

        if (!englishInput.trim() || !japaneseInput.trim()) {
            setStatusMessage("Please provide both English and Japanese terms.");
            return;
        }

        // Add to proposedVocabulary
        setProposedVocabulary((prev) => [
            ...prev,
            {
                English: englishInput.trim(),
                Japanese: japaneseInput.trim(),
            },
        ]);

        // Clear input fields
        setEnglishInput("");
        setJapaneseInput("");
        setStatusMessage("Single vocabulary item added in memory!");
    };

    // ------------------------- 3) Handle Bulk Addition (in memory) -------------------------
    const handleAddBulkToProposed = () => {
        if (!bulkInput.trim()) {
            setStatusMessage("Please provide some lines in bulk input.");
            return;
        }

        const lines = bulkInput.split("\n").filter((line) => line.trim());

        const itemsToAdd = [];
        for (const line of lines) {
            const [english, japanese] = line.split(",").map((s) => s.trim());
            if (english && japanese) {
                itemsToAdd.push({ English: english, Japanese: japanese });
            }
        }

        setProposedVocabulary((prev) => [...prev, ...itemsToAdd]);
        setBulkInput("");
        setStatusMessage(`${itemsToAdd.length} bulk item(s) added in memory!`);
    };

    // ------------------------- 4) Handle Search Vocabulary (in memory) -------------------------
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
        const vocabularyItem = {
            English: item.English,
            Japanese: item["Japanese(Hiragana/Katakana)"] || item.Japanese || "",
        };
        setProposedVocabulary((prev) => [...prev, vocabularyItem]);
        setStatusMessage(`Added "${item.English}" to proposed list.`);
    };

    // ------------------------- 5) Final Request to Create New Set & Items -------------------------
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

        // Build the JSON payload including the user's email from the userProfile
        const payload = {
            setName: newSetName.trim(),
            userEmail: userProfile.email,
            items: proposedVocabulary,
        };

        try {
            const res = await fetch("/api/database/upload-user-set", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const errorData = await res.json();
                setStatusMessage("Error: " + errorData.error);
                return;
            }

            const resultData = await res.json();
            setStatusMessage(
                `Set "${newSetName}" created successfully with ${proposedVocabulary.length} items!`
            );
            // Optionally clear the state after successful upload.
            // setNewSetName("");
            // setProposedVocabulary([]);
            router.push("/learn/vocabulary");
        } catch (error) {
            setStatusMessage("Error uploading set: " + error.message);
        }
    };

    // ------------------------- 6) Remove a Proposed Item (Optional) -------------------------
    const handleRemoveProposedItem = (index) => {
        setProposedVocabulary((prev) => {
            const newList = [...prev];
            newList.splice(index, 1);
            return newList;
        });
    };

    return (
        <main className="flex flex-row min-h-screen bg-[#141f25] text-white">
            {/* Sidebar (optional) */}
            <Sidebar />

            {/* Main Content */}
            <div className="ml-40 flex-1 flex flex-col justify-center items-center p-3">
                <Head>
                    <title>Create New Set</title>
                    <link rel="icon" href="/favicon.ico" />
                </Head>

                <div className="w-full max-w-4xl mx-auto px-4 sm:px-8">
                    <h1 className="text-3xl font-bold mb-6 text-center">
                        Create a New Vocabulary Set
                    </h1>

                    {/* ------------------------- New Set Name ------------------------- */}
                    <section className="mb-6">
                        <label className="block mb-2 font-semibold" htmlFor="newSetName">
                            New Set Name:
                        </label>
                        <input
                            id="newSetName"
                            type="text"
                            value={newSetName}
                            onChange={(e) => setNewSetName(e.target.value)}
                            placeholder="e.g. 'My Lesson 5 Vocab'"
                            className="px-3 py-2 text-black rounded-md focus:outline-none w-full sm:w-auto"
                        />
                    </section>

                    {/* ------------------------- Tab Buttons ------------------------- */}
                    <div className="flex justify-left space-x-4 mb-4">
                        <button
                            onClick={() => setActiveTab("import")}
                            className={`px-4 py-2 rounded-md font-semibold transition-colors 
                ${activeTab === "import" ? "bg-[#da1c60]" : "bg-gray-600"} 
                hover:bg-[#c71854]`}
                        >
                            Import Genki
                        </button>
                        <button
                            onClick={() => setActiveTab("single")}
                            className={`px-4 py-2 rounded-md font-semibold transition-colors 
                ${activeTab === "single" ? "bg-[#da1c60]" : "bg-gray-600"} 
                hover:bg-[#c71854]`}
                        >
                            Add Single
                        </button>
                        <button
                            onClick={() => setActiveTab("bulk")}
                            className={`px-4 py-2 rounded-md font-semibold transition-colors 
                ${activeTab === "bulk" ? "bg-[#da1c60]" : "bg-gray-600"} 
                hover:bg-[#c71854]`}
                        >
                            Add Bulk
                        </button>
                        <button
                            onClick={() => setActiveTab("search")}
                            className={`px-4 py-2 rounded-md font-semibold transition-colors 
                ${activeTab === "search" ? "bg-[#da1c60]" : "bg-gray-600"} 
                hover:bg-[#c71854]`}
                        >
                            Search Vocabulary
                        </button>
                    </div>

                    {/* ------------------------- Tab Container ------------------------- */}
                    <div className="bg-[#2d3c47] rounded-lg shadow-md p-4 mb-6 h-[500px] overflow-y-auto">
                        {activeTab === "import" && (
                            <div>
                                <h2 className="text-lg font-semibold mb-3">
                                    Import Genki Vocabulary
                                </h2>
                                <div className="mb-3">
                                    <label
                                        className="block mb-1 font-semibold"
                                        htmlFor="genkiLesson"
                                    >
                                        Select Genki Lesson:
                                    </label>
                                    <select
                                        id="genkiLesson"
                                        value={genkiLesson}
                                        onChange={(e) => {
                                            const selectedLesson = e.target.value;
                                            setGenkiLesson(selectedLesson);
                                            if (selectedLesson === "") {
                                                // Clear the imported vocabulary list when no lesson is selected.
                                                setImportChunk([]);
                                            }
                                        }}
                                        className="w-full px-3 py-2 text-black rounded-md focus:outline-none"
                                    >
                                        <option value="">-- No Lesson Selected --</option>
                                        {[...Array(12)].map((_, idx) => {
                                            const lessonNum = idx + 1;
                                            return (
                                                <option key={lessonNum} value={lessonNum}>
                                                    Lesson {lessonNum}
                                                </option>
                                            );
                                        })}
                                    </select>
                                </div>

                                {/* Show imported chunk if any */}
                                {importChunk.length > 0 && (
                                    <div className="mb-4">
                                        {/* Button to finalize chunk into proposedVocabulary */}
                                        <button
                                            onClick={handleAddChunkToProposed}
                                            className="px-2 py-1 my-2 bg-green-600 rounded hover:bg-green-500"
                                        >
                                            Add Imported
                                        </button>
                                        <h3 className="font-semibold mb-2">
                                            Imported Vocabulary:
                                        </h3>
                                        <table className="w-full text-sm mb-3 border-collapse">
                                            <thead>
                                                <tr className="border-b border-gray-500">
                                                    <th className="py-2 text-left">English</th>
                                                    <th className="py-2 text-left">Japanese</th>
                                                    <th className="py-2" />
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {importChunk.map((item, index) => {
                                                    const japaneseVal =
                                                        item["Japanese(Hiragana/Katakana)"] ||
                                                        item.Japanese ||
                                                        "";
                                                    return (
                                                        <tr
                                                            key={index}
                                                            className="border-b border-gray-500 hover:bg-gray-600"
                                                        >
                                                            <td className="px-2 py-2">{item.English}</td>
                                                            <td className="px-2 py-2">{japaneseVal}</td>
                                                            <td className="px-2 py-2 text-right">
                                                                <button
                                                                    onClick={() => handleRemoveFromChunk(index)}
                                                                    className="px-2 py-1 bg-red-600 rounded hover:bg-red-500"
                                                                >
                                                                    Remove
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>

                                        {/* Add single item to the chunk
                                        <div className="flex flex-wrap gap-2 mb-3">
                                            <input
                                                type="text"
                                                placeholder="English"
                                                value={addEnglishChunk}
                                                onChange={(e) => setAddEnglishChunk(e.target.value)}
                                                className="px-2 py-1 text-black rounded-md focus:outline-none w-1/2"
                                            />
                                            <input
                                                type="text"
                                                placeholder="Japanese"
                                                value={addJapaneseChunk}
                                                onChange={(e) => setAddJapaneseChunk(e.target.value)}
                                                className="px-2 py-1 text-black rounded-md focus:outline-none w-1/2"
                                            />
                                            <button
                                                onClick={handleAddToChunk}
                                                className="px-4 py-1 bg-blue-600 rounded hover:bg-blue-500"
                                            >
                                                + Add to Chunk
                                            </button>
                                        </div> */}


                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === "single" && (
                            <form onSubmit={handleAddSingleToProposed}>
                                <h2 className="text-lg font-semibold mb-3">
                                    Add Single Vocabulary
                                </h2>
                                <div className="mb-3">
                                    <label className="block mb-1 font-semibold" htmlFor="english">
                                        English
                                    </label>
                                    <input
                                        id="english"
                                        type="text"
                                        value={englishInput}
                                        onChange={(e) => setEnglishInput(e.target.value)}
                                        placeholder="Enter English term"
                                        className="w-full px-3 py-2 text-black rounded-md focus:outline-none"
                                    />
                                </div>
                                <div className="mb-3">
                                    <label
                                        className="block mb-1 font-semibold"
                                        htmlFor="japanese"
                                    >
                                        Japanese
                                    </label>
                                    <input
                                        id="japanese"
                                        type="text"
                                        value={japaneseInput}
                                        onChange={(e) => setJapaneseInput(e.target.value)}
                                        placeholder="例: こんにちは"
                                        className="w-full px-3 py-2 text-black rounded-md focus:outline-none"
                                    />
                                </div>
                                <button
                                    type="submit"
                                    className="px-2 py-1 bg-green-600 rounded hover:bg-green-500"
                                >
                                    Add
                                </button>
                            </form>
                        )}

                        {activeTab === "bulk" && (
                            <div>
                                <h2 className="text-lg font-semibold mb-3">
                                    Add Vocabulary in Bulk
                                </h2>
                                <p className="text-sm mb-2">
                                    Paste lines in the format: <i>English, Japanese</i>
                                </p>
                                <textarea
                                    rows={6}
                                    value={bulkInput}
                                    onChange={(e) => setBulkInput(e.target.value)}
                                    className="w-full px-3 py-2 text-black rounded-md focus:outline-none mb-3"
                                    placeholder={`Example:\nhello, こんにちは\ngoodbye, さようなら`}
                                />
                                <button
                                    onClick={handleAddBulkToProposed}
                                    className="px-2 py-1 bg-green-600 rounded hover:bg-green-500"
                                >
                                    Add
                                </button>
                            </div>
                        )}

                        {activeTab === "search" && (
                            <div>
                                <h2 className="text-lg font-semibold mb-3">
                                    Search Vocabulary
                                </h2>
                                <div className="flex items-center mb-3">
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="Enter a word to search..."
                                        className="w-full px-3 py-2 text-black rounded-md focus:outline-none"
                                    />
                                    <button
                                        onClick={handleSearch}
                                        className="ml-2 px-4 py-2 bg-blue-600 rounded hover:bg-blue-500"
                                    >
                                        Search
                                    </button>
                                </div>
                                {searchResults && searchResults.length > 0 ? (
                                    <table className="w-full text-sm mb-3 border-collapse">
                                        <thead>
                                            <tr className="border-b border-gray-500">
                                                <th className="py-2 text-left">English</th>
                                                <th className="py-2 text-left">Japanese</th>
                                                <th className="py-2" />
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {searchResults.map((item, index) => {
                                                const japaneseVal =
                                                    item["Japanese(Hiragana/Katakana)"] ||
                                                    item.Japanese ||
                                                    "";
                                                return (
                                                    <tr
                                                        key={index}
                                                        className="border-b border-gray-500 hover:bg-gray-600"
                                                    >
                                                        <td className="px-2 py-2">{item.English}</td>
                                                        <td className="px-2 py-2">{japaneseVal}</td>
                                                        <td className="px-2 py-2 text-right">
                                                            <button
                                                                onClick={() => addSearchResultToProposed(item)}
                                                                className="px-2 py-1 bg-green-600 rounded hover:bg-green-500"
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
                                    <div className="text-center text-gray-300">
                                        No search results to display.
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* ------------------------- Added Vocabulary Table (Preview) ------------------------- */}
                    {proposedVocabulary.length > 0 && (
                        <section className="mb-6">
                            <h2 className="text-xl font-semibold mb-2">Added Vocabulary</h2>
                            <table className="table-auto w-full border-collapse text-sm">
                                <thead>
                                    <tr className="bg-gray-700 border-b border-gray-500">
                                        <th className="px-4 py-2 text-left">English</th>
                                        <th className="px-4 py-2 text-left">Japanese</th>
                                        <th className="px-4 py-2 text-right">Remove</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {proposedVocabulary.map((item, idx) => (
                                        <tr
                                            key={idx}
                                            className="border-b border-gray-500 hover:bg-gray-600"
                                        >
                                            <td className="px-4 py-2">{item.English}</td>
                                            <td className="px-4 py-2">{item.Japanese}</td>
                                            <td className="px-4 py-2 text-right">
                                                <button
                                                    onClick={() => handleRemoveProposedItem(idx)}
                                                    className="px-3 py-1 bg-red-600 rounded hover:bg-red-500"
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

                    {/* ------------------------- Final Submit (Upload via API) ------------------------- */}
                    <section className="text-center">
                        {/* Status/feedback message */}
                        {statusMessage && (
                            <div className="mb-4 text-center text-sm text-red-300">
                                {statusMessage}
                            </div>
                        )}
                        <div className="flex gap-4">
                            {/* Exit Button */}
                            <Link href="/learn/vocabulary">
                                <button className="px-6 py-2 bg-red-600 text-white rounded-md font-semibold hover:bg-red-500 transition-colors">
                                    Exit
                                </button>
                            </Link>

                            {/* Create Set Button */}
                            <button
                                onClick={handleSubmitAll}
                                className="px-6 py-2 bg-green-600 text-white rounded-md font-semibold hover:bg-green-500 transition-colors"
                            >
                                Create Set
                            </button>
                        </div>
                    </section>
                </div>
            </div>
        </main>
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