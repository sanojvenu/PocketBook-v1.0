'use client';

import { useEffect, useState } from 'react';
import { SplashScreen } from '@capacitor/splash-screen';
import { Capacitor } from '@capacitor/core';
import { useAuth } from '@/context/AuthContext';
import { usePushNotifications } from '@/hooks/usePushNotifications';

const SPLASH_IMAGES = [
    '/splash-1.png',
    '/splash-2.png',
    '/splash-3.png'
];

const SPLASH_DURATION = 800; // ms per image

export default function AppInitializer() {
    usePushNotifications();
    const { loading } = useAuth();
    const [showSplash, setShowSplash] = useState(Capacitor.isNativePlatform());
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [isFading, setIsFading] = useState(false);
    const [slideshowFinished, setSlideshowFinished] = useState(false);

    useEffect(() => {
        if (!Capacitor.isNativePlatform()) return;

        const initApp = async () => {
            try {
                await SplashScreen.hide();
            } catch (e) {
                console.warn("SplashScreen plugin error", e);
            }

            const interval = setInterval(() => {
                setCurrentImageIndex(prev => {
                    if (prev < SPLASH_IMAGES.length - 1) {
                        return prev + 1;
                    } else {
                        clearInterval(interval);
                        setSlideshowFinished(true);
                        return prev;
                    }
                });
            }, SPLASH_DURATION);

            return () => clearInterval(interval);
        };

        initApp();
    }, []);

    // Only hide splash when BOTH slideshow is done AND auth is valid (or at least loaded)
    useEffect(() => {
        if (slideshowFinished && !loading) {
            setIsFading(true);
            const timeout = setTimeout(() => setShowSplash(false), 500);
            return () => clearTimeout(timeout);
        }
    }, [slideshowFinished, loading]);


    // Use App plugin from Capacitor
    useEffect(() => {
        if (!Capacitor.isNativePlatform()) return;

        let backButtonListener: any;

        import('@capacitor/app').then(({ App }) => {
            backButtonListener = App.addListener('backButton', ({ canGoBack }) => {
                // Normalize path by removing trailing slash for consistent matching
                const path = window.location.pathname.replace(/\/$/, "") || '/';
                const hash = window.location.hash;
                const isChatOpen = (window as any).isPbookChatOpen;
                // Check Menu Flag
                const isMenuOpen = (window as any).isPbookMenuOpen;

                console.log(`[BackButton] Path: ${path}, Hash: ${hash}, Chat: ${isChatOpen}, Menu: ${isMenuOpen}`);

                // Routes that should exit the app when back is pressed (if no modal/hash is open)
                const exitRoutes = ['/', '/login', '/dashboard'];

                // Check if we are on an exit route
                const isExitRoute = exitRoutes.includes(path);

                if (isChatOpen) {
                    console.log("[BackButton] Chat Open -> Closing via history.back()");
                    window.history.back();
                    return;
                }

                if (isMenuOpen) {
                    console.log("[BackButton] Menu Open -> Dispatching close-menu event");
                    // Dispatch event because Menu isn't using hash state
                    window.dispatchEvent(new Event('close-menu'));
                    return;
                }

                // logic:
                // 1. If we have a hash (like #chat, #settings), just go back (closes modal)
                // 2. If we are on an exit route and NO hash, exit app
                // 3. Otherwise, just go back (navigate history)

                if (hash) {
                    console.log("[BackButton] Hash present -> history.back()");
                    window.history.back();
                } else if (isExitRoute) {
                    console.log("[BackButton] Exit route detected -> App.exitApp()");
                    App.exitApp();
                } else {
                    console.log("[BackButton] Default -> history.back()");
                    window.history.back();
                }
            });
        });

        return () => {
            if (backButtonListener) {
                backButtonListener.then((listener: any) => listener.remove());
            }
        };
    }, []);

    if (!showSplash) return null;

    return (
        <div
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                backgroundColor: '#ffffff',
                zIndex: 9999,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'opacity 0.5s ease-out',
                opacity: isFading ? 0 : 1,
            }}
        >
            {SPLASH_IMAGES.map((src, index) => (
                <img
                    key={src}
                    src={src}
                    alt={`PocketBook Splash ${index + 1}`}
                    style={{
                        display: index === currentImageIndex ? 'block' : 'none',
                        maxWidth: '100%',
                        maxHeight: '100%',
                        objectFit: 'cover',
                        width: '100%',
                        height: '100%'
                    }}
                />
            ))}
        </div>
    );
}
