"use client";

import { useState, useRef, useEffect } from 'react';
import { toast } from "sonner";
import { aiService } from "@/lib/aiService";
import { generateInsights, getSmartSuggestions, analyzeBudgetStatus, detectSubscriptions, simulateFinancialScenario, analyzeTrends } from "@/lib/insightsEngine";
import { useAuth } from "@/context/AuthContext";
import { Message, Transaction, Reminder } from "@/types";

// NEW DB SERVICES
import { TransactionService } from "@/services/TransactionService";
import { ReminderService } from "@/services/ReminderService";

export interface UseChatLogicProps {
    transactions: Transaction[];
    reminders: Reminder[];
    onTransaction?: (data: any) => Promise<void>; // Optional for global chat if using hook directly
    onReminder?: (data: any) => Promise<void>;
    addTransaction?: (data: any) => Promise<void>; // Support both prop styles
    addReminder?: (data: any) => Promise<void>;
    budgets?: any[];
    saveBudget?: (budget: any) => Promise<any>;
}

export function useChatLogic({ transactions, reminders, onTransaction, onReminder, addTransaction, addReminder, budgets = [], saveBudget }: UseChatLogicProps) {
    const { user } = useAuth();
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(false);
    const [lastActionItem, setLastActionItem] = useState<{ type: 'transaction' | 'reminder'; id: string } | null>(null);

    // Context management
    const conversationHistoryRef = useRef<{ role: string; content: string }[]>([]);

    const addToHistory = (role: "user" | "assistant", content: string) => {
        conversationHistoryRef.current.push({ role, content });
        // Keep history manageable
        if (conversationHistoryRef.current.length > 20) {
            conversationHistoryRef.current = conversationHistoryRef.current.slice(-20);
        }
    };

    const clearHistory = () => {
        conversationHistoryRef.current = [];
        setMessages([]);
        toast.success("Conversation cleared");
    };

    // --- Helper Logic ---

    const findItem = (target: string, searchCriteria: any): { item: any; type: 'transaction' | 'reminder' } | null => {
        if (target === 'last' && lastActionItem) {
            const collection = lastActionItem.type === 'transaction' ? transactions : reminders;
            const item = collection.find(i => i.id === lastActionItem.id);
            if (item) return { item, type: lastActionItem.type };
        }

        // Search in transactions
        const txn = transactions.find(t => {
            if (searchCriteria.description && !t.description?.toLowerCase().includes(searchCriteria.description.toLowerCase())) return false;
            // Fuzzy amount match usually needed but exact for now
            if (searchCriteria.amount && t.amount !== searchCriteria.amount) return false;
            return true;
        });
        if (txn) return { item: txn, type: 'transaction' };

        // Search in reminders
        const rem = reminders.find(r => {
            if (searchCriteria.description && !r.title?.toLowerCase().includes(searchCriteria.description.toLowerCase())) return false;
            if (searchCriteria.amount && r.amount !== searchCriteria.amount) return false;
            return true;
        });
        if (rem) return { item: rem, type: 'reminder' };

        return null;
    };

    const processQuery = (data: any) => {
        const { entity, filters, operation, field, limit } = data;
        let resultText = "";

        // 1. Filter Data
        let filtered: any[] = [];
        if (entity === 'transaction') {
            filtered = transactions.filter(t => {
                const tDate = t.date?.toDate ? t.date.toDate().toISOString().split('T')[0] : (t.date instanceof Date ? t.date.toISOString().split('T')[0] : t.date);
                if (filters.startDate && tDate < filters.startDate) return false;
                if (filters.endDate && tDate > filters.endDate) return false;
                if (filters.type && t.type !== filters.type) return false;
                if (filters.category && t.category?.toLowerCase() !== filters.category.toLowerCase()) return false;
                if (filters.search) {
                    const searchLower = filters.search.toLowerCase();
                    const match = t.description?.toLowerCase().includes(searchLower) ||
                        t.tags?.some((tag: string) => tag.toLowerCase().includes(searchLower));
                    if (!match) return false;
                }
                return true;
            });
        } else if (entity === 'reminder') {
            filtered = reminders.filter(r => {
                const rDate = (r.date as any) instanceof Date ? (r.date as any).toISOString().split('T')[0] : r.date;
                if (filters.startDate && rDate < filters.startDate) return false;
                if (filters.endDate && rDate > filters.endDate) return false;
                if (filters.search) {
                    if (!r.title.toLowerCase().includes(filters.search.toLowerCase())) return false;
                }
                return true;
            });
        }

        // 2. Perform Operation
        const count = filtered.length;

        if (count === 0) {
            return "I couldn't find any matching records.";
        }

        if (operation === 'breakdown') {
            const groupBy = field === 'date' ? 'date' : 'category';
            const groups: Record<string, number> = {};
            let total = 0;

            filtered.forEach(item => {
                let key = "Other";
                if (groupBy === 'date') key = item.date?.toDate ? item.date.toDate().toISOString().split('T')[0] : (item.date instanceof Date ? item.date.toISOString().split('T')[0] : item.date);
                else key = item.category || "Other";

                const val = Number(item.amount) || 0;
                groups[key] = (groups[key] || 0) + val;
                total += val;
            });

            const items = Object.entries(groups)
                .map(([label, value]) => ({ label, value, percentage: (value / total) * 100 }))
                .sort((a, b) => b.value - a.value);

            return {
                text: `Here is the breakdown by ${groupBy}:`,
                items: items,
                totalCount: count,
                grandTotal: total
            };

        } else if (operation === 'sum' || operation === 'average') {
            const sum = filtered.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);

            if (operation === 'sum') {
                resultText = `The total amount is ₹${sum.toLocaleString('en-IN')}.`;
            } else {
                resultText = `The average amount is ₹${(sum / count).toLocaleString('en-IN', { maximumFractionDigits: 0 })}.`;
            }
        } else if (operation === 'count') {
            resultText = `I found ${count} ${entity}s matching your criteria.`;
        } else if (operation === 'list') {
            resultText = `Here are the records I found:`;
        } else {
            resultText = "I found some data.";
        }

        const resultLimit = limit || 10;
        return { text: resultText, items: filtered.slice(0, resultLimit), totalCount: count };
    };

    // --- Actions ---

    const handleEdit = async (itemId: string, itemType: 'transaction' | 'reminder', changes: any) => {
        if (!user) return false;
        try {
            if (itemType === 'transaction') {
                await TransactionService.updateTransaction(user.uid, itemId, changes);
            } else {
                await ReminderService.updateReminder(user.uid, itemId, changes);
            }
            toast.success(`${itemType} updated successfully!`);
            return true;
        } catch (error) {
            console.error("Edit error:", error);
            toast.error("Failed to update");
            return false;
        }
    };

    const handleDelete = async (itemId: string, itemType: 'transaction' | 'reminder') => {
        if (!user) return false;
        try {
            if (itemType === 'transaction') {
                await TransactionService.deleteTransaction(user.uid, itemId);
            } else {
                await ReminderService.deleteReminder(user.uid, itemId);
            }
            toast.success(`${itemType} deleted successfully!`);
            return true;
        } catch (error) {
            console.error("Delete error:", error);
            toast.error("Failed to delete");
            return false;
        }
    };

    const handleConfirmAction = async (msgId: string, data: any, type: 'transaction' | 'reminder' | 'cleanup') => {
        try {
            if (type === 'cleanup') {
                const updates = data.proposals || [];
                let count = 0;
                for (const update of updates) {
                    await handleEdit(update.id, 'transaction', { category: update.newCategory });
                    count++;
                }
                setMessages(prev => prev.map(m => m.id === msgId ? { ...m, saved: true, content: `✅ Updated ${count} transactions!`, type: "text", data: null } : m));
                return;
            }

            const amount = data.amount || 0;
            const date = data.date || new Date().toISOString().split('T')[0];
            const tags = data.tags || [];

            if (type === 'transaction') {
                const txnData = {
                    amount,
                    description: data.description || "AI Transaction",
                    category: data.category || "Other",
                    type: data.transactionType || 'expense',
                    date,
                    tags
                };
                if (addTransaction) await addTransaction(txnData);
                else if (onTransaction) await onTransaction(txnData);

            } else {
                const remData = {
                    title: data.title || "AI Reminder",
                    amount,
                    date,
                    recurrence: data.recurrence || 'none',
                    type: data.transactionType === 'income' ? 'collect' : 'pay',
                    tags
                };
                if (addReminder) await addReminder(remData);
                else if (onReminder) await onReminder(remData);
            }

            setMessages(prev => prev.map(m => {
                if (m.id === msgId) {
                    if (m.type === 'subscription') {
                        toast.success("Reminder added!");
                        // Don't close the message, just keep it. Ideally we mark the specific item as added but for now just toast.
                        return m;
                    }
                    return { ...m, saved: true, content: "✅ Saved successfully!", type: "text", data: null };
                }
                return m;
            }));

            if (type !== 'reminder') {
                setLastActionItem({ type, id: 'recent' });
            }
        } catch (e) {
            console.error(e);
            toast.error("Failed to save.");
        }
    };

    const handleConfirmEdit = async (msgId: string, itemId: string, itemType: 'transaction' | 'reminder', changes: any) => {
        const success = await handleEdit(itemId, itemType, changes);
        if (success) {
            setMessages(prev => prev.map(m => m.id === msgId ? { ...m, content: "✅ Updated successfully!", type: "text", data: null } : m));
        }
    };

    const handleConfirmDelete = async (msgId: string, itemId: string, itemType: 'transaction' | 'reminder') => {
        const success = await handleDelete(itemId, itemType);
        if (success) {
            setMessages(prev => prev.map(m => m.id === msgId ? { ...m, content: "✅ Deleted successfully!", type: "text", data: null } : m));
        }
    };


    // Proactive Budget Rescue
    useEffect(() => {
        if (loading || budgets.length === 0) return;

        const checkBudgets = () => {
            const status = analyzeBudgetStatus(budgets, transactions);
            const critical = status.find(b => b.percentage >= 90 && b.percentage < 100); // 90-99% used (if 100% probably already know)

            // Simple check to avoid spamming: only if we haven't shown a warning this session
            const warningKey = `budget_warning_${new Date().toDateString()}`;
            if (critical && !sessionStorage.getItem(warningKey)) {
                sessionStorage.setItem(warningKey, 'true');

                const remaining = critical.limit - critical.spent;
                const warningMsg: Message = {
                    id: Date.now().toString(),
                    role: 'assistant',
                    content: `⚠️ Heads up! You've used ${Math.round(critical.percentage)}% of your ${critical.category} budget with plenty of month left.`,
                    type: 'insight',
                    data: {
                        insights: [{
                            type: 'warning',
                            title: 'Budget Alert',
                            message: `You have only ₹${remaining.toLocaleString()} left for ${critical.category}.`,
                            value: `₹${remaining.toLocaleString()}`
                        }]
                    },
                    nextPrompts: ["How can I save money?", "Adjust budget", "Show spending details"]
                };
                setMessages(prev => [...prev, warningMsg]);
            }
        };

        const timer = setTimeout(checkBudgets, 2000); // Wait a bit after load
        return () => clearTimeout(timer);
    }, [transactions, budgets, loading]);

    const sendMessage = async (text: string) => {
        if (!text.trim()) return;

        const userMsg: Message = { id: Date.now().toString(), role: "user", content: text };
        setMessages(prev => [...prev, userMsg]);
        setLoading(true);
        addToHistory("user", text);

        // Client-side quick checks
        const lowerTxt = text.toLowerCase();
        if (['help', 'commands'].some(cmd => lowerTxt.includes(cmd))) {
            setTimeout(() => {
                const helpMsg: Message = {
                    id: Date.now().toString(),
                    role: "assistant",
                    content: "I can help you log transactions, analyze spending, check budgets, or set reminders.",
                    nextPrompts: getSmartSuggestions(transactions),
                    type: "text"
                };
                setMessages(prev => [...prev, helpMsg]);
                addToHistory("assistant", helpMsg.content);
                setLoading(false);
            }, 500);
            return;
        }

        try {
            // Enhanced Context: Pass a summary of recent transactions to the AI
            // We can do this by prepending to the first message or a system note, 
            // but `aiService.chatWithGemini` handles the system prompt. 
            // We should modify `aiService` to accept "contextData" or handle it here by injecting into history.

            // Let's inject it as a "system" style user message that is invisible or just part of the prompt?
            // Better: `aiService` should take `financialContext`.

            // For now, let's pass it in the history as a system context if it's the first message?
            // Actually, `aiService.chatWithGemini` takes `conversationHistory`.

            const result = await aiService.chatWithGemini(userMsg.content, conversationHistoryRef.current, { transactions, reminders });
            const nextPrompts = result.nextPrompts || [];

            let assistantMsg: Message = {
                id: Date.now().toString(),
                role: "assistant",
                content: "",
                nextPrompts
            };

            if (result.type === 'unknown') {
                assistantMsg.content = result.message || "I didn't understand that.";
                assistantMsg.type = "text";

            } else if (result.type === 'greeting') {
                assistantMsg.content = result.message || "Hello! I'm PocketBook AI. How can I help you with your finances today?";
                assistantMsg.type = "text";

            } else if (result.type === 'query') {
                const queryResult = processQuery(result);
                if (typeof queryResult === 'string') {
                    assistantMsg.content = queryResult;
                    assistantMsg.type = "text";
                } else {
                    const isBreakdown = result.operation === 'breakdown';
                    assistantMsg.content = queryResult.text;
                    assistantMsg.type = isBreakdown ? "breakdown" : "stats";
                    assistantMsg.data = { items: queryResult.items, count: queryResult.totalCount, grandTotal: queryResult.grandTotal };
                }

            } else if (result.type === 'insight') {
                const insights = generateInsights(transactions);
                const trends = analyzeTrends(transactions);

                // Add trend insight if significant
                if (trends.difference > 0) {
                    insights.unshift({
                        type: trends.status === 'high' ? 'warning' : 'success',
                        title: 'Spending Trend',
                        message: `Your spending is ${trends.status === 'high' ? 'higher' : 'lower'} than your 6-month average by ₹${trends.difference.toLocaleString()}.`,
                        value: trends.current
                    });
                }

                assistantMsg.content = "Here's your financial overview:";
                assistantMsg.type = "insight";
                assistantMsg.data = { insights };

            } else if (result.type === 'budget_check') {
                const budgetStatus = analyzeBudgetStatus(budgets, transactions);
                if (result.category) {
                    const categoryBudget = budgetStatus.find(b => b.category.toLowerCase() === result.category.toLowerCase());
                    if (categoryBudget) {
                        assistantMsg.content = `Budget status for ${result.category}:`;
                        assistantMsg.data = { budgets: [categoryBudget] };
                    } else {
                        assistantMsg.content = `No budget set for ${result.category}.`;
                        assistantMsg.nextPrompts = [`Set budget for ${result.category} at 5000`];
                        assistantMsg.type = "text";
                    }
                } else {
                    assistantMsg.content = budgetStatus.length > 0 ? "Here's your budget status:" : "No budgets set yet.";
                    assistantMsg.data = { budgets: budgetStatus };
                    assistantMsg.type = "budget";
                }
                if (assistantMsg.type !== "text") assistantMsg.type = "budget";

            } else if (result.type === 'budget_set') {
                if (saveBudget) {
                    await saveBudget({
                        category: result.category,
                        limit: result.limit,
                        period: result.period || 'monthly'
                    });
                    assistantMsg.content = `✅ Budget set: ₹${result.limit} for ${result.category}`;
                } else {
                    assistantMsg.content = "Budget saving is not available in this view.";
                }
                assistantMsg.type = "text";

            } else if (result.type === 'edit') {
                const found = findItem(result.target, result.searchCriteria || {});
                if (found) {
                    assistantMsg.content = `Found this ${found.type}. Confirm the changes:`;
                    assistantMsg.type = "edit-confirm";
                    assistantMsg.data = { item: found.item, itemType: found.type, changes: result.changes };
                } else {
                    assistantMsg.content = "I couldn't find a matching item to edit.";
                    assistantMsg.type = "text";
                }

            } else if (result.type === 'delete') {
                const found = findItem(result.target, result.searchCriteria || {});
                if (found) {
                    assistantMsg.content = `Are you sure you want to delete this ${found.type}?`;
                    assistantMsg.type = "delete-confirm";
                    assistantMsg.data = { item: found.item, itemType: found.type };
                } else {
                    assistantMsg.content = "I couldn't find a matching item to delete.";
                    assistantMsg.type = "text";
                }

            } else if (result.type === 'subscription') {
                const candidates = detectSubscriptions(transactions);
                if (candidates.length > 0) {
                    assistantMsg.content = `I found ${candidates.length} potential subscriptions based on your history:`;
                    assistantMsg.type = "subscription";
                    assistantMsg.data = { candidates };
                } else {
                    assistantMsg.content = "I clearly analyzed your transaction history but couldn't find any obvious recurring subscriptions.";
                    assistantMsg.type = "text";
                }

            } else if (result.type === 'cleanup_categories') {
                const uncategorized = transactions.filter(t => !t.category || t.category === 'Other').slice(0, 10); // Limit to 10 for now
                if (uncategorized.length > 0) {
                    const suggestions = await aiService.suggestCategories(uncategorized.map(t => ({ id: t.id, description: t.description || 'Unknown', amount: t.amount })));

                    if (suggestions.length > 0) {
                        const proposals = suggestions.map(s => {
                            const original = uncategorized.find(u => u.id === s.id);
                            return {
                                id: s.id,
                                description: original?.description,
                                amount: original?.amount,
                                currentCategory: original?.category || 'Other',
                                newCategory: s.category
                            };
                        });

                        assistantMsg.content = `I found ${proposals.length} transactions that could use better categories. Review them below:`;
                        assistantMsg.type = "category-cleanup";
                        assistantMsg.data = { proposals };
                    } else {
                        assistantMsg.content = "I couldn't generate any better categories for your 'Other' transactions.";
                        assistantMsg.type = "text";
                    }
                } else {
                    assistantMsg.content = "Great news! You don't have any uncategorized transactions.";
                    assistantMsg.type = "text";
                }

            } else if (result.type === 'scenario_simulation') {
                const simulation = simulateFinancialScenario(
                    transactions,
                    {
                        type: result.scenario_type || 'one_time',
                        amount: result.amount || 0,
                        title: result.title
                    },
                    reminders
                );

                assistantMsg.content = simulation.message;
                assistantMsg.type = "scenario-simulation";
                assistantMsg.data = simulation;

            } else if (result.type === 'chart') {
                assistantMsg.content = `Here is the chart you requested:`;
                assistantMsg.type = "chart";
                assistantMsg.data = {
                    title: result.title,
                    chartData: result.chartData
                };

            } else if (result.type === 'action-card') {
                assistantMsg.content = ""; // Card can speak for itself
                assistantMsg.type = "action-card";
                assistantMsg.data = result;

            } else {
                // Transaction or Reminder Intent
                assistantMsg.content = result.type === 'reminder' ? "I've drafted a reminder for you." : "I've prepared a transaction.";
                assistantMsg.type = result.type === 'reminder' ? "confirmation-reminder" : "confirmation-transaction";
                assistantMsg.data = result;
            }

            setMessages(prev => [...prev, assistantMsg]);
            addToHistory("assistant", assistantMsg.content);

        } catch (e: any) {
            console.error(e);
            setMessages(prev => [...prev, { id: Date.now().toString(), role: "system", content: "Sorry, I encountered an error." }]);
        } finally {
            setLoading(false);
        }
    };

    return {
        messages,
        loading,
        sendMessage,
        setMessages,
        clearHistory,
        handleConfirmAction,
        handleConfirmEdit,
        handleConfirmDelete
    };
}
