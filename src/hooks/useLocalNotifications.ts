import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';
import { useCallback } from 'react';

export const useLocalNotifications = () => {

    const requestPermissions = useCallback(async () => {
        if (Capacitor.getPlatform() !== 'web') {
            const result = await LocalNotifications.requestPermissions();
            return result.display === 'granted';
        }
        return true;
    }, []);

    const scheduleNotification = useCallback(async (reminder: { id: string, title: string, amount: number, date: any, time?: string }) => {
        if (Capacitor.getPlatform() === 'web') return;

        const hashCode = (s: string) => {
            let h = 0, l = s.length, i = 0;
            if (l > 0)
                while (i < l)
                    h = (h << 5) - h + s.charCodeAt(i++) | 0;
            return Math.abs(h);
        };

        const id9am = hashCode(reminder.id + "_9am");
        const idTime = hashCode(reminder.id + "_time");

        const now = new Date();
        const notificationsToSchedule = [];

        // --- 1. Morning Summary (9 AM) ---
        let date9am = new Date();
        if (reminder.date?.toDate) date9am = reminder.date.toDate();
        else if (typeof reminder.date === 'string') date9am = new Date(reminder.date);
        else if (reminder.date instanceof Date) date9am = new Date(reminder.date);

        // Reset to 9 AM
        if (date9am) date9am.setHours(9, 0, 0, 0);

        if (date9am.getTime() < now.getTime()) {
            if (date9am.toDateString() === now.toDateString()) {
                // If 9 AM passed today, schedule for immediate (1 min from now)
                console.log("9 AM passed for today, scheduling summary for 1 min from now.");
                date9am = new Date(now.getTime() + 60 * 1000);
            } else {
                // Past date (yesterday or earlier), skip 9am summary
                console.log("Skipping 9 AM summary for past date", date9am);
                date9am = null as any;
            }
        }

        if (date9am) {
            notificationsToSchedule.push({
                title: "Payment Reminder 🔔",
                body: `Today: ${reminder.title} - ₹${reminder.amount}`,
                id: id9am,
                schedule: { at: date9am, allowWhileIdle: true },
                channelId: 'reminders',
                sound: "beep.wav",
                actionTypeId: "",
                extra: { url: '/reminders' }
            });
        }

        // --- 2. Specific Time Alert ---
        if (reminder.time) {
            let dateTime = new Date();
            if (reminder.date?.toDate) dateTime = reminder.date.toDate();
            else if (typeof reminder.date === 'string') dateTime = new Date(reminder.date);
            else if (reminder.date instanceof Date) dateTime = new Date(reminder.date);

            const [hours, minutes] = reminder.time.split(':').map(Number);
            if (dateTime) dateTime.setHours(hours, minutes, 0, 0);

            if (dateTime.getTime() > now.getTime()) {
                notificationsToSchedule.push({
                    title: "Due Now ⏰",
                    body: `${reminder.title} - ₹${reminder.amount}`,
                    id: idTime,
                    schedule: { at: dateTime, allowWhileIdle: true },
                    channelId: 'reminders',
                    sound: "beep.wav",
                    actionTypeId: "",
                    extra: { url: '/reminders' }
                });
            } else {
                console.log("Specific time already passed", dateTime);
            }
        }

        try {
            // Ensure channel exists
            await LocalNotifications.createChannel({
                id: 'reminders',
                name: 'Reminders',
                description: 'Notifications for payment reminders',
                importance: 5,
                visibility: 1,
                vibration: true,
            });

            if (notificationsToSchedule.length > 0) {
                await LocalNotifications.schedule({ notifications: notificationsToSchedule });
                console.log(`Scheduled ${notificationsToSchedule.length} notifications for ${reminder.title}`);
            }
        } catch (e) {
            console.error("Failed to schedule notification", e);
        }
    }, []);

    const cancelNotification = useCallback(async (reminderId: string) => {
        if (Capacitor.getPlatform() === 'web') return;

        const hashCode = (s: string) => {
            let h = 0, l = s.length, i = 0;
            if (l > 0)
                while (i < l)
                    h = (h << 5) - h + s.charCodeAt(i++) | 0;
            return Math.abs(h);
        };

        const idLegacy = hashCode(reminderId);
        const id9am = hashCode(reminderId + "_9am");
        const idTime = hashCode(reminderId + "_time");

        try {
            // Cancel all potential variants
            await LocalNotifications.cancel({ notifications: [{ id: idLegacy }, { id: id9am }, { id: idTime }] });
            console.log("Cancelled notifications for", reminderId);
        } catch (e) {
            console.error("Failed to cancel notification", e);
        }
    }, []);

    const scheduleWeeklyHealthCheck = useCallback(async (score: number, status: string) => {
        if (Capacitor.getPlatform() === 'web') return;

        try {
            await LocalNotifications.createChannel({
                id: 'insights',
                name: 'Financial Insights',
                description: 'Weekly health score and proactive tips',
                importance: 4,
                visibility: 1,
            });

            // Schedule for Sunday at 10 AM
            const now = new Date();
            let nextSunday = new Date();
            nextSunday.setDate(now.getDate() + (7 - now.getDay()));
            nextSunday.setHours(10, 0, 0, 0);

            // If today is Sunday and it's past 10 AM, schedule for next week
            if (now.getDay() === 0 && now.getHours() >= 10) {
                nextSunday.setDate(nextSunday.getDate() + 7);
            }

            // Cancel existing weekly insight first to avoid duplicates
            await LocalNotifications.cancel({ notifications: [{ id: 999 }] });

            let emoji = '📈';
            if (score >= 80) emoji = '🌟';
            else if (score < 50) emoji = '⚠️';

            await LocalNotifications.schedule({
                notifications: [{
                    title: `Weekly Financial Health ${emoji}`,
                    body: `Your score is ${score}/100 (${status}). Tap to see what you can improve!`,
                    id: 999,
                    schedule: { at: nextSunday, repeats: true },
                    channelId: 'insights',
                    extra: { url: '/chat' }
                }]
            });
            console.log("Scheduled weekly health check for", nextSunday);

        } catch (e) {
            console.error("Failed to schedule health check notification", e);
        }
    }, []);

    return { requestPermissions, scheduleNotification, cancelNotification, scheduleWeeklyHealthCheck };
};
