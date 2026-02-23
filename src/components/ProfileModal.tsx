"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { updateProfile, updateEmail, deleteUser, GoogleAuthProvider, reauthenticateWithPopup, verifyBeforeUpdateEmail } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { UserService } from "@/services/UserService";
import { toast } from "sonner";
import { X, User, Mail, Phone, Save, Loader2, Trash2, AlertTriangle, Check } from "lucide-react";

interface ProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function ProfileModal({ isOpen, onClose }: ProfileModalProps) {
    const { user } = useAuth();
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [mobile, setMobile] = useState("");
    const [loading, setLoading] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [fetching, setFetching] = useState(true);

    // Fetch initial data
    useEffect(() => {
        const fetchUserData = async () => {
            if (user && isOpen) {
                setFetching(true);
                setName(user.displayName || "");
                setEmail(user.email || "");

                // Fetch mobile from Firestore via Service
                try {
                    const profileData = await UserService.getUserProfile(user.uid);
                    if (profileData) {
                        setMobile(profileData.mobile || "");
                    }
                } catch (error) {
                    console.error("Error fetching user data:", error);
                }
                setFetching(false);
            }
        };

        fetchUserData();
    }, [user, isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        setLoading(true);

        try {
            // 1. Update Auth Profile (Display Name)
            if (name !== user.displayName) {
                await updateProfile(user, { displayName: name });
            }

            // 2. Handle Email Update
            let emailVerificationSent = false;
            if (email !== user.email) {
                try {
                    const actionCodeSettings = {
                        url: window.location.origin + '/login', // Redirect back to login/home
                        // This must be true.
                        handleCodeInApp: true,
                    };
                    await verifyBeforeUpdateEmail(user, email, actionCodeSettings);
                    emailVerificationSent = true;
                    toast.success(`Verification email sent to ${email}. Please check your inbox (and Spam).`);
                } catch (emailError: any) {
                    // Fallback or specific error handling
                    console.error("Email update failed:", emailError);
                    if (emailError.code === 'auth/requires-recent-login') {
                        toast.error("Please re-login to update email.");
                        // return early? or continue with other updates?
                    } else {
                        toast.error("Failed to send verification email. " + emailError.message);
                    }
                    // If email fails, do we stop?
                    // Let's continue to save Name/Mobile but warn about email
                }
            }

            // 3. Update Firestore
            // Note: We only update the email in Firestore if it hasn't changed (already synced) 
            // or if we decide to effectively "optimistically" update it. 
            // However, since Auth won't update until verified, let's keep Firestore in sync with Auth 
            // by NOT updating the email field if we just sent a verification.
            // But if the user didn't change email, we can include it (it's same).

            const updateData: any = {
                displayName: name,
                mobile: mobile,
                updatedAt: new Date()
            };

            // Only update email in Firestore if we didn't attempt a change (so it remains consistent)
            if (!emailVerificationSent && email === user.email) {
                updateData.email = email;
            }

            await UserService.updateUserProfile(user.uid, updateData);

            if (emailVerificationSent) {
                toast.info("Profile updated. Email will change after verification.");
            } else {
                toast.success("Profile updated successfully!");
            }
            onClose();
        } catch (error: any) {
            console.error("Error updating profile:", error);
            if (error.code === 'auth/requires-recent-login') {
                toast.error("Security check failed. Please re-login to update sensitive info.");
            } else {
                toast.error("Failed to update profile. " + error.message);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteAccount = async () => {
        if (!auth?.currentUser) return;
        setDeleteLoading(true);

        const performDelete = async (userToDelete: any) => {
            const uid = userToDelete.uid;

            // 1. Delete all Firestore Data via Service
            await UserService.deleteUserAllData(uid);

            // 2. Delete Auth User
            await deleteUser(userToDelete);
        };

        try {
            // Prefer auth.currentUser for the most up-to-date reference
            if (auth.currentUser) {
                await performDelete(auth.currentUser);
                toast.success("Account deleted successfully. We'll miss you!");
                onClose();
            }
        } catch (error: any) {
            console.warn("Initial delete failed, attempting re-auth:", error.code);

            if (error.code === 'auth/requires-recent-login') {
                toast.info("Please verify your identity to continue.");
                try {
                    const provider = new GoogleAuthProvider();
                    if (auth.currentUser) {
                        await reauthenticateWithPopup(auth.currentUser, provider);

                        // Retry delete after successful re-auth
                        await performDelete(auth.currentUser);
                        toast.success("Account deleted successfully. We'll miss you!");
                        onClose();
                    }
                } catch (reauthError: any) {
                    console.error("Re-auth failed:", reauthError);
                    if (reauthError.code === 'auth/popup-blocked') {
                        toast.error("Popup blocked. Please allow popups to verify identity.");
                    } else {
                        toast.error("Authentication failed. " + (reauthError.message || ""));
                    }
                }
            } else {
                toast.error("Failed to delete account. " + error.message);
            }
        } finally {
            setDeleteLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-900 w-full max-w-md rounded-2xl shadow-xl overflow-hidden border border-gray-100 dark:border-gray-800 animate-in fade-in zoom-in duration-200">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800">
                    <h2 className="text-lg font-bold">Edit Profile</h2>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {fetching ? (
                    <div className="p-8 flex justify-center">
                        <Loader2 className="animate-spin text-blue-500" />
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="p-6 space-y-4">
                        {/* Name */}
                        <div className="space-y-2">
                            <label className="text-xs font-semibold uppercase text-gray-500">Full Name</label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-transparent focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                                    placeholder="Your Name"
                                    required
                                />
                            </div>
                        </div>

                        {/* Email */}
                        <div className="space-y-2">
                            <label className="text-xs font-semibold uppercase text-gray-500">Email Address</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-transparent focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                                    placeholder="name@example.com"
                                    required
                                />
                            </div>
                        </div>

                        {/* Mobile - Only editable if not linked? Or allow re-linking? */}
                        {/* For simplicity, if they have a phone number in Auth, we show it disabled or allow changing via re-verify */}
                        <div className="space-y-2">
                            <label className="text-xs font-semibold uppercase text-gray-500">Mobile Number</label>
                            <div className="relative">
                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input
                                    type="tel"
                                    value={user?.phoneNumber || mobile}
                                    onChange={(e) => setMobile(e.target.value)}
                                    // If Auth has phone, disable simple edit. They should use a "Change Number" flow (out of scope for now, just show current)
                                    disabled={!!user?.phoneNumber}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-transparent focus:ring-2 focus:ring-blue-100 outline-none transition-all disabled:opacity-70 disabled:bg-gray-100 dark:disabled:bg-gray-800"
                                    placeholder="+91 98765 43210"
                                />
                                {!!user?.phoneNumber && <Check className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500" size={16} />}
                            </div>
                            {!user?.phoneNumber && (
                                <p className="text-[10px] text-blue-500">
                                    * To link a mobile number, please use the Mandatory Completion flow (re-login if skipped).
                                </p>
                            )}
                        </div>

                        <div className="pt-4 flex gap-3">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 px-4 py-2 text-gray-600 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors border border-gray-200 dark:border-gray-700"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                                Save Changes
                            </button>
                        </div>
                    </form>
                )}

                {/* Danger Zone */}
                {!fetching && (
                    <div className="p-4 bg-red-50 dark:bg-red-900/10 border-t border-red-100 dark:border-red-900/20">
                        <button
                            onClick={() => setShowDeleteConfirm(true)}
                            className="w-full flex items-center justify-center gap-2 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 p-2 rounded-lg transition-colors text-sm font-medium"
                        >
                            <Trash2 size={16} />
                            Delete Account
                        </button>
                    </div>
                )}

                {/* Delete Confirmation Overlay */}
                {showDeleteConfirm && (
                    <div className="absolute inset-0 z-10 bg-white dark:bg-gray-900 flex flex-col items-center justify-center p-6 text-center animate-in fade-in zoom-in duration-200">
                        <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4 text-red-600">
                            <AlertTriangle size={24} />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">Delete Account?</h3>
                        <p className="text-sm text-gray-500 mb-6">
                            This action cannot be undone. All your transactions, reminders, and personal data will be permanently wiped.
                        </p>
                        <div className="flex flex-col gap-3 w-full">
                            <button
                                onClick={handleDeleteAccount}
                                disabled={deleteLoading}
                                className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg shadow-sm transition-colors flex items-center justify-center gap-2"
                            >
                                {deleteLoading ? <Loader2 className="animate-spin" size={18} /> : <Trash2 size={18} />}
                                Yes, Delete Everything
                            </button>
                            <button
                                onClick={() => setShowDeleteConfirm(false)}
                                disabled={deleteLoading}
                                className="w-full px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
