import React, { useState } from 'react';
import {
    LeadingActions,
    SwipeableListItem,
    SwipeAction,
    TrailingActions,
} from 'react-swipeable-list';
import 'react-swipeable-list/dist/styles.css';
import { Tag, Calendar, Pencil, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import useLongPress from '@/hooks/useLongPress';

interface Transaction {
    id: string;
    description: string;
    amount: number;
    type: 'income' | 'expense';
    category: string;
    date: any;
    time?: string;
    tags?: string[];
}

interface SwipeableTransactionCardProps {
    transaction: Transaction;
    isSelected: boolean;
    onToggleSelect: (id: string) => void;
    onEdit: (transaction: Transaction) => void;
    onDelete: (id: string) => void;
    isSelectionMode: boolean;
    swipeEnabled?: boolean;
}

export default function SwipeableTransactionCard({
    transaction,
    isSelected,
    onToggleSelect,
    onEdit,
    onDelete,
    isSelectionMode,
    swipeEnabled = false
}: SwipeableTransactionCardProps) {

    // Long press handlers
    const longPressProps = useLongPress(
        () => {
            // Vibrate if available (native only)
            if (typeof navigator !== 'undefined' && navigator.vibrate) {
                navigator.vibrate(50);
            }
            onToggleSelect(transaction.id);
        },
        () => { },
        { shouldPreventDefault: false, delay: isSelectionMode ? 500 : 1000 }
    );

    const leadingActions = () => (
        <LeadingActions>
            <SwipeAction onClick={() => onEdit(transaction)}>
                <div className="flex items-center px-6 bg-blue-500 text-white h-full rounded-l-xl">
                    <Pencil size={24} className="mr-2" />
                    <span className="font-bold">Edit</span>
                </div>
            </SwipeAction>
        </LeadingActions>
    );

    const trailingActions = () => (
        <TrailingActions>
            <SwipeAction
                onClick={() => onDelete(transaction.id)}
            >
                <div className="flex items-center justify-end px-6 bg-red-500 text-white h-full rounded-r-xl">
                    <span className="font-bold mr-2">Delete</span>
                    <Trash2 size={24} />
                </div>
            </SwipeAction>
        </TrailingActions>
    );

    // Standard Web Layout (Reverted from optimized mobile view)
    const cardContent = (
        <div
            {...longPressProps}
            className={`w-full glass-panel p-3 border-l-4 ${transaction.type === 'income' ? 'border-l-emerald-500' : 'border-l-rose-500'} relative group transition-all duration-200 mb-3 select-none
            ${isSelected ? '!bg-blue-100 !dark:bg-blue-900/40 ring-2 ring-blue-500 z-10' : ''}`}
        >
            <div className="flex justify-between items-start mb-2">
                <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${transaction.type === 'income' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                        <Tag size={18} />
                    </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                    <span className="px-2 py-0.5 text-xs font-bold rounded bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-300">
                        {transaction.category}
                    </span>
                </div>
            </div>

            <div>
                <div className="flex justify-between items-start gap-4">
                    <h3 className="font-bold text-base mb-1 flex-1 break-words">{transaction.description}</h3>
                    <h4 className={`text-lg font-bold whitespace-nowrap ${transaction.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {transaction.type === 'income' ? '+' : '-'} ₹ {Number(transaction.amount).toFixed(2)}
                    </h4>
                </div>

                <div className="mt-2 flex items-center text-xs text-gray-500">
                    <Calendar size={12} className="mr-2" />
                    {transaction.date?.toDate ? format(transaction.date.toDate(), "dd MMM yyyy") : format(new Date(transaction.date), "dd MMM yyyy")}
                    {transaction.time && <span className="ml-2 font-mono">@{transaction.time}</span>}
                </div>

                {transaction.tags && transaction.tags.length > 0 && (
                    <div className="flex gap-2 flex-wrap mt-2">
                        {transaction.tags.map((tag: string, i: number) => (
                            <span key={i} className="bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-300 px-2 py-0.5 rounded text-xs">
                                #{tag}
                            </span>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );

    if (!swipeEnabled) {
        return cardContent;
    }

    return (
        <SwipeableListItem
            leadingActions={leadingActions()}
            trailingActions={trailingActions()}
            threshold={0.25}
        >
            {cardContent}
        </SwipeableListItem>
    );
}
