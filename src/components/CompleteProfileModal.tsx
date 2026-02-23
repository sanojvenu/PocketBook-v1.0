"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import {
    updateProfile,
    verifyBeforeUpdateEmail
} from "firebase/auth";
import { UserService } from "@/services/UserService";
import { toast } from "sonner";
import {
    User,
    Mail,
    Loader2,
    Check
} from "lucide-react";

export default function CompleteProfileModal() {
    const { user, loading: authLoading } = useAuth();
    const [isOpen, setIsOpen] = useState(false);

    // Form States
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (!user || authLoading) return;

        // CRITICAL CHECK: Does the user have a display name?
        // Since login is Phone-only, they initially have a phoneNumber but NO displayName.
        const missingName = !user.displayName;

        if (missingName) {
            setIsOpen(true);
            // Pre-fill email if it exists (unlikely for phone auth, but possible if linked later)
            if (user.email) setEmail(user.email);
        } else {
            setIsOpen(false);
        }
    }, [user, authLoading]);

    const handleSaveProfile = async () => {
        if (!user) return;

        // Name is Mandatory
        if (!name.trim()) {
            toast.error("Please enter your full name.");
            return;
        }

        // Email is Optional, but if provided must be valid
        if (email.trim() && !email.includes('@')) {
            toast.error("Please enter a valid email address.");
            return;
        }

        setIsSaving(true);
        try {
            // 1. Update Display Name (Always)
            if (name !== user.displayName) {
                await updateProfile(user, { displayName: name });
            }

            // 2. Update Email (If provided and changed)
            if (email.trim() && email !== user.email) {
                try {
                    const actionCodeSettings = {
                        url: 'https://web.mypocketbook.in/login',
                        handleCodeInApp: true,
                    };
                    await verifyBeforeUpdateEmail(user, email, actionCodeSettings);
                    toast.success(`Verification email sent to ${email}. Please verify.`);
                } catch (emailError: any) {
                    console.error("Email verification send failed", emailError);
                    if (emailError.code === 'auth/email-already-in-use') {
                        toast.error("Email is already in use by another account.");
                    } else if (emailError.code === 'auth/requires-recent-login') {
                        toast.error("Please re-login to update email.");
                    } else {
                        console.error("Email update error:", emailError);
                        toast.warning("Could not send verification email: " + (emailError.message || "Unknown error"));
                    }
                }
            }

            // 3. Update Firestore (Always) via Service
            await UserService.syncUserProfile(user.uid, {
                displayName: name,
                email: email || user.email || null, // Create/Update
                mobile: user.phoneNumber, // Ensures mobile is synced
                updatedAt: new Date()
            });

            toast.success("Profile Setup Complete!");
            setIsOpen(false);

        } catch (error: any) {
            console.error("Profile Save Error", error);
            toast.error(error.message || "Failed to save profile.");
        } finally {
            setIsSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <div className="bg-white dark:bg-gray-900 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-blue-100 dark:border-blue-900 animate-in fade-in zoom-in duration-300">
                <div className="p-6 text-center border-b border-gray-100 dark:border-gray-800 bg-blue-50/50 dark:bg-blue-900/10">
                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-3 text-blue-600">
                        <User size={24} />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Welcome to <span className="text-[#073449]">Pocket</span><span className="text-[#F07E23]">Book</span></h2>
                    <p className="text-sm text-gray-500 mt-1 max-w-xs mx-auto">
                        Please provide your name to continue.
                    </p>
                </div>

                <div className="p-6 space-y-5">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-xs font-semibold uppercase text-gray-500">Full Name <span className="text-red-500">*</span></label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    // Removed disable logic for existing name to enforce user confirmation if they want
                                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                    placeholder="Your Name"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-semibold uppercase text-gray-500">Email Address <span className="text-xs normal-case text-gray-400">(Optional)</span></label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                    placeholder="name@example.com"
                                />
                            </div>
                        </div>

                        <button
                            onClick={handleSaveProfile}
                            disabled={isSaving}
                            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2"
                        >
                            {isSaving ? <Loader2 className="animate-spin" size={20} /> : "Continue to App"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
