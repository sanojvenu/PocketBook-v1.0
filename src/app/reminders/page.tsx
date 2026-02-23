"use client";

import { format } from "date-fns";

import { Bell, Calendar, Plus, Pencil, Trash2, Filter, Search, X, CheckCircle2, LayoutGrid, List, Eye, EyeOff, ChevronDown, TrendingUp, TrendingDown, Wallet, Camera, Mic } from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { ReminderService } from "@/services/ReminderService";
import { TransactionService } from "@/services/TransactionService";
import Modal from "@/components/ui/Modal";
import AddReminderForm from "@/components/AddReminderForm";
import ConfirmModal from "@/components/ui/ConfirmModal";
import { toast } from "sonner";
import DateFilterDropdown from "@/components/ui/DateFilterDropdown";
import CustomDateModal from "@/components/ui/CustomDateModal";
import FilterDropdown from "@/components/ui/FilterDropdown";
import MultiSelectFilterDropdown from "@/components/ui/MultiSelectFilterDropdown";
import { Capacitor } from '@capacitor/core';
import { useLocalNotifications } from "@/hooks/useLocalNotifications";
import GlobalFAB from "@/components/ui/GlobalFAB";

import { SwipeableList } from 'react-swipeable-list';
import SwipeableReminderCard from "@/components/SwipeableReminderCard";

interface ReminderSummaryProps {
    totalPay: number;
    totalCollect: number;
}

