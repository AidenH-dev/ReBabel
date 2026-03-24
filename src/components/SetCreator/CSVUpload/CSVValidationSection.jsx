import { useState, useEffect, useMemo } from 'react';
import { FiCheckCircle, FiAlertCircle, FiFile } from 'react-icons/fi';
import { TbX } from 'react-icons/tb';
import Button from '@/components/ui/Button';
import CustomSelect from '@/components/ui/CustomSelect';

const FIELD_DEFS = {
  vocabulary: {
    required: [
      { key: 'english', label: 'English' },
      { key: 'kana', label: 'Kana' },
    ],
    optional: [
      { key: 'kanji', label: 'Kanji' },
      { key: 'example_sentences', label: 'Example Sentences' },
      { key: 'tags', label: 'Tags' },
      { key: 'audio', label: 'Audio URL' },
    ],
    requireOneOf: true,
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
    requireOneOf: false,
  },
};

export default function CSVValidationSection({
  csvData,
  selectedFile,
  onClear,
  itemType,
  onColumnsMapped,
}) {
  // columnMappings: { [csvColumnIndex]: fieldKey }
  const [columnMappings, setColumnMappings] = useState({});
  const [editedData, setEditedData] = useState([]);

  const fields = useMemo(
    () => FIELD_DEFS[itemType] || FIELD_DEFS.vocabulary,
    [itemType]
  );

  const allFields = useMemo(
    () => [...fields.required, ...fields.optional],
    [fields]
  );

  // Parse headers from first CSV line
  const headers = useMemo(() => {
    if (!csvData) return [];
    const firstLine = csvData.trim().split('\n')[0];
    return firstLine.split(',').map((h) => h.trim());
  }, [csvData]);

  // Parse data rows
  useEffect(() => {
    if (!csvData) {
      setEditedData([]);
      return;
    }
    const lines = csvData.trim().split('\n');
    const rows = lines.slice(1).map((line) => {
      const values = [];
      let current = '';
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          values.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      values.push(current.trim());
      return values;
    });
    setEditedData(rows.filter((row) => row.some((cell) => cell.length > 0)));
  }, [csvData]);

  // Auto-detect column mappings when CSV is loaded
  useEffect(() => {
    if (!headers.length) return;
    const auto = {};
    headers.forEach((header, idx) => {
      const headerLower = header.toLowerCase();
      const match = allFields.find(
        (f) =>
          f.key.toLowerCase() === headerLower ||
          headerLower.includes(f.key.toLowerCase()) ||
          f.key.toLowerCase().includes(headerLower)
      );
      if (match && !Object.values(auto).includes(match.key)) {
        auto[idx] = match.key;
      }
    });
    setColumnMappings(auto);
  }, [headers, allFields]);

  // Which fields are currently assigned to a column
  const assignedFields = useMemo(
    () => new Set(Object.values(columnMappings).filter(Boolean)),
    [columnMappings]
  );

  // Mapping progress status
  const mappingStatus = useMemo(() => {
    const mapped = fields.required.filter((f) => assignedFields.has(f.key));
    if (fields.requireOneOf) {
      return {
        satisfied: mapped.length >= 1,
        label: `${mapped.length}/${fields.required.length} required fields mapped`,
        detail: mapped.length === 0 ? 'Map at least English or Kana' : null,
      };
    }
    return {
      satisfied: mapped.length === fields.required.length,
      label: `${mapped.length}/${fields.required.length} required fields mapped`,
      detail:
        mapped.length < fields.required.length
          ? `Missing: ${fields.required
              .filter((f) => !assignedFields.has(f.key))
              .map((f) => f.label)
              .join(', ')}`
          : null,
    };
  }, [fields, assignedFields]);

  // Check actual cell data for empty kanji/kana values
  const categorizerWarning = useMemo(() => {
    if (itemType !== 'vocabulary' || editedData.length === 0) return null;

    const kanjiColIdx = Object.keys(columnMappings).find(
      (k) => columnMappings[k] === 'kanji'
    );
    const kanaColIdx = Object.keys(columnMappings).find(
      (k) => columnMappings[k] === 'kana'
    );

    const hasKanjiCol = kanjiColIdx !== undefined;
    const hasKanaCol = kanaColIdx !== undefined;

    if (!hasKanjiCol && !hasKanaCol) {
      return {
        level: 'error',
        message:
          'No Japanese text columns mapped. Auto-categorization requires kana or kanji to classify items.',
      };
    }

    const total = editedData.length;

    const missingKanji = hasKanjiCol
      ? editedData.filter((row) => !row[parseInt(kanjiColIdx)]?.trim()).length
      : total;

    const missingKana = hasKanaCol
      ? editedData.filter((row) => !row[parseInt(kanaColIdx)]?.trim()).length
      : total;

    // Both columns mapped but many rows missing both
    if (hasKanjiCol && hasKanaCol) {
      const missingBoth = editedData.filter(
        (row) =>
          !row[parseInt(kanjiColIdx)]?.trim() &&
          !row[parseInt(kanaColIdx)]?.trim()
      ).length;
      if (missingBoth > 0) {
        return {
          level: 'error',
          message: `${missingBoth} of ${total} items have no kanji or kana. These items cannot be auto-categorized.`,
        };
      }
    }

    // Kanji column missing or many empty kanji cells
    if (missingKanji > 0) {
      const pct = Math.round((missingKanji / total) * 100);
      if (!hasKanjiCol) {
        return {
          level: 'warn',
          message: `Kanji not mapped. Auto-categorization will use kana only, which may produce lower-confidence results.`,
        };
      }
      return {
        level: pct > 50 ? 'warn' : 'info',
        message: `${missingKanji} of ${total} items (${pct}%) have no kanji. This may result in inconsistent auto-categorization of vocabulary types.`,
      };
    }

    return null;
  }, [itemType, columnMappings, editedData]);

  const handleColumnAssign = (colIdx, fieldKey) => {
    setColumnMappings((prev) => {
      const next = { ...prev };
      // If this field is already assigned elsewhere, unassign it first
      if (fieldKey) {
        Object.keys(next).forEach((key) => {
          if (next[key] === fieldKey) delete next[key];
        });
        next[colIdx] = fieldKey;
      } else {
        delete next[colIdx];
      }
      return next;
    });
  };

  const handleInsert = () => {
    // Convert { colIdx: fieldKey } -> { fieldKey: headerName } for parent
    const mappings = {};
    Object.entries(columnMappings).forEach(([colIdx, fieldKey]) => {
      if (fieldKey) {
        mappings[fieldKey] = headers[parseInt(colIdx)];
      }
    });
    onColumnsMapped(mappings);
  };

  const handleCellChange = (rowIdx, cellIdx, value) => {
    const newData = [...editedData];
    newData[rowIdx] = [...newData[rowIdx]];
    newData[rowIdx][cellIdx] = value;
    setEditedData(newData);
  };

  if (!csvData) return null;

  return (
    <div className="space-y-3">
      {/* File info bar */}
      <div className="bg-surface-deep rounded-lg px-3 py-2.5 border border-border-default flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <FiFile className="w-4 h-4 text-brand-pink flex-shrink-0" />
          <span className="text-sm text-gray-900 dark:text-white font-medium truncate">
            {selectedFile?.name || 'CSV File'}
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">
            {selectedFile ? (selectedFile.size / 1024).toFixed(1) : '0'} KB
            &middot; {editedData.length} rows
          </span>
        </div>
        <button
          onClick={onClear}
          className="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-white/10 transition-colors flex-shrink-0"
          aria-label="Remove CSV"
        >
          <TbX className="w-4 h-4 text-gray-500 dark:text-gray-400" />
        </button>
      </div>

      {/* Mapping status bar */}
      <div
        className={`flex items-center justify-between gap-3 rounded-lg px-3 py-2.5 border ${
          mappingStatus.satisfied
            ? 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800'
            : 'bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800'
        }`}
      >
        <div className="flex items-center gap-2 min-w-0">
          {mappingStatus.satisfied ? (
            <FiCheckCircle className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0" />
          ) : (
            <FiAlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
          )}
          <span
            className={`text-xs font-medium ${
              mappingStatus.satisfied
                ? 'text-green-800 dark:text-green-300'
                : 'text-amber-800 dark:text-amber-300'
            }`}
          >
            {mappingStatus.label}
          </span>
          {mappingStatus.detail && (
            <span
              className={`text-xs hidden sm:inline ${
                mappingStatus.satisfied
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-amber-600 dark:text-amber-400'
              }`}
            >
              &mdash; {mappingStatus.detail}
            </span>
          )}
        </div>
        {mappingStatus.satisfied && (
          <Button
            variant="primary-subtle"
            size="sm"
            onClick={handleInsert}
            className="flex-shrink-0"
          >
            Insert {editedData.length} Items
          </Button>
        )}
      </div>

      {/* Inline mapping hint */}
      <p className="text-[11px] text-gray-500 dark:text-gray-400">
        Use the dropdowns in each column header to assign your CSV columns to
        fields. Fields marked with * are required.
      </p>

      {/* Table with inline column mapping */}
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
        <div className="overflow-x-auto overflow-y-auto max-h-[350px]">
          <table className="min-w-full text-sm table-fixed">
            <thead className="sticky top-0 z-10 bg-surface-card shadow-[0_1px_0_0] shadow-gray-200 dark:shadow-gray-700">
              {/* Mapping dropdowns row */}
              <tr className="bg-surface-elevated dark:bg-surface-elevated">
                {headers.map((_, idx) => {
                  const assignedField = columnMappings[idx];
                  const isRequired = fields.required.some(
                    (f) => f.key === assignedField
                  );

                  const options = [
                    { value: '', label: '-- Skip --' },
                    ...allFields.map((f) => {
                      const usedElsewhere =
                        assignedFields.has(f.key) &&
                        columnMappings[idx] !== f.key;
                      const isReq = fields.required.some(
                        (r) => r.key === f.key
                      );
                      return {
                        value: f.key,
                        label: `${f.label}${isReq ? ' *' : ''}${usedElsewhere ? ' (in use)' : ''}`,
                      };
                    }),
                  ];

                  return (
                    <th
                      key={idx}
                      className="px-2 py-3 min-w-[160px] w-[200px] font-medium"
                    >
                      <CustomSelect
                        value={assignedField || ''}
                        onChange={(val) => handleColumnAssign(idx, val)}
                        placeholder="-- Skip --"
                        options={options}
                        size="sm"
                        className={
                          assignedField
                            ? isRequired
                              ? 'ring-1 ring-brand-pink/40 rounded-md'
                              : 'ring-1 ring-green-400/40 rounded-md'
                            : ''
                        }
                      />
                    </th>
                  );
                })}
              </tr>
              {/* Original CSV header names */}
              <tr className="bg-surface-deep">
                {headers.map((header, idx) => (
                  <th
                    key={idx}
                    className="px-3 py-1.5 text-left text-[11px] font-normal text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-200 dark:border-gray-700 whitespace-nowrap min-w-[160px] w-[200px]"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-surface-card divide-y divide-gray-200 dark:divide-gray-700">
              {categorizerWarning && (
                <tr
                  className={
                    categorizerWarning.level === 'error'
                      ? 'bg-red-50 dark:bg-red-900/10'
                      : 'bg-amber-50 dark:bg-amber-900/10'
                  }
                >
                  <td colSpan={headers.length} className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      <FiAlertCircle
                        className={`w-3.5 h-3.5 flex-shrink-0 ${
                          categorizerWarning.level === 'error'
                            ? 'text-red-500 dark:text-red-400'
                            : 'text-amber-500 dark:text-amber-400'
                        }`}
                      />
                      <span
                        className={`text-xs ${
                          categorizerWarning.level === 'error'
                            ? 'text-red-700 dark:text-red-300'
                            : 'text-amber-700 dark:text-amber-300'
                        }`}
                      >
                        {categorizerWarning.message}
                      </span>
                    </div>
                  </td>
                </tr>
              )}
              {editedData.map((row, rowIdx) => (
                <tr
                  key={rowIdx}
                  className="hover:bg-gray-50 dark:hover:bg-surface-elevated"
                >
                  {row.map((cell, cellIdx) => (
                    <td
                      key={cellIdx}
                      className="px-3 py-1.5 min-w-[160px] w-[200px]"
                    >
                      <input
                        type="text"
                        value={cell || ''}
                        onChange={(e) =>
                          handleCellChange(rowIdx, cellIdx, e.target.value)
                        }
                        className="w-full bg-transparent border-none outline-none text-sm text-gray-900 dark:text-white focus:bg-gray-50 dark:focus:bg-surface-deep px-2 py-0.5 rounded transition-colors"
                        placeholder="-"
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {editedData.length === 0 && (
        <div className="flex items-center gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <FiAlertCircle className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
          <span className="text-xs text-yellow-800 dark:text-yellow-300">
            No valid data rows found in the CSV file.
          </span>
        </div>
      )}
    </div>
  );
}
