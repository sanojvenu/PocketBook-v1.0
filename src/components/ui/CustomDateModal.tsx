"use client";

import { useState } from "react";
import Modal from "./Modal";
import { Calendar } from "lucide-react";

interface CustomDateModalProps {
    isOpen: boolean;
    onClose: () => void;
    onApply: (start: string, end: string) => void;
}

export default function CustomDateModal({ isOpen, onClose, onApply }: CustomDateModalProps) {
    const [mode, setMode] = useState<'range' | 'single'>('range');
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");

    const handleSave = () => {
        if (mode === 'single') {
            onApply(startDate, startDate);
        } else {
            onApply(startDate, endDate);
        }
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Select Custom Date">
            <div className="space-y-6">
                {/* Toggles */}
                <div className="flex gap-2">
                    <button
                        onClick={() => setMode('range')}
                        className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${mode === 'range'
                                ? 'bg-blue-50 text-blue-600 border border-blue-200'
                                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                            }`}
                    >
                        Date Range
                    </button>
                    <button
                        onClick={() => setMode('single')}
                        className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${mode === 'single'
                                ? 'bg-blue-50 text-blue-600 border border-blue-200'
                                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                            }`}
                    >
                        Single Day
                    </button>
                </div>

                {/* Inputs */}
                <div className="flex gap-4">
                    <div className="flex-1 space-y-1">
                        <label className="text-xs font-semibold text-gray-500">Start Date</label>
                        <div className="relative">
                            <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all dark:bg-gray-900 dark:border-gray-700 dark:text-white"
                            />
                        </div>
                    </div>

                    {mode === 'range' && (
                        <div className="flex-1 space-y-1">
                            <label className="text-xs font-semibold text-gray-500">End Date</label>
                            <div className="relative">
                                <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all dark:bg-gray-900 dark:border-gray-700 dark:text-white"
                                />
                            </div>
                        </div>
                    )}
                </div>

                <div className="pt-4 border-t border-gray-100 dark:border-gray-800 flex justify-end">
                    <button
                        onClick={handleSave}
                        className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200 dark:shadow-none"
                    >
                        Save
                    </button>
                </div>
            </div>
        </Modal>
    );
}
