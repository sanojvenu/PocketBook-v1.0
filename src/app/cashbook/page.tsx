"use client";

import { format } from "date-fns";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, Filter, Search, X, ChevronDown, Tag, Calendar, Upload, ArrowUpRight, ArrowDownRight, Camera, Mic } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { TransactionService } from "@/services/TransactionService";
import { toast } from "sonner";
import ConfirmModal from "@/components/ui/ConfirmModal";
import Modal from "@/components/ui/Modal";
import AddTransactionForm from "@/components/AddTransactionForm";
import DateFilterDropdown from "@/components/ui/DateFilterDropdown";
import CustomDateModal from "@/components/ui/CustomDateModal";
import FilterDropdown from "@/components/ui/FilterDropdown";
import MultiSelectFilterDropdown from "@/components/ui/MultiSelectFilterDropdown";
import ExportButtons from "@/components/ExportButtons";
import ImportModal from "@/components/ImportModal";
import { Capacitor } from '@capacitor/core';
import { SwipeableList } from 'react-swipeable-list';
import SwipeableTransactionCard from "@/components/SwipeableTransactionCard";
import { TrendingUp, TrendingDown, Wallet } from 'lucide-react';
import GlobalFAB from "@/components/ui/GlobalFAB";

interface SummaryCardsProps {
    income: number;
    expense: number;
    balance: number;
    durationLabel: string;
}

