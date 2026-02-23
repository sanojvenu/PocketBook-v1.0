"use client";

import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Info, Lightbulb } from "lucide-react";

interface SparklineProps {
    data: number[];
    color?: string;
    height?: number;
}

// Mini sparkline chart for trends
export function Sparkline({ data, color = "#3b82f6", height = 24 }: SparklineProps) {
    if (data.length < 2) return null;

    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min || 1;
    const width = 80;
    const step = width / (data.length - 1);

    const points = data.map((value, i) => {
        const x = i * step;
        const y = height - ((value - min) / range) * height;
        return `${x},${y}`;
    }).join(' ');

    return (
        <svg width={width} height={height} className="inline-block ml-2">
            <polyline
                points={points}
                fill="none"
                stroke={color}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}

interface ComparisonBarProps {
    current: number;
    previous: number;
    label?: string;
    formatValue?: (val: number) => string;
}

// Comparison bar showing current vs previous
export function ComparisonBar({ current, previous, label, formatValue }: ComparisonBarProps) {
    const max = Math.max(current, previous) || 1;
    const currentPercent = (current / max) * 100;
    const previousPercent = (previous / max) * 100;
    const change = previous > 0 ? ((current - previous) / previous) * 100 : 0;
    const isUp = change > 0;

    const format = formatValue || ((val: number) => `₹${val.toLocaleString('en-IN')}`);

    return (
        <div className="space-y-2 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
            {label && <div className="text-xs font-medium text-gray-500">{label}</div>}

            <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs">
                    <span className="w-16 text-gray-500">This period</span>
                    <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-blue-500 rounded-full transition-all duration-500"
                            style={{ width: `${currentPercent}%` }}
                        />
                    </div>
                    <span className="font-bold text-gray-800 dark:text-gray-200 w-20 text-right">{format(current)}</span>
                </div>

                <div className="flex items-center gap-2 text-xs">
                    <span className="w-16 text-gray-500">Last period</span>
                    <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gray-400 rounded-full transition-all duration-500"
                            style={{ width: `${previousPercent}%` }}
                        />
                    </div>
                    <span className="font-medium text-gray-500 w-20 text-right">{format(previous)}</span>
                </div>
            </div>

            {previous > 0 && (
                <div className={`flex items-center gap-1 text-xs font-medium ${isUp ? 'text-rose-500' : 'text-emerald-500'}`}>
                    {isUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                    <span>{Math.abs(change).toFixed(0)}% {isUp ? 'increase' : 'decrease'}</span>
                </div>
            )}
        </div>
    );
}

interface BudgetMeterProps {
    category: string;
    spent: number;
    limit: number;
    showLabel?: boolean;
}

// Circular budget meter
export function BudgetMeter({ category, spent, limit, showLabel = true }: BudgetMeterProps) {
    const percentage = limit > 0 ? Math.min((spent / limit) * 100, 100) : 0;
    const remaining = Math.max(limit - spent, 0);
    const isOver = spent > limit;

    const radius = 28;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    let color = '#22c55e'; // green
    if (percentage >= 80) color = '#f59e0b'; // amber
    if (percentage >= 100) color = '#ef4444'; // red

    return (
        <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
            <div className="relative w-16 h-16">
                <svg className="transform -rotate-90" width="64" height="64">
                    <circle
                        cx="32"
                        cy="32"
                        r={radius}
                        fill="none"
                        stroke="#e5e7eb"
                        strokeWidth="6"
                    />
                    <circle
                        cx="32"
                        cy="32"
                        r={radius}
                        fill="none"
                        stroke={color}
                        strokeWidth="6"
                        strokeLinecap="round"
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                        className="transition-all duration-500"
                    />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xs font-bold" style={{ color }}>{Math.round(percentage)}%</span>
                </div>
            </div>

            {showLabel && (
                <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-800 dark:text-gray-200 truncate">{category}</div>
                    <div className="text-xs text-gray-500">
                        ₹{spent.toLocaleString('en-IN')} / ₹{limit.toLocaleString('en-IN')}
                    </div>
                    <div className={`text-xs font-medium ${isOver ? 'text-rose-500' : 'text-emerald-500'}`}>
                        {isOver
                            ? `₹${(spent - limit).toLocaleString('en-IN')} over budget`
                            : `₹${remaining.toLocaleString('en-IN')} remaining`
                        }
                    </div>
                </div>
            )}
        </div>
    );
}

interface InsightCardProps {
    type: 'warning' | 'success' | 'info' | 'tip';
    title: string;
    message: string;
}

// Insight display card
export function InsightCard({ type, title, message }: InsightCardProps) {
    const config = {
        warning: {
            bg: 'bg-amber-50 dark:bg-amber-900/20',
            border: 'border-amber-200 dark:border-amber-800',
            icon: <AlertTriangle size={16} className="text-amber-500" />,
            text: 'text-amber-800 dark:text-amber-200'
        },
        success: {
            bg: 'bg-emerald-50 dark:bg-emerald-900/20',
            border: 'border-emerald-200 dark:border-emerald-800',
            icon: <CheckCircle size={16} className="text-emerald-500" />,
            text: 'text-emerald-800 dark:text-emerald-200'
        },
        info: {
            bg: 'bg-blue-50 dark:bg-blue-900/20',
            border: 'border-blue-200 dark:border-blue-800',
            icon: <Info size={16} className="text-blue-500" />,
            text: 'text-blue-800 dark:text-blue-200'
        },
        tip: {
            bg: 'bg-purple-50 dark:bg-purple-900/20',
            border: 'border-purple-200 dark:border-purple-800',
            icon: <Lightbulb size={16} className="text-purple-500" />,
            text: 'text-purple-800 dark:text-purple-200'
        }
    };

    const { bg, border, icon, text } = config[type];

    return (
        <div className={`p-3 rounded-lg border ${bg} ${border}`}>
            <div className={`flex items-start gap-2 ${text}`}>
                <div className="mt-0.5">{icon}</div>
                <div>
                    <div className="font-medium text-sm">{title}</div>
                    <div className="text-xs opacity-80 mt-0.5">{message}</div>
                </div>
            </div>
        </div>
    );
}

// Category spending mini bar
export function CategoryBar({ category, amount, total }: { category: string; amount: number; total: number }) {
    const percentage = total > 0 ? (amount / total) * 100 : 0;

    return (
        <div className="flex items-center gap-2 text-xs">
            <span className="w-20 truncate text-gray-600 dark:text-gray-400">{category}</span>
            <div className="flex-1 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                    className="h-full bg-blue-500 rounded-full"
                    style={{ width: `${percentage}%` }}
                />
            </div>
            <span className="font-medium text-gray-800 dark:text-gray-200 w-16 text-right">
                ₹{amount.toLocaleString('en-IN')}
            </span>
        </div>
    );
}
