"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { Shield, Loader2, LayoutDashboard, Users, UserPlus, Settings } from "lucide-react";

// Import tab content components
import OverviewTab from "@/components/admin/OverviewTab";
import UsersTab from "@/components/admin/UsersTab";
import InvitesTab from "@/components/admin/InvitesTab";
import SettingsTab from "@/components/admin/SettingsTab";

type AdminTab = 'overview' | 'users' | 'invites' | 'settings';

export type UserFilterType = 'all' | 'new7days' | 'active7days';
interface AdminTabState {
    id: AdminTab;
    filter?: UserFilterType;
}

export default function AdminPage() {
    const { user, role, loading } = useAuth();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<AdminTabState>({ id: 'overview' });

    // Auth Check
    useEffect(() => {
        if (!loading) {
            if (!user) {
                router.push("/login");
            } else if (role !== "admin") {
                router.push("/");
            }
        }
    }, [user, role, loading, router]);

    if (loading || (user && role !== "admin")) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="animate-spin text-blue-500" size={32} />
            </div>
        );
    }

    const tabs = [
        { id: 'overview', label: 'Overview', icon: LayoutDashboard },
        { id: 'users', label: 'Users', icon: Users },
        { id: 'invites', label: 'Invitations', icon: UserPlus },
        { id: 'settings', label: 'Settings', icon: Settings }
    ] as const;

    const navigateToTab = (tabId: AdminTab, filter?: UserFilterType) => {
        setActiveTab({ id: tabId, filter });
    };

    return (
        <div className="space-y-6 max-w-6xl mx-auto">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl text-blue-600">
                    <Shield size={28} />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Manage global application settings and users.</p>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="hide-scrollbar overflow-x-auto border-b border-gray-200 dark:border-gray-800">
                <div className="flex space-x-6 min-w-max pb-px">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeTab.id === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => navigateToTab(tab.id as AdminTab)}
                                className={`flex items-center gap-2 pb-3 px-1 border-b-2 text-sm font-medium transition-colors ${isActive
                                    ? 'border-blue-600 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                                    }`}
                            >
                                <Icon size={18} />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Tab Content Rendering */}
            <div className="mt-6 animation-fade-in">
                {activeTab.id === 'overview' && <OverviewTab onNavigate={navigateToTab} />}
                {activeTab.id === 'users' && <UsersTab initialFilter={activeTab.filter || 'all'} />}
                {activeTab.id === 'invites' && <InvitesTab />}
                {activeTab.id === 'settings' && <SettingsTab />}
            </div>
        </div>
    );
}
