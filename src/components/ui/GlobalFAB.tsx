"use client";

import { useState } from "react";
import { Plus, Bell, IndianRupee } from "lucide-react";
import Modal from "@/components/ui/Modal";
import AddTransactionForm from "@/components/AddTransactionForm";
import AddReminderForm from "@/components/AddReminderForm";

interface GlobalFABProps {
    onAddTransaction?: () => void;
    onAddReminder?: () => void;
    className?: string;
}

export default function GlobalFAB({ onAddTransaction, onAddReminder, className = "" }: GlobalFABProps) {
    const [isOpen, setIsOpen] = useState(false);

    // If modal states are not controlled externally, we handle them internally, but ideally parent controls it.
    // However, since we want a truly "Drop-in Global" FAB for any page, it's easier to just let it trigger given callbacks.

    const handleTransactionClick = () => {
        setIsOpen(false);
        if (onAddTransaction) onAddTransaction();
    };

    const handleReminderClick = () => {
        setIsOpen(false);
        if (onAddReminder) onAddReminder();
    };

    return (
        <>
            {/* Backdrop to close FAB when clicking outside */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-30"
                    onClick={() => setIsOpen(false)}
                />
            )}

            <div className={`fixed bottom-[80px] md:bottom-8 right-4 md:right-8 z-40 flex flex-col gap-3 items-end pb-safe ${className}`}>
                {/* Expanded Menu Actions */}
                <div className={`flex flex-col gap-3 origin-bottom transition-all duration-300 ease-in-out ${isOpen ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-10 scale-0 pointer-events-none'}`}>
                    <button
                        onClick={handleReminderClick}
                        className="flex items-center gap-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 shadow-lg px-4 py-2.5 rounded-full hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border border-gray-100 dark:border-gray-700"
                    >
                        <span className="text-sm font-semibold whitespace-nowrap">Add Reminder</span>
                        <Bell size={18} className="text-blue-500" />
                    </button>
                    <button
                        onClick={handleTransactionClick}
                        className="flex items-center gap-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 shadow-lg px-4 py-2.5 rounded-full hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border border-gray-100 dark:border-gray-700"
                    >
                        <span className="text-sm font-semibold whitespace-nowrap">Add Transaction</span>
                        <IndianRupee size={18} className="text-emerald-500" />
                    </button>
                </div>

                {/* Primary Main FAB Button */}
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className={`w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full flex items-center justify-center shadow-xl shadow-blue-500/30 transition-transform active:scale-95 ${isOpen ? 'rotate-45' : ''}`}
                >
                    <Plus size={28} />
                </button>
            </div>
        </>
    );
}
