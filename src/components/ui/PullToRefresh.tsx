"use client";

import { useState, useEffect } from "react";
import { motion, useAnimation, PanInfo } from "framer-motion";
import { Loader2, ArrowDown } from "lucide-react";

interface PullToRefreshProps {
    onRefresh: () => Promise<void>;
    children: React.ReactNode;
    disabled?: boolean;
}

export default function PullToRefresh({ onRefresh, children, disabled = false }: PullToRefreshProps) {
    const [refreshing, setRefreshing] = useState(false);
    const [pullDistance, setPullDistance] = useState(0);

    if (disabled) {
        return <>{children}</>;
    }
    const controls = useAnimation();
    const threshold = 100;
    const maxPull = 150;

    const handlePan = (_: any, info: PanInfo) => {
        if (refreshing) return;
        // Only allow pulling down when scrolled to top
        if (window.scrollY === 0 && info.offset.y > 0) {
            const newDistance = Math.min(info.offset.y * 0.5, maxPull); // dampening
            setPullDistance(newDistance);
            controls.set({ y: newDistance });
        }
    };

    const handlePanEnd = async () => {
        if (refreshing) return;
        if (pullDistance > threshold) {
            setRefreshing(true);
            controls.start({ y: threshold });
            try {
                await onRefresh();
            } finally {
                setRefreshing(false);
                controls.start({ y: 0 });
                setPullDistance(0);
            }
        } else {
            controls.start({ y: 0 });
            setPullDistance(0);
        }
    };

    return (
        <div className="relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 flex justify-center items-center pointer-events-none" style={{ height: threshold }}>
                <div className="transition-transform duration-200" style={{ transform: `scale(${Math.min(pullDistance / threshold, 1)})` }}>
                    {refreshing ? (
                        <Loader2 className="animate-spin text-blue-600" size={24} />
                    ) : (
                        <div className={`p-2 rounded-full bg-white shadow-md border border-gray-100 ${pullDistance > threshold ? 'rotate-180' : ''} transition-all duration-300`}>
                            <ArrowDown className={`text-blue-500 ${pullDistance > threshold ? 'text-blue-600' : ''}`} size={20} />
                        </div>
                    )}
                </div>
            </div>

            <motion.div
                animate={controls}
                onPan={handlePan}
                onPanEnd={handlePanEnd}
                style={{ touchAction: "pan-y" }} // Important for allowing vertical scroll
                className="relative z-10 bg-inherit"
            >
                {children}
            </motion.div>
        </div>
    );
}
