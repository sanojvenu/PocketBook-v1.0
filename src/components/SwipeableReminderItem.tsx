'use client';

import React from 'react';
import {
    LeadingActions,
    SwipeableListItem,
    SwipeAction,
    TrailingActions,
} from 'react-swipeable-list';
import 'react-swipeable-list/dist/styles.css';
import { ArrowUpRight, ArrowDownRight, Bell, CheckCircle2, Pencil } from 'lucide-react';

interface Reminder {
    id: string;
    title: string;
    amount: number;
    date: string;
    recurrence: string;
    completed: boolean;
    type: 'pay' | 'collect';
    tags?: string[];
    time?: string;
}

interface SwipeableReminderItemProps {
    reminder: Reminder;
    onComplete: (reminder: Reminder) => void;
    onEdit: (reminder: Reminder) => void;
    getDaysDue: (date: string) => string;
    swipeEnabled?: boolean;
}

export default function SwipeableReminderItem({ reminder, onComplete, onEdit, getDaysDue, swipeEnabled = false }: SwipeableReminderItemProps) {
    const leadingActions = () => (
        <LeadingActions>
            <SwipeAction onClick={() => onEdit(reminder)}>
                <div className="flex items-center px-4 bg-blue-500 text-white h-full rounded-l-xl">
                    <Pencil size={24} className="mr-2" />
                    <span className="font-medium">Edit</span>
                </div>
            </SwipeAction>
        </LeadingActions>
    );

    const trailingActions = () => (
        <TrailingActions>
            <SwipeAction
                onClick={() => onComplete(reminder)}
            >
                <div className="flex items-center justify-end px-4 bg-emerald-500 text-white h-full rounded-r-xl">
                    <span className="font-medium mr-2">Complete</span>
                    <CheckCircle2 size={24} />
                </div>
            </SwipeAction>
        </TrailingActions>
    );

    if (!swipeEnabled) {
        return (
            <div className="w-full mb-2 rounded-xl overflow-hidden bg-white/40 dark:bg-white/5 border border-transparent hover:border-white/20 transition-all">
                <div className="w-full p-2 px-3 flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${reminder.type === 'collect' ? 'bg-emerald-100 text-emerald-600' : (getDaysDue(reminder.date).includes('Overdue') ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600')}`}>
                            {reminder.type === 'collect' ? <ArrowDownRight size={18} /> : (reminder.type === 'pay' ? <ArrowUpRight size={18} /> : <Bell size={18} />)}
                        </div>
                        <div className="overflow-hidden">
                            <h4 className={`font-bold text-sm truncate ${reminder.completed ? 'line-through text-gray-400' : ''}`}>{reminder.title}</h4>
                            <div className="flex items-center gap-2 text-xs truncate">
                                <span className={`font-medium shrink-0 ${getDaysDue(reminder.date).includes('Overdue') ? 'text-red-500' : 'text-blue-500'}`}>
                                    {getDaysDue(reminder.date)}
                                </span>
                                <span className="text-gray-400">•</span>
                                <span className="text-gray-500 flex items-center gap-1 truncate">
                                    {new Date(reminder.date).toLocaleDateString()}
                                    {reminder.time && <span className="font-mono ml-1">@{reminder.time}</span>}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0 ml-2">
                        {reminder.amount > 0 && (
                            <div className={`font-bold text-sm whitespace-nowrap ${reminder.type === 'collect' ? 'text-emerald-600' : 'text-rose-600'}`}>
                                {reminder.type === 'collect' ? '+' : '-'} ₹ {Number(reminder.amount).toLocaleString('en-IN')}
                            </div>
                        )}

                    </div>
                </div>
            </div>
        );
    }

    return (
        <SwipeableListItem
            leadingActions={leadingActions()}
            trailingActions={trailingActions()}
            threshold={0.25}
        >
            <div className="w-full mb-2 rounded-xl overflow-hidden bg-white/40 dark:bg-white/5 border border-transparent hover:border-white/20 transition-all">
                <div className="w-full p-2 px-3 flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${reminder.type === 'collect' ? 'bg-emerald-100 text-emerald-600' : (getDaysDue(reminder.date).includes('Overdue') ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600')}`}>
                            {reminder.type === 'collect' ? <ArrowDownRight size={18} /> : (reminder.type === 'pay' ? <ArrowUpRight size={18} /> : <Bell size={18} />)}
                        </div>
                        <div className="overflow-hidden">
                            <h4 className={`font-bold text-sm truncate ${reminder.completed ? 'line-through text-gray-400' : ''}`}>{reminder.title}</h4>
                            <div className="flex items-center gap-2 text-xs truncate">
                                <span className={`font-medium shrink-0 ${getDaysDue(reminder.date).includes('Overdue') ? 'text-red-500' : 'text-blue-500'}`}>
                                    {getDaysDue(reminder.date)}
                                </span>
                                <span className="text-gray-400">•</span>
                                <span className="text-gray-500 flex items-center gap-1 truncate">
                                    {new Date(reminder.date).toLocaleDateString()}
                                    {reminder.time && <span className="font-mono ml-1">@{reminder.time}</span>}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0 ml-2">
                        {reminder.amount > 0 && (
                            <div className={`font-bold text-sm whitespace-nowrap ${reminder.type === 'collect' ? 'text-emerald-600' : 'text-rose-600'}`}>
                                {reminder.type === 'collect' ? '+' : '-'} ₹ {Number(reminder.amount).toLocaleString('en-IN')}
                            </div>
                        )}

                    </div>
                </div>
            </div>
        </SwipeableListItem>
    );
}