const SummaryCards: React.FC<SummaryCardsProps> = ({ income, expense, balance, durationLabel }) => {
    return (
        <div className="grid grid-cols-2 gap-2 md:grid-cols-3 md:gap-6">
            {/* Balance Card */}
            <div className="col-span-2 md:col-span-1 glass-panel p-2 md:p-6 relative overflow-hidden group flex flex-col justify-center">
                <div className="absolute -right-6 -top-6 w-32 h-32 bg-primary/10 rounded-full group-hover:scale-150 transition-transform duration-500 hidden md:block" />
                <div className="relative z-10 text-center md:text-left">
                    <p className="text-[10px] md:text-sm font-medium text-gray-500 dark:text-gray-400 mb-0.5 md:mb-1 uppercase md:normal-case">Balance</p>
                    <h2 className={`text-sm md:text-4xl font-bold tracking-tight truncate ${balance >= 0 ? '' : 'text-rose-600 dark:text-rose-400'}`}>
                        {balance >= 0 ? '' : '- '}₹ {Math.abs(balance).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                    </h2>
                    <div className="hidden md:flex items-center gap-2 mt-4 text-emerald-500 text-sm font-medium">
                        <TrendingUp size={16} />
                        <span>updated just now</span>
                    </div>
                </div>
            </div>

            {/* Income Card */}
            <div className="glass-card p-2 md:p-6 flex flex-col justify-center">
                <div className="hidden md:flex items-center justify-between mb-4">
                    <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg">
                        <ArrowDownRight size={24} />
                    </div>
                    <span className="px-2.5 py-1 bg-white/50 dark:bg-black/20 rounded-md text-xs font-semibold text-gray-500">
                        Cash In
                    </span>
                </div>
                <div className="text-center md:text-left">
                    <p className="md:hidden text-[10px] font-bold text-gray-500 uppercase mb-0.5 truncate">Income</p>
                    <h3 className="text-sm md:text-2xl font-bold text-emerald-600 md:text-foreground truncate">
                        + ₹{income.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                    </h3>
                    <p className="text-[10px] md:text-sm text-gray-500 mt-0.5 md:mt-1 truncate">{durationLabel}</p>
                </div>
            </div>

            {/* Expense Card */}
            <div className="glass-card p-2 md:p-6 flex flex-col justify-center">
                <div className="hidden md:flex items-center justify-between mb-4">
                    <div className="p-3 bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-lg">
                        <ArrowUpRight size={24} />
                    </div>
                    <span className="px-2.5 py-1 bg-white/50 dark:bg-black/20 rounded-md text-xs font-semibold text-gray-500">
                        Cash Out
                    </span>
                </div>
                <div className="text-center md:text-left">
                    <p className="md:hidden text-[10px] font-bold text-gray-500 uppercase mb-0.5 truncate">Expense</p>
                    <h3 className="text-sm md:text-2xl font-bold text-rose-600 md:text-foreground truncate">
                        - ₹{expense.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                    </h3>
                    <p className="text-[10px] md:text-sm text-gray-500 mt-0.5 md:mt-1 truncate">{durationLabel}</p>
                </div>
            </div>
        </div>
    );
};

export default function CashbookPage() {
    const router = useRouter();
    const { user } = useAuth();
    const [transactions, setTransactions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [searchText, setSearchText] = useState("");

    // Filters
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [filterType, setFilterType] = useState("all"); // 'all' | 'income' | 'expense'
    const [filterCategory, setFilterCategory] = useState("All");
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [isCustomDateOpen, setIsCustomDateOpen] = useState(false);
    const [durationLabel, setDurationLabel] = useState("All Time");
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [isNative, setIsNative] = useState(false);

    // Pagination
    const ITEMS_PER_PAGE = 25;
    const [currentPage, setCurrentPage] = useState(1);

    useEffect(() => {
        setIsNative(Capacitor.isNativePlatform());

        const handleOpenImport = () => setIsImportModalOpen(true);
        window.addEventListener('open-import', handleOpenImport);
        return () => window.removeEventListener('open-import', handleOpenImport);
    }, []);

    // Derived Tags
    const validTags = Array.from(new Set(transactions.flatMap(t => t.tags || []))).sort((a, b) => a.localeCompare(b));
    const tagOptions = validTags.map(tag => ({ label: tag, value: tag }));

    // Fetch Transactions
    useEffect(() => {
        if (!user) return;

        const unsubscribe = TransactionService.subscribeTransactions(user.uid, (data) => {
            setTransactions(data);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user]);

    // Check for add new item param
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        if (params.get('add') === 'true') {
            setIsModalOpen(true);
            router.replace('/cashbook');
        }
    }, [router]);

    // Computed Filtered Transactions
    const filteredTransactions = transactions.filter(t => {
        // Search
        if (searchText && !t.description.toLowerCase().includes(searchText.toLowerCase())) return false;

        // Date Filter
        if (startDate && new Date(t.date?.toDate ? t.date.toDate() : t.date) < new Date(startDate)) return false;
        if (endDate) {
            const end = new Date(endDate);
            end.setHours(23, 59, 59); // End of day
            if (new Date(t.date?.toDate ? t.date.toDate() : t.date) > end) return false;
        }

        // Type Filter
        if (filterType !== 'all' && t.type !== filterType) return false;

        // Category Filter
        if (filterCategory !== 'All' && t.category !== filterCategory) return false;

        // Tag Filter
        if (selectedTags.length > 0) {
            if (!t.tags || !t.tags.some((tag: string) => selectedTags.includes(tag))) return false;
        }

        return true;
    });

    const totalPages = Math.ceil(filteredTransactions.length / ITEMS_PER_PAGE);
    const paginatedTransactions = filteredTransactions.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

    const handleSaveTransaction = async (data: any) => {
        if (!user) return;
        try {
            // Construct precise Date object from Date + Time inputs
            let transactionDate = new Date();
            if (data.date) {
                const [y, m, d] = data.date.split('-').map(Number);
                transactionDate = new Date(y, m - 1, d);
                // If time provided, set it
                if (data.time) {
                    const [hours, minutes] = data.time.split(':').map(Number);
                    transactionDate.setHours(hours, minutes, 0, 0);
                } else {
                    const now = new Date();
                    transactionDate.setHours(now.getHours(), now.getMinutes(), now.getSeconds());
                }
            }

            // Separate the time string for easy access if needed, or just rely on the Date object
            const cleanData = {
                ...data,
                date: transactionDate,
                time: data.time || transactionDate.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
            };

            if (selectedTransaction) {
                // Update Existing
                await TransactionService.updateTransaction(user.uid, selectedTransaction.id, cleanData);
                toast.success("Transaction updated successfully!");
            } else {
                // Create New
                await TransactionService.addTransaction(user.uid, cleanData);
                toast.success("Transaction added successfully!");
            }
            setIsModalOpen(false);
            setSelectedTransaction(null);
        } catch (error) {
            console.error("Error saving transaction", error);
            toast.error("Failed to save transaction");
        }
    };

    const handleEdit = (transaction: any) => {
        // Pre-process date/time for form
        const dateObj = transaction.date?.toDate ? transaction.date.toDate() : new Date(transaction.date);
        const formattedDate = dateObj.toISOString().split('T')[0];
        const formattedTime = transaction.time || dateObj.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

        setSelectedTransaction({
            ...transaction,
            date: formattedDate,
            time: formattedTime
        });
        setIsModalOpen(true);
    };

    const handleDelete = (id: string) => {
        setDeleteId(id);
    };

    const confirmDelete = async () => {
        if (!user || !deleteId) return;
        try {
            await TransactionService.deleteTransaction(user.uid, deleteId);
            toast.success("Transaction deleted!");
            setDeleteId(null);
        } catch (error) {
            console.error("Error deleting transaction", error);
            toast.error("Failed to delete transaction");
        }
    };

    const handleBulkDelete = async () => {
        if (!user || selectedIds.size === 0) return;
        try {
            await TransactionService.bulkDeleteTransactions(user.uid, Array.from(selectedIds));
            toast.success(`${selectedIds.size} transactions deleted!`);
            setSelectedIds(new Set());
            setIsBulkDeleteModalOpen(false);
        } catch (error) {
            console.error("Error deleting transactions", error);
            toast.error("Failed to delete transactions");
        }
    };

    const handleBulkImport = async (data: any[]) => {
        if (!user) return;
        try {
            const mappedTransactions = data.map((row) => {
                let dateObj = new Date();

                // Handle Excel Date (Serial Number) or String
                if (typeof row.Date === 'number') {
                    // Excel serial date to JS Date
                    dateObj = new Date(Math.round((row.Date - 25569) * 86400 * 1000));
                } else if (typeof row.Date === 'string') {
                    // Check for DD-MM-YYYY format
                    const dmyMatch = row.Date.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
                    if (dmyMatch) {
                        // Parse DD-MM-YYYY manually
                        dateObj = new Date(Number(dmyMatch[3]), Number(dmyMatch[2]) - 1, Number(dmyMatch[1]));
                    } else {
                        // Fallback to standard parsing
                        dateObj = new Date(row.Date);
                    }
                }

                return {
                    date: dateObj,
                    description: row.Description || row.description || "Imported Transaction",
                    category: row.Category || row.category || "Other",
                    type: (row.Type || row.type || "expense").toLowerCase(),
                    amount: Number(row.Amount || row.amount || 0),
                    tags: row.Tags ? String(row.Tags).split(',').map((s: string) => s.trim()) : []
                };
            });

            await TransactionService.importTransactions(user.uid, mappedTransactions);
            toast.success(`Successfully imported ${data.length} transactions!`);
        } catch (error) {
            console.error("Bulk Import Error", error);
            toast.error("Failed to import transactions.");
            throw error; // Re-throw to be caught by modal if needed
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
        if (selectedIds.size === filteredTransactions.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(filteredTransactions.map(t => t.id)));
        }
    };

    const openNewModal = () => {
        setSelectedTransaction(null);
        setIsModalOpen(true);
    };

    const categories = ["All", "Food", "Transport", "Utilities", "Income", "Entertainment", "Shopping", "Health", "Education", "Other"];

    return (
        <div className="flex flex-col gap-4 md:min-h-[calc(100vh-10rem)]">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
                <h1 className="text-3xl font-bold">Cashbook</h1>
                <div className="hidden md:flex gap-2 w-auto">
                    <button
                        onClick={() => setIsImportModalOpen(true)}
                        className="bg-white dark:bg-gray-800 text-blue-600 border border-blue-200 dark:border-blue-700 px-4 py-2 rounded-lg font-medium flex items-center gap-2 shadow-sm hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all justify-center"
                    >
                        <Upload size={18} /> Import
                    </button>
                    <button
                        onClick={openNewModal}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 shadow-lg hover:bg-blue-700 transition-all justify-center"
                    >
                        <Plus size={18} /> Add Transaction
                    </button>
                </div>
            </div>


            {/* Filter Bar */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col md:flex-row md:items-center gap-4 shrink-0 transition-all duration-300">
                <button
                    onClick={() => setIsFilterOpen(!isFilterOpen)}
                    className="flex items-center gap-2 text-gray-500 shrink-0 w-full md:w-auto justify-between md:justify-start"
                >
                    <div className="flex items-center gap-2">
                        <Filter size={18} />
                        <span className="text-sm font-bold uppercase">Filters:</span>
                    </div>
                    <ChevronDown size={16} className={`md:hidden transition-transform duration-300 ${isFilterOpen ? 'rotate-180' : ''}`} />
                </button>

                <div className={`flex flex-col md:flex-row gap-4 items-stretch md:items-center flex-wrap transition-all duration-300 ${isFilterOpen ? 'flex opacity-100 max-h-[500px]' : 'hidden md:flex opacity-0 md:opacity-100 max-h-0 md:max-h-none overflow-hidden md:overflow-visible'}`}>
                    {/* Date Dropdown */}
                    <DateFilterDropdown
                        onApply={(start, end, label) => {
                            setStartDate(start);
                            setEndDate(end);
                            setDurationLabel(label);
                            setCurrentPage(1);
                        }}
                        onCustom={() => setIsCustomDateOpen(true)}


                        currentLabel={durationLabel}
                    />

                    <div className="relative flex-1 min-w-[200px]">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            value={searchText}
                            onChange={(e) => {
                                setSearchText(e.target.value);
                                setCurrentPage(1);
                            }}
                            placeholder="Search transactions..."
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

                    {/* Type Filter */}
                    <FilterDropdown
                        label="Types"
                        value={filterType}
                        onChange={(val) => {
                            setFilterType(val);
                            setCurrentPage(1);
                        }}
                        options={[
                            { label: "All", value: "all" },
                            { label: "Cash In", value: "income" },
                            { label: "Cash Out", value: "expense" }
                        ]}
                    />

                    {/* Category Filter */}
                    <FilterDropdown
                        label="Category"
                        value={filterCategory}
                        onChange={(val) => {
                            setFilterCategory(val);
                            setCurrentPage(1);
                        }}
                        options={categories.map(c => ({ label: c, value: c }))}
                    />

                    {/* Tag Filter */}
                    <MultiSelectFilterDropdown
                        label="Tags"
                        options={tagOptions}
                        value={selectedTags}
                        onChange={(tags) => {
                            setSelectedTags(tags);
                            setCurrentPage(1);
                        }}
                        onClear={() => {
                            setSelectedTags([]);
                            setCurrentPage(1);
                        }}
                    />

                    {/* Clear Filters */}
                    {(searchText || startDate || endDate || filterType !== 'all' || filterCategory !== 'All' || selectedTags.length > 0) && (
                        <button
                            onClick={() => {
                                setSearchText("");
                                setStartDate("");
                                setEndDate("");
                                setFilterType("all");
                                setFilterCategory("All");
                                setSelectedTags([]);
                                setDurationLabel("All Time"); // Reset duration label
                                setCurrentPage(1);
                            }}
                            className="text-red-500 text-xs font-bold flex items-center gap-1 hover:underline ml-auto"
                        >
                            <X size={14} /> Clear
                        </button>
                    )}
                </div>
            </div>

            {/* Summary Widgets */}
            <SummaryCards
                income={filteredTransactions.reduce((acc, t) => t.type === 'income' ? acc + Number(t.amount) : acc, 0)}
                expense={filteredTransactions.reduce((acc, t) => t.type === 'expense' ? acc + Number(t.amount) : acc, 0)}
                balance={filteredTransactions.reduce((acc, t) => t.type === 'income' ? acc + Number(t.amount) : acc - Number(t.amount), 0)}
                durationLabel={durationLabel}
            />

            {/* Bulk Action Bar */}
            {selectedIds.size > 0 && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 p-3 rounded-xl flex items-center justify-between animate-in fade-in slide-in-from-top-2">
                    <span className="text-sm font-bold text-blue-700 dark:text-blue-300 px-2">
                        {selectedIds.size} selected
                    </span>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setIsBulkDeleteModalOpen(true)}
                            className="text-white bg-red-500 hover:bg-red-600 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-2"
                        >
                            <Trash2 size={14} /> Delete Selected
                        </button>
                    </div>
                </div>
            )}

            {/* Stats & Export Row */}
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="text-sm text-gray-500">
                    Showing {filteredTransactions.length} transaction{filteredTransactions.length !== 1 && 's'}
                </div>
                <ExportButtons transactions={filteredTransactions} title={`PocketBook Report - ${durationLabel}`} />
            </div>

            {/* Mobile Card List - Direct Sibling */}
            <div className="block md:hidden space-y-4 pb-4">
                {loading ? (
                    <div className="text-center py-10 text-gray-400">Loading transactions...</div>
                ) : filteredTransactions.length === 0 ? (
                    <div className="text-center py-10 bg-white/50 rounded-xl border border-dashed border-gray-300">
                        <p className="text-gray-500 mb-2">No transactions match your filters.</p>
                    </div>
                ) : (
                    <>
                        <SwipeableList>
                            {filteredTransactions.map((t) => (
                                <SwipeableTransactionCard
                                    key={t.id}
                                    transaction={t}
                                    isSelected={selectedIds.has(t.id)}
                                    isSelectionMode={selectedIds.size > 0}
                                    onToggleSelect={toggleSelection}
                                    onEdit={handleEdit}
                                    onDelete={handleDelete}
                                    swipeEnabled={true}
                                />
                            ))}
                        </SwipeableList>

                        <div className="mt-6 mb-2 text-center">
                            <p className="text-xs font-medium text-gray-500 bg-gray-100/50 dark:bg-gray-800/50 inline-block px-4 py-2 rounded-full backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50">
                                Swipe Left: Delete • Swipe Right: Edit • Long Press: Select
                            </p>
                        </div>
                    </>
                )}
            </div>

            {/* Desktop Table Container */}
            <div className="hidden md:flex flex-col flex-1 min-h-[500px]">
                <div className="col-span-1 h-full w-full">
                    <div className="glass-panel p-6 h-full flex flex-col">
                        <div className="flex justify-between items-center mb-4 shrink-0">
                            <h3 className="text-xl font-bold">Transactions</h3>
                        </div>

                        {/* Desktop Table View */}
                        <div className="flex-1 overflow-auto custom-scrollbar">
                            <table className="w-full text-left border-collapse relative">
                                <thead className="sticky top-0 bg-white dark:bg-gray-900 z-10 shadow-sm">
                                    <tr className="border-b border-gray-200 dark:border-gray-800 text-gray-500 text-sm">
                                        <th className="py-3 px-4 w-12 bg-white dark:bg-gray-900">
                                            <input
                                                type="checkbox"
                                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                checked={filteredTransactions.length > 0 && selectedIds.size === filteredTransactions.length}
                                                onChange={toggleSelectAll}
                                            />
                                        </th>
                                        <th className="py-3 px-4 font-medium bg-white dark:bg-gray-900">Date</th>
                                        <th className="py-3 px-4 font-medium bg-white dark:bg-gray-900">Description</th>
                                        <th className="py-3 px-4 font-medium bg-white dark:bg-gray-900">Category</th>
                                        <th className="py-3 px-4 font-medium text-right bg-white dark:bg-gray-900">Amount</th>
                                        <th className="py-3 px-4 font-medium text-right bg-white dark:bg-gray-900">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="text-sm">
                                    {loading ? (
                                        <tr><td colSpan={5} className="p-4 text-center">Loading...</td></tr>
                                    ) : filteredTransactions.length === 0 ? (
                                        <tr><td colSpan={5} className="p-10 text-center text-gray-400">
                                            <div className="flex flex-col items-center gap-2">
                                                <Search size={24} className="opacity-20" />
                                                <p>No transactions found matching your filters.</p>
                                            </div>
                                        </td></tr>
                                    ) : paginatedTransactions.map((t) => (
                                        <tr key={t.id} className={`group border-b border-gray-100 dark:border-gray-800/50 hover:bg-black/5 transition-colors ${selectedIds.has(t.id) ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}`}>
                                            <td className="py-3 px-4">
                                                <input
                                                    type="checkbox"
                                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                    checked={selectedIds.has(t.id)}
                                                    onChange={() => toggleSelection(t.id)}
                                                />
                                            </td>
                                            <td className="py-3 px-4 text-gray-500 whitespace-nowrap">
                                                {t.date?.toDate ? format(t.date.toDate(), "dd MMM yyyy") : format(new Date(t.date), "dd MMM yyyy")}
                                                {t.time && <span className="ml-2 text-xs font-mono">@{t.time}</span>}
                                            </td>
                                            <td className="py-3 px-4 font-medium">
                                                <div className="flex flex-col">
                                                    <span>{t.description}</span>
                                                    {t.tags && t.tags.length > 0 && (
                                                        <div className="flex flex-wrap gap-1 mt-1">
                                                            {t.tags.map((tag: string, i: number) => (
                                                                <span key={i} className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] bg-blue-50 text-blue-600 border border-blue-100">
                                                                    <Tag size={10} className="mr-0.5" />
                                                                    {tag}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="py-3 px-4"><span className="px-2 py-1 bg-gray-100 dark:bg-gray-700/50 rounded text-xs select-none">{t.category}</span></td>
                                            <td className={`py-3 px-4 text-right font-bold ${t.type === 'income' ? 'text-emerald-500' : 'text-rose-500'}`}>
                                                {t.type === 'income' ? '+' : '-'} ₹ {Number(t.amount).toFixed(2)}
                                            </td>
                                            <td className="py-3 px-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => handleEdit(t)}
                                                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                        title="Edit"
                                                    >
                                                        <Pencil size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(t.id)}
                                                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                        title="Delete"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination Controls */}
                        {totalPages > 1 && (
                            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 dark:border-gray-800 shrink-0">
                                <button
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${currentPage === 1 ? 'text-gray-400 cursor-not-allowed bg-gray-50 dark:bg-gray-800/50' : 'text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20'}`}
                                >
                                    Previous
                                </button>
                                <span className="text-sm text-gray-500">
                                    Page <span className="font-medium text-gray-900 dark:text-gray-100">{currentPage}</span> of <span className="font-medium text-gray-900 dark:text-gray-100">{totalPages}</span>
                                </span>
                                <button
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}
                                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${currentPage === totalPages ? 'text-gray-400 cursor-not-allowed bg-gray-50 dark:bg-gray-800/50' : 'text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20'}`}
                                >
                                    Next
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={selectedTransaction ? "Edit Transaction" : "Add New Transaction"}
            >
                <AddTransactionForm
                    key={selectedTransaction ? selectedTransaction.id : 'new'} // Force re-render on switch
                    onSubmit={handleSaveTransaction}
                    onCancel={() => setIsModalOpen(false)}
                    initialData={selectedTransaction}
                />
            </Modal>

            <ConfirmModal
                isOpen={!!deleteId}
                onClose={() => setDeleteId(null)}
                onConfirm={confirmDelete}
                title="Delete Transaction"
                message="Are you sure you want to delete this transaction? This action cannot be undone."
            />

            <ConfirmModal
                isOpen={isBulkDeleteModalOpen}
                onClose={() => setIsBulkDeleteModalOpen(false)}
                onConfirm={handleBulkDelete}
                title="Delete Selected Transactions"
                message={`Are you sure you want to delete ${selectedIds.size} transactions? This action cannot be undone.`}
            />

            <CustomDateModal
                isOpen={isCustomDateOpen}
                onClose={() => setIsCustomDateOpen(false)}
                onApply={(start, end) => {
                    setStartDate(start);
                    setEndDate(end);
                    setDurationLabel("Custom Range"); // Set label for custom range
                    setCurrentPage(1);
                }}
            />

            <ImportModal
                isOpen={isImportModalOpen}
                onClose={() => setIsImportModalOpen(false)}
                onImport={handleBulkImport}
            />

            <GlobalFAB
                onAddTransaction={() => setIsModalOpen(true)}
                onAddReminder={() => router.push('/reminders?add=true')}
                className="md:hidden"
            />
        </div >
    );
}
