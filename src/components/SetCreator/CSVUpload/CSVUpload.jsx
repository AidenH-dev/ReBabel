import { useState } from 'react';
import { FiUpload, FiFile, FiDownload } from 'react-icons/fi';
import CSVValidationSection from './CSVValidationSection';

const FIELD_INFO = {
  vocabulary: {
    required: [
      { key: 'english', label: 'English' },
      { key: 'kana', label: 'Kana' },
    ],
    optional: [
      { key: 'kanji', label: 'Kanji' },
      { key: 'example_sentences', label: 'Example Sentences' },
      { key: 'tags', label: 'Tags' },
    ],
    hint: 'At least one of English or Kana is required.',
  },
  grammar: {
    required: [
      { key: 'title', label: 'Title' },
      { key: 'description', label: 'Description' },
    ],
    optional: [
      { key: 'topic', label: 'Topic' },
      { key: 'notes', label: 'Notes' },
      { key: 'example_sentences', label: 'Example Sentences' },
      { key: 'tags', label: 'Tags' },
    ],
    hint: 'Both Title and Description are required.',
  },
};

export default function CSVUpload({ onUpload, itemType, onColumnsMapped }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [csvData, setCsvData] = useState(null);

  const fields = FIELD_INFO[itemType] || FIELD_INFO.vocabulary;

  const handleClearUpload = () => {
    setSelectedFile(null);
    setCsvData(null);
    if (onUpload) onUpload(null);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type === 'text/csv') {
      setSelectedFile(file);
      readFile(file);
    } else {
      alert('Please select a valid CSV file');
    }
  };

  const readFile = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target.result;
      setCsvData(content);
      if (onUpload) onUpload(content);
    };
    reader.readAsText(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type === 'text/csv') {
      setSelectedFile(file);
      readFile(file);
    } else {
      alert('Please drop a valid CSV file');
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const downloadTemplate = () => {
    const headers = [...fields.required, ...fields.optional].map((f) => f.key);
    const csv = headers.join(',') + '\n';
    const blob = new Blob(['\uFEFF' + csv], {
      type: 'text/csv;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${itemType}_template.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      {!csvData ? (
        <>
          {/* Pre-upload guidance */}
          <div className="bg-surface-deep rounded-lg p-4 border border-border-default">
            <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
              Upload a CSV with columns for your {itemType} data. {fields.hint}
            </p>
            <div className="flex flex-wrap gap-1.5 mb-3">
              {fields.required.map((f) => (
                <span
                  key={f.key}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-brand-pink/10 text-brand-pink border border-brand-pink/20"
                >
                  {f.label}
                  <span className="text-[10px] opacity-60">required</span>
                </span>
              ))}
              {fields.optional.map((f) => (
                <span
                  key={f.key}
                  className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-white/10"
                >
                  {f.label}
                </span>
              ))}
            </div>
            <button
              onClick={downloadTemplate}
              className="inline-flex items-center gap-1.5 text-xs text-brand-pink hover:underline"
            >
              <FiDownload className="w-3.5 h-3.5" />
              Download CSV template
            </button>
          </div>

          {/* Drop zone */}
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              isDragging
                ? 'border-brand-pink bg-pink-50 dark:bg-pink-900/10'
                : 'border-gray-300 dark:border-gray-600 hover:border-brand-pink dark:hover:border-brand-pink'
            }`}
          >
            <FiUpload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              Drag and drop your CSV file here, or
            </p>
            <label className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-brand-pink text-white hover:bg-brand-pink-hover active:scale-[0.98] transition cursor-pointer">
              <FiFile className="w-4 h-4" />
              Browse Files
              <input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
          </div>
        </>
      ) : (
        <CSVValidationSection
          csvData={csvData}
          selectedFile={selectedFile}
          onClear={handleClearUpload}
          itemType={itemType}
          onColumnsMapped={onColumnsMapped}
        />
      )}
    </div>
  );
}
