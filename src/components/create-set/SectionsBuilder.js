import React from "react";
import {
  FaGripVertical,
  FaChevronDown,
  FaChevronUp,
  FaPencilAlt,
  FaTrash,
  FaPlus,
  FaTimes,
  FaLightbulb,
  FaCheck,
  FaArrowRight,
} from "react-icons/fa";

export default function SectionsBuilder({
  sections,
  currentSection,
  setCurrentSection,
  editingSectionId,
  showGrammarForm,
  setShowGrammarForm,
  showVocabForm,
  setShowVocabForm,
  currentGrammar,
  setCurrentGrammar,
  currentVocab,
  setCurrentVocab,
  actions,
  onBack,
  onReview,
  canProceed,
}) {
  const {
    startEditingSection,
    cancelEditing,
    addGrammarPoint,
    addVocabulary,
    addExample,
    updateExample,
    removeExample,
    saveSection,
    removeSection,
    removeGrammarFromSection,
    removeVocabFromSection,
    toggleSectionExpansion,
  } = actions;

  // 🔧 NEW: distinguish add vs edit mode for UI
  const isEditing = Boolean(editingSectionId);
  const hasUnsaved =
    !isEditing &&
    Boolean(
      currentSection?.title ||
        currentSection?.description ||
        (currentSection?.grammar?.length ?? 0) > 0 ||
        (currentSection?.vocabulary?.length ?? 0) > 0
    );

  return (
    <div className="space-y-6">
      {/* Saved Sections */}
      {sections.length > 0 && (
        <SavedSectionsList
          sections={sections}
          onEdit={startEditingSection}
          onRemove={removeSection}
          onToggle={toggleSectionExpansion}
        />
      )}

      {/* Current Section Being Created / Edited */}
      <SectionEditor
        sectionsCount={sections.length}
        currentSection={currentSection}
        setCurrentSection={setCurrentSection}
        editingSectionId={editingSectionId}
        showGrammarForm={showGrammarForm}
        setShowGrammarForm={setShowGrammarForm}
        showVocabForm={showVocabForm}
        setShowVocabForm={setShowVocabForm}
        currentGrammar={currentGrammar}
        setCurrentGrammar={setCurrentGrammar}
        currentVocab={currentVocab}
        setCurrentVocab={setCurrentVocab}
        addGrammarPoint={addGrammarPoint}
        addVocabulary={addVocabulary}
        addExample={addExample}
        updateExample={updateExample}
        removeExample={removeExample}
        removeGrammarFromSection={removeGrammarFromSection}
        removeVocabFromSection={removeVocabFromSection}
        saveSection={saveSection}
        cancelEditing={cancelEditing}
      />

      {/* Navigation */}
      <SectionsNavigation
        sectionsCount={sections.length}
        hasUnsaved={hasUnsaved} // 🔧 now only true when adding a *new* unsaved section
        onBack={onBack}
        onReview={onReview}
        canProceed={canProceed}
      />
    </div>
  );
}

