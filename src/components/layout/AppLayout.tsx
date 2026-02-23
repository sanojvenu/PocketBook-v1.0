"use client";

import Sidebar from "./Sidebar";
import { useAuth } from "@/context/AuthContext";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { AlertTriangle, Info, X } from "lucide-react";

import CompleteProfileModal from "../CompleteProfileModal";

import BottomNav from "./BottomNav";
import GlobalChat from "../GlobalChat";

import useFcmToken from "@/hooks/useFcmToken";
import PageTransition from "../ui/PageTransition";
import Footer from "./Footer";

export default function AppLayout({ children }: { children: React.ReactNode }) {
    const { user, role, loading } = useAuth();
    const pathname = usePathname();
    const router = useRouter();

    const [globalSettings, setGlobalSettings] = useState({
        maintenanceModeEnabled: false,
        globalAnnouncementMessage: ""
    });
    const [dismissedAnnouncement, setDismissedAnnouncement] = useState("");

    // Initialize FCM
    useFcmToken();

    // Fetch Global Settings
    useEffect(() => {
        if (!db) return;
        const unsubscribe = onSnapshot(doc(db, "settings", "global"), (snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.data();
                setGlobalSettings({
                    maintenanceModeEnabled: data.maintenanceModeEnabled || false,
                    globalAnnouncementMessage: data.globalAnnouncementMessage || ""
                });
            }
        });
        return () => unsubscribe();
    }, []);

    const isPublicPage = pathname === "/login" || pathname?.startsWith("/privacy") || pathname?.startsWith("/terms") || pathname?.startsWith("/google") || pathname?.startsWith("/faq");
    const isRoot = pathname === "/";

    useEffect(() => {
        // Exclude public pages and explicitly check /google with startsWith
        if (!loading && !user && !isPublicPage && !isRoot && !pathname?.startsWith("/google")) {
            router.push("/"); // Redirect to root (which shows LoginView) instead of /login
        }
    }, [user, loading, isPublicPage, isRoot, pathname, router]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (isPublicPage || (isRoot && !user)) {
        return <main className="pt-safe">{children}</main>;
    }

    if (!user && !isRoot) return null; // Wait for redirect (except on root)

    // Maintenance Mode Check
    if (globalSettings.maintenanceModeEnabled && role !== 'admin') {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 p-6 text-center">
                <div className="w-20 h-20 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center mb-6 text-orange-500">
                    <AlertTriangle size={40} />
                </div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">We'll be right back</h1>
                <p className="text-gray-500 max-w-md">
                    PocketBook is currently undergoing scheduled maintenance. Please check back later. Thank you for your patience!
                </p>
                <button
                    onClick={() => router.push("/")}
                    className="mt-8 px-6 py-2 bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                >
                    Reload Page
                </button>
            </div>
        );
    }

    const showAnnouncement = globalSettings.globalAnnouncementMessage && globalSettings.globalAnnouncementMessage !== dismissedAnnouncement;

    return (
        <div className="flex min-h-screen pt-safe relative">
            {user && <Sidebar />}

            <main className={`flex-1 min-w-0 md:ml-72 flex flex-col ${user ? 'pb-24 md:pb-8' : ''}`}>
                {/* Global Announcement Banner */}
                {showAnnouncement && (
                    <div className="bg-blue-600 text-white px-4 py-3 flex items-start md:items-center justify-between gap-4 z-50">
                        <div className="flex items-center gap-3 text-sm font-medium">
                            <Info size={18} className="shrink-0" />
                            <p>{globalSettings.globalAnnouncementMessage}</p>
                        </div>
                        <button
                            onClick={() => setDismissedAnnouncement(globalSettings.globalAnnouncementMessage)}
                            className="p-1 hover:bg-blue-700 rounded-lg transition-colors shrink-0"
                            aria-label="Dismiss announcement"
                        >
                            <X size={16} />
                        </button>
                    </div>
                )}

                <div className="flex-1 p-4 md:p-8">
                    <PageTransition className="max-w-7xl mx-auto space-y-8 w-full">
                        {children}
                        <Footer />
                    </PageTransition>
                </div>
            </main>

            {user && <BottomNav />}

            {user && <GlobalChat />}

            <CompleteProfileModal />
        </div>
    );
}
