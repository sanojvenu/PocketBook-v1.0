"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { LocalNotifications } from "@capacitor/local-notifications";
import { Capacitor } from "@capacitor/core";

export default function NotificationListener() {
    const router = useRouter();

    useEffect(() => {
        if (Capacitor.getPlatform() === 'web') return;

        const setupListener = async () => {
            await LocalNotifications.addListener('localNotificationActionPerformed', (notification) => {
                const url = notification.notification.extra?.url;
                if (url) {
                    router.push(url);
                }
            });
        };

        setupListener();

        return () => {
            LocalNotifications.removeAllListeners();
        };
    }, [router]);

    return null;
}
