"use client";

import { useEffect, useState } from "react";
import { collection, query, orderBy, onSnapshot, getDocs, updateDoc, doc, limit, startAfter, DocumentData, QueryDocumentSnapshot, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { toast } from "sonner";
import { Search, Shield, Users, User, Download, Loader2, MoreVertical, X, Phone, Mail, Calendar, Ban } from "lucide-react";
import Modal from "@/components/ui/Modal";

import { UserFilterType } from "@/app/admin/page";

const ITEMS_PER_PAGE = 25;

interface UsersTabProps {
    initialFilter?: UserFilterType;
}

export default function UsersTab({ initialFilter = 'all' }: UsersTabProps) {
    const [users, setUsers] = useState<any[]>([]);
    const [lastVisible, setLastVisible] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
    const [loading, setLoading] = useState(true);
    const [hasMore, setHasMore] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    // Search
    const [searchQuery, setSearchQuery] = useState("");

    // User Detail Modal
    const [selectedUser, setSelectedUser] = useState<any | null>(null);
    const [isUserModalOpen, setIsUserModalOpen] = useState(false);

    const fetchUsers = async (isLoadMore = false) => {
        if (!db) return;

        try {
            // Apply analytic filters if active
            const queryConstraints: any[] = [];

            if (initialFilter === 'new7days') {
                const sevenDaysAgo = new Date();
                sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
                queryConstraints.push(where("createdAt", ">=", sevenDaysAgo));
            } else if (initialFilter === 'active7days') {
                const sevenDaysAgo = new Date();
                sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
                queryConstraints.push(where("lastLoginAt", ">=", sevenDaysAgo));
            }

            // Always order by the field being filtered or createdAt by default
            if (initialFilter === 'active7days') {
                queryConstraints.push(orderBy("lastLoginAt", "desc"));
            } else {
                queryConstraints.push(orderBy("createdAt", "desc"));
            }

            let q = query(collection(db, "users"), ...queryConstraints, limit(ITEMS_PER_PAGE));

            if (isLoadMore && lastVisible) {
                q = query(collection(db, "users"), ...queryConstraints, startAfter(lastVisible), limit(ITEMS_PER_PAGE));
            }

            const snapshot = await getDocs(q);
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            if (isLoadMore) {
                setUsers(prev => [...prev, ...data]);
            } else {
                setUsers(data);
            }

            if (snapshot.docs.length > 0) {
                setLastVisible(snapshot.docs[snapshot.docs.length - 1]);
            }
            if (snapshot.docs.length < ITEMS_PER_PAGE) {
                setHasMore(false);
            }
        } catch (error) {
            console.error("Error fetching users:", error);
            toast.error("Failed to load users");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const filteredUsers = users.filter(u => {
        const q = searchQuery.toLowerCase();
        return (
            (u.displayName && u.displayName.toLowerCase().includes(q)) ||
            (u.email && u.email.toLowerCase().includes(q)) ||
            (u.phoneNumber && u.phoneNumber.includes(q))
        );
    });

    const handleRoleToggle = async (userId: string, currentRole: string) => {
        if (!confirm(`Are you sure you want to change this user's role to ${currentRole === 'admin' ? 'User' : 'Admin'}?`)) return;
        setIsSaving(true);
        try {
            const newRole = currentRole === 'admin' ? 'user' : 'admin';
            await updateDoc(doc(db!, "users", userId), { role: newRole });
            setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
            if (selectedUser?.id === userId) setSelectedUser({ ...selectedUser, role: newRole });
            toast.success("Role updated successfully");
        } catch (error) {
            toast.error("Failed to update role");
        } finally {
            setIsSaving(false);
        }
    };

    const handleStatusToggle = async (userId: string, currentStatus: string) => {
        const newStatus = currentStatus === 'suspended' ? 'active' : 'suspended';
        const actionStr = newStatus === 'suspended' ? 'SUSPEND' : 'ACTIVATE';
        if (!confirm(`Are you sure you want to ${actionStr} this user? A suspended user cannot log into the app.`)) return;

        setIsSaving(true);
        try {
            await updateDoc(doc(db!, "users", userId), { status: newStatus });
            setUsers(prev => prev.map(u => u.id === userId ? { ...u, status: newStatus } : u));
            if (selectedUser?.id === userId) setSelectedUser({ ...selectedUser, status: newStatus });
            toast.success(`User successfully ${newStatus}`);
        } catch (error) {
            toast.error("Failed to update user status");
        } finally {
            setIsSaving(false);
        }
    };

    const downloadCSV = () => {
        const headers = ["ID", "Name", "Email", "Phone", "Role", "Status", "Joined"];
        const csvContent = [
            headers.join(","),
            ...filteredUsers.map(u => [
                u.id,
                `"${u.displayName || ''}"`,
                u.email || '',
                u.phoneNumber || '',
                u.role || 'user',
                u.status || 'active',
                u.createdAt ? new Date(u.createdAt.seconds * 1000).toLocaleDateString() : ''
            ].join(","))
        ].join("\n");

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `pocketbook_users_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (loading && users.length === 0) {
        return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-blue-500" /></div>;
    }

    return (
        <div className="glass-panel p-6 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 dark:border-gray-800 pb-4">
                <div className="flex items-center gap-2 text-gray-800 dark:text-gray-200 font-semibold text-lg">
                    <Users size={20} />
                    <h2>
                        {initialFilter === 'new7days' && "New Users (Last 7 Days)"}
                        {initialFilter === 'active7days' && "Active Users (Last 7 Days)"}
                        {initialFilter === 'all' && "User Directory"}
                    </h2>
                    <span className="text-xs font-normal text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full ml-2">
                        {users.length} loaded
                    </span>
                    {initialFilter !== 'all' && (
                        <span className="text-[10px] uppercase font-bold text-blue-600 bg-blue-100 dark:bg-blue-900/30 px-2 py-0.5 rounded-full ml-1">
                            Filtered
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="relative flex-1 md:flex-none">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <input
                            type="text"
                            placeholder="Search users..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full md:w-64 pl-9 pr-4 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                        />
                    </div>
                    <button
                        onClick={downloadCSV}
                        className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors whitespace-nowrap"
                        title="Export displayed users"
                    >
                        <Download size={16} /> Export
                    </button>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[700px]">
                    <thead>
                        <tr className="text-xs text-gray-500 border-b border-gray-100 dark:border-gray-800 uppercase tracking-wider">
                            <th className="py-3 font-medium pl-2">User</th>
                            <th className="py-3 font-medium">Contact</th>
                            <th className="py-3 font-medium">Role</th>
                            <th className="py-3 font-medium">Status</th>
                            <th className="py-3 font-medium text-right pr-2">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 dark:divide-gray-800/50">
                        {filteredUsers.map((u) => (
                            <tr key={u.id} className="group hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors">
                                <td className="py-3 pr-4 pl-2">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 font-bold text-sm uppercase shrink-0">
                                            {u.displayName ? u.displayName.substring(0, 2) : (u.email ? u.email.substring(0, 2) : "??")}
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-900 dark:text-gray-100 text-sm">{u.displayName || "Unknown Name"}</p>
                                            <p className="text-[11px] text-gray-400">ID: {u.id.substring(0, 8)}...</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="py-3">
                                    <div className="text-sm text-gray-600 dark:text-gray-400">
                                        {u.email && <div className="flex items-center gap-1"><Mail size={12} />{u.email}</div>}
                                        {u.phoneNumber && <div className="flex items-center gap-1 mt-0.5"><Phone size={12} />{u.phoneNumber}</div>}
                                        {!u.email && !u.phoneNumber && "-"}
                                    </div>
                                </td>
                                <td className="py-3">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${u.role === 'admin' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300' : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'}`}>
                                        {u.role === 'admin' ? <Shield size={10} className="mr-1" /> : <User size={10} className="mr-1" />}
                                        {u.role}
                                    </span>
                                </td>
                                <td className="py-3">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${u.status === 'suspended' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'}`}>
                                        {u.status === 'suspended' ? <Ban size={10} className="mr-1" /> : <div className="w-1.5 h-1.5 rounded-full bg-green-500 mr-1.5"></div>}
                                        {u.status || 'active'}
                                    </span>
                                </td>
                                <td className="py-3 text-right pr-2">
                                    <button
                                        onClick={() => { setSelectedUser(u); setIsUserModalOpen(true); }}
                                        className="p-1.5 rounded-md text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-gray-800 transition-colors"
                                        title="View Details"
                                    >
                                        <Search size={16} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {filteredUsers.length === 0 && (
                            <tr>
                                <td colSpan={5} className="py-8 text-center text-gray-400 text-sm">No users matched your search.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {hasMore && !searchQuery && (
                <div className="pt-4 border-t border-gray-100 dark:border-gray-800 flex justify-center">
                    <button
                        onClick={() => fetchUsers(true)}
                        disabled={loading}
                        className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition"
                    >
                        {loading ? <Loader2 size={16} className="animate-spin mx-auto" /> : "Load More Users"}
                    </button>
                </div>
            )}

            {/* Detailed User Modal */}
            <Modal
                isOpen={isUserModalOpen}
                onClose={() => setIsUserModalOpen(false)}
                title="User Details"
            >
                {selectedUser && (
                    <div className="space-y-6">
                        <div className="flex items-center gap-4 pb-4 border-b border-gray-100 dark:border-gray-800">
                            <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 font-bold text-2xl uppercase">
                                {selectedUser.displayName ? selectedUser.displayName.substring(0, 2) : (selectedUser.email ? selectedUser.email.substring(0, 2) : "??")}
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white">{selectedUser.displayName || "Unknown Name"}</h3>
                                <p className="text-sm text-gray-500 font-mono mt-1">ID: {selectedUser.id}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div className="space-y-1">
                                <span className="text-gray-500 flex items-center gap-1"><Mail size={14} /> Email</span>
                                <p className="font-medium text-gray-900 dark:text-gray-200">{selectedUser.email || "Not Provided"}</p>
                            </div>
                            <div className="space-y-1">
                                <span className="text-gray-500 flex items-center gap-1"><Phone size={14} /> Phone</span>
                                <p className="font-medium text-gray-900 dark:text-gray-200">{selectedUser.phoneNumber || "Not Provided"}</p>
                            </div>
                            <div className="space-y-1">
                                <span className="text-gray-500 flex items-center gap-1"><Calendar size={14} /> Joined</span>
                                <p className="font-medium text-gray-900 dark:text-gray-200">
                                    {selectedUser.createdAt ? new Date(selectedUser.createdAt.seconds * 1000).toLocaleDateString() : "Unknown"}
                                </p>
                            </div>
                            <div className="space-y-1">
                                <span className="text-gray-500 flex items-center gap-1"><Calendar size={14} /> Last Login</span>
                                <p className="font-medium text-gray-900 dark:text-gray-200">
                                    {selectedUser.lastLogin ? new Date(selectedUser.lastLogin.seconds * 1000).toLocaleDateString() : "Unknown"}
                                </p>
                            </div>
                        </div>

                        <div className="pt-4 border-t border-gray-100 dark:border-gray-800 space-y-3">
                            <h4 className="font-semibold text-gray-900 dark:text-gray-200 text-sm">Administrative Actions</h4>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => handleRoleToggle(selectedUser.id, selectedUser.role)}
                                    disabled={isSaving}
                                    className="flex-1 py-2 px-3 border border-blue-200 dark:border-blue-900/50 bg-blue-50 dark:bg-blue-900/10 text-blue-600 rounded-lg text-sm font-medium hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                                >
                                    {selectedUser.role === 'admin' ? 'Demote to User' : 'Promote to Admin'}
                                </button>

                                <button
                                    onClick={() => handleStatusToggle(selectedUser.id, selectedUser.status)}
                                    disabled={isSaving}
                                    className={`flex-1 py-2 px-3 border rounded-lg text-sm font-medium transition-colors ${selectedUser.status === 'suspended'
                                        ? 'border-green-200 bg-green-50 text-green-700 hover:bg-green-100 dark:border-green-900/50 dark:bg-green-900/10 dark:text-green-400'
                                        : 'border-red-200 bg-red-50 text-red-600 hover:bg-red-100 dark:border-red-900/50 dark:bg-red-900/10 dark:text-red-400'
                                        }`}
                                >
                                    {selectedUser.status === 'suspended' ? 'Activate Account' : 'Suspend Account'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}
