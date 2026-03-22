import { useState } from 'react';
import { FaTimes, FaCheckCircle } from 'react-icons/fa';
import { TbDownload, TbLoader3 } from 'react-icons/tb';
import { clientLog } from '@/lib/clientLogger';

// Starter data for the three sets
const COMMON_WORDS_DATA = [
  {
    english: 'Hello',
    kana: 'こんにちは',
    kanji: '今日は',
    category: 'expression',
  },
  {
    english: 'Thank you',
    kana: 'ありがとう',
    kanji: '有難う',
    category: 'expression',
  },
  { english: 'Yes', kana: 'はい', kanji: '', category: 'expression' },
  { english: 'No', kana: 'いいえ', kanji: '', category: 'expression' },
  { english: 'I', kana: 'わたし', kanji: '私', category: 'noun' },
  { english: 'You', kana: 'あなた', kanji: '貴方', category: 'noun' },
  { english: 'This', kana: 'これ', kanji: '', category: 'noun' },
  { english: 'That', kana: 'それ', kanji: '', category: 'noun' },
  { english: 'What', kana: 'なに', kanji: '何', category: 'noun' },
  { english: 'Who', kana: 'だれ', kanji: '誰', category: 'noun' },
  { english: 'Where', kana: 'どこ', kanji: '', category: 'noun' },
  { english: 'When', kana: 'いつ', kanji: '', category: 'noun' },
  { english: 'Why', kana: 'なぜ', kanji: '', category: 'noun' },
  { english: 'How', kana: 'どう', kanji: '', category: 'adverb' },
  { english: 'Good', kana: 'いい', kanji: '良い', category: 'adjective' },
  { english: 'Bad', kana: 'わるい', kanji: '悪い', category: 'adjective' },
  { english: 'Big', kana: 'おおきい', kanji: '大きい', category: 'adjective' },
  {
    english: 'Small',
    kana: 'ちいさい',
    kanji: '小さい',
    category: 'adjective',
  },
  { english: 'Hot', kana: 'あつい', kanji: '暑い', category: 'adjective' },
  { english: 'Cold', kana: 'さむい', kanji: '寒い', category: 'adjective' },
  { english: 'To eat', kana: 'たべる', kanji: '食べる', category: 'verb' },
  { english: 'To drink', kana: 'のむ', kanji: '飲む', category: 'verb' },
  { english: 'To go', kana: 'いく', kanji: '行く', category: 'verb' },
  { english: 'To come', kana: 'くる', kanji: '来る', category: 'verb' },
  { english: 'To see', kana: 'みる', kanji: '見る', category: 'verb' },
  { english: 'To hear', kana: 'きく', kanji: '聞く', category: 'verb' },
  { english: 'To speak', kana: 'はなす', kanji: '話す', category: 'verb' },
  { english: 'To read', kana: 'よむ', kanji: '読む', category: 'verb' },
  { english: 'To write', kana: 'かく', kanji: '書く', category: 'verb' },
  { english: 'To buy', kana: 'かう', kanji: '買う', category: 'verb' },
  { english: 'Water', kana: 'みず', kanji: '水', category: 'noun' },
  { english: 'Food', kana: 'たべもの', kanji: '食べ物', category: 'noun' },
  { english: 'Person', kana: 'ひと', kanji: '人', category: 'noun' },
  { english: 'House', kana: 'いえ', kanji: '家', category: 'noun' },
  { english: 'School', kana: 'がっこう', kanji: '学校', category: 'noun' },
  { english: 'Book', kana: 'ほん', kanji: '本', category: 'noun' },
  { english: 'Car', kana: 'くるま', kanji: '車', category: 'noun' },
  { english: 'Time', kana: 'じかん', kanji: '時間', category: 'noun' },
  { english: 'Day', kana: 'ひ', kanji: '日', category: 'noun' },
  { english: 'Year', kana: 'とし', kanji: '年', category: 'noun' },
  { english: 'Month', kana: 'つき', kanji: '月', category: 'noun' },
  { english: 'Name', kana: 'なまえ', kanji: '名前', category: 'noun' },
  { english: 'Friend', kana: 'ともだち', kanji: '友達', category: 'noun' },
  { english: 'Teacher', kana: 'せんせい', kanji: '先生', category: 'noun' },
  { english: 'Student', kana: 'がくせい', kanji: '学生', category: 'noun' },
  { english: 'Today', kana: 'きょう', kanji: '今日', category: 'noun' },
  { english: 'Tomorrow', kana: 'あした', kanji: '明日', category: 'noun' },
  { english: 'Yesterday', kana: 'きのう', kanji: '昨日', category: 'noun' },
  { english: 'Now', kana: 'いま', kanji: '今', category: 'noun' },
  { english: 'Morning', kana: 'あさ', kanji: '朝', category: 'noun' },
];

