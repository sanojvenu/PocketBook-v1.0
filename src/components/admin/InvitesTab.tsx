"use client";

import { useEffect, useState } from "react";
import { collection, query, orderBy, onSnapshot, deleteDoc, doc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { Mail, Search, Shield, User, Loader2, Plus, X, Trash2, Send } from "lucide-react";
import Modal from "@/components/ui/Modal";

export default function InvitesTab() {
    const { user } = useAuth();
    const [invites, setInvites] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

    // Invite Modal
    const [isAddUserOpen, setIsAddUserOpen] = useState(false);
    const [newUserEmail, setNewUserEmail] = useState("");
    const [newUserRole, setNewUserRole] = useState("user");
    const [inviteLoading, setInviteLoading] = useState(false);

    useEffect(() => {
        if (!db) return;

        const q = query(collection(db, "user_invites"), orderBy("createdAt", "desc"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
            setInvites(data);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const filteredInvites = invites.filter(i => {
        const q = searchQuery.toLowerCase();
        return (
            (i.email && i.email.toLowerCase().includes(q)) ||
            (i.role && i.role.toLowerCase().includes(q)) ||
            (i.status && i.status.toLowerCase().includes(q))
        );
    });

    const handleInviteUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setInviteLoading(true);
        try {
            await setDoc(doc(db!, "user_invites", newUserEmail.toLowerCase()), {
                email: newUserEmail.toLowerCase(),
                role: newUserRole,
                invitedBy: user?.email,
                createdAt: new Date(),
                status: 'pending'
            });
            toast.success("User invited! They can now log in.");
            setIsAddUserOpen(false);
            setNewUserEmail("");
            setNewUserRole("user");
        } catch (error) {
            console.error("Error inviting user", error);
            toast.error("Failed to invite user");
        } finally {
            setInviteLoading(false);
        }
    };

    const cancelInvite = async (emailId: string) => {
        if (!confirm("Are you sure you want to cancel this invitation?")) return;
        try {
            await deleteDoc(doc(db!, "user_invites", emailId));
            toast.success("Invitation cancelled successfully.");
        } catch (error) {
            console.error("Error canceling invite:", error);
            toast.error("Failed to cancel invitation.");
        }
    };

    if (loading && invites.length === 0) {
        return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-blue-500" /></div>;
    }

    return (
        <div className="glass-panel p-6 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 dark:border-gray-800 pb-4">
                <div className="flex items-center gap-2 text-gray-800 dark:text-gray-200 font-semibold text-lg">
                    <Mail size={20} />
                    <h2>Pending Invitations</h2>
                </div>
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="relative flex-1 md:flex-none">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <input
                            type="text"
                            placeholder="Search invites..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full md:w-64 pl-9 pr-4 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                        />
                    </div>
                    <button
                        onClick={() => setIsAddUserOpen(true)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap"
                    >
                        <Plus size={16} /> New Invite
                    </button>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[600px]">
                    <thead>
                        <tr className="text-xs text-gray-500 border-b border-gray-100 dark:border-gray-800 uppercase tracking-wider">
                            <th className="py-3 font-medium pl-2">Email Address</th>
                            <th className="py-3 font-medium">Assigned Role</th>
                            <th className="py-3 font-medium">Status / Age</th>
                            <th className="py-3 font-medium text-right pr-2">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 dark:divide-gray-800/50">
                        {filteredInvites.map((i) => (
                            <tr key={i.id} className="group hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors">
                                <td className="py-3 pr-4 pl-2 font-medium text-gray-900 dark:text-gray-100 text-sm">
                                    {i.email}
                                    <div className="text-[10px] text-gray-400 font-normal mt-0.5">Invited by: {i.invitedBy || 'System'}</div>
                                </td>
                                <td className="py-3">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${i.role === 'admin' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300' : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'}`}>
                                        {i.role === 'admin' ? <Shield size={10} className="mr-1" /> : <User size={10} className="mr-1" />}
                                        {i.role}
                                    </span>
                                </td>
                                <td className="py-3">
                                    <div className="flex items-center gap-2">
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${i.status === 'accepted' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'}`}>
                                            {i.status || 'pending'}
                                        </span>
                                        <span className="text-[11px] text-gray-400">
                                            {i.createdAt ? new Date(i.createdAt.seconds * 1000).toLocaleDateString() : ''}
                                        </span>
                                    </div>
                                </td>
                                <td className="py-3 text-right pr-2">
                                    {i.status !== 'accepted' && (
                                        <button
                                            onClick={() => cancelInvite(i.id)}
                                            className="p-1.5 rounded-md text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                            title="Cancel Invite"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                        {filteredInvites.length === 0 && (
                            <tr>
                                <td colSpan={5} className="py-8 text-center text-gray-400 text-sm">No invitations found.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Invite User Modal */}
            <Modal isOpen={isAddUserOpen} onClose={() => setIsAddUserOpen(false)} title="Invite New User">
                <form onSubmit={handleInviteUser} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email Address</label>
                        <input
                            type="email"
                            required
                            value={newUserEmail}
                            onChange={(e) => setNewUserEmail(e.target.value)}
                            className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                            placeholder="user@example.com"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Role</label>
                        <select
                            value={newUserRole}
                            onChange={(e) => setNewUserRole(e.target.value)}
                            className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                        >
                            <option value="user">User</option>
                            <option value="admin">Admin</option>
                        </select>
                    </div>
                    <div className="pt-2 flex gap-3">
                        <button type="button" onClick={() => setIsAddUserOpen(false)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                            Cancel
                        </button>
                        <button type="submit" disabled={inviteLoading} className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors flex justify-center items-center gap-2">
                            {inviteLoading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                            Send Invite
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
