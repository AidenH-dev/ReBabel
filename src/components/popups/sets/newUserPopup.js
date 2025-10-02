import { useState } from "react";
import { FaRocket, FaTimes, FaStar, FaGift, FaBook, FaCheckCircle } from "react-icons/fa";
import { TbSparkles } from "react-icons/tb";

// Starter data for the three sets
const COMMON_WORDS_DATA = [
  { english: "Hello", kana: "こんにちは", kanji: "今日は", category: "expression" },
  { english: "Thank you", kana: "ありがとう", kanji: "有難う", category: "expression" },
  { english: "Yes", kana: "はい", kanji: "", category: "expression" },
  { english: "No", kana: "いいえ", kanji: "", category: "expression" },
  { english: "I", kana: "わたし", kanji: "私", category: "noun" },
  { english: "You", kana: "あなた", kanji: "貴方", category: "noun" },
  { english: "This", kana: "これ", kanji: "", category: "noun" },
  { english: "That", kana: "それ", kanji: "", category: "noun" },
  { english: "What", kana: "なに", kanji: "何", category: "noun" },
  { english: "Who", kana: "だれ", kanji: "誰", category: "noun" },
  { english: "Where", kana: "どこ", kanji: "", category: "noun" },
  { english: "When", kana: "いつ", kanji: "", category: "noun" },
  { english: "Why", kana: "なぜ", kanji: "", category: "noun" },
  { english: "How", kana: "どう", kanji: "", category: "adverb" },
  { english: "Good", kana: "いい", kanji: "良い", category: "adjective" },
  { english: "Bad", kana: "わるい", kanji: "悪い", category: "adjective" },
  { english: "Big", kana: "おおきい", kanji: "大きい", category: "adjective" },
  { english: "Small", kana: "ちいさい", kanji: "小さい", category: "adjective" },
  { english: "Hot", kana: "あつい", kanji: "暑い", category: "adjective" },
  { english: "Cold", kana: "さむい", kanji: "寒い", category: "adjective" },
  { english: "To eat", kana: "たべる", kanji: "食べる", category: "verb" },
  { english: "To drink", kana: "のむ", kanji: "飲む", category: "verb" },
  { english: "To go", kana: "いく", kanji: "行く", category: "verb" },
  { english: "To come", kana: "くる", kanji: "来る", category: "verb" },
  { english: "To see", kana: "みる", kanji: "見る", category: "verb" },
  { english: "To hear", kana: "きく", kanji: "聞く", category: "verb" },
  { english: "To speak", kana: "はなす", kanji: "話す", category: "verb" },
  { english: "To read", kana: "よむ", kanji: "読む", category: "verb" },
  { english: "To write", kana: "かく", kanji: "書く", category: "verb" },
  { english: "To buy", kana: "かう", kanji: "買う", category: "verb" },
  { english: "Water", kana: "みず", kanji: "水", category: "noun" },
  { english: "Food", kana: "たべもの", kanji: "食べ物", category: "noun" },
  { english: "Person", kana: "ひと", kanji: "人", category: "noun" },
  { english: "House", kana: "いえ", kanji: "家", category: "noun" },
  { english: "School", kana: "がっこう", kanji: "学校", category: "noun" },
  { english: "Book", kana: "ほん", kanji: "本", category: "noun" },
  { english: "Car", kana: "くるま", kanji: "車", category: "noun" },
  { english: "Time", kana: "じかん", kanji: "時間", category: "noun" },
  { english: "Day", kana: "ひ", kanji: "日", category: "noun" },
  { english: "Year", kana: "とし", kanji: "年", category: "noun" },
  { english: "Month", kana: "つき", kanji: "月", category: "noun" },
  { english: "Name", kana: "なまえ", kanji: "名前", category: "noun" },
  { english: "Friend", kana: "ともだち", kanji: "友達", category: "noun" },
  { english: "Teacher", kana: "せんせい", kanji: "先生", category: "noun" },
  { english: "Student", kana: "がくせい", kanji: "学生", category: "noun" },
  { english: "Today", kana: "きょう", kanji: "今日", category: "noun" },
  { english: "Tomorrow", kana: "あした", kanji: "明日", category: "noun" },
  { english: "Yesterday", kana: "きのう", kanji: "昨日", category: "noun" },
  { english: "Now", kana: "いま", kanji: "今", category: "noun" },
  { english: "Morning", kana: "あさ", kanji: "朝", category: "noun" }
];

