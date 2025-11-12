import { useState, useEffect } from "react";
import { FiX, FiCheckCircle, FiAlertCircle } from "react-icons/fi";

export default function CSVColumnMapper({ isOpen, onClose, csvHeaders, itemType, onMapComplete }) {
    const [columnMappings, setColumnMappings] = useState({});
    const [validationErrors, setValidationErrors] = useState([]);

    // Define required and optional fields based on item type
    const fieldDefinitions = {
        vocabulary: {
            required: [
                { key: 'english', label: 'English', description: 'English translation/meaning' },
                { key: 'kana', label: 'Kana', description: 'Hiragana/Katakana reading' }
            ],
            requireOneOf: ['english', 'kana'], // At least one of these must be mapped
            optional: [
                { key: 'kanji', label: 'Kanji', description: 'Kanji characters' },
                { key: 'lexical_category', label: 'Category', description: 'Part of speech (noun, verb, etc.)' },
                { key: 'example_sentences', label: 'Example Sentences', description: 'Usage examples' },
                { key: 'tags', label: 'Tags', description: 'Comma-separated tags' },
                { key: 'audio', label: 'Audio URL', description: 'Pronunciation audio link' }
            ]
        },
        grammar: {
            required: [
                { key: 'title', label: 'Title', description: 'Grammar pattern name' },
                { key: 'description', label: 'Description', description: 'Explanation of the pattern' }
            ],
            optional: [
                { key: 'topic', label: 'Topic', description: 'Category (e.g., N5, JLPT)' },
                { key: 'notes', label: 'Notes', description: 'Additional usage tips' },
                { key: 'example_sentences', label: 'Example Sentences', description: 'Usage examples' },
                { key: 'tags', label: 'Tags', description: 'Comma-separated tags' }
            ]
        }
    };

    const fields = fieldDefinitions[itemType] || fieldDefinitions.vocabulary;

    // Validate mappings
    const validateMappings = () => {
        const errors = [];

        if (itemType === 'vocabulary') {
            // Check if at least one of english or kana is mapped
            const hasEnglish = columnMappings['english'] && columnMappings['english'] !== '';
            const hasKana = columnMappings['kana'] && columnMappings['kana'] !== '';

            if (!hasEnglish && !hasKana) {
                errors.push('At least one of "English" or "Kana" must be mapped');
            }
        } else {
            // For grammar, check all required fields
            fields.required.forEach(field => {
                if (!columnMappings[field.key] || columnMappings[field.key] === '') {
                    errors.push(`"${field.label}" is required and must be mapped`);
                }
            });
        }

        setValidationErrors(errors);
        return errors.length === 0;
    };

    const handleMappingChange = (fieldKey, csvColumn) => {
        setColumnMappings(prev => ({
            ...prev,
            [fieldKey]: csvColumn
        }));
    };

    const handleMapColumns = () => {
        if (validateMappings()) {
            onMapComplete(columnMappings);
            onClose();
        }
    };

    // Auto-detect potential matches
    useEffect(() => {
        if (!isOpen || !csvHeaders.length) return;

        const autoMappings = {};
        const allFields = [...fields.required, ...fields.optional];

        allFields.forEach(field => {
            const fieldLower = field.key.toLowerCase();
            const match = csvHeaders.find(header =>
                header.toLowerCase() === fieldLower ||
                header.toLowerCase().includes(fieldLower) ||
                fieldLower.includes(header.toLowerCase())
            );
            if (match) {
                autoMappings[field.key] = match;
            }
        });

        setColumnMappings(autoMappings);
        setValidationErrors([]);
    }, [isOpen, csvHeaders, itemType, fields]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-[#1c2b35] rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col m-4">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                            Map CSV Columns
                        </h2>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            Match your CSV columns to {itemType} fields
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg bg-gray-200 dark:bg-white/10 hover:bg-gray-300 dark:hover:bg-white/20 transition-colors"
                        aria-label="Close"
                    >
                        <FiX className="w-5 h-5 text-gray-700 dark:text-white" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 space-y-6">
                    {/* Validation Errors */}
                    {validationErrors.length > 0 && (
                        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                            <div className="flex items-start gap-2">
                                <FiAlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-red-800 dark:text-red-300 mb-1">
                                        Please fix the following errors:
                                    </p>
                                    <ul className="text-xs text-red-700 dark:text-red-400 list-disc list-inside space-y-1">
                                        {validationErrors.map((error, idx) => (
                                            <li key={idx}>{error}</li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Required Fields */}
                    <div>
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                            <FiCheckCircle className="w-4 h-4 text-red-500" />
                            Required Fields
                            {itemType === 'vocabulary' && (
                                <span className="text-xs font-normal text-gray-500 dark:text-gray-400">
                                    (at least one must be mapped)
                                </span>
                            )}
                        </h3>
                        <div className="space-y-3">
                            {fields.required.map(field => (
                                <div key={field.key}>
                                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        {field.label}
                                        <span className="text-gray-500 dark:text-gray-400 font-normal ml-1">
                                            - {field.description}
                                        </span>
                                    </label>
                                    <select
                                        value={columnMappings[field.key] || ''}
                                        onChange={(e) => handleMappingChange(field.key, e.target.value)}
                                        className="w-full bg-gray-50 dark:bg-[#0f1a1f] text-gray-900 dark:text-white px-3 py-2 rounded text-sm border border-black/10 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-[#e30a5f]"
                                    >
                                        <option value="">-- Select CSV Column --</option>
                                        {csvHeaders.map((header, idx) => (
                                            <option key={idx} value={header}>
                                                {header}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Optional Fields */}
                    <div>
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                            <FiCheckCircle className="w-4 h-4 text-gray-400" />
                            Optional Fields
                        </h3>
                        <div className="space-y-3">
                            {fields.optional.map(field => (
                                <div key={field.key}>
                                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        {field.label}
                                        <span className="text-gray-500 dark:text-gray-400 font-normal ml-1">
                                            - {field.description}
                                        </span>
                                    </label>
                                    <select
                                        value={columnMappings[field.key] || ''}
                                        onChange={(e) => handleMappingChange(field.key, e.target.value)}
                                        className="w-full bg-gray-50 dark:bg-[#0f1a1f] text-gray-900 dark:text-white px-3 py-2 rounded text-sm border border-black/10 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-[#e30a5f]"
                                    >
                                        <option value="">-- Select CSV Column (Optional) --</option>
                                        {csvHeaders.map((header, idx) => (
                                            <option key={idx} value={header}>
                                                {header}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-200 dark:border-gray-700">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded text-sm font-medium border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#1d2a32] transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleMapColumns}
                        className="px-4 py-2 rounded text-sm font-medium bg-[#e30a5f] text-white hover:opacity-95 transition-opacity"
                    >
                        Map Columns & Insert
                    </button>
                </div>
            </div>
        </div>
    );
}
