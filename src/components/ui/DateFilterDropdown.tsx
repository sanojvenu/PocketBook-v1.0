"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, Circle, CheckCircle2 } from "lucide-react";

interface DateFilterDropdownProps {
    onApply: (start: string, end: string, label: string) => void;
    onCustom: () => void;
    currentLabel: string;
    filterType?: 'history' | 'upcoming';
}

export default function DateFilterDropdown({ onApply, onCustom, currentLabel, filterType = 'history' }: DateFilterDropdownProps) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close on click outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const formatDate = (date: Date) => {
        const offset = date.getTimezoneOffset();
        const localDate = new Date(date.getTime() - (offset * 60 * 1000));
        return localDate.toISOString().split('T')[0];
    };

    const handleSelect = (option: string) => {
        const today = new Date();
        let start = "";
        let end = "";

        switch (option) {
            case "All Time":
                start = "";
                end = "";
                break;
            case "Today":
                start = formatDate(today);
                end = formatDate(today);
                break;
            case "Tomorrow":
                const tmr = new Date(today);
                tmr.setDate(tmr.getDate() + 1);
                start = formatDate(tmr);
                end = formatDate(tmr);
                break;
            case "Yesterday":
                const y = new Date(today);
                y.setDate(y.getDate() - 1);
                start = formatDate(y);
                end = formatDate(y);
                break;
            case "This Month":
                start = formatDate(new Date(today.getFullYear(), today.getMonth(), 1));
                end = formatDate(new Date(today.getFullYear(), today.getMonth() + 1, 0));
                break;
            case "Last Month":
                start = formatDate(new Date(today.getFullYear(), today.getMonth() - 1, 1));
                end = formatDate(new Date(today.getFullYear(), today.getMonth(), 0));
                break;
            case "Next Month":
                start = formatDate(new Date(today.getFullYear(), today.getMonth() + 1, 1));
                end = formatDate(new Date(today.getFullYear(), today.getMonth() + 2, 0));
                break;
            case "Custom":
                setIsOpen(false);
                onCustom();
                return;
        }

        onApply(start, end, option);
    };

    const options = filterType === 'history'
        ? ["All Time", "Today", "Yesterday", "This Month", "Last Month", "Custom"]
        : ["All Time", "Today", "Tomorrow", "This Month", "Next Month", "Custom"];

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 focus:ring-2 focus:ring-blue-100 transition-all dark:text-white"
            >
                <span className="text-gray-500 dark:text-gray-400">Duration:</span>
                <span>{currentLabel}</span>
                <ChevronDown size={14} className="text-gray-400" />
            </button>

            {isOpen && (
                <div className="absolute top-full left-0 mt-2 w-56 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl shadow-xl z-50 p-1">
                    <div className="flex flex-col gap-1 p-1">
                        {options.map((opt) => (
                            <button
                                key={opt}
                                onClick={() => handleSelect(opt)}
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors text-left
                                    ${currentLabel === opt
                                        ? 'bg-blue-50 text-blue-700 font-medium dark:bg-blue-900/20 dark:text-blue-300'
                                        : 'text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-white/5'
                                    }
                                `}
                            >
                                {currentLabel === opt
                                    ? <CheckCircle2 size={16} className="text-blue-600 dark:text-blue-400" />
                                    : <Circle size={16} className="text-gray-300" />
                                }
                                {opt}
                            </button>
                        ))}
                    </div>
                    <div className="mt-1 pt-2 border-t border-gray-100 dark:border-gray-800 flex justify-end px-3 pb-2 gap-2">
                        <button
                            onClick={() => { handleSelect("This Month"); setIsOpen(false); }}
                            className="text-xs font-bold text-gray-500 hover:text-gray-700 px-2 py-1"
                        >
                            Clear
                        </button>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="text-xs font-bold text-blue-600 hover:text-blue-700 px-2 py-1"
                        >
                            Done
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
