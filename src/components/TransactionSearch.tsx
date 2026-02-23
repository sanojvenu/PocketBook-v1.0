"use client";

import { useState, useEffect, useMemo } from "react";
import { Search, X, SlidersHorizontal, ChevronDown } from "lucide-react";

interface Transaction {
    id: string;
    amount: number;
    type: 'income' | 'expense';
    tags: string[];
    date: any;
    category?: string;
    description?: string;
}

interface TransactionSearchProps {
    transactions: Transaction[];
    onFilteredChange: (filtered: Transaction[]) => void;
    categories: string[];
}

export default function TransactionSearch({ transactions, onFilteredChange, categories }: TransactionSearchProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const [showFilters, setShowFilters] = useState(false);
    const [minAmount, setMinAmount] = useState("");
    const [maxAmount, setMaxAmount] = useState("");
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
    const [selectedType, setSelectedType] = useState<'all' | 'income' | 'expense'>('all');

    // Debounced search
    const [debouncedQuery, setDebouncedQuery] = useState("");

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedQuery(searchQuery);
        }, 300);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    // Filter transactions
    const filteredTransactions = useMemo(() => {
        return transactions.filter(t => {
            // Text search
            if (debouncedQuery) {
                const query = debouncedQuery.toLowerCase();
                const matchesDescription = t.description?.toLowerCase().includes(query);
                const matchesCategory = t.category?.toLowerCase().includes(query);
                const matchesTags = t.tags?.some(tag => tag.toLowerCase().includes(query));
                if (!matchesDescription && !matchesCategory && !matchesTags) return false;
            }

            // Amount filter
            const amount = Number(t.amount) || 0;
            if (minAmount && amount < parseFloat(minAmount)) return false;
            if (maxAmount && amount > parseFloat(maxAmount)) return false;

            // Category filter
            if (selectedCategories.length > 0 && !selectedCategories.includes(t.category || 'Other')) {
                return false;
            }

            // Type filter
            if (selectedType !== 'all' && t.type !== selectedType) return false;

            return true;
        });
    }, [transactions, debouncedQuery, minAmount, maxAmount, selectedCategories, selectedType]);

    // Notify parent of filtered results
    useEffect(() => {
        onFilteredChange(filteredTransactions);
    }, [filteredTransactions, onFilteredChange]);

    const hasActiveFilters = minAmount || maxAmount || selectedCategories.length > 0 || selectedType !== 'all';

    const clearFilters = () => {
        setSearchQuery("");
        setMinAmount("");
        setMaxAmount("");
        setSelectedCategories([]);
        setSelectedType('all');
    };

    const toggleCategory = (cat: string) => {
        setSelectedCategories(prev =>
            prev.includes(cat)
                ? prev.filter(c => c !== cat)
                : [...prev, cat]
        );
    };

    return (
        <div className="space-y-3">
            {/* Search Bar */}
            <div className="flex gap-2">
                <div className="relative flex-1">
                    <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search transactions..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-10 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm"
                    />
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery("")}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                            <X size={16} />
                        </button>
                    )}
                </div>
                <button
                    onClick={() => setShowFilters(!showFilters)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all ${showFilters || hasActiveFilters
                            ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-600'
                            : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-600'
                        }`}
                >
                    <SlidersHorizontal size={18} />
                    <span className="text-sm font-medium hidden sm:inline">Filters</span>
                    {hasActiveFilters && (
                        <span className="w-5 h-5 bg-blue-600 text-white text-xs rounded-full flex items-center justify-center">
                            {(minAmount ? 1 : 0) + (maxAmount ? 1 : 0) + selectedCategories.length + (selectedType !== 'all' ? 1 : 0)}
                        </span>
                    )}
                </button>
            </div>

            {/* Expanded Filters */}
            {showFilters && (
                <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 space-y-4 animate-in slide-in-from-top-2">
                    {/* Type Filter */}
                    <div>
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-2">Type</label>
                        <div className="flex gap-2">
                            {(['all', 'income', 'expense'] as const).map(type => (
                                <button
                                    key={type}
                                    onClick={() => setSelectedType(type)}
                                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${selectedType === type
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800'
                                        }`}
                                >
                                    {type === 'all' ? 'All' : type === 'income' ? 'Cash In' : 'Cash Out'}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Amount Range */}
                    <div>
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-2">Amount Range</label>
                        <div className="flex gap-2 items-center">
                            <div className="relative flex-1">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₹</span>
                                <input
                                    type="number"
                                    placeholder="Min"
                                    value={minAmount}
                                    onChange={(e) => setMinAmount(e.target.value)}
                                    className="w-full pl-7 pr-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>
                            <span className="text-gray-400">to</span>
                            <div className="relative flex-1">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₹</span>
                                <input
                                    type="number"
                                    placeholder="Max"
                                    value={maxAmount}
                                    onChange={(e) => setMaxAmount(e.target.value)}
                                    className="w-full pl-7 pr-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Category Filter */}
                    <div>
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-2">Categories</label>
                        <div className="flex flex-wrap gap-2">
                            {categories.map(cat => (
                                <button
                                    key={cat}
                                    onClick={() => toggleCategory(cat)}
                                    className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${selectedCategories.includes(cat)
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800'
                                        }`}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Clear Filters */}
                    {hasActiveFilters && (
                        <button
                            onClick={clearFilters}
                            className="text-sm text-red-500 font-medium hover:underline"
                        >
                            Clear all filters
                        </button>
                    )}
                </div>
            )}

            {/* Results Count */}
            {(searchQuery || hasActiveFilters) && (
                <p className="text-xs text-gray-500">
                    Showing {filteredTransactions.length} of {transactions.length} transactions
                </p>
            )}
        </div>
    );
}