const HIRAGANA_DATA = [
  { char: 'あ', romaji: 'a' },
  { char: 'い', romaji: 'i' },
  { char: 'う', romaji: 'u' },
  { char: 'え', romaji: 'e' },
  { char: 'お', romaji: 'o' },
  { char: 'か', romaji: 'ka' },
  { char: 'き', romaji: 'ki' },
  { char: 'く', romaji: 'ku' },
  { char: 'け', romaji: 'ke' },
  { char: 'こ', romaji: 'ko' },
  { char: 'さ', romaji: 'sa' },
  { char: 'し', romaji: 'shi' },
  { char: 'す', romaji: 'su' },
  { char: 'せ', romaji: 'se' },
  { char: 'そ', romaji: 'so' },
  { char: 'た', romaji: 'ta' },
  { char: 'ち', romaji: 'chi' },
  { char: 'つ', romaji: 'tsu' },
  { char: 'て', romaji: 'te' },
  { char: 'と', romaji: 'to' },
  { char: 'な', romaji: 'na' },
  { char: 'に', romaji: 'ni' },
  { char: 'ぬ', romaji: 'nu' },
  { char: 'ね', romaji: 'ne' },
  { char: 'の', romaji: 'no' },
  { char: 'は', romaji: 'ha' },
  { char: 'ひ', romaji: 'hi' },
  { char: 'ふ', romaji: 'fu' },
  { char: 'へ', romaji: 'he' },
  { char: 'ほ', romaji: 'ho' },
  { char: 'ま', romaji: 'ma' },
  { char: 'み', romaji: 'mi' },
  { char: 'む', romaji: 'mu' },
  { char: 'め', romaji: 'me' },
  { char: 'も', romaji: 'mo' },
  { char: 'や', romaji: 'ya' },
  { char: 'ゆ', romaji: 'yu' },
  { char: 'よ', romaji: 'yo' },
  { char: 'ら', romaji: 'ra' },
  { char: 'り', romaji: 'ri' },
  { char: 'る', romaji: 'ru' },
  { char: 'れ', romaji: 're' },
  { char: 'ろ', romaji: 'ro' },
  { char: 'わ', romaji: 'wa' },
  { char: 'を', romaji: 'wo' },
  { char: 'ん', romaji: 'n' },
];

