// Custom Item Modal
// Custom item creation form like sets/create

import { useState } from "react";
import { toKana } from "wanakana";
import { FiPlus, FiX } from "react-icons/fi";

export default function CardSwapCustomItemModal({
  category, // 'vocabulary' | 'grammar'
  onConfirm,
  onClose
}) {
  const [grammarTitleInputType, setGrammarTitleInputType] = useState("kana");

  // Vocabulary form state
  const [vocabForm, setVocabForm] = useState({
    english: "",
    kana: "",
    kanji: "",
    lexical_category: "",
    example_sentences: "",
    tags: "",
  });

  // Grammar form state
  const [grammarForm, setGrammarForm] = useState({
    title: "",
    description: "",
    topic: "",
    notes: "",
    example_sentences: "",
    tags: ""
  });

  const categoryLabel = category === 'grammar' ? 'Grammar' : 'Vocabulary';

  const handleVocabFormChange = (field, value) => {
    if (field === "kana" || field === "kanji") {
      setVocabForm(prev => ({ ...prev, [field]: toKana(value, { IMEMode: true }) }));
    } else {
      setVocabForm(prev => ({ ...prev, [field]: value }));
    }
  };

  const handleGrammarFormChange = (field, value) => {
    if (field === "title" && grammarTitleInputType === "kana") {
      setGrammarForm(prev => ({ ...prev, [field]: toKana(value, { IMEMode: true }) }));
    } else {
      setGrammarForm(prev => ({ ...prev, [field]: value }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (category === 'vocabulary') {
      if (!vocabForm.english.trim() && !vocabForm.kana.trim()) {
        alert("Please provide at least English or Kana.");
        return;
      }
      const item = {
        id: `temp-vocab-${Date.now()}`,
        type: 'vocabulary',
        english: vocabForm.english.trim(),
        kana: vocabForm.kana.trim(),
        kanji: vocabForm.kanji.trim(),
        lexical_category: vocabForm.lexical_category.trim(),
        example_sentences: vocabForm.example_sentences.trim(),
        tags: vocabForm.tags.trim(),
      };
      onConfirm([item]);
      resetForms();
      onClose();
    } else {
      if (!grammarForm.title.trim()) {
        alert("Please provide a title for the grammar item.");
        return;
      }
      const item = {
        id: `temp-grammar-${Date.now()}`,
        type: 'grammar',
        title: grammarForm.title.trim(),
        description: grammarForm.description.trim(),
        topic: grammarForm.topic.trim(),
        notes: grammarForm.notes.trim(),
        example_sentences: grammarForm.example_sentences.trim(),
        tags: grammarForm.tags.trim()
      };
      onConfirm([item]);
      resetForms();
      onClose();
    }
  };

  const resetForms = () => {
    setVocabForm({
      english: "",
      kana: "",
      kanji: "",
      lexical_category: "",
      example_sentences: "",
      tags: "",
    });
    setGrammarForm({
      title: "",
      description: "",
      topic: "",
      notes: "",
      example_sentences: "",
      tags: ""
    });
  };

  const handleCancel = () => {
    resetForms();
    onClose();
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
          Add Custom {categoryLabel}
        </h2>
        <button
          onClick={handleCancel}
          className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          <FiX className="w-5 h-5" />
        </button>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
        {category === 'vocabulary' ? (
          <>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  English
                </label>
                <input
                  type="text"
                  value={vocabForm.english}
                  onChange={(e) => handleVocabFormChange("english", e.target.value)}
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
                  value={vocabForm.kana}
                  onChange={(e) => handleVocabFormChange("kana", e.target.value)}
                  placeholder="ka → か, shi → し"
                  className="w-full bg-gray-50 dark:bg-[#0f1a1f] text-gray-900 dark:text-white px-2 py-1.5 rounded text-sm border border-black/10 dark:border-white/10 focus:outline-none focus:ring-1 focus:ring-[#e30a5f] font-japanese"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Kanji <span className="text-gray-500 dark:text-gray-400">(Please Paste)</span>
                </label>
                <input
                  type="text"
                  value={vocabForm.kanji}
                  onChange={(e) => handleVocabFormChange("kanji", e.target.value)}
                  placeholder="kanji → かんじ"
                  className="w-full bg-gray-50 dark:bg-[#0f1a1f] text-gray-900 dark:text-white px-2 py-1.5 rounded text-sm border border-black/10 dark:border-white/10 focus:outline-none focus:ring-1 focus:ring-[#e30a5f] font-japanese"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Category
                </label>
                <select
                  value={vocabForm.lexical_category}
                  onChange={(e) => handleVocabFormChange("lexical_category", e.target.value)}
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
                  value={vocabForm.example_sentences}
                  onChange={(e) => handleVocabFormChange("example_sentences", e.target.value)}
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
                  value={vocabForm.tags}
                  onChange={(e) => handleVocabFormChange("tags", e.target.value)}
                  placeholder="tag1, tag2, tag3"
                  className="w-full bg-gray-50 dark:bg-[#0f1a1f] text-gray-900 dark:text-white px-2 py-1.5 rounded text-sm border border-black/10 dark:border-white/10 focus:outline-none focus:ring-1 focus:ring-[#e30a5f]"
                />
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center justify-between">
                  <span>Title * {grammarForm.title && (
                    <span className="text-[10px] text-gray-500 dark:text-gray-400 ml-1">
                      ({grammarTitleInputType === "kana" ? "Kana" : "English"})
                    </span>
                  )}</span>
                </label>
                <input
                  type="text"
                  value={grammarForm.title}
                  onChange={(e) => handleGrammarFormChange("title", e.target.value)}
                  placeholder={grammarTitleInputType === "kana"
                    ? "Type in romaji: ka → か, shi → し"
                    : "Grammar pattern name"}
                  className={`w-full bg-gray-50 dark:bg-[#0f1a1f] text-gray-900 dark:text-white px-2 py-1.5 rounded text-sm border border-black/10 dark:border-white/10 focus:outline-none focus:ring-1 focus:ring-[#e30a5f] ${grammarTitleInputType === "kana" ? "font-japanese" : ""}`}
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
            <div className="grid grid-cols-1 gap-3">
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
            <div className="grid grid-cols-2 gap-3 mb-2 mt-3">
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
            <div className="grid grid-cols-1 gap-3 mb-3">
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
          </>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end gap-2 pt-4 border-t border-black/5 dark:border-white/5 mt-4">
          <button
            type="button"
            onClick={handleCancel}
            className="px-4 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#1d2a32] transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm rounded-lg bg-[#e30a5f] text-white hover:opacity-95 transition-opacity"
          >
            <FiPlus className="w-3 h-3" /> Add Item
          </button>
        </div>
      </form>
    </div>
  );
}