const ReminderSummaryCards: React.FC<ReminderSummaryProps> = ({ totalPay, totalCollect }) => {
    return (
        <div className="grid grid-cols-2 gap-2 md:grid-cols-2 md:gap-4 mb-4 md:mb-6">
            {/* Collect Card */}
            <div className="bg-white dark:bg-gray-800 p-2 md:p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col md:flex-row items-center md:items-center justify-between">
                <div className="text-center md:text-left">
                    <p className="text-gray-500 text-[10px] md:text-xs font-bold uppercase mb-0.5 md:mb-1 truncate">Total Collect</p>
                    <h3 className="text-sm md:text-2xl font-bold text-emerald-500 truncate w-full">
                        + ₹{totalCollect.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                    </h3>
                </div>
                <div className="hidden md:block p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-full text-emerald-600 dark:text-emerald-400">
                    <TrendingUp size={24} />
                </div>
            </div>

            {/* Pay Card */}
            <div className="bg-white dark:bg-gray-800 p-2 md:p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col md:flex-row items-center md:items-center justify-between">
                <div className="text-center md:text-left">
                    <p className="text-gray-500 text-[10px] md:text-xs font-bold uppercase mb-0.5 md:mb-1 truncate">Total Pay</p>
                    <h3 className="text-sm md:text-2xl font-bold text-rose-500 truncate w-full">
                        - ₹{totalPay.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                    </h3>
                </div>
                <div className="hidden md:block p-3 bg-rose-50 dark:bg-rose-900/20 rounded-full text-rose-600 dark:text-rose-400">
                    <TrendingDown size={24} />
                </div>
            </div>
        </div>
    );
};

export default function RemindersPage() {
    const router = useRouter();
    const { user } = useAuth();
    const [reminders, setReminders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedReminder, setSelectedReminder] = useState<any>(null);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
    const [isTransactionConfirmOpen, setIsTransactionConfirmOpen] = useState(false);
    const [isBulkTransactionConfirmOpen, setIsBulkTransactionConfirmOpen] = useState(false);
    const [reminderToComplete, setReminderToComplete] = useState<any>(null);

    // Filters
    const [filterStatus, setFilterStatus] = useState("upcoming");
    const [searchText, setSearchText] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [durationLabel, setDurationLabel] = useState("All Time");
    const [isCustomDateOpen, setIsCustomDateOpen] = useState(false);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [showCompleted, setShowCompleted] = useState(false);
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const { requestPermissions, scheduleNotification, cancelNotification } = useLocalNotifications();
    const [isNative, setIsNative] = useState(false);

    useEffect(() => {
        setIsNative(Capacitor.isNativePlatform());
        if (Capacitor.isNativePlatform()) {
            requestPermissions();
        }
    }, [requestPermissions]);

    // Fetch Reminders
    useEffect(() => {
        if (!user) return;

        const unsubscribe = ReminderService.subscribeReminders(user.uid, (data) => {
            setReminders(data);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user]);

    // Check for add new item param
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        if (params.get('add') === 'true') {
            setIsModalOpen(true);
            router.replace('/reminders');
        }
    }, [router]);

    // ... (Computed Filtered Reminders logic stays same) ...
    const getDaysDue = (targetDate: string) => {
        const diff = new Date(targetDate).getTime() - new Date().getTime();
        const days = Math.ceil(diff / (1000 * 3600 * 24));
        if (days < 0) return `Overdue by ${Math.abs(days)} days`;
        if (days === 0) return "Due Today";
        return `in ${days} days`;
    };

    const isOverdue = (targetDate: string) => {
        const diff = new Date(targetDate).getTime() - new Date().getTime();
        return Math.ceil(diff / (1000 * 3600 * 24)) < 0;
    };

    const filteredReminders = reminders.filter(r => {
        // Hide completed if toggle is off
        if (!showCompleted && r.completed) return false;

        // Search
        if (searchText && !r.title.toLowerCase().includes(searchText.toLowerCase())) return false;

        // Status Filter
        if (filterStatus === 'overdue' && !isOverdue(r.date)) return false;
        if (filterStatus === 'upcoming' && isOverdue(r.date)) return false;

        // Date Filter
        if (r.date) {
            if (startDate && r.date < startDate) return false;
            if (endDate && r.date > endDate) return false;
        }

        // Tags Filter
        if (selectedTags.length > 0) {
            if (!r.tags || !r.tags.some((tag: string) => selectedTags.includes(tag))) return false;
        }

        return true;
    });

    const handleSaveReminder = async (data: { title: string; amount: number; date: string; time?: string; recurrence?: string; type?: 'pay' | 'collect'; tags?: string[] }) => {
        if (!user) return;

        try {
            const cleanData = {
                title: data.title,
                amount: data.amount,
                date: data.date,
                time: data.time || '',
                recurrence: data.recurrence || 'none',
                type: data.type || 'pay',
                tags: data.tags || [],
            };

            if (selectedReminder) {
                // Update
                await ReminderService.updateReminder(user.uid, selectedReminder.id, cleanData);
                // Reschedule notification
                await scheduleNotification({ id: selectedReminder.id, ...cleanData });
                toast.success("Reminder updated successfully!");
            } else {
                // Create
                const newReminderData = { ...cleanData, completed: false };
                const docId = await ReminderService.addReminder(user.uid, newReminderData);
                // Schedule notification
                await scheduleNotification({ id: docId, ...newReminderData });
                toast.success("Reminder added successfully!");
            }
            setIsModalOpen(false);
            setSelectedReminder(null);
        } catch (error) {
            console.error("Error saving reminder:", error);
            toast.error("Failed to save reminder");
        }
    };

    const handleEdit = (reminder: any) => {
        setSelectedReminder(reminder);
        setIsModalOpen(true);
    };

    const handleDelete = (id: string) => {
        setDeleteId(id);
    };

    const confirmDelete = async () => {
        if (!user || !deleteId) return;
        try {
            await ReminderService.deleteReminder(user.uid, deleteId);
            await cancelNotification(deleteId);
            toast.success("Reminder deleted!");
            setDeleteId(null);
        } catch (error) {
            console.error("Error deleting reminder", error);
            toast.error("Failed to delete reminder");
        }
    };

    const handleToggleComplete = async (reminder: any) => {
        if (reminder.completed) {
            // If already completed, just mark as incomplete (no transaction needed usually)
            await processToggleComplete(reminder, false);
        } else {
            // If marking as complete, ask for transaction
            setReminderToComplete(reminder);
            setIsTransactionConfirmOpen(true);
        }
    };

    const handleConfirmTransaction = async () => {
        if (reminderToComplete) {
            await processToggleComplete(reminderToComplete, true);
            setIsTransactionConfirmOpen(false);
            setReminderToComplete(null);
        }
    };

    const handleSkipTransaction = async () => {
        if (reminderToComplete) {
            await processToggleComplete(reminderToComplete, false);
            setIsTransactionConfirmOpen(false);
            setReminderToComplete(null);
        }
    };

    const processToggleComplete = async (reminder: any, createTransaction: boolean) => {
        if (!user) return;
        try {
            // 1. Mark current as completed
            const isCompleting = !reminder.completed;
            await ReminderService.updateReminder(user.uid, reminder.id, { completed: isCompleting });

            if (isCompleting) {
                await cancelNotification(reminder.id);
            } else {
                // Re-schedule if marked incomplete
                await scheduleNotification(reminder);
            }

            // 1.1 Create Transaction if completing AND confirmed
            if (isCompleting && createTransaction) {
                await TransactionService.addTransaction(user.uid, {
                    description: reminder.title,
                    amount: Number(reminder.amount) || 0,
                    type: reminder.type === 'collect' ? 'income' : 'expense',
                    category: 'Other',
                    date: new Date(),
                    tags: reminder.tags || ['Reminder']
                });
            }

            // 2. If it was incomplete and is recurring, create the next instance
            if (!reminder.completed && reminder.recurrence && reminder.recurrence !== 'none') {
                const current = new Date(reminder.date);
                let nextDate = new Date(current);

                switch (reminder.recurrence) {
                    case 'daily': nextDate.setDate(current.getDate() + 1); break;
                    case 'weekly': nextDate.setDate(current.getDate() + 7); break;
                    case 'monthly': nextDate.setMonth(current.getMonth() + 1); break;
                    case 'yearly': nextDate.setFullYear(current.getFullYear() + 1); break;
                }

                const nextDateStr = nextDate.toISOString().split('T')[0];
                const newReminderData = {
                    title: reminder.title,
                    amount: reminder.amount,
                    date: nextDateStr,
                    time: reminder.time || null,
                    recurrence: reminder.recurrence,
                    completed: false,
                    type: reminder.type || 'pay',
                    tags: reminder.tags || []
                };

                const newDocId = await ReminderService.addReminder(user.uid, newReminderData);
                await scheduleNotification({ id: newDocId, ...newReminderData });

                toast.success(`Marked complete! Next reminder set for ${nextDateStr}`);
            } else {
                toast.success(reminder.completed ? "Marked as incomplete" : "Marked as complete!");
            }

        } catch (error) {
            console.error("Error updating reminder", error);
            toast.error("Failed to update reminder");
        }
    };

    const handleBulkDelete = async () => {
        if (!user || selectedIds.size === 0) return;
        try {
            await ReminderService.bulkDeleteReminders(user.uid, Array.from(selectedIds));
            const batchPromises = Array.from(selectedIds).map(id => cancelNotification(id));
            await Promise.all(batchPromises);
            toast.success(`${selectedIds.size} reminders deleted!`);
            setSelectedIds(new Set());
            setIsBulkDeleteModalOpen(false);
        } catch (error) {
            console.error("Error deleting reminders", error);
            toast.error("Failed to delete reminders");
        }
    };

    const handleBulkToggleComplete = async (markAs: boolean) => {
        if (!user || selectedIds.size === 0) return;

        if (markAs) {
            // If marking as complete, show confirmation dialog
            setIsBulkTransactionConfirmOpen(true);
        } else {
            // If marking incomplete, just do it (no transactions)
            await processBulkToggleComplete(markAs, false);
        }
    };

    const handleConfirmBulkTransaction = async () => {
        await processBulkToggleComplete(true, true);
        setIsBulkTransactionConfirmOpen(false);
    };

    const handleSkipBulkTransaction = async () => {
        await processBulkToggleComplete(true, false);
        setIsBulkTransactionConfirmOpen(false);
    };

    const processBulkToggleComplete = async (markAs: boolean, createTransaction: boolean) => {
        if (!user) return;
        try {
            // Filter to find items that actually need updates
            const itemsToUpdate = reminders.filter(r => selectedIds.has(r.id) && r.completed !== markAs);

            const promises = itemsToUpdate.map(async (reminder) => {
                await ReminderService.updateReminder(user.uid, reminder.id, { completed: markAs });

                if (markAs) {
                    await cancelNotification(reminder.id);
                } else {
                    await scheduleNotification(reminder);
                }

                // Create Transaction if completing AND confirmed
                if (markAs && createTransaction) {
                    await TransactionService.addTransaction(user.uid, {
                        description: reminder.title,
                        amount: Number(reminder.amount) || 0,
                        type: reminder.type === 'collect' ? 'income' : 'expense',
                        category: 'Other',
                        date: new Date(),
                        tags: reminder.tags || ['Reminder']
                    });
                }
            });

            await Promise.all(promises);
            toast.success(`${itemsToUpdate.length} reminders updated!`);
            setSelectedIds(new Set());
        } catch (error) {
            console.error("Error updating reminders", error);
            toast.error("Failed to update reminders");
        }
    };

    const toggleSelection = (id: string) => {
        const newSelected = new Set(selectedIds);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedIds(newSelected);
    };

    const toggleSelectAll = () => {
        if (selectedIds.size === filteredReminders.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(filteredReminders.map(r => r.id)));
        }
    };

    const openNewModal = () => {
        setSelectedReminder(null);
        setIsModalOpen(true);
    };

    // Extract all unique tags
    const allTags = Array.from(new Set(reminders.flatMap(r => r.tags || []))).sort((a, b) => a.localeCompare(b));
    const tagOptions = allTags.map(tag => ({ label: tag, value: tag }));

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <h1 className="text-3xl font-bold">Reminders</h1>
                    {!isNative && (
                        <div className="bg-gray-100 dark:bg-gray-800 p-1 rounded-lg flex items-center">
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`p-1.5 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-gray-700 shadow-sm text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
                                title="Grid View"
                            >
                                <LayoutGrid size={18} />
                            </button>
                            <button
                                onClick={() => setViewMode('list')}
                                className={`p-1.5 rounded-md transition-all ${viewMode === 'list' ? 'bg-white dark:bg-gray-700 shadow-sm text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
                                title="List View"
                            >
                                <List size={18} />
                            </button>
                        </div>
                    )}
                </div>
                <button
                    onClick={openNewModal}
                    className="hidden md:flex bg-blue-600 text-white px-4 py-2 rounded-lg font-medium items-center gap-2 shadow-lg hover:bg-blue-700 transition-all w-full md:w-auto justify-center"
                >
                    <Plus size={18} /> Add Reminder
                </button>
            </div>

            {/* Filter Bar */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col md:flex-row md:items-center gap-4 transition-all duration-300">
                <button
                    onClick={() => setIsFilterOpen(!isFilterOpen)}
                    className="flex items-center gap-2 text-gray-500 w-full md:w-auto justify-between md:justify-start"
                >
                    <div className="flex items-center gap-2">
                        <Filter size={18} />
                        <span className="text-sm font-bold uppercase">Filters:</span>
                    </div>
                    <ChevronDown size={16} className={`md:hidden transition-transform duration-300 ${isFilterOpen ? 'rotate-180' : ''}`} />
                </button>

                <div className={`flex flex-col md:flex-row gap-4 flex-1 flex-wrap md:flex-nowrap transition-all duration-300 ${isFilterOpen ? 'flex opacity-100 max-h-[500px]' : 'hidden md:flex opacity-0 md:opacity-100 max-h-0 md:max-h-none overflow-hidden md:overflow-visible'}`}>
                    {/* Date Dropdown */}
                    <DateFilterDropdown
                        onApply={(start, end, label) => {
                            setStartDate(start);
                            setEndDate(end);
                            setDurationLabel(label);
                        }}
                        onCustom={() => setIsCustomDateOpen(true)}
                        currentLabel={durationLabel}
                        filterType="upcoming"
                    />

                    <div className="relative flex-1 min-w-[200px]">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            value={searchText}
                            onChange={(e) => setSearchText(e.target.value)}
                            placeholder="Search reminders..."
                            className={`w-full pl-9 p-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-transparent dark:text-white outline-none focus:border-blue-500 transition-all ${isNative ? 'pr-16' : ''}`}
                        />
                        {isNative && (
                            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1.5 bg-white dark:bg-gray-800 shadow-[0_0_10px_10px_white] dark:shadow-[0_0_10px_10px_rgba(31,41,55,1)]">
                                <button onClick={() => window.dispatchEvent(new Event('open-chat'))} className="text-gray-400 hover:text-blue-600 transition-colors" title="Scan receipt with AI">
                                    <Camera size={16} />
                                </button>
                                <button onClick={() => window.dispatchEvent(new Event('open-chat'))} className="text-gray-400 hover:text-blue-600 transition-colors" title="Use voice with AI">
                                    <Mic size={16} />
                                </button>
                            </div>
                        )}
                    </div>

                    <FilterDropdown
                        label="Status"
                        value={filterStatus}
                        onChange={setFilterStatus}
                        options={[
                            { label: "All Status", value: "all" },
                            { label: "Overdue", value: "overdue" },
                            { label: "Upcoming", value: "upcoming" }
                        ]}
                    />

                    <MultiSelectFilterDropdown
                        label="Tags"
                        options={tagOptions}
                        value={selectedTags}
                        onChange={setSelectedTags}
                        onClear={() => setSelectedTags([])}
                    />

                    <button
                        onClick={() => setShowCompleted(!showCompleted)}
                        className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all border ${showCompleted
                            ? 'bg-blue-50 text-blue-600 border-blue-200'
                            : 'bg-white dark:bg-gray-800 text-gray-500 border-gray-200 dark:border-gray-700 hover:text-gray-700'}`}
                    >
                        {showCompleted ? <Eye size={16} /> : <EyeOff size={16} />}
                        {showCompleted ? "Hide Completed" : "Show Completed"}
                    </button>

                    {(searchText || filterStatus !== 'upcoming' || startDate || endDate || showCompleted) && (
                        <button
                            onClick={() => {
                                setSearchText("");
                                setFilterStatus("upcoming");
                                setStartDate("");
                                setEndDate("");
                                setSelectedTags([]);
                                setDurationLabel("All Time");
                                setShowCompleted(false);
                            }}
                            className="text-red-500 text-xs font-bold flex items-center gap-1 hover:underline whitespace-nowrap"
                        >
                            <X size={14} /> Clear
                        </button>
                    )}
                </div>
            </div>

            {/* Summary Widgets */}
            <ReminderSummaryCards
                totalPay={filteredReminders.reduce((acc, r) => (r.type === 'pay' || !r.type) ? acc + Number(r.amount) : acc, 0)}
                totalCollect={filteredReminders.reduce((acc, r) => r.type === 'collect' ? acc + Number(r.amount) : acc, 0)}
            />

            {/* Bulk Action Bar */}
            {
                selectedIds.size > 0 && (
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 p-3 rounded-xl flex items-center justify-between animate-in fade-in slide-in-from-top-2">
                        <span className="text-sm font-bold text-blue-700 dark:text-blue-300 px-2">
                            {selectedIds.size} selected
                        </span>
                        <div className="flex gap-2">
                            <button
                                onClick={() => handleBulkToggleComplete(true)}
                                className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-2"
                            >
                                <CheckCircle2 size={14} /> Mark Complete
                            </button>
                            <button
                                onClick={() => setIsBulkDeleteModalOpen(true)}
                                className="text-white bg-red-500 hover:bg-red-600 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-2"
                            >
                                <Trash2 size={14} /> Delete Selected
                            </button>
                        </div>
                    </div>
                )
            }

            {
                viewMode === 'grid' ? (
                    <div className="space-y-2">
                        {!isNative && (
                            <div className="flex items-center gap-2 p-2 justify-end">
                                <label className="flex items-center gap-2 text-sm text-gray-500 cursor-pointer select-none">
                                    <input
                                        type="checkbox"
                                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                        checked={filteredReminders.length > 0 && selectedIds.size === filteredReminders.length}
                                        onChange={toggleSelectAll}
                                    />
                                    Select All
                                </label>
                            </div>
                        )}
                        <div>
                            {loading ? (
                                <div className="col-span-full text-center py-10 text-gray-400">Loading reminders...</div>
                            ) : filteredReminders.length === 0 ? (
                                <div className="col-span-full text-center py-10 bg-white/50 rounded-xl border border-dashed border-gray-300">
                                    <p className="text-gray-500 mb-2">No reminders match your filters.</p>
                                    <p className="text-sm text-gray-400">Try adjusting your search criteria.</p>
                                </div>
                            ) : (
                                <>
                                    {isNative ? (
                                        <>
                                            <SwipeableList>
                                                {filteredReminders.map((item) => (
                                                    <SwipeableReminderCard
                                                        key={item.id}
                                                        reminder={item}
                                                        isSelected={selectedIds.has(item.id)}
                                                        isSelectionMode={selectedIds.size > 0}
                                                        onToggleSelect={toggleSelection}
                                                        onComplete={handleToggleComplete}
                                                        onEdit={handleEdit}
                                                        onDelete={handleDelete}
                                                        getDaysDue={getDaysDue}
                                                        swipeEnabled={true}
                                                    />
                                                ))}
                                            </SwipeableList>
                                            <div className="mt-6 mb-2 text-center">
                                                <p className="text-xs font-medium text-gray-500 bg-gray-100/50 dark:bg-gray-800/50 inline-block px-4 py-2 rounded-full backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50">
                                                    Swipe Left: Complete • Swipe Right: Edit • Long Press: Select
                                                </p>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                            {filteredReminders.map((item) => (
                                                <SwipeableReminderCard
                                                    key={item.id}
                                                    reminder={item}
                                                    isSelected={selectedIds.has(item.id)}
                                                    isSelectionMode={selectedIds.size > 0}
                                                    onToggleSelect={toggleSelection}
                                                    onComplete={handleToggleComplete}
                                                    onEdit={handleEdit}
                                                    onDelete={handleDelete}
                                                    getDaysDue={getDaysDue}
                                                    swipeEnabled={false}
                                                />
                                            ))}
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                ) : (
                    /* List View */
                    <div className="glass-panel overflow-hidden flex-1 flex flex-col min-h-[500px]">
                        <div className="overflow-x-auto flex-1 custom-scrollbar">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-gray-200 dark:border-gray-700 text-gray-500 text-sm bg-gray-50/50 dark:bg-gray-800/50">
                                        <th className="py-3 px-4 w-12 text-center">
                                            <input
                                                type="checkbox"
                                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                checked={filteredReminders.length > 0 && selectedIds.size === filteredReminders.length}
                                                onChange={toggleSelectAll}
                                            />
                                        </th>
                                        <th className="py-3 px-4 font-medium">Status</th>
                                        <th className="py-3 px-4 font-medium">Title</th>
                                        <th className="py-3 px-4 font-medium">Due Date</th>
                                        <th className="py-3 px-4 font-medium">Recurrence</th>
                                        <th className="py-3 px-4 font-medium text-right">Amount</th>
                                        <th className="py-3 px-4 font-medium text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="text-sm">
                                    {loading ? (
                                        <tr><td colSpan={7} className="py-8 text-center text-gray-400">Loading...</td></tr>
                                    ) : filteredReminders.length === 0 ? (
                                        <tr><td colSpan={7} className="py-8 text-center text-gray-400">No reminders found.</td></tr>
                                    ) : (
                                        filteredReminders.map((item) => (
                                            <tr key={item.id} className={`border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${item.completed ? 'opacity-50 grayscale' : ''} ${selectedIds.has(item.id) ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}`}>
                                                <td className="py-3 px-4 text-center">
                                                    <input
                                                        type="checkbox"
                                                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                        checked={selectedIds.has(item.id)}
                                                        onChange={() => toggleSelection(item.id)}
                                                    />
                                                </td>
                                                <td className="py-3 px-4">
                                                    <button
                                                        onClick={() => handleToggleComplete(item)}
                                                        className={`p-1 rounded-full border transition-all ${item.completed
                                                            ? 'bg-green-100 text-green-600 border-green-200'
                                                            : 'bg-white border-gray-300 text-transparent hover:border-green-500 hover:text-green-500'
                                                            }`}
                                                    >
                                                        <CheckCircle2 size={16} />
                                                    </button>
                                                </td>
                                                <td className="py-3 px-4 font-medium">
                                                    <span className={item.completed ? 'line-through text-gray-400' : ''}>{item.title}</span>
                                                </td>
                                                <td className="py-3 px-4 text-gray-500">
                                                    <div className="flex flex-col">
                                                        <span>{format(new Date(item.date), "dd MMM yyyy")} {item.time && <span className="text-xs font-mono">@{item.time}</span>}</span>
                                                        <span className={`text-xs font-bold ${getDaysDue(item.date).includes('Overdue') ? 'text-red-500' : 'text-blue-500'}`}>
                                                            {item.completed ? 'Completed' : getDaysDue(item.date)}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="py-3 px-4">
                                                    {item.recurrence && item.recurrence !== 'none' ? (
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 capitalize">
                                                            {item.recurrence}
                                                        </span>
                                                    ) : (
                                                        <span className="text-gray-400 text-xs">-</span>
                                                    )}
                                                </td>
                                                <td className="py-3 px-4 text-right font-bold text-gray-700 dark:text-gray-300">
                                                    ₹ {item.amount}
                                                </td>
                                                <td className="py-3 px-4 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button
                                                            onClick={() => handleEdit(item)}
                                                            className="text-blue-600 hover:bg-blue-50 p-1.5 rounded-lg transition-colors"
                                                            title="Edit"
                                                        >
                                                            <Pencil size={16} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(item.id)}
                                                            className="text-red-600 hover:bg-red-50 p-1.5 rounded-lg transition-colors"
                                                            title="Delete"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )
            }

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={selectedReminder ? "Edit Reminder" : "Add New Reminder"}
            >
                <AddReminderForm
                    key={selectedReminder ? selectedReminder.id : 'new'}
                    onAdd={handleSaveReminder}
                    onCancel={() => setIsModalOpen(false)}
                    initialData={selectedReminder}
                />
            </Modal>

            <ConfirmModal
                isOpen={!!deleteId}
                onClose={() => setDeleteId(null)}
                onConfirm={confirmDelete}
                title="Delete Reminder"
                message="Are you sure you want to delete this reminder? This action cannot be undone."
            />

            <ConfirmModal
                isOpen={isBulkDeleteModalOpen}
                onClose={() => setIsBulkDeleteModalOpen(false)}
                onConfirm={handleBulkDelete}
                title="Delete Selected Reminders"
                message={`Are you sure you want to delete ${selectedIds.size} reminders? This action cannot be undone.`}
            />

            <Modal
                isOpen={isTransactionConfirmOpen}
                onClose={() => setIsTransactionConfirmOpen(false)}
                title="Create Transaction?"
            >
                <div className="space-y-4">
                    <p className="text-gray-600 dark:text-gray-300">
                        Do you want to add a transaction record for this reminder?
                    </p>
                    <div className="flex flex-col gap-2 pt-2">
                        <button
                            onClick={handleConfirmTransaction}
                            className="w-full px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-200 dark:shadow-none transition-colors font-bold"
                        >
                            Yes, Create Transaction
                        </button>
                        <button
                            onClick={handleSkipTransaction}
                            className="w-full px-4 py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors font-medium"
                        >
                            No, Just Mark Complete
                        </button>
                    </div>
                </div>
            </Modal>

            <Modal
                isOpen={isBulkTransactionConfirmOpen}
                onClose={() => setIsBulkTransactionConfirmOpen(false)}
                title="Create Transactions?"
            >
                <div className="space-y-4">
                    <p className="text-gray-600 dark:text-gray-300">
                        Do you want to add transaction records for these {selectedIds.size} reminders?
                    </p>
                    <div className="flex flex-col gap-2 pt-2">
                        <button
                            onClick={handleConfirmBulkTransaction}
                            className="w-full px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-200 dark:shadow-none transition-colors font-bold"
                        >
                            Yes, Create All
                        </button>
                        <button
                            onClick={handleSkipBulkTransaction}
                            className="w-full px-4 py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors font-medium"
                        >
                            No, Just Mark Complete
                        </button>
                    </div>
                </div>
            </Modal>

            <CustomDateModal
                isOpen={isCustomDateOpen}
                onClose={() => setIsCustomDateOpen(false)}
                onApply={(start, end) => {
                    setStartDate(start);
                    setEndDate(end);
                    setDurationLabel("Custom Range");
                }}
            />

            <GlobalFAB
                onAddTransaction={() => router.push('/cashbook?add=true')}
                onAddReminder={() => setIsModalOpen(true)}
                className="md:hidden"
            />
        </div >
    );
}
