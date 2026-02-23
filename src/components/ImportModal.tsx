"use client";

import { useState } from "react";
import { Upload, FileSpreadsheet, Download, AlertCircle, CheckCircle, X } from "lucide-react";
import * as XLSX from "xlsx";
import Modal from "./ui/Modal";
import { toast } from "sonner";

interface ImportModalProps {
    isOpen: boolean;
    onClose: () => void;
    onImport: (data: any[]) => Promise<void>;
}

export default function ImportModal({ isOpen, onClose, onImport }: ImportModalProps) {
    const [file, setFile] = useState<File | null>(null);
    const [previewData, setPreviewData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            // Reset states
            setError(null);
            setPreviewData([]);
            setFile(selectedFile);
            parseFile(selectedFile);
        }
    };

    const parseFile = (file: File) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = e.target?.result;
                const workbook = XLSX.read(data, { type: 'binary' });
                const sheetName = workbook.SheetNames[0];
                const sheet = workbook.Sheets[sheetName];
                const jsonData = XLSX.utils.sheet_to_json(sheet);

                // Basic validation filter
                const validData = jsonData.filter((row: any) =>
                    row.Date && (row.Description || row.description) && row.Amount
                );

                if (validData.length === 0) {
                    setError("No valid data found. Ensure columns match the template: Date, Description, Category, Type, Amount.");
                } else {
                    setPreviewData(validData);
                }
            } catch (err) {
                console.error(err);
                setError("Failed to parse file. Please upload a valid Excel file.");
            }
        };
        reader.readAsBinaryString(file);
    };

    const downloadTemplate = () => {
        const template = [
            {
                "Date": "25-03-2024",
                "Description": "Grocery Shopping",
                "Category": "Food",
                "Type": "expense",
                "Amount": 1500,
                "Tags": "home, weekly"
            },
            {
                "Date": "24-03-2024",
                "Description": "Client Payment",
                "Category": "Income",
                "Type": "income",
                "Amount": 50000,
                "Tags": "project, salary"
            }
        ];
        const ws = XLSX.utils.json_to_sheet(template);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Template");
        XLSX.writeFile(wb, "PocketBook_Import_Template.xlsx");
    };

    const handleUpload = async () => {
        if (previewData.length === 0) return;
        setLoading(true);
        try {
            await onImport(previewData);
            // Reset and close on success
            setFile(null);
            setPreviewData([]);
            onClose();
        } catch (err) {
            console.error("Import error in modal", err);
            // Error handling usually done in parent via toast, but we can set state here too
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Bulk Import Transactions">
            <div className="space-y-6">

                {/* 1. Instructions & Template */}
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800 text-sm space-y-3">
                    <div className="flex items-start gap-3">
                        <AlertCircle className="text-blue-600 shrink-0 mt-0.5" size={18} />
                        <div className="text-blue-800 dark:text-blue-200">
                            <p className="font-semibold mb-1">Instructions:</p>
                            <ul className="list-disc pl-4 space-y-1 opacity-90">
                                <li>Download the template to see the required format.</li>
                                <li><strong>Date</strong> should be in <code>DD-MM-YYYY</code> format (e.g., 25-03-2024).</li>
                                <li><strong>Type</strong> must be <code>income</code> or <code>expense</code>.</li>
                                <li>Allowed Categories: Food, Transport, Utilities, Income, Entertainment, Shopping, Health, Education, Other.</li>
                            </ul>
                        </div>
                    </div>
                    <button
                        onClick={downloadTemplate}
                        className="w-full bg-white dark:bg-gray-800 border border-blue-200 dark:border-blue-700 text-blue-600 hover:bg-blue-50 hover:text-blue-700 py-2 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
                    >
                        <Download size={16} /> Download Excel Template
                    </button>
                </div>

                {/* 2. File Upload Area */}
                <div className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${file ? 'border-green-500 bg-green-50/50 dark:bg-green-900/10' : 'border-gray-300 dark:border-gray-700 hover:border-blue-500 bg-gray-50 dark:bg-gray-800/50'}`}>
                    <input
                        type="file"
                        accept=".xlsx, .xls"
                        onChange={handleFileChange}
                        className="hidden"
                        id="file-upload"
                    />
                    <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center gap-3">
                        {file ? (
                            <>
                                <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                                    <FileSpreadsheet size={24} />
                                </div>
                                <div>
                                    <p className="font-bold text-green-700 dark:text-green-400">{file.name}</p>
                                    <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-1">
                                    <Upload size={24} />
                                </div>
                                <p className="font-medium text-gray-700 dark:text-gray-300">Click to upload Excel file</p>
                                <p className="text-xs text-gray-400">Supports .xlsx and .xls</p>
                            </>
                        )}
                    </label>
                </div>

                {/* 3. Status / Error Preview */}
                {error && (
                    <div className="text-red-500 text-sm flex items-center gap-2 bg-red-50 p-3 rounded-lg border border-red-100">
                        <AlertCircle size={16} /> {error}
                    </div>
                )}

                {previewData.length > 0 && !error && (
                    <div className="flex items-center gap-2 text-green-600 bg-green-50 dark:bg-green-900/20 p-3 rounded-lg border border-green-100 dark:border-green-800">
                        <CheckCircle size={18} />
                        <span className="font-medium">Ready to import {previewData.length} transactions.</span>
                    </div>
                )}

                {/* 4. Actions */}
                <div className="flex justify-end gap-3 pt-2">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg font-medium transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleUpload}
                        disabled={loading || previewData.length === 0}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {loading ? 'Importing...' : 'Import Data'}
                    </button>
                </div>
            </div>
        </Modal>
    );
}
