"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Capacitor } from "@capacitor/core";

export default function Footer() {
    const [isNative, setIsNative] = useState(false);

    useEffect(() => {
        setIsNative(Capacitor.isNativePlatform());
    }, []);

    if (isNative) return null;

    return (
        <footer className="mt-12 mb-6 border-t border-gray-100 dark:border-gray-800 pt-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-gray-500 dark:text-gray-400">
                <p>&copy; {new Date().getFullYear()} PocketBook. All rights reserved.</p>

                <div className="flex items-center gap-6">
                    <Link href="/privacy" className="hover:text-primary transition-colors">
                        Privacy Policy
                    </Link>
                    <Link href="/terms" className="hover:text-primary transition-colors">
                        Terms of Service
                    </Link>
                    <Link href="/faq" className="hover:text-primary transition-colors">
                        FAQ
                    </Link>
                </div>
            </div>
        </footer>
    );
}
