"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, CheckCircle2, Circle } from "lucide-react";

interface FilterDropdownProps {
    label: string;
    options: { label: string; value: string }[];
    value: string;
    onChange: (value: string) => void;
    onClear?: () => void;
}

export default function FilterDropdown({ label, options, value, onChange, onClear }: FilterDropdownProps) {
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

    const selectedOption = options.find(opt => opt.value === value) || options[0];

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 focus:ring-2 focus:ring-blue-100 transition-all dark:text-white whitespace-nowrap"
            >
                <span className="text-gray-500 dark:text-gray-400">{label}:</span>
                <span>{selectedOption.label}</span>
                <ChevronDown size={14} className="text-gray-400" />
            </button>

            {isOpen && (
                <div className="absolute top-full left-0 mt-2 min-w-[180px] bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl shadow-xl z-50 p-1">
                    <div className="flex flex-col gap-1 p-1">
                        {options.map((opt) => (
                            <button
                                key={opt.value}
                                onClick={() => {
                                    onChange(opt.value);
                                    setIsOpen(false);
                                }}
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors text-left
                                    ${value === opt.value
                                        ? 'bg-blue-50 text-blue-700 font-medium dark:bg-blue-900/20 dark:text-blue-300'
                                        : 'text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-white/5'
                                    }
                                `}
                            >
                                {value === opt.value
                                    ? <CheckCircle2 size={16} className="text-blue-600 dark:text-blue-400" />
                                    : <Circle size={16} className="text-gray-300" />
                                }
                                {opt.label}
                            </button>
                        ))}
                    </div>
                    {onClear && (
                        <div className="mt-1 pt-2 border-t border-gray-100 dark:border-gray-800 flex justify-end px-3 pb-2 gap-2">
                            <button
                                onClick={() => { onClear(); setIsOpen(false); }}
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
                    )}
                </div>
            )}
        </div>
    );
}
