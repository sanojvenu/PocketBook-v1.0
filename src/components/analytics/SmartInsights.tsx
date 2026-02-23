"use client";

import { useMemo, useState } from "react";
import { TrendingUp, TrendingDown, Lightbulb, AlertTriangle, Target, Sparkles, Loader2, Bot } from "lucide-react";
import { aiService } from "@/lib/aiService";

interface Transaction {
    id: string;
    amount: number;
    type: 'income' | 'expense';
    tags: string[];
    date: any;
    category?: string;
    description?: string;
}

interface SmartInsightsProps {
    transactions: Transaction[];
}

interface Insight {
    type: 'positive' | 'warning' | 'neutral' | 'tip';
    icon: React.ReactNode;
    title: string;
    description: string;
}

export default function SmartInsights({ transactions }: SmartInsightsProps) {
    const [loading, setLoading] = useState(false);
    const [aiInsight, setAiInsight] = useState<{ title: string; description: string } | null>(null);

    const handleGenerateInsights = async () => {
        setLoading(true);
        try {
            // Send last 30 transactions for analysis
            const recentTxns = transactions.slice(0, 30).map(t => ({
                amount: t.amount,
                type: t.type,
                category: t.category,
                date: t.date?.toDate ? t.date.toDate().toISOString().split('T')[0] : t.date,
                description: t.description
            }));

            const prompt = `Analyze these recent transactions and provide a short, helpful financial insight or tip in the 'message' field. Focus on spending habits or savings. Data: ${JSON.stringify(recentTxns)}`;

            const parsed = await aiService.chatWithGemini(prompt, []);

            if (parsed) {
                if (parsed.type === 'insight' && parsed.message) {
                    setAiInsight({ title: "AI Analysis", description: parsed.message });
                } else if (parsed.message) {
                    setAiInsight({ title: "AI Analysis", description: parsed.message });
                } else {
                    setAiInsight({ title: "AI Analysis", description: "Spending looks stable based on recent activity." });
                }
            }
        } catch (e) {
            console.error("AI Insight Error", e);
        } finally {
            setLoading(false);
        }
    };

    const insights = useMemo(() => {
        const results: Insight[] = [];

        if (transactions.length < 5) {
            return [{
                type: 'neutral' as const,
                icon: <Sparkles size={18} />,
                title: "Getting Started",
                description: "Add more transactions to unlock personalized insights and tips."
            }];
        }

        // Get current and previous month data
        const now = new Date();
        const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const previousMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

        const getDateFromTransaction = (t: Transaction): Date | null => {
            if (t.date?.toDate) return t.date.toDate();
            if (typeof t.date === 'string') return new Date(t.date);
            return null;
        };

        const currentMonthTxns = transactions.filter(t => {
            const date = getDateFromTransaction(t);
            return date && date >= currentMonthStart;
        });

        const previousMonthTxns = transactions.filter(t => {
            const date = getDateFromTransaction(t);
            return date && date >= previousMonthStart && date <= previousMonthEnd;
        });

        // Calculate totals
        const currentExpenses = currentMonthTxns
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + Number(t.amount || 0), 0);

        const previousExpenses = previousMonthTxns
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + Number(t.amount || 0), 0);

        const currentIncome = currentMonthTxns
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + Number(t.amount || 0), 0);

        const previousIncome = previousMonthTxns
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + Number(t.amount || 0), 0);

        // Spending comparison
        if (previousExpenses > 0) {
            const expenseChange = ((currentExpenses - previousExpenses) / previousExpenses * 100).toFixed(0);
            const changeNum = parseFloat(expenseChange);

            if (changeNum < -10) {
                results.push({
                    type: 'positive',
                    icon: <TrendingDown size={18} />,
                    title: `Spending Down ${Math.abs(changeNum)}%`,
                    description: `Great job! You've spent ₹${(previousExpenses - currentExpenses).toLocaleString('en-IN')} less than last month.`
                });
            } else if (changeNum > 20) {
                results.push({
                    type: 'warning',
                    icon: <TrendingUp size={18} />,
                    title: `Spending Up ${changeNum}%`,
                    description: `Your expenses are higher than last month. Consider reviewing discretionary spending.`
                });
            }
        }

        // Savings rate
        if (currentIncome > 0) {
            const savingsRate = ((currentIncome - currentExpenses) / currentIncome * 100).toFixed(0);
            const rate = parseFloat(savingsRate);

            if (rate >= 20) {
                results.push({
                    type: 'positive',
                    icon: <Target size={18} />,
                    title: `${savingsRate}% Savings Rate`,
                    description: `Excellent! You're saving more than 20% of your income.`
                });
            } else if (rate < 10 && rate >= 0) {
                results.push({
                    type: 'warning',
                    icon: <AlertTriangle size={18} />,
                    title: `Low Savings Rate`,
                    description: `Try to save at least 20% of your income for financial security.`
                });
            } else if (rate < 0) {
                results.push({
                    type: 'warning',
                    icon: <AlertTriangle size={18} />,
                    title: `Spending Exceeds Income`,
                    description: `You're spending more than you earn this month. Review your expenses.`
                });
            }
        }

        // Top spending category
        const categoryMap = new Map<string, number>();
        currentMonthTxns
            .filter(t => t.type === 'expense')
            .forEach(t => {
                const cat = t.category || 'Other';
                categoryMap.set(cat, (categoryMap.get(cat) || 0) + Number(t.amount || 0));
            });

        const sortedCategories = Array.from(categoryMap.entries())
            .sort((a, b) => b[1] - a[1]);

        if (sortedCategories.length > 0) {
            const topCategory = sortedCategories[0];
            const percentage = currentExpenses > 0
                ? ((topCategory[1] / currentExpenses) * 100).toFixed(0)
                : 0;

            results.push({
                type: 'neutral',
                icon: <Lightbulb size={18} />,
                title: `${topCategory[0]} = ${percentage}% of Spending`,
                description: `Your biggest expense category this month is ${topCategory[0]} (₹${topCategory[1].toLocaleString('en-IN')}).`
            });
        }

        // Add a tip if we have few insights
        if (results.length < 2) {
            results.push({
                type: 'tip',
                icon: <Lightbulb size={18} />,
                title: "Pro Tip",
                description: "Tag your transactions to track spending patterns across projects or goals."
            });
        }

        return results.slice(0, 3);
    }, [transactions]);

    if (insights.length === 0) return null;

    const getColors = (type: Insight['type']) => {
        switch (type) {
            case 'positive':
                return 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400';
            case 'warning':
                return 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400';
            case 'tip':
                return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400';
            default:
                return 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300';
        }
    };

    return (
        <div className="glass-panel p-4 md:p-6 w-full min-w-0">
            <div className="flex items-center gap-2 mb-4">
                <Sparkles className="text-blue-500" size={20} />
                <h3 className="text-lg font-bold">Smart Insights</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {insights.map((insight, index) => (
                    <div
                        key={index}
                        className={`p-4 rounded-xl border ${getColors(insight.type)} transition-all hover:scale-[1.02]`}
                    >
                        <div className="flex items-center gap-2 mb-2">
                            {insight.icon}
                            <span className="font-semibold text-sm">{insight.title}</span>
                        </div>
                        <p className="text-xs opacity-80">{insight.description}</p>
                    </div>
                ))}
            </div>

            {!aiInsight && (
                <div className="mt-4 flex justify-end">
                    <button
                        onClick={handleGenerateInsights}
                        disabled={loading}
                        className="flex items-center gap-2 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 px-3 py-2 rounded-lg transition-colors border border-blue-100"
                    >
                        {loading ? <Loader2 size={14} className="animate-spin" /> : <Bot size={14} />}
                        {loading ? "Analyzing..." : "Analyze with AI"}
                    </button>
                </div>
            )}

            {aiInsight && (
                <div className="mt-4 p-4 rounded-xl border border-blue-200 bg-blue-50/50 dark:bg-blue-900/10 animate-in fade-in slide-in-from-bottom-2">
                    <div className="flex items-center gap-2 mb-2 text-blue-700 dark:text-blue-400">
                        <Bot size={18} />
                        <span className="font-bold text-sm">{aiInsight.title}</span>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap break-words">{aiInsight.description}</p>
                </div>
            )}
        </div>
    );
}
