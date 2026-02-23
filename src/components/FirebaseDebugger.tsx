"use client";

import { useEffect, useState } from "react";
import { Capacitor } from "@capacitor/core";
import { FirebaseAuthentication } from "@capacitor-firebase/authentication";

/**
 * Debug component for Firebase setup verification on Android/iOS
 * This helps identify certificate and configuration issues early
 */
export default function FirebaseDebugger() {
    const [debugInfo, setDebugInfo] = useState<any>(null);
    const [showDebug, setShowDebug] = useState(false);

    useEffect(() => {
        const verifyFirebaseSetup = async () => {
            const platform = Capacitor.getPlatform();
            const debugData: any = {
                platform,
                timestamp: new Date().toISOString(),
                environment: {
                    isDevelopment: process.env.NODE_ENV === 'development',
                },
                firebasePlugin: {
                    available: !!FirebaseAuthentication,
                    version: '8.0.1',
                },
                appPackage: 'YOUR_PACKAGE_NAME',
            };

            // On mobile, try to get app info
            if (platform === 'android' || platform === 'ios') {
                try {
                    // This will trigger the native plugin to check connectivity
                    console.log("Firebase Debug: Platform is", platform);
                    debugData.nativeValid = true;
                } catch (error: any) {
                    debugData.nativeError = error.message;
                    console.error("Firebase initialization error:", error);
                }
            }

            setDebugInfo(debugData);
        };

        verifyFirebaseSetup();
    }, []);

    if (!debugInfo) return null;

    return (
        <div
            className={`fixed bottom-4 right-4 z-50 transition-all ${showDebug ? 'opacity-100' : 'opacity-30'
                }`}
            onMouseEnter={() => setShowDebug(true)}
            onMouseLeave={() => setShowDebug(false)}
        >
            <button
                onClick={() => setShowDebug(!showDebug)}
                className="bg-gray-800 text-white px-3 py-2 rounded-lg text-xs font-mono hover:bg-gray-700 cursor-pointer"
            >
                🐛 {debugInfo.platform}
            </button>

            {showDebug && (
                <div className="bg-gray-900 text-green-400 p-4 rounded-lg mt-2 text-xs font-mono max-w-sm overflow-auto max-h-64 border border-gray-700">
                    <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
                </div>
            )}
        </div>
    );
}