const KATAKANA_DATA = [
  { char: 'ア', romaji: 'a' },
  { char: 'イ', romaji: 'i' },
  { char: 'ウ', romaji: 'u' },
  { char: 'エ', romaji: 'e' },
  { char: 'オ', romaji: 'o' },
  { char: 'カ', romaji: 'ka' },
  { char: 'キ', romaji: 'ki' },
  { char: 'ク', romaji: 'ku' },
  { char: 'ケ', romaji: 'ke' },
  { char: 'コ', romaji: 'ko' },
  { char: 'サ', romaji: 'sa' },
  { char: 'シ', romaji: 'shi' },
  { char: 'ス', romaji: 'su' },
  { char: 'セ', romaji: 'se' },
  { char: 'ソ', romaji: 'so' },
  { char: 'タ', romaji: 'ta' },
  { char: 'チ', romaji: 'chi' },
  { char: 'ツ', romaji: 'tsu' },
  { char: 'テ', romaji: 'te' },
  { char: 'ト', romaji: 'to' },
  { char: 'ナ', romaji: 'na' },
  { char: 'ニ', romaji: 'ni' },
  { char: 'ヌ', romaji: 'nu' },
  { char: 'ネ', romaji: 'ne' },
  { char: 'ノ', romaji: 'no' },
  { char: 'ハ', romaji: 'ha' },
  { char: 'ヒ', romaji: 'hi' },
  { char: 'フ', romaji: 'fu' },
  { char: 'ヘ', romaji: 'he' },
  { char: 'ホ', romaji: 'ho' },
  { char: 'マ', romaji: 'ma' },
  { char: 'ミ', romaji: 'mi' },
  { char: 'ム', romaji: 'mu' },
  { char: 'メ', romaji: 'me' },
  { char: 'モ', romaji: 'mo' },
  { char: 'ヤ', romaji: 'ya' },
  { char: 'ユ', romaji: 'yu' },
  { char: 'ヨ', romaji: 'yo' },
  { char: 'ラ', romaji: 'ra' },
  { char: 'リ', romaji: 'ri' },
  { char: 'ル', romaji: 'ru' },
  { char: 'レ', romaji: 're' },
  { char: 'ロ', romaji: 'ro' },
  { char: 'ワ', romaji: 'wa' },
  { char: 'ヲ', romaji: 'wo' },
  { char: 'ン', romaji: 'n' },
];

const SETS = [
  {
    title: '50 Most Common Words',
    description: 'Essential vocabulary for everyday use',
    count: 50,
    preview: ['私', '水', '人', '本', '日', '今'],
    color: 'text-brand-pink',
    bgColor: 'bg-brand-pink/8 dark:bg-brand-pink/10',
    borderColor: 'border-brand-pink/15 dark:border-brand-pink/20',
  },
  {
    title: 'Complete Hiragana',
    description: 'All 46 basic characters',
    count: 46,
    preview: ['あ', 'い', 'う', 'え', 'お', 'か', 'き', 'く'],
    color: 'text-blue-500 dark:text-blue-400',
    bgColor: 'bg-blue-500/8 dark:bg-blue-500/10',
    borderColor: 'border-blue-500/15 dark:border-blue-500/20',
  },
  {
    title: 'Complete Katakana',
    description: 'All 46 basic characters',
    count: 46,
    preview: ['ア', 'イ', 'ウ', 'エ', 'オ', 'カ', 'キ', 'ク'],
    color: 'text-purple-500 dark:text-purple-400',
    bgColor: 'bg-purple-500/8 dark:bg-purple-500/10',
    borderColor: 'border-purple-500/15 dark:border-purple-500/20',
  },
];

