"use client";

import { useEffect, useState } from 'react';
import { getToken, onMessage } from 'firebase/messaging';
import { messaging } from '@/lib/firebase';
import { toast } from 'sonner';

import { Capacitor } from '@capacitor/core';

const useFcmToken = () => {
    const [token, setToken] = useState<string | null>(null);
    const [notificationPermissionStatus, setNotificationPermissionStatus] = useState<NotificationPermission>('default');

    useEffect(() => {
        const retrieveToken = async () => {
            // Skip on native platform to avoid prompt
            if (Capacitor.isNativePlatform()) {
                return;
            }

            try {
                if (typeof window !== 'undefined' && 'serviceWorker' in navigator && messaging) {
                    const permission = await Notification.requestPermission();
                    setNotificationPermissionStatus(permission);

                    if (permission === 'granted') {
                        console.log('Notification permission granted.');
                        const currentToken = await getToken(messaging, {
                            vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY
                        });

                        if (currentToken) {
                            setToken(currentToken);
                            console.log('FCM Token:', currentToken);
                            // TODO: Send this token to backend/Firestore
                        } else {
                            console.log('No registration token available. Request permission to generate one.');
                        }
                    } else {
                        console.log('Notification permission denied');
                    }
                }
            } catch (error) {
                console.error('An error occurred while retrieving token:', error);
            }
        };

        retrieveToken();
    }, []);

    useEffect(() => {
        if (typeof window !== 'undefined' && messaging) {
            const unsubscribe = onMessage(messaging, (payload) => {
                console.log('Foreground Message received', payload);
                toast.info(payload.notification?.title || 'New Message', {
                    description: payload.notification?.body,
                });
            });

            return () => unsubscribe();
        }
    }, [token]); // Re-run if token changes, though messaging instance is stable

    return { token, notificationPermissionStatus };
};

export default useFcmToken;
