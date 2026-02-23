import React, { useMemo } from "react";

interface UserAvatarProps {
    name: string | null | undefined;
    className?: string;
    size?: number;
}

const COLORS = [
    "bg-red-500",
    "bg-orange-500",
    "bg-amber-500",
    "bg-yellow-500",
    "bg-lime-500",
    "bg-green-500",
    "bg-emerald-500",
    "bg-teal-500",
    "bg-cyan-500",
    "bg-sky-500",
    "bg-blue-500",
    "bg-indigo-500",
    "bg-violet-500",
    "bg-purple-500",
    "bg-fuchsia-500",
    "bg-pink-500",
    "bg-rose-500",
];

export default function UserAvatar({ name, className = "", size = 40 }: UserAvatarProps) {
    const { initials, color } = useMemo(() => {
        const safeName = name || "User";
        const parts = safeName.trim().split(/\s+/);

        let initials = "";
        if (parts.length > 0) {
            initials += parts[0][0].toUpperCase();
            if (parts.length > 1) {
                initials += parts[parts.length - 1][0].toUpperCase();
            }
        } else {
            initials = "U";
        }

        // Simple hash function to get consistent color
        let hash = 0;
        for (let i = 0; i < safeName.length; i++) {
            hash = safeName.charCodeAt(i) + ((hash << 5) - hash);
        }

        const colorIndex = Math.abs(hash) % COLORS.length;
        const color = COLORS[colorIndex];

        return { initials, color };
    }, [name]);

    return (
        <div
            className={`flex items-center justify-center rounded-full text-white font-bold select-none ${color} ${className}`}
            style={{ width: size, height: size, fontSize: size * 0.4 }}
        >
            {initials}
        </div>
    );
}