const HIRAGANA_DATA = [
  { char: "あ", romaji: "a" }, { char: "い", romaji: "i" }, { char: "う", romaji: "u" }, { char: "え", romaji: "e" }, { char: "お", romaji: "o" },
  { char: "か", romaji: "ka" }, { char: "き", romaji: "ki" }, { char: "く", romaji: "ku" }, { char: "け", romaji: "ke" }, { char: "こ", romaji: "ko" },
  { char: "さ", romaji: "sa" }, { char: "し", romaji: "shi" }, { char: "す", romaji: "su" }, { char: "せ", romaji: "se" }, { char: "そ", romaji: "so" },
  { char: "た", romaji: "ta" }, { char: "ち", romaji: "chi" }, { char: "つ", romaji: "tsu" }, { char: "て", romaji: "te" }, { char: "と", romaji: "to" },
  { char: "な", romaji: "na" }, { char: "に", romaji: "ni" }, { char: "ぬ", romaji: "nu" }, { char: "ね", romaji: "ne" }, { char: "の", romaji: "no" },
  { char: "は", romaji: "ha" }, { char: "ひ", romaji: "hi" }, { char: "ふ", romaji: "fu" }, { char: "へ", romaji: "he" }, { char: "ほ", romaji: "ho" },
  { char: "ま", romaji: "ma" }, { char: "み", romaji: "mi" }, { char: "む", romaji: "mu" }, { char: "め", romaji: "me" }, { char: "も", romaji: "mo" },
  { char: "や", romaji: "ya" }, { char: "ゆ", romaji: "yu" }, { char: "よ", romaji: "yo" },
  { char: "ら", romaji: "ra" }, { char: "り", romaji: "ri" }, { char: "る", romaji: "ru" }, { char: "れ", romaji: "re" }, { char: "ろ", romaji: "ro" },
  { char: "わ", romaji: "wa" }, { char: "を", romaji: "wo" }, { char: "ん", romaji: "n" }
];

const KATAKANA_DATA = [
  { char: "ア", romaji: "a" }, { char: "イ", romaji: "i" }, { char: "ウ", romaji: "u" }, { char: "エ", romaji: "e" }, { char: "オ", romaji: "o" },
  { char: "カ", romaji: "ka" }, { char: "キ", romaji: "ki" }, { char: "ク", romaji: "ku" }, { char: "ケ", romaji: "ke" }, { char: "コ", romaji: "ko" },
  { char: "サ", romaji: "sa" }, { char: "シ", romaji: "shi" }, { char: "ス", romaji: "su" }, { char: "セ", romaji: "se" }, { char: "ソ", romaji: "so" },
  { char: "タ", romaji: "ta" }, { char: "チ", romaji: "chi" }, { char: "ツ", romaji: "tsu" }, { char: "テ", romaji: "te" }, { char: "ト", romaji: "to" },
  { char: "ナ", romaji: "na" }, { char: "ニ", romaji: "ni" }, { char: "ヌ", romaji: "nu" }, { char: "ネ", romaji: "ne" }, { char: "ノ", romaji: "no" },
  { char: "ハ", romaji: "ha" }, { char: "ヒ", romaji: "hi" }, { char: "フ", romaji: "fu" }, { char: "ヘ", romaji: "he" }, { char: "ホ", romaji: "ho" },
  { char: "マ", romaji: "ma" }, { char: "ミ", romaji: "mi" }, { char: "ム", romaji: "mu" }, { char: "メ", romaji: "me" }, { char: "モ", romaji: "mo" },
  { char: "ヤ", romaji: "ya" }, { char: "ユ", romaji: "yu" }, { char: "ヨ", romaji: "yo" },
  { char: "ラ", romaji: "ra" }, { char: "リ", romaji: "ri" }, { char: "ル", romaji: "ru" }, { char: "レ", romaji: "re" }, { char: "ロ", romaji: "ro" },
  { char: "ワ", romaji: "wa" }, { char: "ヲ", romaji: "wo" }, { char: "ン", romaji: "n" }
];

