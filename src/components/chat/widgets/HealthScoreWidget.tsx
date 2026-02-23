"use client";

import { HealthScore } from '@/lib/insightsEngine';
import { Activity, TrendingUp, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface HealthScoreWidgetProps {
    data: HealthScore;
}

export function HealthScoreWidget({ data }: HealthScoreWidgetProps) {
    if (!data) return null;

    const { score, status, factors } = data;

    // Determine colors based on overall score
    let scoreColor = "text-red-500";
    let scoreBg = "bg-red-50 dark:bg-red-500/10";
    let icon = <AlertTriangle className="w-5 h-5 text-red-500" />;

    if (score >= 80) {
        scoreColor = "text-green-500";
        scoreBg = "bg-green-50 dark:bg-green-500/10";
        icon = <CheckCircle2 className="w-5 h-5 text-green-500" />;
    } else if (score >= 60) {
        scoreColor = "text-blue-500";
        scoreBg = "bg-blue-50 dark:bg-blue-500/10";
        icon = <TrendingUp className="w-5 h-5 text-blue-500" />;
    } else if (score >= 40) {
        scoreColor = "text-yellow-500";
        scoreBg = "bg-yellow-50 dark:bg-yellow-500/10";
        icon = <Activity className="w-5 h-5 text-yellow-500" />;
    }

    const CircleProgress = ({ value, colorClass }: { value: number, colorClass: string }) => {
        const radius = 38;
        const circumference = 2 * Math.PI * radius;
        const strokeDashoffset = circumference - (value / 100) * circumference;

        return (
            <div className="relative w-24 h-24 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90">
                    <circle
                        cx="48" cy="48" r={radius}
                        fill="none"
                        className="stroke-gray-100 dark:stroke-gray-800"
                        strokeWidth="8"
                    />
                    <circle
                        cx="48" cy="48" r={radius}
                        fill="none"
                        className={`stroke-current transition-all duration-1000 ease-out ${colorClass}`}
                        strokeWidth="8"
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                        strokeLinecap="round"
                    />
                </svg>
                <div className="absolute flex items-center justify-center inset-0">
                    <span className={`text-2xl font-black ${colorClass}`}>{value}</span>
                </div>
            </div>
        );
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 md:p-5 shadow-sm border border-gray-100 dark:border-gray-700 w-full mt-2">

            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-gray-900 dark:text-white font-bold text-lg">Financial Health</h3>
                    <div className={`mt-1 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${scoreBg} ${scoreColor}`}>
                        {icon}
                        {status}
                    </div>
                </div>
                <CircleProgress value={score} colorClass={scoreColor} />
            </div>

            <div className="space-y-4">
                <div className="space-y-1">
                    <div className="flex justify-between items-end">
                        <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Savings Rate</span>
                        <span className="text-xs text-gray-500">{factors.savings.score}/{factors.savings.impact} pts</span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{factors.savings.message}</p>
                </div>

                <div className="space-y-1">
                    <div className="flex justify-between items-end">
                        <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Budget Adherence</span>
                        <span className="text-xs text-gray-500">{factors.budget.score}/{factors.budget.impact} pts</span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{factors.budget.message}</p>
                </div>

                <div className="space-y-1">
                    <div className="flex justify-between items-end">
                        <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Bill Payments</span>
                        <span className="text-xs text-gray-500">{factors.bills.score}/{factors.bills.impact} pts</span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{factors.bills.message}</p>
                </div>
            </div>

        </div>
    );
}
