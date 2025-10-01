import Head from "next/head";
import MainSidebar from "../../../../components/Sidebars/MainSidebar";
import { withPageAuthRequired } from "@auth0/nextjs-auth0";
import { useState } from "react";
import { useRouter } from "next/router";
import { FaBook } from "react-icons/fa"; // Icon for Verbs
import { GiSpellBook } from "react-icons/gi"; // Icon for Adjectives
import Select from "react-select";
import { FaArrowsUpDown, FaShuffle } from "react-icons/fa6";

export default function ConjugationDashboard() {
  const router = useRouter();

  // Initial states for easy reset
  const initialVerbOptions = {
    dictionary: false,          // 辞書形
    masu: false,                // ます形
    te: false,                  // て形
    nai: false,                 // ない形 (Negative)
    ta: false,                  // た形 (Past)
    potential: false,           // 可能形
    imperative: false,          // 命令形
    volitional: false,          // 意向形
    conditional: false,         // 条件形
    passive: false,             // 受身形
    causative: false,           // 使役形
    causativePassive: false,    // 使役受身形
  };

  const initialAdjectiveOptions = {
    PresentAffirmative: false,  // 基本形
    PresentNegative: false,     // ない形
    PastAffirmative: false,     // かった形
    PastNegative: false,        // くなかった形
    TeForm: false,              // くて
  };

  // ==== Conjugation Options State ====
  const [verbOptions, setVerbOptions] = useState(initialVerbOptions);
  const [adjectiveOptions, setAdjectiveOptions] = useState(initialAdjectiveOptions);

  // Extra conjugation controls
  const [isSelectAll, setIsSelectAll] = useState(false);
  const [isRandomMode, setIsRandomMode] = useState(false);

  // ==== Book and Lesson Selection State ====
  const [selectedBooks, setSelectedBooks] = useState({
    genki1: false,
    genki2: false,
  });
  const [selectedLesson, setSelectedLesson] = useState(null);

  // ==== Conjugation Option Handlers ====
  const toggleVerbOption = (option) => {
    if (isRandomMode) return; // No manual changes in random mode
    setVerbOptions((prev) => {
      const newState = { ...prev, [option]: !prev[option] };
      updateSelectAllStatus(newState, adjectiveOptions);
      return newState;
    });
  };

  const toggleAdjectiveOption = (option) => {
    if (isRandomMode) return; // No manual changes in random mode
    setAdjectiveOptions((prev) => {
      const newState = { ...prev, [option]: !prev[option] };
      updateSelectAllStatus(verbOptions, newState);
      return newState;
    });
  };

  // Update the "Select All" checkbox status.
  const updateSelectAllStatus = (newVerbOptions, newAdjectiveOptions) => {
    const allVerbsSelected = Object.values(newVerbOptions).every((v) => v);
    const allAdjectivesSelected = Object.values(newAdjectiveOptions).every((v) => v);
    setIsSelectAll(allVerbsSelected && allAdjectivesSelected);
  };

  const handleToggleSelectAll = () => {
    if (isSelectAll) {
      setVerbOptions(initialVerbOptions);
      setAdjectiveOptions(initialAdjectiveOptions);
      setIsSelectAll(false);
    } else {
      setVerbOptions(
        Object.keys(initialVerbOptions).reduce((acc, k) => ({ ...acc, [k]: true }), {})
      );
      setAdjectiveOptions(
        Object.keys(initialAdjectiveOptions).reduce((acc, k) => ({ ...acc, [k]: true }), {})
      );
      setIsSelectAll(true);
      setIsRandomMode(false);
    }
  };

  const handleToggleRandomMode = () => {
    if (isRandomMode) {
      setIsRandomMode(false);
    } else {
      setIsRandomMode(true);
      setIsSelectAll(false);
      // Clear manual selections when random mode is activated.
      setVerbOptions(initialVerbOptions);
      setAdjectiveOptions(initialAdjectiveOptions);
    }
  };

  // ==== Book and Lesson Handlers ====
  const handleBookSelection = (book) => {
    setSelectedBooks((prev) => ({ ...prev, [book]: !prev[book] }));
    setSelectedLesson(null); // Clear the lesson when books change.
  };

  // Create a list of lessons (Lessons 1–23)
  const lessons = Array.from({ length: 23 }, (_, i) => `Lesson ${i + 1}`);
  // Filter lessons based on the selected books.
  const filteredLessonOptions = lessons
    .filter((_, index) => {
      if (selectedBooks.genki1 && index < 12) return true; // Genki 1: 1–12
      if (selectedBooks.genki2 && index >= 12 && index < 23) return true; // Genki 2: 13–23
      return false;
    })
    .map((lesson) => ({ value: lesson, label: lesson }));

  // ==== Buttons ====
  const handleBegin = () => {
    if (!isRandomMode && !selectedLesson) {
      alert("Please select a lesson.");
      return;
    }

    if (isRandomMode) {
      router.push({
        pathname: "/learn/conjugation",
        query: { random: "1", lesson: selectedLesson || "" },
      });
      return;
    }

    const selectedVerbs = Object.keys(verbOptions).filter((key) => verbOptions[key]);
    const selectedAdjectives = Object.keys(adjectiveOptions).filter(
      (key) => adjectiveOptions[key]
    );

    if (selectedVerbs.length === 0 && selectedAdjectives.length === 0) {
      alert("Please select at least one conjugation option.");
      return;
    }

    const query = {
      lesson: selectedLesson,
      verbs: selectedVerbs.join(","),
      adjectives: selectedAdjectives.join(","),
    };

    router.push({ pathname: "/learn/conjugation", query });
  };

  // NEW: Cancel resets all selections and modes
  const handleCancel = () => {
    router.push({ pathname: "/learn/grammar" });
  };

  return (
    <div className="flex min-h-screen">
      <MainSidebar />

      {/* More padding to the right of the sidebar + smaller global font */}
      <main className="ml-64 flex-1 pl-12 pr-8 py-10 flex flex-col items-center justify-center">
        <Head>
          <title>Conjugation</title>
          <link rel="icon" href="/favicon.ico" />
        </Head>

        {/* Combined Container (narrower + small text) */}
        <div className="w-[720px] rounded-xl shadow-lg overflow-hidden text-[13px] leading-5">
          {/* ---- Book and Lesson Selection (Precursor) ---- */}
          <div className="px-6 py-4 bg-white text-black">
            <h2 className="text-base font-semibold mb-2">Conjugation</h2>

            <div>
              <h3 className="text-sm font-semibold mb-2">Select Book(s)</h3>
              <div className="grid grid-cols-1 gap-2 ml-2">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedBooks.genki1}
                    onChange={() => handleBookSelection("genki1")}
                    className="mr-2"
                  />
                  Genki 1 Third Edition
                </label>
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedBooks.genki2}
                    onChange={() => handleBookSelection("genki2")}
                    className="mr-2"
                  />
                  Genki 2
                </label>
              </div>
            </div>

            <div className="mt-2">
              <h3 className="text-sm font-semibold">Select Lesson</h3>
              <div className="min-h-[32px] flex items-center">
                {Object.values(selectedBooks).some((isSelected) => isSelected) ? (
                  <Select
                    options={filteredLessonOptions}
                    value={
                      selectedLesson
                        ? { value: selectedLesson, label: selectedLesson }
                        : null
                    }
                    onChange={(option) =>
                      setSelectedLesson(option ? option.value : null)
                    }
                    placeholder="Select a Lesson"
                    isClearable
                    isSearchable
                    styles={{
                      control: (base, state) => ({
                        ...base,
                        backgroundColor: "#fff",
                        color: "#000",
                        minHeight: 30,
                        height: 30,
                        borderColor: state.isFocused ? "#e30a5f" : base.borderColor,
                        boxShadow: state.isFocused ? "0 0 0 1px #e30a5f" : "none",
                        "&:hover": {
                          borderColor: state.isFocused ? "#e30a5f" : base.borderColor,
                        },
                      }),
                      valueContainer: (base) => ({
                        ...base,
                        padding: "0 8px",
                      }),
                      input: (base) => ({ ...base, margin: 0, padding: 0 }),
                      indicatorsContainer: (base) => ({
                        ...base,
                        height: 30,
                      }),
                      singleValue: (base) => ({
                        ...base,
                        color: "#000",
                        fontSize: "0.875rem",
                      }),
                      menu: (base) => ({ ...base, backgroundColor: "#fff" }),
                      option: (base, state) => ({
                        ...base,
                        fontSize: "0.875rem",
                        backgroundColor: state.isFocused ? "#f0f0f0" : "#fff",
                        color: "#000",
                      }),
                      placeholder: (base) => ({
                        ...base,
                        color: "#999",
                        fontSize: "0.875rem",
                      }),
                    }}
                  />
                ) : (
                  <p className="text-gray-500">Please select a book to see lessons.</p>
                )}
              </div>
            </div>
          </div>

          {/* ---- Conjugation Options ---- */}
          <div className="p-5 bg-gradient-to-r from-[#404f7d] to-blue-600 text-white">
            {/* Extra Controls: Select All and Random Mode */}
            <div className="flex items-center justify-beginning mb-3">
              <div
                className={`flex items-center mr-6 cursor-pointer`}
                onClick={handleToggleSelectAll}
              >
                <FaArrowsUpDown
                  className={`mr-1 ${isSelectAll ? "text-green-400" : "text-white"}`}
                  size={16}
                />
                <span className="text-sm">Select All</span>
              </div>

              <div
                className="flex items-center cursor-pointer"
                onClick={handleToggleRandomMode}
              >
                <FaShuffle
                  className={`mr-2 ${isRandomMode ? "text-green-400" : "text-white"}`}
                  size={16}
                />
                <span className="text-sm">Random Mode</span>
              </div>
            </div>

            {/* Conjugation Checkboxes */}
            <div className="flex gap-5">
              {/* Verbs Section */}
              <section className="flex-1">
                <h3 className="text-base font-semibold flex items-center mb-2">
                  <FaBook className="mr-2" size={14} /> Verbs
                </h3>
                <div className="pl-4">
                  {[
                    { key: "dictionary", label: "Dictionary (辞書形)" },
                    { key: "masu", label: "Masu (ます形)" },
                    { key: "te", label: "Te-form (て形)" },
                    { key: "nai", label: "Negative (ない形)" },
                    { key: "ta", label: "Past (た形)" },
                    { key: "potential", label: "Potential (可能形)" },
                    { key: "imperative", label: "Imperative (命令形)" },
                    { key: "volitional", label: "Volitional (意向形)" },
                    { key: "conditional", label: "Conditional (条件形)" },
                    { key: "passive", label: "Passive (受身形)" },
                    { key: "causative", label: "Causative (使役形)" },
                    { key: "causativePassive", label: "Causative-passive (使役受身形)" },
                  ].map(({ key, label }) => (
                    <label key={key} className="block mb-1">
                      <input
                        type="checkbox"
                        checked={verbOptions[key]}
                        disabled={isRandomMode}
                        onChange={() => toggleVerbOption(key)}
                        className="mr-2"
                      />
                      {label}
                    </label>
                  ))}
                </div>
              </section>

              {/* Adjectives Section */}
              <section className="flex-1">
                <h3 className="text-base font-semibold flex items-center mb-2">
                  <GiSpellBook className="mr-2" size={14} /> Adjectives
                </h3>
                <div className="pl-4">
                  {[
                    { key: "PresentAffirmative", label: "Present Affirmative (基本形)" },
                    { key: "PresentNegative", label: "Present Negative (ない形)" },
                    { key: "PastAffirmative", label: "Past Affirmative (かった形)" },
                    { key: "PastNegative", label: "Past Negative (くなかった形)" },
                    { key: "TeForm", label: "Te-form (くて)" },
                  ].map(({ key, label }) => (
                    <label key={key} className="block mb-1">
                      <input
                        type="checkbox"
                        checked={adjectiveOptions[key]}
                        disabled={isRandomMode}
                        onChange={() => toggleAdjectiveOption(key)}
                        className="mr-2"
                      />
                      {label}
                    </label>
                  ))}
                </div>
              </section>
            </div>

            {/* Buttons Row: Cancel (left) and Begin (right) */}
            <div className="flex items-center justify-between mt-4">
              <button
                className="border border-white/40 text-white rounded-lg py-1.5 px-3 text-xs hover:bg-white/10 active:bg-white/20 transition"
                onClick={handleCancel}
              >
                Cancel
              </button>

              <div className="relative inline-block">
                <div className="absolute inset-x-0 bottom-0 bg-[#B0104F] rounded-lg translate-y-1 h-[88%] transition-transform duration-200"></div>
                <button
                  className="relative bg-[#E30B5C] active:bg-[#f41567] text-white py-1.5 px-3 rounded-lg transform transition-transform duration-200 active:translate-y-1 text-xs"
                  onClick={handleBegin}
                >
                  Begin
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export const getServerSideProps = withPageAuthRequired();
