"use client";

import { createContext, useContext, useEffect, useState } from "react";
import {
    onAuthStateChanged,
    signOut,
    User,
    setPersistence,
    browserLocalPersistence,
    signInWithPopup,
    GoogleAuthProvider
} from "firebase/auth";
import { toast } from "sonner";
import { auth, db } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { UserService } from "@/services/UserService";

interface AuthContextType {
    user: User | null;
    role: string | null;
    status: string | null;
    loading: boolean;
    logout: () => Promise<void>;
    signInWithGoogle: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthContextProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [role, setRole] = useState<string | null>(null);
    const [status, setStatus] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    // Session Persistence Logic
    useEffect(() => {
        if (!auth) {
            setLoading(false);
            return;
        }

        // Set persistence to LOCAL (keeps user logged in across restarts)
        // detailed here: https://firebase.google.com/docs/auth/web/auth-state-persistence
        setPersistence(auth, browserLocalPersistence)
            .then(() => {
                const unsubscribe = onAuthStateChanged(auth!, async (currentUser) => {
                    if (currentUser) {
                        if (db) {
                            try {
                                const userProfile = await UserService.getUserProfile(currentUser.uid);

                                if (userProfile) {
                                    if (userProfile.status === 'suspended') {
                                        toast.error("Your account has been suspended by an administrator.");
                                        if (auth) await signOut(auth);
                                        setUser(null);
                                        setRole(null);
                                        setStatus('suspended');
                                        setLoading(false);
                                        router.push("/login");
                                        return;
                                    }

                                    setUser(currentUser);
                                    setRole(userProfile.role);
                                    setStatus(userProfile.status || 'active');

                                    await UserService.syncUserProfile(currentUser.uid, {
                                        displayName: currentUser.displayName || userProfile.displayName || null,
                                        email: currentUser.email || userProfile.email || null,
                                        phoneNumber: currentUser.phoneNumber || userProfile.phoneNumber || null,
                                        photoURL: currentUser.photoURL || userProfile.photoURL || null,
                                        lastLoginAt: new Date()
                                    });
                                } else {
                                    const { role: newRole, phoneNumber: newPhone } = await UserService.checkInviteAndSetRole(currentUser.email || "");

                                    setUser(currentUser);
                                    setRole(newRole);
                                    setStatus('active');

                                    await UserService.syncUserProfile(currentUser.uid, {
                                        email: currentUser.email,
                                        displayName: currentUser.displayName || null,
                                        photoURL: currentUser.photoURL || null,
                                        role: newRole,
                                        status: 'active',
                                        phoneNumber: newPhone || currentUser.phoneNumber || null,
                                        createdAt: new Date(),
                                        lastLoginAt: new Date()
                                    });
                                }
                            } catch (e) {
                                console.error("Error fetching user profile", e);
                            }
                        }
                    } else {
                        setUser(null);
                        setRole(null);
                        setStatus(null);
                    }
                    setLoading(false);
                });
                return () => unsubscribe();
            })
            .catch((error) => {
                console.error("Error setting persistence", error);
                setLoading(false);
            });
    }, []);

    const signInWithGoogle = async () => {
        if (!auth) {
            console.error("Firebase Auth not initialized");
            toast.error("Authentication Service Unavailable");
            return;
        }
        const provider = new GoogleAuthProvider();
        try {
            await signInWithPopup(auth, provider);
            localStorage.setItem("lastActive", Date.now().toString());
            router.push("/");
        } catch (error: any) {
            console.error("Login Failed", error);
            if (error.code === 'auth/operation-not-allowed') {
                toast.error("Google Sign-In is disabled in Firebase Console.");
            } else if (error.code === 'auth/popup-closed-by-user') {
                toast.info("Sign-in cancelled");
            } else {
                toast.error(`Login Failed: ${error.message}`);
            }
        }
    };

    const logout = async () => {
        if (!auth) return;
        try {
            await signOut(auth);
            localStorage.removeItem("lastActive"); // Clear activity on logout
            router.push("/");
        } catch (error) {
            console.error("Error signing out", error);
        }
    };

    // Inactivity Timeout (48 Hours)
    useEffect(() => {
        if (!user) return; // Only track when logged in

        const TIMEOUT_MS = 48 * 60 * 60 * 1000; // 48 hours
        const CHECK_INTERVAL_MS = 60 * 1000; // Check every 1 minute

        const updateLastActive = () => {
            localStorage.setItem("lastActive", Date.now().toString());
        };

        const checkInactivity = () => {
            const lastActive = localStorage.getItem("lastActive");
            if (lastActive) {
                const elapsed = Date.now() - parseInt(lastActive, 10);
                if (elapsed > TIMEOUT_MS) {
                    console.log("Session timed out due to inactivity");
                    toast.info("Session expired due to inactivity");
                    logout();
                }
            } else {
                updateLastActive();
            }
        };

        // Initial check
        checkInactivity();

        // Activity Listeners (Throttled)
        let activityTimer: NodeJS.Timeout | null = null;
        const onActivity = () => {
            if (!activityTimer) {
                activityTimer = setTimeout(() => {
                    updateLastActive();
                    activityTimer = null;
                }, 1000);
            }
        };

        const events = ["mousemove", "keydown", "click", "scroll", "touchstart"];
        events.forEach(event => window.addEventListener(event, onActivity));

        const intervalId = setInterval(checkInactivity, CHECK_INTERVAL_MS);

        return () => {
            events.forEach(event => window.removeEventListener(event, onActivity));
            clearInterval(intervalId);
            if (activityTimer) clearTimeout(activityTimer);
        };
    }, [user, logout]); // Re-run if user changes (login/logout)

    return (
        <AuthContext.Provider value={{ user, role, status, loading, signInWithGoogle, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
