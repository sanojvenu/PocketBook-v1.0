"use client";

import { useState, useEffect } from "react";
import { Zap, Plus, Coffee, Car, ShoppingBag, Utensils, Smartphone, Home } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { TransactionService } from "@/services/TransactionService";

interface QuickAction {
    id: string;
    description: string;
    amount: number;
    category: string;
    type: 'income' | 'expense';
    count: number;
}

interface QuickActionsProps {
    onQuickAdd: (data: { description: string; amount: number; category: string; type: 'income' | 'expense' }) => Promise<void>;
}

const categoryIcons: Record<string, React.ReactNode> = {
    'Food': <Utensils size={16} />,
    'Transport': <Car size={16} />,
    'Shopping': <ShoppingBag size={16} />,
    'Coffee': <Coffee size={16} />,
    'Bills': <Smartphone size={16} />,
    'Rent': <Home size={16} />,
    'Default': <Zap size={16} />
};



export default function QuickActions({ onQuickAdd }: QuickActionsProps) {
    const { user } = useAuth();
    const [quickActions, setQuickActions] = useState<QuickAction[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) {
            setLoading(false);
            return;
        }

        // Get recent transactions to find patterns
        const unsubscribe = TransactionService.subscribeRecentTransactions(user.uid, 100, (transactions) => {

            // Find frequently used description + amount combinations
            const patternMap = new Map<string, QuickAction>();

            transactions.forEach(t => {
                const key = `${t.description?.toLowerCase()}_${t.amount}_${t.category}`;
                if (t.description && t.amount) {
                    if (patternMap.has(key)) {
                        patternMap.get(key)!.count++;
                    } else {
                        patternMap.set(key, {
                            id: key,
                            description: t.description,
                            amount: Number(t.amount),
                            category: t.category || 'Other',
                            type: t.type || 'expense',
                            count: 1
                        });
                    }
                }
            });

            // Get top 5 most frequent patterns
            const sorted = Array.from(patternMap.values())
                .filter(a => a.count >= 2) // At least used twice
                .sort((a, b) => b.count - a.count)
                .slice(0, 5);

            setQuickActions(sorted);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user]);

    const handleQuickAdd = async (action: QuickAction) => {
        await onQuickAdd({
            description: action.description,
            amount: action.amount,
            category: action.category,
            type: action.type
        });
    };

    if (loading) {
        return (
            <div className="flex gap-2 overflow-x-auto pb-2">
                {[1, 2, 3].map(i => (
                    <div key={i} className="h-10 w-32 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse flex-shrink-0" />
                ))}
            </div>
        );
    }

    if (quickActions.length === 0) {
        // Default Quick Actions if no patterns found
        const defaults: QuickAction[] = [
            { id: 'def1', description: 'Coffee', amount: 50, category: 'Coffee', type: 'expense', count: 0 },
            { id: 'def2', description: 'Lunch', amount: 150, category: 'Food', type: 'expense', count: 0 },
            { id: 'def3', description: 'Petrol', amount: 500, category: 'Transport', type: 'expense', count: 0 },
            { id: 'def4', description: 'Groceries', amount: 1000, category: 'Shopping', type: 'expense', count: 0 },
        ];

        return (
            <div className="space-y-2">
                <div className="flex items-center gap-2">
                    <Zap size={16} className="text-amber-500" />
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Quick Add (Suggestions)</span>
                </div>
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                    {defaults.map((action) => (
                        <button
                            key={action.id}
                            onClick={() => handleQuickAdd(action)}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all hover:scale-105 active:scale-95 flex-shrink-0 ${action.type === 'expense'
                                ? 'bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/30'
                                : 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/30'
                                }`}
                        >
                            {categoryIcons[action.category] || categoryIcons['Default']}
                            <span className="text-sm font-medium truncate max-w-[100px]">{action.description}</span>
                            <span className="text-xs font-bold">₹{action.amount.toLocaleString('en-IN')}</span>
                        </button>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-2">
            <div className="flex items-center gap-2">
                <Zap size={16} className="text-amber-500" />
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Quick Add</span>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {quickActions.map((action) => (
                    <button
                        key={action.id}
                        onClick={() => handleQuickAdd(action)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all hover:scale-105 active:scale-95 flex-shrink-0 ${action.type === 'expense'
                            ? 'bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/30'
                            : 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/30'
                            }`}
                    >
                        {categoryIcons[action.category] || categoryIcons['Default']}
                        <span className="text-sm font-medium truncate max-w-[100px]">{action.description}</span>
                        <span className="text-xs font-bold">₹{action.amount.toLocaleString('en-IN')}</span>
                    </button>
                ))}
            </div>
        </div>
    );
}