function SavedSectionsList({ sections, onEdit, onRemove, onToggle }) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
        Saved Sections ({sections.length})
      </h3>

      {sections.map((section, index) => (
        <div
          key={section.id}
          className="bg-white dark:bg-[#1c2b35] rounded-xl shadow-sm overflow-hidden"
        >
          <div
            className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50"
            onClick={() => onToggle(section.id)}
          >
            <div className="flex items-center gap-3">
              <FaGripVertical className="text-gray-400" />
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">
                  Section {index + 1}: {section.title}
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {section.grammar.length} grammar points, {section.vocabulary.length} vocabulary items
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(section);
                }}
                className="p-2 text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20 rounded-lg"
                title="Edit this section"
              >
                <FaPencilAlt />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove(section.id);
                }}
                className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                title="Delete this section"
              >
                <FaTrash />
              </button>
              {section.isExpanded ? <FaChevronUp /> : <FaChevronDown />}
            </div>
          </div>

          {section.isExpanded && (
            <div className="px-4 pb-4 border-t border-gray-100 dark:border-gray-700">
              {section.description && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-3 mb-4">
                  {section.description}
                </p>
              )}

              {/* Grammar Points */}
              {section.grammar.length > 0 && (
                <div className="mb-4">
                  <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Grammar Points
                  </h5>
                  <div className="space-y-2">
                    {section.grammar.map((g) => (
                      <div key={g.id} className="flex items-start gap-2 text-sm">
                        <FaPencilAlt className="text-[#e30a5f] mt-0.5" />
                        <div>
                          <span className="font-medium text-gray-900 dark:text-white">
                            {g.point}
                          </span>
                          <p className="text-gray-600 dark:text-gray-400">
                            {g.explanation}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Vocabulary */}
              {section.vocabulary.length > 0 && (
                <div>
                  <h5 className="pt-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Vocabulary
                  </h5>
                  <div className="flex flex-wrap gap-2">
                    {section.vocabulary.map((v) => (
                      <span
                        key={v.id}
                        className="px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-full text-sm text-gray-700 dark:text-gray-300"
                      >
                        {v.word} ({v.reading}) - {v.meaning}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function SectionEditor({
  sectionsCount,
  currentSection,
  setCurrentSection,
  editingSectionId,
  showGrammarForm,
  setShowGrammarForm,
  showVocabForm,
  setShowVocabForm,
  currentGrammar,
  setCurrentGrammar,
  currentVocab,
  setCurrentVocab,
  addGrammarPoint,
  addVocabulary,
  addExample,
  updateExample,
  removeExample,
  removeGrammarFromSection,
  removeVocabFromSection,
  saveSection,
  cancelEditing,
}) {
  const isEditing = Boolean(editingSectionId);
  const ready =
    Boolean(currentSection.title) &&
    ((currentSection.grammar?.length ?? 0) > 0 ||
      (currentSection.vocabulary?.length ?? 0) > 0);

  return (
    <div className="bg-white dark:bg-[#1c2b35] rounded-xl shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          {/* 🔧 NEW: correct header for edit mode */}
          {isEditing
            ? `Edit Section${currentSection?.title ? `: ${currentSection.title}` : ""}`
            : sectionsCount > 0
            ? `Add Section ${sectionsCount + 1}`
            : "Add Your First Section"}
        </h3>
        {/* 🔧 Only show “Required” chip when adding the very first section */}
        {!isEditing && sectionsCount === 0 && (
          <span className="text-xs px-3 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-full">
            Required: Add at least 1 section
          </span>
        )}
      </div>

      {/* Section Info */}
      <div className="space-y-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Section Title *
          </label>
          <input
            type="text"
            value={currentSection.title}
            onChange={(e) => setCurrentSection((prev) => ({ ...prev, title: e.target.value }))}
            placeholder="e.g., Section 6: Te-form"
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#e30a5f] focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Description (Optional)
          </label>
          <textarea
            value={currentSection.description}
            onChange={(e) => setCurrentSection((prev) => ({ ...prev, description: e.target.value }))}
            placeholder="Brief description of what this section covers..."
            rows={2}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#e30a5f] focus:border-transparent resize-none"
          />
        </div>
      </div>

      {/* Grammar Section */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-md font-medium text-gray-900 dark:text-white">
            Grammar Points ({currentSection.grammar.length})
          </h4>
          <button
            onClick={() => setShowGrammarForm(!showGrammarForm)}
            className="flex items-center gap-2 px-3 py-1.5 bg-[#e30a5f]/10 text-[#e30a5f] rounded-lg hover:bg-[#e30a5f]/20 transition-all text-sm"
          >
            <FaPlus />
            Add Grammar
          </button>
        </div>

        {showGrammarForm && (
          <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg mb-4">
            <div className="space-y-3">
              <input
                type="text"
                value={currentGrammar.point}
                onChange={(e) => setCurrentGrammar((prev) => ({ ...prev, point: e.target.value }))}
                placeholder="Grammar point (e.g., て-form + います)"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
              />
              <textarea
                value={currentGrammar.explanation}
                onChange={(e) =>
                  setCurrentGrammar((prev) => ({ ...prev, explanation: e.target.value }))
                }
                placeholder="Explanation..."
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm resize-none"
              />

              <div>
                <label className="text-xs text-gray-600 dark:text-gray-400 mb-1 block">
                  Examples (Optional)
                </label>
                {currentGrammar.examples.map((example, idx) => (
                  <div key={idx} className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={example}
                      onChange={(e) => updateExample("grammar", idx, e.target.value)}
                      placeholder="Example sentence..."
                      className="flex-1 px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                    />
                    {currentGrammar.examples.length > 1 && (
                      <button
                        onClick={() => removeExample("grammar", idx)}
                        className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                      >
                        <FaTimes className="text-sm" />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  onClick={() => addExample("grammar")}
                  className="text-xs text-[#e30a5f] hover:text-[#f41567]"
                >
                  + Add example
                </button>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={addGrammarPoint}
                  className="px-4 py-2 bg-gradient-to-r from-[#e30a5f] to-[#f41567] text-white rounded-lg text-sm font-medium"
                >
                  Add Grammar Point
                </button>
                <button
                  onClick={() => setShowGrammarForm(false)}
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {currentSection.grammar.length > 0 && (
          <div className="space-y-2">
            {currentSection.grammar.map((g) => (
              <div
                key={g.id}
                className="flex items-start justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg"
              >
                <div className="flex-1">
                  <h5 className="font-medium text-gray-900 dark:text-white text-sm">
                    {g.point}
                  </h5>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    {g.explanation}
                  </p>
                  {g.examples.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {g.examples
                        .filter((ex) => ex)
                        .map((ex, idx) => (
                          <p key={idx} className="text-xs text-gray-500 dark:text-gray-500 italic">
                            • {ex}
                          </p>
                        ))}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => removeGrammarFromSection(g.id)}
                  className="ml-2 p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                >
                  <FaTrash className="text-sm" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Vocabulary Section */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-md font-medium text-gray-900 dark:text-white">
            Vocabulary ({currentSection.vocabulary.length})
          </h4>
          <button
            onClick={() => setShowVocabForm(!showVocabForm)}
            className="flex items-center gap-2 px-3 py-1.5 bg-[#e30a5f]/10 text-[#e30a5f] rounded-lg hover:bg-[#e30a5f]/20 transition-all text-sm"
          >
            <FaPlus />
            Add Vocabulary
          </button>
        </div>

        {showVocabForm && (
          <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg mb-4">
            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <input
                  type="text"
                  value={currentVocab.word}
                  onChange={(e) => setCurrentVocab((prev) => ({ ...prev, word: e.target.value }))}
                  placeholder="Word (e.g., 食べる)"
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                />
                <input
                  type="text"
                  value={currentVocab.reading}
                  onChange={(e) =>
                    setCurrentVocab((prev) => ({ ...prev, reading: e.target.value }))
                  }
                  placeholder="Reading (e.g., たべる)"
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                />
                <input
                  type="text"
                  value={currentVocab.meaning}
                  onChange={(e) =>
                    setCurrentVocab((prev) => ({ ...prev, meaning: e.target.value }))
                  }
                  placeholder="Meaning (e.g., to eat)"
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                />
              </div>

              <div>
                <label className="text-xs text-gray-600 dark:text-gray-400 mb-1 block">
                  Example Sentences (Optional)
                </label>
                {currentVocab.examples.map((example, idx) => (
                  <div key={idx} className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={example}
                      onChange={(e) => updateExample("vocab", idx, e.target.value)}
                      placeholder="Example sentence..."
                      className="flex-1 px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                    />
                    {currentVocab.examples.length > 1 && (
                      <button
                        onClick={() => removeExample("vocab", idx)}
                        className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                      >
                        <FaTimes className="text-sm" />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  onClick={() => addExample("vocab")}
                  className="text-xs text-[#e30a5f] hover:text-[#f41567]"
                >
                  + Add example
                </button>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={addVocabulary}
                  className="px-4 py-2 bg-gradient-to-r from-[#e30a5f] to-[#f41567] text-white rounded-lg text-sm font-medium"
                >
                  Add Vocabulary
                </button>
                <button
                  onClick={() => setShowVocabForm(false)}
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {currentSection.vocabulary.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {currentSection.vocabulary.map((v) => (
              <div
                key={v.id}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900 dark:text-white text-sm">
                      {v.word}
                    </span>
                    {v.reading && (
                      <span className="text-xs text-gray-600 dark:text-gray-400">
                        [{v.reading}]
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                    {v.meaning}
                  </p>
                  {v.examples.filter((ex) => ex).length > 0 && (
                    <p className="text-xs text-gray-500 dark:text-gray-500 italic mt-1">
                      Ex: {v.examples.filter((ex) => ex)[0]}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => removeVocabFromSection(v.id)}
                  className="ml-2 p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                >
                  <FaTrash className="text-sm" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Action Buttons for Current Section */}
      <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-6">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {currentSection.title ? (
              <span className="flex items-center gap-2">
                {isEditing && (
                  <span className="px-2 py-0.5 text-xs rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                    Editing saved section
                  </span>
                )}
                <span className="inline-block w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                Currently editing: <strong>{currentSection.title}</strong>
              </span>
            ) : (
              <span>Fill in section details above</span>
            )}
          </div>

          {ready && (
            <div className="flex gap-3">
              {isEditing ? (
                <>
                  <button
                    onClick={cancelEditing}
                    className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                  >
                    Cancel Edit
                  </button>
                  <button
                    onClick={saveSection}
                    className="px-6 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-all flex items-center gap-2 shadow-lg hover:shadow-xl"
                  >
                    <FaCheck />
                    Update Section
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() =>
                      setCurrentSection({
                        title: "",
                        description: "",
                        grammar: [],
                        vocabulary: [],
                        isExpanded: true,
                      })
                    }
                    className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                  >
                    Clear
                  </button>
                  <button
                    onClick={saveSection}
                    className="px-6 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-all flex items-center gap-2 shadow-lg hover:shadow-xl"
                  >
                    <FaCheck />
                    Save This Section
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        {ready && (
          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-start gap-3">
            <FaLightbulb className="text-blue-500 mt-0.5" />
            <div className="text-sm">
              {/* 🔧 Dynamic callout copy */}
              <p className="text-blue-900 dark:text-blue-100 font-medium">
                {isEditing ? "Ready to update this section?" : "Ready to save this section?"}
              </p>
              <p className="text-blue-700 dark:text-blue-300 text-xs mt-1">
                {isEditing
                  ? 'Click "Update Section" above to apply your changes.'
                  : 'Click "Save This Section" above to add it to your learning_material. You can then create another section or proceed to review.'}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function SectionsNavigation({ sectionsCount, hasUnsaved, onBack, onReview, canProceed }) {
  return (
    <div className="bg-white dark:bg-[#1c2b35] rounded-xl shadow-sm p-6">
      <div className="flex justify-between items-center">
        <button
          onClick={onBack}
          className="px-6 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium"
        >
          Back
        </button>

        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            <span className="font-medium text-gray-900 dark:text-white">{sectionsCount}</span>{" "}
            section{sectionsCount !== 1 ? "s" : ""} created
            {hasUnsaved && " (+1 unsaved)"}
          </div>

          <button
            onClick={onReview}
            disabled={!canProceed}
            className={`px-6 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
              canProceed
                ? "bg-gradient-to-r from-[#e30a5f] to-[#f41567] text-white hover:shadow-lg"
                : "bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed"
            }`}
          >
            Review Learning Material
            <FaArrowRight />
          </button>
        </div>
      </div>

      {!canProceed && (
        <p className="text-xs text-center text-amber-600 dark:text-amber-400 mt-3">
          ⚠️ Add at least one section with grammar or vocabulary to continue
        </p>
      )}
    </div>
  );
}
