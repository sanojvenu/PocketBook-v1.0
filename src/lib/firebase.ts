import { initializeApp, getApps, getApp, FirebaseOptions, FirebaseApp } from "firebase/app";
import { getFirestore, Firestore, initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from "firebase/firestore";

// Helper to get config
const getFirebaseConfig = (): FirebaseOptions => {
    // 1. Try Environment Variables first
    const envConfig = {
        apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
        authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
        appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
    };

    if (envConfig.apiKey) return envConfig as FirebaseOptions;

    // 2. Try LocalStorage (Client-side only)
    if (typeof window !== 'undefined') {
        const stored = localStorage.getItem("firebase_config_json");
        if (stored) {
            try {
                return JSON.parse(stored);
            } catch (e) {
                console.error("Invalid Firebase Config in LocalStorage");
            }
        }
    }

    return {} as FirebaseOptions; // Return empty to prevent crash, but app won't work
};

// Initialize Firebase
import { getAuth, Auth } from "firebase/auth";

// ... (imports)

// Initialize Firebase
let app: FirebaseApp | undefined;
let db: Firestore | undefined;
let auth: Auth | undefined;

// Initialize Messaging
import { getMessaging, Messaging } from "firebase/messaging";

let messaging: Messaging | undefined;

try {
    const config = getFirebaseConfig();
    if (config.apiKey && config.projectId) {
        app = !getApps().length ? initializeApp(config) : getApp();

        // Initialize Firestore with persistent cache
        db = initializeFirestore(app, {
            localCache: persistentLocalCache({
                tabManager: persistentMultipleTabManager()
            })
        });

        auth = getAuth(app);

        // Initialize Messaging (Client-side only)
        if (typeof window !== 'undefined') {
            try {
                messaging = getMessaging(app);
            } catch (err) {
                console.error("Firebase Messaging Initialization Error:", err);
            }
        }
    } else {
        console.warn("Firebase not initialized: Missing Config (apiKey or projectId)");
        console.log("Environment Keys Check:", {
            apiKey: !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
            projectId: !!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
        });
    }
} catch (e) {
    console.error("Firebase Initialization Error:", e);
}

export { app, db, auth, messaging };
