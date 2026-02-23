"use client";

import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { toast } from "sonner";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Loader2 } from "lucide-react";

export default function GoogleLoginPage() {
    const { user, signInWithGoogle, loading } = useAuth();
    const router = useRouter();
    const [pageLoading, setPageLoading] = useState(true);
    const toastShownRef = useRef(false);

    useEffect(() => {
        let isMounted = true;
        const checkFeatureFlag = async () => {
            if (!db) {
                if (isMounted) setPageLoading(false);
                return;
            }
            try {
                const docRef = doc(db, "settings", "global");
                const docSnap = await getDoc(docRef);

                if (docSnap.exists() && isMounted) {
                    const isEnabled = docSnap.data().googleAuthEnabled;
                    // Only redirect if explicitly set to false
                    if (isEnabled === false && !toastShownRef.current) {
                        toastShownRef.current = true;
                        toast.error("Google Login is currently disabled.");
                        router.replace("/login");
                        return;
                    }
                }
            } catch (e) {
                console.error("Feature Flag check failed", e);
            } finally {
                if (isMounted) {
                    setPageLoading(false);
                }
            }
        };

        checkFeatureFlag();

        return () => { isMounted = false; };
    }, [router]);

    useEffect(() => {
        if (!loading && user) {
            router.replace("/");
        }
    }, [user, loading, router]);

    if (loading || pageLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <div className="glass-panel p-8 max-w-md w-full text-center space-y-8">
                <div className="flex justify-center mb-6">
                    <img
                        src="/logo-new.png"
                        alt="PocketBook"
                        className="w-24 h-24 rounded-2xl shadow-xl object-contain hover:scale-105 transition-transform duration-300"
                    />
                </div>

                <div className="space-y-2">
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                        PocketBook
                    </h1>
                    <p className="text-gray-500">
                        Sign in to continue
                    </p>
                </div>

                <button
                    onClick={signInWithGoogle}
                    className="w-full bg-white dark:bg-white/10 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-white/20 text-gray-800 dark:text-white font-bold py-4 rounded-xl flex items-center justify-center gap-3 transition-all shadow-sm hover:shadow-md group"
                >
                    <img src="https://www.google.com/favicon.ico" alt="Google" className="w-6 h-6 group-hover:scale-110 transition-transform" />
                    Sign in with Google
                </button>

                <div className="text-xs text-gray-400">
                    <p>Secure authentication powered by Firebase</p>
                </div>
            </div>
        </div>
    );
}
