"use client";

import { useEffect, useState } from "react";
import { collection, getCountFromServer, query, where, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Users, UserPlus, ArrowRight, Loader2, Activity, TrendingUp, Sparkles } from "lucide-react";

import { UserFilterType } from "@/app/admin/page";

interface OverviewTabProps {
    onNavigate: (tab: 'users' | 'invites' | 'settings', filter?: UserFilterType) => void;
}

export default function OverviewTab({ onNavigate }: OverviewTabProps) {
    const [stats, setStats] = useState({
        totalUsers: 0,
        activeAdmins: 0,
        pendingInvites: 0,
        newUsers7Days: 0,
        activeUsers7Days: 0,
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            if (!db) return;
            try {
                const usersColl = collection(db, "users");
                const invitesColl = collection(db, "user_invites");

                const sevenDaysAgo = new Date();
                sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
                const sevenDaysAgoTimestamp = Timestamp.fromDate(sevenDaysAgo);

                const [
                    usersSnapshot,
                    adminsSnapshot,
                    invitesSnapshot,
                    newUsersSnapshot,
                    activeUsersSnapshot
                ] = await Promise.all([
                    getCountFromServer(usersColl),
                    getCountFromServer(query(usersColl, where("role", "==", "admin"))),
                    getCountFromServer(query(invitesColl, where("status", "==", "pending"))),
                    getCountFromServer(query(usersColl, where("createdAt", ">=", sevenDaysAgoTimestamp))),
                    getCountFromServer(query(usersColl, where("lastLoginAt", ">=", sevenDaysAgoTimestamp)))
                ]);

                setStats({
                    totalUsers: usersSnapshot.data().count,
                    activeAdmins: adminsSnapshot.data().count,
                    pendingInvites: invitesSnapshot.data().count,
                    newUsers7Days: newUsersSnapshot.data().count,
                    activeUsers7Days: activeUsersSnapshot.data().count
                });
            } catch (error) {
                console.error("Failed to load admin stats", error);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    if (loading) {
        return (
            <div className="flex justify-center p-12">
                <Loader2 className="animate-spin text-blue-500" size={32} />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                <Activity size={20} className="text-blue-500" /> System Overview
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Total Users Card */}
                <div onClick={() => onNavigate('users')} className="glass-panel p-6 cursor-pointer hover:border-blue-500/50 transition-all group">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Users</p>
                            <h3 className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{stats.totalUsers}</h3>
                        </div>
                        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-xl">
                            <Users size={24} />
                        </div>
                    </div>
                    <div className="mt-4 flex items-center text-sm font-medium text-blue-600 group-hover:underline">
                        Manage Users <ArrowRight size={16} className="ml-1" />
                    </div>
                </div>

                {/* Admins Card */}
                <div onClick={() => onNavigate('users')} className="glass-panel p-6 cursor-pointer hover:border-purple-500/50 transition-all group">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Administrators</p>
                            <h3 className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{stats.activeAdmins}</h3>
                        </div>
                        <div className="p-3 bg-purple-50 dark:bg-purple-900/20 text-purple-600 rounded-xl">
                            <Users size={24} />
                        </div>
                    </div>
                    <div className="mt-4 flex items-center text-sm font-medium text-purple-600 group-hover:underline">
                        View Admins <ArrowRight size={16} className="ml-1" />
                    </div>
                </div>

                {/* Pending Invites Card */}
                <div onClick={() => onNavigate('invites')} className="glass-panel p-6 cursor-pointer hover:border-orange-500/50 transition-all group">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Pending Invites</p>
                            <h3 className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{stats.pendingInvites}</h3>
                        </div>
                        <div className="p-3 bg-orange-50 dark:bg-orange-900/20 text-orange-600 rounded-xl">
                            <UserPlus size={24} />
                        </div>
                    </div>
                    <div className="mt-4 flex items-center text-sm font-medium text-orange-600 group-hover:underline">
                        Review Invites <ArrowRight size={16} className="ml-1" />
                    </div>
                </div>
            </div>

            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2 pt-4">
                <TrendingUp size={20} className="text-green-500" /> Analytics & Retention
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* User Acquisition */}
                <div onClick={() => onNavigate('users', 'new7days')} className="glass-panel p-6 cursor-pointer hover:border-green-500/50 transition-all group">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">New Users (Last 7 Days)</p>
                            <h3 className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{stats.newUsers7Days}</h3>
                        </div>
                        <div className="p-3 bg-green-50 dark:bg-green-900/20 text-green-600 rounded-xl">
                            <Sparkles size={24} />
                        </div>
                    </div>
                    <div className="mt-4 flex items-center text-sm font-medium text-green-600 group-hover:underline">
                        View Recent Signups <ArrowRight size={16} className="ml-1" />
                    </div>
                </div>

                {/* User Retention */}
                <div onClick={() => onNavigate('users', 'active7days')} className="glass-panel p-6 cursor-pointer hover:border-teal-500/50 transition-all group">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Active Users (Last 7 Days)</p>
                            <h3 className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{stats.activeUsers7Days}</h3>
                        </div>
                        <div className="p-3 bg-teal-50 dark:bg-teal-900/20 text-teal-600 rounded-xl">
                            <Activity size={24} />
                        </div>
                    </div>
                    <div className="mt-4 flex items-center text-sm font-medium text-teal-600 group-hover:underline">
                        View Active Engagements <ArrowRight size={16} className="ml-1" />
                    </div>
                </div>
            </div>
        </div>
    );
}