export function BeginnerPackPopup({ isOpen, onClose, onImport, userProfile }) {
  const [isImporting, setIsImporting] = useState(false);
  const [importStatus, setImportStatus] = useState({
    success: 0,
    total: 3,
    error: null,
  });
  const [showSuccess, setShowSuccess] = useState(false);

  if (!isOpen) return null;

  const createSet = async (setData) => {
    const response = await fetch('/api/database/v2/sets/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(setData),
    });

    const result = await response.json();
    if (!response.ok || !result.success) {
      throw new Error(result.error || 'Failed to create set');
    }
    return result;
  };

  const handleImport = async () => {
    if (!userProfile?.sub) {
      setImportStatus({
        success: 0,
        total: 3,
        error: 'Please contact support',
      });
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
          title: '50 Most Common Words',
          description: 'Essential vocabulary for everyday use',
          date_created: currentDate,
          updated_at: currentDate,
          last_studied: currentDate,
          tags: ['beginner', 'essential', 'starter-pack'],
        },
        items: COMMON_WORDS_DATA.map((word) => ({
          owner: userId,
          type: 'vocab',
          english: word.english,
          kana: word.kana,
          kanji: word.kanji,
          lexical_category: word.category,
          example_sentences: '',
          tags: ['common', 'essential'],
          audio: '',
          known_status: 'unknown',
          srs_level: 0,
          srs_reviewed_last: null,
        })),
      };
      await createSet(commonWordsPayload);
      setImportStatus((prev) => ({ ...prev, success: 1 }));

      // 2. Create Hiragana Set
      const hiraganaPayload = {
        set: {
          owner: userId,
          title: 'Complete Hiragana Set',
          description: 'All 46 basic hiragana characters',
          date_created: currentDate,
          updated_at: currentDate,
          last_studied: currentDate,
          tags: ['hiragana', 'alphabet', 'starter-pack'],
        },
        items: HIRAGANA_DATA.map((char) => ({
          owner: userId,
          type: 'vocab',
          english: char.romaji,
          kana: char.char,
          kanji: '',
          lexical_category: 'character',
          example_sentences: '',
          tags: ['hiragana', 'character'],
          audio: '',
          known_status: 'unknown',
          srs_level: 0,
          srs_reviewed_last: null,
        })),
      };
      await createSet(hiraganaPayload);
      setImportStatus((prev) => ({ ...prev, success: 2 }));

      // 3. Create Katakana Set
      const katakanaPayload = {
        set: {
          owner: userId,
          title: 'Complete Katakana Set',
          description: 'All 46 basic katakana characters',
          date_created: currentDate,
          updated_at: currentDate,
          last_studied: currentDate,
          tags: ['katakana', 'alphabet', 'starter-pack'],
        },
        items: KATAKANA_DATA.map((char) => ({
          owner: userId,
          type: 'vocab',
          english: char.romaji,
          kana: char.char,
          kanji: '',
          lexical_category: 'character',
          example_sentences: '',
          tags: ['katakana', 'character'],
          audio: '',
          known_status: 'unknown',
          srs_level: 0,
          srs_reviewed_last: null,
        })),
      };
      await createSet(katakanaPayload);
      setImportStatus((prev) => ({ ...prev, success: 3 }));

      // Show success state
      setShowSuccess(true);
      setTimeout(() => {
        onImport();
      }, 2000);
    } catch (error) {
      clientLog.error('starter_pack.create_failed', {
        error: error?.message || String(error),
      });
      setImportStatus((prev) => ({ ...prev, error: error.message }));
      setIsImporting(false);
    }
  };

  if (showSuccess) {
    return (
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
        <div className="relative w-full sm:max-w-[440px] sm:mx-4">
          <div className="bg-surface-card sm:rounded-2xl rounded-t-2xl shadow-2xl p-8 text-center">
            <div className="mx-auto w-16 h-16 mb-5 rounded-2xl bg-green-500/10 dark:bg-green-500/15 flex items-center justify-center">
              <FaCheckCircle className="text-2xl text-green-500" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1.5">
              You&apos;re all set
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              3 starter sets added to your library
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={!isImporting ? onClose : undefined}
      />

      <div className="relative w-full sm:max-w-[440px] sm:mx-4">
        <div className="bg-surface-card sm:rounded-2xl rounded-t-2xl shadow-2xl overflow-hidden">
          {/* Header with decorative kana background */}
          <div className="relative overflow-hidden px-6 pt-6 pb-5">
            {/* Faint scattered kana in background */}
            <div
              className="absolute inset-0 overflow-hidden select-none pointer-events-none"
              aria-hidden="true"
            >
              <span className="absolute top-3 right-6 text-[72px] font-japanese text-gray-100 dark:text-white/[0.03] leading-none">
                あ
              </span>
              <span className="absolute -bottom-2 right-24 text-[56px] font-japanese text-gray-100 dark:text-white/[0.03] leading-none">
                カ
              </span>
              <span className="absolute top-8 right-28 text-[40px] font-japanese text-gray-100 dark:text-white/[0.025] leading-none">
                水
              </span>
            </div>

            {!isImporting && (
              <button
                onClick={onClose}
                className="absolute top-4 right-4 z-10 p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
                aria-label="Close"
              >
                <FaTimes className="w-4 h-4" />
              </button>
            )}

            <div className="relative">
              <p className="text-[11px] font-medium text-brand-pink uppercase tracking-wider mb-1.5">
                Starter Pack
              </p>
              <h2 className="text-[22px] font-bold text-gray-900 dark:text-white leading-tight mb-1">
                Start with the basics
              </h2>
              <p className="text-[14px] text-gray-500 dark:text-gray-400">
                Three foundational sets to begin learning Japanese
              </p>
            </div>
          </div>

          {/* Set cards */}
          <div className="px-6 space-y-2.5">
            {SETS.map((set, i) => (
              <div
                key={i}
                className={`rounded-xl p-3.5 border ${set.borderColor} ${set.bgColor} transition-colors`}
              >
                <div className="flex items-start justify-between gap-3 mb-2.5">
                  <div className="min-w-0">
                    <h3 className="text-[14px] font-semibold text-gray-900 dark:text-white">
                      {set.title}
                    </h3>
                    <p className="text-[12px] text-gray-500 dark:text-gray-400 mt-0.5">
                      {set.description}
                    </p>
                  </div>
                  <span
                    className={`text-[11px] font-medium ${set.color} flex-shrink-0 mt-0.5`}
                  >
                    {set.count} items
                  </span>
                </div>
                {/* Character/word preview strip */}
                <div className="flex gap-1.5">
                  {set.preview.map((char, j) => (
                    <span
                      key={j}
                      className="flex-shrink-0 w-8 h-8 rounded-lg bg-white/60 dark:bg-white/5 flex items-center justify-center text-[14px] font-japanese text-gray-700 dark:text-gray-300"
                    >
                      {char}
                    </span>
                  ))}
                  <span className="flex-shrink-0 w-8 h-8 rounded-lg bg-white/40 dark:bg-white/[0.03] flex items-center justify-center text-[11px] text-gray-400 dark:text-gray-500">
                    +{set.count - set.preview.length}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Error */}
          {importStatus.error && (
            <div className="mx-6 mt-3 px-3.5 py-2.5 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200/60 dark:border-red-800/40">
              <p className="text-[13px] text-red-600 dark:text-red-400">
                {importStatus.error}
              </p>
            </div>
          )}

          {/* Import progress */}
          {isImporting && (
            <div className="mx-6 mt-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[12px] font-medium text-gray-600 dark:text-gray-300">
                  Creating sets...
                </span>
                <span className="text-[12px] text-gray-400 dark:text-gray-500">
                  {importStatus.success}/{importStatus.total}
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-brand-pink h-full rounded-full transition-all duration-500 ease-out"
                  style={{
                    width: `${(importStatus.success / importStatus.total) * 100}%`,
                  }}
                />
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="px-6 pt-5 pb-6 space-y-2.5">
            <button
              onClick={handleImport}
              disabled={isImporting}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-[14px] font-semibold text-white bg-gradient-to-r from-brand-pink to-[#d10950] hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm shadow-brand-pink/20"
            >
              {isImporting ? (
                <TbLoader3 className="w-4.5 h-4.5 animate-spin" />
              ) : (
                <TbDownload className="w-4.5 h-4.5" />
              )}
              {isImporting ? 'Creating Sets...' : 'Add All to My Library'}
            </button>

            {!isImporting && (
              <button
                onClick={onClose}
                className="w-full py-2.5 rounded-xl text-[13px] font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
              >
                Skip for now
              </button>
            )}
          </div>

          {/* Bottom safe area for mobile */}
          <div className="h-[env(safe-area-inset-bottom)]" />
        </div>
      </div>
    </div>
  );
}
