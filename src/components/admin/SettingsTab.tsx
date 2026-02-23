"use client";

import { useEffect, useState } from "react";
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { toast } from "sonner";
import { Settings, ToggleLeft, ToggleRight, Loader2, AlertTriangle, MessageSquare, Save } from "lucide-react";

export default function SettingsTab() {
    const [settings, setSettings] = useState({
        googleAuthEnabled: true,
        maintenanceModeEnabled: false,
        globalAnnouncementMessage: ""
    });
    const [announcementInput, setAnnouncementInput] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!db) return;
        const unsubscribe = onSnapshot(doc(db, "settings", "global"), (docSnapshot) => {
            if (docSnapshot.exists()) {
                const data = docSnapshot.data();
                setSettings({
                    googleAuthEnabled: data.googleAuthEnabled ?? true,
                    maintenanceModeEnabled: data.maintenanceModeEnabled ?? false,
                    globalAnnouncementMessage: data.globalAnnouncementMessage ?? ""
                });
                setAnnouncementInput(data.globalAnnouncementMessage ?? "");
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const updateSetting = async (key: string, value: any) => {
        if (!db) return;
        setIsSaving(true);
        try {
            await setDoc(doc(db, "settings", "global"), {
                [key]: value
            }, { merge: true });
            toast.success("Settings updated");
        } catch (error) {
            console.error("Error updating settings", error);
            toast.error("Failed to update settings");
        } finally {
            setIsSaving(false);
        }
    };

    const handleSaveAnnouncement = () => {
        updateSetting("globalAnnouncementMessage", announcementInput.trim());
    };

    if (loading) {
        return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-blue-500" /></div>;
    }

    return (
        <div className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">

                {/* Authentication Settings */}
                <div className="glass-panel p-6 space-y-4">
                    <div className="flex items-center gap-2 text-gray-800 dark:text-gray-200 font-semibold text-lg border-b border-gray-100 dark:border-gray-800 pb-3">
                        <Settings size={20} className="text-blue-500" />
                        <h2>Authentication</h2>
                    </div>
                    <div className="flex items-center justify-between py-2">
                        <div>
                            <p className="font-medium text-gray-700 dark:text-gray-300">Google Login Page</p>
                            <p className="text-xs text-gray-500">Enable/Disable OAuth access</p>
                        </div>
                        <button
                            onClick={() => updateSetting("googleAuthEnabled", !settings.googleAuthEnabled)}
                            disabled={isSaving}
                            className={`p-2 rounded-full transition-colors ${settings.googleAuthEnabled ? 'text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20' : 'text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                        >
                            {isSaving ? <Loader2 className="animate-spin" size={24} /> : (
                                settings.googleAuthEnabled ? <ToggleRight size={32} /> : <ToggleLeft size={32} />
                            )}
                        </button>
                    </div>
                </div>

                {/* System State Settings */}
                <div className="glass-panel p-6 space-y-4">
                    <div className="flex items-center gap-2 text-gray-800 dark:text-gray-200 font-semibold text-lg border-b border-orange-100 dark:border-orange-900/30 pb-3">
                        <AlertTriangle size={20} className="text-orange-500" />
                        <h2>System State</h2>
                    </div>
                    <div className="flex items-center justify-between py-2">
                        <div>
                            <p className="font-medium text-gray-700 dark:text-gray-300">Maintenance Mode</p>
                            <p className="text-xs text-gray-500 max-w-[200px]">Blocks all non-admin users from accessing the app.</p>
                        </div>
                        <button
                            onClick={() => updateSetting("maintenanceModeEnabled", !settings.maintenanceModeEnabled)}
                            disabled={isSaving}
                            className={`p-2 rounded-full transition-colors ${settings.maintenanceModeEnabled ? 'text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/20' : 'text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                        >
                            {isSaving ? <Loader2 className="animate-spin" size={24} /> : (
                                settings.maintenanceModeEnabled ? <ToggleRight size={32} /> : <ToggleLeft size={32} />
                            )}
                        </button>
                    </div>
                </div>

            </div>

            {/* Global Announcements */}
            <div className="glass-panel p-6 space-y-4">
                <div className="flex items-center gap-2 text-gray-800 dark:text-gray-200 font-semibold text-lg border-b border-gray-100 dark:border-gray-800 pb-3">
                    <MessageSquare size={20} className="text-purple-500" />
                    <h2>Global App Announcement</h2>
                </div>
                <div>
                    <p className="text-sm text-gray-500 mb-3">
                        Broadcast a banner message to all active users. Clear the text to remove the banner.
                    </p>
                    <div className="relative">
                        <textarea
                            value={announcementInput}
                            onChange={(e) => setAnnouncementInput(e.target.value)}
                            className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none h-24 text-sm"
                            placeholder="e.g., Version 1.6.0 is out! Pull to refresh."
                        />
                    </div>
                    <div className="flex justify-end mt-3">
                        <button
                            onClick={handleSaveAnnouncement}
                            disabled={isSaving || announcementInput === settings.globalAnnouncementMessage}
                            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white font-medium text-sm rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
                        >
                            <Save size={16} /> Save Banner
                        </button>
                    </div>
                </div>
            </div>

        </div>
    );
}
