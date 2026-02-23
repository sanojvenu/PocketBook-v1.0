import React, { useState } from 'react';
import {
    LeadingActions,
    SwipeableListItem,
    SwipeAction,
    TrailingActions,
} from 'react-swipeable-list';
import 'react-swipeable-list/dist/styles.css';
import { Bell, Calendar, CheckCircle2, Pencil, Trash2, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { format } from 'date-fns';
import useLongPress from '@/hooks/useLongPress';

interface Reminder {
    id: string;
    title: string;
    amount: number;
    date: string;
    completed: boolean;
    type: 'pay' | 'collect';
    recurrence?: string;
    time?: string;
    tags?: string[];
}

interface SwipeableReminderCardProps {
    reminder: Reminder;
    isSelected: boolean;
    onToggleSelect: (id: string) => void;
    onComplete: (reminder: Reminder) => void;
    onEdit: (reminder: Reminder) => void;
    onDelete: (id: string) => void;
    getDaysDue: (date: string) => string;
    isSelectionMode: boolean;
    swipeEnabled?: boolean;
}

export default function SwipeableReminderCard({
    reminder,
    isSelected,
    onToggleSelect,
    onComplete,
    onEdit,
    onDelete,
    getDaysDue,
    isSelectionMode,
    swipeEnabled = false
}: SwipeableReminderCardProps) {

    // Long press handlers
    const longPressProps = useLongPress(
        () => {
            if (typeof navigator !== 'undefined' && navigator.vibrate) {
                navigator.vibrate(50);
            }
            onToggleSelect(reminder.id);
        },
        () => { },
        { shouldPreventDefault: false, delay: isSelectionMode ? 500 : 1000 }
    );

    const leadingActions = () => (
        <LeadingActions>
            <SwipeAction onClick={() => onEdit(reminder)}>
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
                onClick={() => onComplete(reminder)}
            >
                <div className="flex items-center justify-end px-6 bg-emerald-500 text-white h-full rounded-r-xl">
                    <span className="font-bold mr-2">Complete</span>
                    <CheckCircle2 size={24} />
                </div>
            </SwipeAction>
        </TrailingActions>
    );

    const cardContent = (
        <div
            {...longPressProps}
            className={`w-full glass-panel p-2 border-l-4 border-l-primary relative group hover:-translate-y-1 transition-transform select-none mb-2
            ${isSelected ? '!bg-blue-100 !dark:bg-blue-900/40 ring-2 ring-blue-500 z-10' : ''}`}
        >
            <div className="flex justify-between items-start mb-2">
                <div className="flex items-start gap-2">
                    <div className={`p-1.5 rounded-lg ${reminder.completed ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'}`}>
                        {reminder.completed ? <CheckCircle2 size={16} /> : <Bell size={16} />}
                    </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                    <span className={`px-2 py-0.5 text-[10px] font-bold rounded ${reminder.completed ? 'bg-green-100 text-green-600' : getDaysDue(reminder.date).includes('Overdue') ? 'bg-red-100 text-red-600' : 'bg-primary/10 text-primary'}`}>
                        {reminder.completed ? 'Completed' : getDaysDue(reminder.date)}
                    </span>

                    {/* Desktop Actions - Visible only on md/lg, hidden on mobile to encourage swipe */}
                    <div className="hidden md:flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                            onClick={(e) => { e.stopPropagation(); onComplete(reminder); }}
                            className={`p-1 rounded-lg transition-colors ${reminder.completed ? 'text-green-600 hover:bg-green-50' : 'text-gray-400 hover:bg-gray-100 hover:text-green-600'}`}
                            title={reminder.completed ? "Mark Incomplete" : "Mark Complete"}
                        >
                            <CheckCircle2 size={14} />
                        </button>
                        <button
                            onClick={(e) => { e.stopPropagation(); onEdit(reminder); }}
                            className="p-1 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit"
                        >
                            <Pencil size={14} />
                        </button>
                        <button
                            onClick={(e) => { e.stopPropagation(); onDelete(reminder.id); }}
                            className="p-1 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete"
                        >
                            <Trash2 size={14} />
                        </button>
                    </div>

                    {/* Mobile Delete - Always visible since Swipe doesn't cover Delete */}
                    <div className="md:hidden">
                        <button
                            onClick={(e) => { e.stopPropagation(); onDelete(reminder.id); }}
                            className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                            title="Delete"
                        >
                            <Trash2 size={14} />
                        </button>
                    </div>
                </div>
            </div>

            <div className={reminder.completed ? 'opacity-50 grayscale' : ''}>
                <div className="flex justify-between items-start gap-3">
                    <h3 className={`font-bold text-sm mb-1 flex-1 break-words ${reminder.completed ? 'line-through text-gray-500' : ''}`}>
                        {reminder.title}
                    </h3>
                    <h4 className={`text-base font-bold whitespace-nowrap ${reminder.type === 'collect' ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {reminder.type === 'collect' ? '+' : '-'} ₹ {reminder.amount}
                    </h4>
                </div>

                <div className="mt-2 flex items-center text-xs text-gray-500 border-t pt-2 border-gray-100 dark:border-gray-800">
                    <Calendar size={12} className="mr-1.5" />
                    {new Date(reminder.date).toLocaleDateString() && format(new Date(reminder.date), "dd MMM yyyy")}
                    {reminder.time && <span className="ml-1.5 font-mono">@{reminder.time}</span>}
                    {reminder.recurrence && reminder.recurrence !== 'none' && (
                        <span className="ml-auto text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded-full capitalize">
                            {reminder.recurrence}
                        </span>
                    )}
                </div>
                {reminder.tags && reminder.tags.length > 0 && (
                    <div className="flex gap-1 flex-wrap mt-1.5">
                        {reminder.tags?.map((tag: string, i: number) => (
                            <span key={i} className="bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-300 px-1.5 py-0.5 rounded-[4px] text-[10px]">
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
