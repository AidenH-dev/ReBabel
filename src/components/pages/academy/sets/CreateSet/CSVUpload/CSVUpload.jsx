import { useState } from "react";
import { FiUpload, FiFile } from "react-icons/fi";
import CSVValidationSection from "./CSVValidationSection";

export default function CSVUpload({ onUpload, itemType, onColumnsMapped }) {
    const [selectedFile, setSelectedFile] = useState(null);
    const [isDragging, setIsDragging] = useState(false);
    const [csvData, setCsvData] = useState(null);

    const handleClearUpload = () => {
        setSelectedFile(null);
        setCsvData(null);
        if (onUpload) {
            onUpload(null);
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file && file.type === "text/csv") {
            setSelectedFile(file);
            readFile(file);
        } else {
            alert("Please select a valid CSV file");
        }
    };

    const readFile = (file) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const content = e.target.result;
            console.log("CSV Content:", content);
            setCsvData(content);
            if (onUpload) {
                onUpload(content);
            }
        };
        reader.readAsText(file);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);

        const file = e.dataTransfer.files[0];
        if (file && file.type === "text/csv") {
            setSelectedFile(file);
            readFile(file);
        } else {
            alert("Please drop a valid CSV file");
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    return (
        <div className="space-y-4">
            {!csvData ? (
                <>
                    <div
                        onDrop={handleDrop}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${isDragging
                                ? "border-[#e30a5f] bg-pink-50 dark:bg-pink-900/10"
                                : "border-gray-300 dark:border-gray-600 hover:border-[#e30a5f] dark:hover:border-[#e30a5f]"
                            }`}
                    >
                        <FiUpload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                            Drag and drop your CSV file here, or
                        </p>
                        <label className="inline-flex items-center gap-2 px-4 py-2 rounded text-sm font-medium bg-[#e30a5f] text-white hover:opacity-95 transition-opacity cursor-pointer">
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
