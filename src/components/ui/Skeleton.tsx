"use client";

import React from "react";

interface SkeletonProps {
    className?: string;
    style?: React.CSSProperties;
}

export function Skeleton({ className = "", style }: SkeletonProps) {
    return (
        <div
            className={`animate-pulse bg-gray-200 dark:bg-gray-700 rounded ${className}`}
            style={style}
        />
    );
}

export function SkeletonCard() {
    return (
        <div className="glass-panel p-4 md:p-6 space-y-4 rounded-2xl">
            <div className="flex items-center justify-between mb-2">
                <Skeleton className="h-8 w-8 rounded-lg opacity-50" />
                <Skeleton className="h-4 w-16 rounded opacity-50" />
            </div>
            <div className="space-y-2 mt-4">
                <Skeleton className="h-3 w-20 rounded" />
                <Skeleton className="h-8 w-32 rounded" />
            </div>
            <Skeleton className="h-3 w-24 rounded mt-2" />
        </div>
    );
}

export function SkeletonRow() {
    return (
        <div className="flex items-center justify-between py-2 px-3 rounded-xl bg-white/40 dark:bg-white/5 border border-transparent">
            <div className="flex items-center gap-3">
                <Skeleton className="w-10 h-10 rounded-full" />
                <div className="space-y-2">
                    <Skeleton className="h-4 w-32 rounded" />
                    <Skeleton className="h-3 w-24 rounded" />
                </div>
            </div>
            <Skeleton className="h-5 w-20 rounded" />
        </div>
    );
}

export function SkeletonTransactionList({ count = 5 }: { count?: number }) {
    return (
        <div className="space-y-1">
            {Array.from({ length: count }).map((_, i) => (
                <SkeletonRow key={i} />
            ))}
        </div>
    );
}

export function SkeletonChart() {
    return (
        <div className="glass-panel p-6">
            <Skeleton className="h-6 w-40 rounded mb-4" />
            <div className="h-[300px] flex items-end justify-around gap-2 px-4">
                {[60, 80, 45, 90, 70, 55].map((height, i) => (
                    <Skeleton
                        key={i}
                        className="w-12 rounded-t"
                        style={{ height: `${height}%` }}
                    />
                ))}
            </div>
        </div>
    );
}

export function SkeletonDashboard() {
    return (
        <div className="space-y-6">
            {/* Header Skeleton */}
            <div className="flex justify-between items-center">
                <div className="space-y-2">
                    <Skeleton className="h-8 w-40 rounded" />
                    <Skeleton className="h-4 w-56 rounded" />
                </div>
                <div className="flex gap-2">
                    <Skeleton className="h-9 w-28 rounded-lg" />
                    <Skeleton className="h-9 w-20 rounded-lg" />
                </div>
            </div>

            {/* Summary Cards Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
            </div>

            {/* Charts Skeleton */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <SkeletonChart />
                <SkeletonChart />
            </div>

            {/* Lists Skeleton */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="glass-panel p-6">
                    <div className="flex justify-between mb-6">
                        <Skeleton className="h-6 w-40 rounded" />
                        <Skeleton className="h-4 w-16 rounded" />
                    </div>
                    <SkeletonTransactionList count={5} />
                </div>
                <div className="glass-panel p-6">
                    <div className="flex justify-between mb-6">
                        <Skeleton className="h-6 w-40 rounded" />
                        <Skeleton className="h-4 w-16 rounded" />
                    </div>
                    <SkeletonTransactionList count={5} />
                </div>
            </div>
        </div>
    );
}
