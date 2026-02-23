import { useState } from "react";
import dynamic from 'next/dynamic';
import { Bot, Calendar, TrendingUp, ArrowRight, PieChart as PieChartIcon, Edit3, Trash2, Sparkles, User } from "lucide-react";
import { BudgetMeter, InsightCard } from "@/components/ChatVisuals";
import { Message } from "@/types";
import { ActionCardWidget } from "./widgets/ActionCardWidget";
import { ChartWidget } from "./widgets/ChartWidget";
import { HealthScoreWidget } from "./widgets/HealthScoreWidget";

// Dynamically import Recharts component with SSR disabled
const SpendingBreakdownChart = dynamic(() => import('./SpendingBreakdownChart'), { ssr: false });

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];

interface ChatMessageProps {
    message: Message;
    onConfirmAction: (msgId: string, data: any, type: 'transaction' | 'reminder' | 'cleanup') => void;
    onConfirmEdit: (msgId: string, itemId: string, itemType: 'transaction' | 'reminder', changes: any) => void;
    onConfirmDelete: (msgId: string, itemId: string, itemType: 'transaction' | 'reminder') => void;
    onPromptClick: (prompt: string) => void;
    variant?: 'fullscreen' | 'compact';
}

export function ChatMessage({ message: msg, onConfirmAction, onConfirmEdit, onConfirmDelete, onPromptClick, variant = 'fullscreen' }: ChatMessageProps) {
    const [expanded, setExpanded] = useState(false);

    // Compact View Implementation
    if (variant === 'compact') {
        return (
            <div className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                <div className={`max-w-[85%] rounded-2xl p-3 text-sm ${msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-white border text-gray-700'}`}>
                    {msg.content}
                    {/* Mini Visuals */}
                    {msg.type === 'breakdown' && msg.data?.items && (
                        <div className="mt-2 space-y-2">
                            {(expanded ? msg.data.items : msg.data.items.slice(0, 3)).map((item: any, idx: number) => (
                                <div key={idx} className="space-y-0.5 animate-in slide-in-from-bottom-1">
                                    <div className="flex justify-between text-[10px] text-gray-600">
                                        <span>{item.label}</span>
                                        <span>{Math.round(item.percentage)}%</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                                        <div className="h-full bg-blue-500 rounded-full" style={{ width: `${item.percentage}%` }} />
                                    </div>
                                </div>
                            ))}
                            {msg.data.items.length > 3 && !expanded && (
                                <button
                                    onClick={() => setExpanded(true)}
                                    className="w-full text-[10px] text-blue-500 font-medium hover:underline text-center py-1 bg-blue-50/50 rounded"
                                >
                                    View {msg.data.items.length - 3} more
                                </button>
                            )}
                        </div>
                    )}
                    {msg.type === 'stats' && msg.data?.items && (
                        <div className="mt-2 space-y-1">
                            {/* Show 3 items, or all if expanded */}
                            {(expanded ? msg.data.items : msg.data.items.slice(0, 3)).map((item: any) => (
                                <div key={item.id} className="bg-gray-50 p-1.5 rounded text-xs border border-gray-100 flex justify-between gap-2">
                                    <span className="truncate flex-1 text-left">{item.description || item.title}</span>
                                    <span className="font-bold whitespace-nowrap">₹{item.amount}</span>
                                </div>
                            ))}

                            {/* More Button */}
                            {msg.data.items.length > 3 && !expanded && (
                                <button
                                    onClick={() => setExpanded(true)}
                                    className="w-full text-[10px] text-blue-500 font-medium hover:underline text-center py-1 bg-blue-50/50 rounded"
                                >
                                    View {msg.data.items.length - 3} more
                                </button>
                            )}

                            {/* Export Suggestion when expanded and long */}
                            {expanded && msg.data.items.length > 5 && (
                                <div className="p-2 bg-yellow-50 text-[10px] text-yellow-700 rounded border border-yellow-100 mt-2">
                                    Showing {msg.data.items.length} records. For a full detailed report, please use the <b>Export</b> feature in the Cashbook page.
                                </div>
                            )}
                        </div>
                    )}
                    {(msg.type === 'confirmation-transaction' || msg.type === 'confirmation-reminder') && msg.data && (
                        <div className="mt-2 bg-gray-50 border border-gray-100 rounded-xl p-3">
                            <div className="text-xs font-bold text-gray-700 mb-2 flex items-center gap-1">
                                {msg.type === 'confirmation-reminder' ? <Calendar size={14} /> : <TrendingUp size={14} />}
                                Confirm {msg.type === 'confirmation-reminder' ? 'Reminder' : 'Transaction'}
                            </div>
                            <div className="space-y-1 mb-3">
                                <div className="flex justify-between text-xs">
                                    <span className="text-gray-400">Amount</span>
                                    <span className="font-bold">₹{msg.data.amount}</span>
                                </div>
                                <div className="flex justify-between text-xs">
                                    <span className="text-gray-400">Title</span>
                                    <span className="font-medium truncate max-w-[120px]">{msg.data.description || msg.data.title}</span>
                                </div>
                            </div>
                            <button
                                onClick={() => onConfirmAction(msg.id, msg.data, msg.type === 'confirmation-transaction' ? 'transaction' : 'reminder')}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1"
                            >
                                <ArrowRight size={12} /> Log It
                            </button>
                        </div>
                    )}
                </div>
                {/* Dynamic Chips in Mini View */}
                {msg.nextPrompts && msg.nextPrompts.length > 0 && (
                    <div className="mt-2 flex flex-col gap-2 pb-1 w-full items-start">
                        {msg.nextPrompts.map((prompt, idx) => (
                            <button
                                key={idx}
                                onClick={() => onPromptClick(prompt)}
                                className="whitespace-nowrap px-2 py-1.5 bg-blue-50 text-blue-600 text-[10px] rounded-lg border border-blue-100 hover:bg-blue-100 transition-colors flex items-center gap-1 w-fit"
                            >
                                <Sparkles size={8} /> {prompt}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        );
    }

    // Full Screen View Implementation
    return (
        <div className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} animate-in slide-in-from-bottom-2`}>
            <div className={`max-w-[88%] md:max-w-[70%] rounded-2xl p-3 md:p-5 text-sm md:text-base shadow-sm ${msg.role === 'user'
                ? 'bg-blue-600 text-white rounded-br-none'
                : 'bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-bl-none'
                }`}>
                {msg.role === 'assistant' && <div className="flex items-center gap-2 text-blue-500 text-xs font-bold mb-2 uppercase tracking-wider"><Bot size={14} /> PocketBook AI</div>}
                <div className="whitespace-pre-wrap leading-relaxed">{msg.content}</div>

                {/* Confirmation Cards */}
                {(msg.type === 'confirmation-transaction' || msg.type === 'confirmation-reminder') && msg.data && (
                    <div className="mt-4 bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
                        <div className="font-bold text-gray-700 dark:text-gray-200 mb-3 flex items-center gap-2">
                            {msg.type === 'confirmation-reminder' ? <Calendar size={18} /> : <TrendingUp size={18} />}
                            Confirm {msg.type === 'confirmation-reminder' ? 'Reminder' : 'Transaction'}
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 dark:text-gray-300 mb-4">
                            <div><span className="block text-xs text-gray-400">Title/Desc</span> <span className="font-medium">{msg.data.description || msg.data.title}</span></div>
                            <div><span className="block text-xs text-gray-400">Amount</span> <span className="font-bold text-lg">₹{msg.data.amount}</span></div>
                            <div><span className="block text-xs text-gray-400">Date</span> <span>{msg.data.date}</span></div>
                            <div><span className="block text-xs text-gray-400">Category</span> <span>{msg.data.category || msg.data.recurrence || 'N/A'}</span></div>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => onConfirmAction(msg.id, msg.data, msg.type === 'confirmation-transaction' ? 'transaction' : 'reminder')}
                                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-200"
                            >
                                <ArrowRight size={16} /> Log It
                            </button>
                        </div>
                    </div>
                )}

                {/* Breakdown Visualization */}
                {msg.type === 'breakdown' && msg.data?.items && (
                    <div className="mt-4 space-y-3">
                        <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-100 dark:border-gray-700">
                            <div className="mb-4 flex justify-between items-end">
                                <h4 className="font-bold text-gray-700 dark:text-gray-200 flex items-center gap-2"><PieChartIcon size={16} /> Breakdown</h4>
                                <span className="text-xl font-bold dark:text-white">Total: ₹{msg.data.grandTotal.toLocaleString('en-IN')}</span>
                            </div>

                            {/* Chart Area */}
                            <div className="h-[200px] w-full flex justify-center items-center mb-6">
                                <SpendingBreakdownChart items={msg.data.items} />
                            </div>

                            <div className="space-y-3">
                                {msg.data.items.map((item: any, idx: number) => (
                                    <div key={idx} className="space-y-1">
                                        <div className="flex justify-between text-xs font-medium text-gray-600 dark:text-gray-400">
                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                                                <span>{item.label}</span>
                                            </div>
                                            <span>₹{item.value.toLocaleString('en-IN')} ({item.percentage.toFixed(1)}%)</span>
                                        </div>
                                        <div className="h-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                            <div
                                                className="h-full rounded-full transition-all duration-1000 ease-out"
                                                style={{ width: `${item.percentage}%`, backgroundColor: COLORS[idx % COLORS.length] }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Stats / List View */}
                {msg.type === 'stats' && msg.data?.items && (
                    <div className="mt-4 space-y-2">
                        {msg.data.items.map((item: any) => (
                            <div key={item.id} className="bg-gray-50 dark:bg-gray-900/50 p-3 rounded-lg text-sm flex justify-between items-center border border-gray-100 dark:border-gray-700">
                                <div>
                                    <div className="font-bold dark:text-gray-200">{item.description || item.title}</div>
                                    <div className="text-xs text-gray-400">{new Date(item.date?.toDate ? item.date.toDate() : item.date).toLocaleDateString()}</div>
                                </div>
                                <div className={`font-bold ${item.type === 'income' || item.type === 'collect' ? 'text-emerald-600' : 'text-rose-600'}`}>
                                    ₹{item.amount}
                                </div>
                            </div>
                        ))}
                        {msg.data.count > msg.data.items.length && <div className="text-xs text-center text-gray-400 italic mt-2">+ {msg.data.count - msg.data.items.length} more records found</div>}
                    </div>
                )}

                {/* Financial Insights */}
                {msg.type === 'insight' && msg.data?.insights && (
                    <div className="mt-4 space-y-3">
                        {msg.data.insights.map((insight: any, idx: number) => (
                            <InsightCard key={idx} type={insight.type} title={insight.title} message={insight.message} />
                        ))}
                    </div>
                )}

                {/* Budget Status */}
                {msg.type === 'budget' && msg.data?.budgets && msg.data.budgets.length > 0 && (
                    <div className="mt-4 space-y-3">
                        {msg.data.budgets.map((budget: any, idx: number) => (
                            <BudgetMeter
                                key={idx}
                                category={budget.category}
                                spent={budget.spent}
                                limit={budget.limit}
                            />
                        ))}
                    </div>
                )}

                {/* Rich UI Widgets */}
                {msg.type === 'chart' && msg.data && (
                    <ChartWidget
                        data={msg.data.chartData}
                        title={msg.data.title}
                    />
                )}

                {msg.type === 'action-card' && msg.data && (
                    <ActionCardWidget
                        title={msg.data.title}
                        description={msg.data.description}
                        amount={msg.data.amount}
                        type={msg.data.actionType}
                        confirmText={msg.data.confirmText}
                        cancelText={msg.data.cancelText}
                        onConfirm={() => {
                            if (msg.data.action === 'log_transaction') {
                                onConfirmAction(msg.id, msg.data.payload, 'transaction');
                            } else if (msg.data.action === 'log_reminder') {
                                onConfirmAction(msg.id, msg.data.payload, 'reminder');
                            }
                        }}
                    />
                )}

                {/* Edit Confirmation */}
                {msg.type === 'edit-confirm' && msg.data && (
                    <div className="mt-4 bg-amber-50 dark:bg-amber-900/20 p-4 rounded-xl border border-amber-200 dark:border-amber-800">
                        <div className="font-bold text-amber-800 dark:text-amber-200 mb-3 flex items-center gap-2">
                            <Edit3 size={18} />
                            Edit {msg.data.itemType}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                            <div className="mb-2">
                                <span className="text-xs text-gray-400">Current:</span>
                                <div className="font-medium">{msg.data.item.description || msg.data.item.title} - ₹{msg.data.item.amount}</div>
                            </div>
                            {msg.data.changes && (
                                <div className="bg-white dark:bg-gray-800 p-2 rounded border border-amber-200 dark:border-amber-700">
                                    <span className="text-xs text-amber-600">Changes:</span>
                                    <div className="font-medium text-amber-800 dark:text-amber-200">
                                        {Object.entries(msg.data.changes).map(([key, value]) => (
                                            <div key={key}>{key}: {String(value)}</div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => onConfirmEdit(msg.id, msg.data.item.id, msg.data.itemType, msg.data.changes)}
                                className="flex-1 bg-amber-500 hover:bg-amber-600 text-white py-2.5 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-all"
                            >
                                <Edit3 size={16} /> Confirm Edit
                            </button>
                        </div>
                    </div>
                )}

                {/* Delete Confirmation */}
                {msg.type === 'delete-confirm' && msg.data && (
                    <div className="mt-4 bg-rose-50 dark:bg-rose-900/20 p-4 rounded-xl border border-rose-200 dark:border-rose-800">
                        <div className="font-bold text-rose-800 dark:text-rose-200 mb-3 flex items-center gap-2">
                            <Trash2 size={18} />
                            Delete {msg.data.itemType}?
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-300 mb-3 bg-white dark:bg-gray-800 p-3 rounded border border-rose-200 dark:border-rose-700">
                            <div className="font-medium">{msg.data.item.description || msg.data.item.title}</div>
                            <div className="text-rose-600 font-bold">₹{msg.data.item.amount}</div>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => onConfirmDelete(msg.id, msg.data.item.id, msg.data.itemType)}
                                className="flex-1 bg-rose-500 hover:bg-rose-600 text-white py-2.5 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-all"
                            >
                                <Trash2 size={16} /> Yes, Delete
                            </button>
                        </div>
                    </div>
                )}

                {/* Subscription Detection */}
                {msg.type === 'subscription' && msg.data?.candidates && (
                    <div className="mt-4 space-y-3">
                        {msg.data.candidates.map((sub: any, idx: number) => (
                            <div key={idx} className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-xl border border-indigo-100 dark:border-indigo-800 flex justify-between items-center gap-3">
                                <div>
                                    <div className="font-bold text-indigo-900 dark:text-indigo-200">{sub.name}</div>
                                    <div className="text-xs text-indigo-600 dark:text-indigo-300">
                                        ₹{sub.amount} • {sub.frequency} • Next: {sub.nextDueDate}
                                    </div>
                                </div>
                                <button
                                    onClick={() => onConfirmAction(msg.id, {
                                        title: sub.name,
                                        amount: sub.amount,
                                        date: sub.nextDueDate,
                                        recurrence: 'monthly',
                                        transactionType: 'expense',
                                        tags: ['Subscription']
                                    }, 'reminder')}
                                    disabled={msg.saved}
                                    className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition-colors whitespace-nowrap"
                                >
                                    Add Reminder
                                </button>
                            </div>
                        ))}
                        {msg.data.candidates.length === 0 && (
                            <div className="text-gray-500 text-sm italic">No subscriptions detected.</div>
                        )}
                    </div>
                )}

                {/* Category Cleanup Proposals */}
                {msg.type === 'category-cleanup' && msg.data?.proposals && (
                    <div className="mt-4 space-y-3">
                        <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-100 dark:border-emerald-800 overflow-hidden">
                            <div className="p-3 bg-emerald-100/50 dark:bg-emerald-900/50 text-xs font-bold text-emerald-800 dark:text-emerald-200 flex justify-between">
                                <span>Transaction</span>
                                <span>New Category</span>
                            </div>
                            <div className="divide-y divide-emerald-100 dark:divide-emerald-800/50">
                                {msg.data.proposals.map((prop: any, idx: number) => (
                                    <div key={idx} className="p-3 flex justify-between items-center text-sm">
                                        <div>
                                            <div className="font-medium text-gray-700 dark:text-gray-200">{prop.description}</div>
                                            <div className="text-xs text-gray-400">₹{prop.amount} • <span className="line-through opacity-50">{prop.currentCategory}</span></div>
                                        </div>
                                        <div className="text-emerald-600 dark:text-emerald-400 font-bold bg-white dark:bg-gray-800 px-2 py-1 rounded border border-emerald-100 dark:border-emerald-900">
                                            {prop.newCategory}
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 border-t border-emerald-100 dark:border-emerald-800">
                                <button
                                    onClick={() => onConfirmAction(msg.id, { proposals: msg.data.proposals }, 'cleanup')}
                                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2 rounded-lg font-bold text-sm transition-colors shadow-sm"
                                >
                                    Apply All Changes
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Scenario Simulation Result */}
                {msg.type === 'scenario-simulation' && msg.data && (
                    <div className={`mt-4 p-4 rounded-xl border ${msg.data.canAfford ? 'bg-emerald-50 border-emerald-100 dark:bg-emerald-900/20 dark:border-emerald-800' : 'bg-rose-50 border-rose-100 dark:bg-rose-900/20 dark:border-rose-800'}`}>
                        <div className={`font-bold text-base mb-2 flex items-center gap-2 ${msg.data.canAfford ? 'text-emerald-800 dark:text-emerald-200' : 'text-rose-800 dark:text-rose-200'}`}>
                            {msg.data.canAfford ? <TrendingUp size={20} /> : <TrendingUp size={20} className="rotate-180" />}
                            {msg.data.canAfford ? "Looks Affordable!" : "Stretch Warning"}
                        </div>
                        <p className="text-gray-700 dark:text-gray-300 text-sm mb-4 leading-relaxed">
                            {msg.data.message}
                        </p>
                        <div className="grid grid-cols-2 gap-3 text-xs">
                            <div className="p-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                                <div className="text-gray-500 mb-1">Impact</div>
                                <div className="font-bold text-gray-900 dark:text-gray-100">₹{msg.data.yearlyImpact.toLocaleString()}/yr</div>
                            </div>
                            <div className="p-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                                <div className="text-gray-500 mb-1">Savings Left</div>
                                <div className={`font-bold ${msg.data.remainingSavings >= 0 ? 'text-gray-900 dark:text-gray-100' : 'text-rose-600'}`}>
                                    ₹{msg.data.remainingSavings.toLocaleString()}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Financial Health Score Widget */}
                {msg.type === 'health_score' && msg.data && (
                    <HealthScoreWidget data={msg.data} />
                )}
            </div>

            {/* Dynamic Chips */}
            {msg.nextPrompts && msg.nextPrompts.length > 0 && (
                <div className="mt-2 flex flex-col gap-2 pb-1 items-end">
                    {msg.nextPrompts.map((prompt, idx) => (
                        <button
                            key={idx}
                            onClick={() => onPromptClick(prompt)}
                            className="whitespace-nowrap px-3 py-2 bg-blue-50 text-blue-600 text-xs rounded-xl border border-blue-100 hover:bg-blue-100 transition-colors flex items-center gap-1 shadow-sm"
                        >
                            <Sparkles size={10} /> {prompt}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