export function BeginnerPackPopup({ isOpen, onClose, onImport, userProfile }) {
  const [isImporting, setIsImporting] = useState(false);
  const [importStatus, setImportStatus] = useState({ success: 0, total: 3, error: null });
  const [showSuccess, setShowSuccess] = useState(false);

  if (!isOpen) return null;

  const createSet = async (setData) => {
    const response = await fetch("/api/database/v2/sets/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(setData),
    });
    
    const result = await response.json();
    if (!response.ok || !result.success) {
      throw new Error(result.error || "Failed to create set");
    }
    return result;
  };

  const handleImport = async () => {
    if (!userProfile?.sub) {
      setImportStatus({ success: 0, total: 3, error: "Please contact support" });
      return;
    }

    setIsImporting(true);
    setImportStatus({ success: 0, total: 3, error: null });

    try {
      const currentDate = new Date().toISOString();
      const userId = userProfile.sub;

      // 1. Create Common Words Set
      const commonWordsPayload = {
        set: {
          owner: userId,
          title: "50 Most Common Words",
          description: "Essential vocabulary for everyday use",
          date_created: currentDate,
          updated_at: currentDate,
          last_studied: currentDate,
          tags: ["beginner", "essential", "starter-pack"]
        },
        items: COMMON_WORDS_DATA.map(word => ({
          owner: userId,
          type: "vocab",
          english: word.english,
          kana: word.kana,
          kanji: word.kanji,
          lexical_category: word.category,
          example_sentences: "",
          tags: ["common", "essential"],
          audio: "",
          known_status: "unknown",
          srs_level: 0,
          srs_reviewed_last: null
        }))
      };
      await createSet(commonWordsPayload);
      setImportStatus(prev => ({ ...prev, success: 1 }));

      // 2. Create Hiragana Set
      const hiraganaPayload = {
        set: {
          owner: userId,
          title: "Complete Hiragana Set",
          description: "All 46 basic hiragana characters",
          date_created: currentDate,
          updated_at: currentDate,
          last_studied: currentDate,
          tags: ["hiragana", "alphabet", "starter-pack"]
        },
        items: HIRAGANA_DATA.map(char => ({
          owner: userId,
          type: "vocab",
          english: char.romaji,
          kana: char.char,
          kanji: "",
          lexical_category: "character",
          example_sentences: "",
          tags: ["hiragana", "character"],
          audio: "",
          known_status: "unknown",
          srs_level: 0,
          srs_reviewed_last: null
        }))
      };
      await createSet(hiraganaPayload);
      setImportStatus(prev => ({ ...prev, success: 2 }));

      // 3. Create Katakana Set
      const katakanaPayload = {
        set: {
          owner: userId,
          title: "Complete Katakana Set",
          description: "All 46 basic katakana characters",
          date_created: currentDate,
          updated_at: currentDate,
          last_studied: currentDate,
          tags: ["katakana", "alphabet", "starter-pack"]
        },
        items: KATAKANA_DATA.map(char => ({
          owner: userId,
          type: "vocab",
          english: char.romaji,
          kana: char.char,
          kanji: "",
          lexical_category: "character",
          example_sentences: "",
          tags: ["katakana", "character"],
          audio: "",
          known_status: "unknown",
          srs_level: 0,
          srs_reviewed_last: null
        }))
      };
      await createSet(katakanaPayload);
      setImportStatus(prev => ({ ...prev, success: 3 }));

      // Show success state
      setShowSuccess(true);
      setTimeout(() => {
        onImport();
      }, 2000);

    } catch (error) {
      console.error("Error creating sets:", error);
      setImportStatus(prev => ({ ...prev, error: error.message }));
      setIsImporting(false);
    }
  };

  if (showSuccess) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fadeIn">
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
        <div className="relative w-full max-w-md animate-slideUp">
          <div className="relative bg-white dark:bg-[#1c2b35] rounded-2xl shadow-2xl overflow-hidden border-2 border-green-500/20 p-8">
            <div className="text-center">
              <div className="mx-auto w-20 h-20 mb-6 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
                <FaCheckCircle className="text-4xl text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Success!
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                3 starter sets created successfully
              </p>
              <div className="text-xs text-gray-500 dark:text-gray-500">
                Redirecting to your sets...
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fadeIn">
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={!isImporting ? onClose : undefined}
      />

      <div className="relative w-full max-w-md animate-slideUp">
        <div className="relative bg-white dark:bg-[#1c2b35] rounded-2xl shadow-2xl overflow-hidden border-2 border-[#e30a5f]/20">
          <div className="absolute inset-0 opacity-5">
            <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-[#e30a5f] to-[#667eea] rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-0 right-0 w-40 h-40 bg-gradient-to-tl from-[#667eea] to-[#764ba2] rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          </div>

          {!isImporting && (
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
              aria-label="Close"
            >
              <FaTimes className="text-gray-600 dark:text-gray-400" />
            </button>
          )}

          <div className="relative p-8">
            <div className="relative mx-auto w-20 h-20 mb-6">
              <div className="absolute inset-0 bg-gradient-to-br from-[#e30a5f] to-[#667eea] rounded-full blur-xl opacity-50 animate-pulse" />
              <div className="relative bg-gradient-to-br from-[#e30a5f] to-[#667eea] rounded-full w-full h-full flex items-center justify-center shadow-lg">
                <FaGift className="text-3xl text-white" />
              </div>
              <div className="absolute -top-1 -right-1">
                <TbSparkles className="text-yellow-400 text-xl animate-bounce" style={{ animationDelay: '0.2s' }} />
              </div>
            </div>

            <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-2">
              Welcome to Your Journey!
            </h2>

            <p className="text-center text-sm text-gray-600 dark:text-gray-400 mb-6">
              Get 3 essential starter sets to begin your Japanese journey
            </p>

            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-gradient-to-r from-[#e30a5f]/10 to-transparent border border-[#e30a5f]/20">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#e30a5f]/20 flex items-center justify-center">
                  <FaStar className="text-[#e30a5f] text-sm" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 dark:text-white">50 Most Common Words</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Essential vocabulary for everyday use</div>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-lg bg-gradient-to-r from-[#667eea]/10 to-transparent border border-[#667eea]/20">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#667eea]/20 flex items-center justify-center">
                  <FaBook className="text-[#667eea] text-sm" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 dark:text-white">Complete Hiragana Set</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">All 46 basic hiragana characters</div>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-lg bg-gradient-to-r from-[#764ba2]/10 to-transparent border border-[#764ba2]/20">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#764ba2]/20 flex items-center justify-center">
                  <FaRocket className="text-[#764ba2] text-sm" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 dark:text-white">Complete Katakana Set</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">All 46 basic katakana characters</div>
                </div>
              </div>
            </div>

            {importStatus.error && (
              <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700/30">
                <div className="text-xs text-red-700 dark:text-red-300">
                  Error: {importStatus.error}
                </div>
              </div>
            )}

            {isImporting && (
              <div className="mb-4 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700/30">
                <div className="text-xs font-medium text-blue-900 dark:text-blue-200 mb-2">
                  Creating sets... ({importStatus.success}/{importStatus.total})
                </div>
                <div className="w-full bg-blue-200 dark:bg-blue-800 rounded-full h-1.5">
                  <div 
                    className="bg-blue-600 dark:bg-blue-400 h-1.5 rounded-full transition-all duration-500"
                    style={{ width: `${(importStatus.success / importStatus.total) * 100}%` }}
                  />
                </div>
              </div>
            )}

            <div className="flex flex-col gap-2">
              <button
                onClick={handleImport}
                disabled={isImporting}
                className="relative w-full py-3 px-4 rounded-xl font-semibold text-white bg-gradient-to-r from-[#e30a5f] to-[#667eea] hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden group"
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  {isImporting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Creating Sets...
                    </>
                  ) : (
                    <>
                      <FaRocket className="text-lg" />
                      Import Beginner Pack
                    </>
                  )}
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-[#667eea] to-[#e30a5f] opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>

              {!isImporting && (
                <button
                  onClick={onClose}
                  className="w-full py-2.5 px-4 rounded-xl font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 transition-colors"
                >
                  I&apos;ll create my own
                </button>
              )}
            </div>

            <p className="text-center text-xs text-gray-500 dark:text-gray-500 mt-4">
              You can always create custom sets later
            </p>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
        .animate-slideUp {
          animation: slideUp 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}