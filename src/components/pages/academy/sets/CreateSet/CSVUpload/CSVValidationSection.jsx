import { useState, useEffect } from "react";
import { FiCheckCircle, FiAlertCircle, FiFile, FiArrowRight } from "react-icons/fi";
import { TbX } from "react-icons/tb";
import CSVColumnMapper from "./CSVColumnMapper";

export default function CSVValidationSection({ csvData, selectedFile, onClear, itemType, onColumnsMapped }) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editedData, setEditedData] = useState([]);

    // Update edited data when CSV data changes
    useEffect(() => {
        if (!csvData) {
            setEditedData([]);
            return;
        }

        // Parse CSV data
        const lines = csvData.trim().split('\n');
        const rows = lines.slice(1).map(line => {
            // Handle CSV parsing with proper quote handling
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

        const validRows = rows.filter(row => row.some(cell => cell.length > 0));
        setEditedData(validRows);
    }, [csvData]);

    if (!csvData) return null;

    // Parse CSV data for headers
    const lines = csvData.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim());

    // Handle cell edits
    const handleCellChange = (rowIdx, cellIdx, value) => {
        const newData = [...editedData];
        newData[rowIdx] = [...newData[rowIdx]];
        newData[rowIdx][cellIdx] = value;
        setEditedData(newData);
    };

    return (
        <div className="space-y-4">
            <div className="bg-gray-50 dark:bg-[#0f1a1f] rounded-lg p-3 border border-black/10 dark:border-white/10">
                <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                        <div className="hidden sm:flex items-center gap-2">
                            <FiCheckCircle className="w-5 h-5 text-green-500" />
                            <h3 className=" text-sm font-semibold text-gray-900 dark:text-white">
                                Preview
                            </h3>
                        </div>
                        <FiFile className="w-4 h-4 text-[#e30a5f] flex-shrink-0" />
                        <span className="text-xs sm:text-sm text-gray-900 dark:text-white font-medium truncate">
                            {selectedFile?.name || 'CSV File'}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">
                            ({selectedFile ? (selectedFile.size / 1024).toFixed(2) : '0'} KB)
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">
                            ({editedData.length} rows)
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={onClear}
                            className="p-2 rounded-lg bg-gray-200 dark:bg-white/10 hover:bg-gray-300 dark:hover:bg-white/20 transition-colors flex-shrink-0"
                            aria-label="Remove CSV"
                        >
                            <TbX className="w-5 h-5 text-gray-700 dark:text-white" />
                        </button>
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="p-2 rounded-lg bg-gray-200 dark:bg-white/10 hover:bg-gray-300 dark:hover:bg-white/20 transition-colors flex-shrink-0"
                            aria-label="Map Columns & Insert"
                            title="Map CSV columns to fields and insert"
                        >
                            <FiArrowRight className="w-5 h-5 text-[#e30a5f]" />
                        </button>
                    </div>
                </div>
            </div>

            <CSVColumnMapper
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                csvHeaders={headers}
                itemType={itemType}
                onMapComplete={onColumnsMapped}
            />

            <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden w-full">
                <div className="overflow-x-auto overflow-y-auto max-h-[280px] w-full">
                    <table className="min-w-full text-sm table-fixed">
                        <thead className="bg-gray-50 dark:bg-[#0f1a1f] sticky top-0">
                            <tr>
                                {headers.map((header, idx) => (
                                    <th
                                        key={idx}
                                        className="px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider border-b border-gray-200 dark:border-gray-700 whitespace-nowrap min-w-[150px] w-[200px]"
                                    >
                                        <div className="overflow-hidden text-ellipsis">
                                            {header}
                                        </div>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-[#1c2b35] divide-y divide-gray-200 dark:divide-gray-700">
                            {editedData.map((row, rowIdx) => (
                                <tr key={rowIdx} className="hover:bg-gray-50 dark:hover:bg-[#1d2a32]">
                                    {row.map((cell, cellIdx) => (
                                        <td
                                            key={cellIdx}
                                            className="px-3 py-2 min-w-[150px] w-[200px]"
                                        >
                                            <input
                                                type="text"
                                                value={cell || ''}
                                                onChange={(e) => handleCellChange(rowIdx, cellIdx, e.target.value)}
                                                className="w-full bg-transparent border-none outline-none text-gray-900 dark:text-white focus:bg-gray-50 dark:focus:bg-[#0f1a1f] px-2 py-1 rounded transition-colors overflow-hidden text-ellipsis"
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
