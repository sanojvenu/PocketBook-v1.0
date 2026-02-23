"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, CheckSquare, Square } from "lucide-react";

interface MultiSelectFilterDropdownProps {
    label: string;
    options: { label: string; value: string }[];
    value: string[];
    onChange: (value: string[]) => void;
    onClear?: () => void;
}

export default function MultiSelectFilterDropdown({ label, options, value, onChange, onClear }: MultiSelectFilterDropdownProps) {
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

    const toggleOption = (optionValue: string) => {
        const newValue = value.includes(optionValue)
            ? value.filter(v => v !== optionValue)
            : [...value, optionValue];
        onChange(newValue);
    };

    const getLabel = () => {
        if (value.length === 0) return "All";
        if (value.length === 1) return options.find(o => o.value === value[0])?.label || value[0];
        return `${value.length} selected`;
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center gap-2 px-4 py-2 border rounded-lg text-sm font-medium hover:bg-gray-50 focus:ring-2 focus:ring-blue-100 transition-all whitespace-nowrap
                    ${value.length > 0
                        ? 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-300'
                        : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300'
                    }`}
            >
                <span className={value.length > 0 ? "text-blue-600 dark:text-blue-400" : "text-gray-500 dark:text-gray-400"}>{label}:</span>
                <span>{getLabel()}</span>
                <ChevronDown size={14} className={value.length > 0 ? "text-blue-400" : "text-gray-400"} />
            </button>

            {isOpen && (
                <div className="absolute top-full left-0 mt-2 min-w-[200px] bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl shadow-xl z-50 p-1">
                    <div className="max-h-[300px] overflow-y-auto flex flex-col gap-1 p-1 custom-scrollbar">
                        {options.length === 0 ? (
                            <div className="p-3 text-center text-xs text-gray-400 italic">No tags available</div>
                        ) : (
                            options.map((opt) => (
                                <button
                                    key={opt.value}
                                    onClick={() => toggleOption(opt.value)}
                                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors text-left
                                        ${value.includes(opt.value)
                                            ? 'bg-blue-50 text-blue-700 font-medium dark:bg-blue-900/20 dark:text-blue-300'
                                            : 'text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-white/5'
                                        }
                                    `}
                                >
                                    {value.includes(opt.value)
                                        ? <CheckSquare size={16} className="text-blue-600 dark:text-blue-400" />
                                        : <Square size={16} className="text-gray-300" />
                                    }
                                    {opt.label}
                                </button>
                            ))
                        )}
                    </div>
                    <div className="mt-1 pt-2 border-t border-gray-100 dark:border-gray-800 flex justify-between px-3 pb-2 gap-2">
                        <button
                            onClick={() => { onChange([]); }}
                            className="text-xs font-bold text-gray-500 hover:text-gray-700 px-2 py-1 disabled:opacity-50"
                            disabled={value.length === 0}
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
