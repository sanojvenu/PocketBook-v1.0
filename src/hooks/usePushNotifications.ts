import { useEffect } from 'react';
import { PushNotifications } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';
import { toast } from 'sonner';

export const usePushNotifications = () => {
    useEffect(() => {
        if (Capacitor.getPlatform() !== 'web') {
            const registerPushNotifications = async () => {
                let permStatus = await PushNotifications.checkPermissions();

                if (permStatus.receive === 'prompt') {
                    permStatus = await PushNotifications.requestPermissions();
                }

                if (permStatus.receive !== 'granted') {
                    console.error('User denied permissions!');
                    return;
                }

                await PushNotifications.register();
            };

            registerPushNotifications();

            PushNotifications.addListener('registration', (token) => {
                console.log('Push registration success, token: ' + token.value);
            });

            PushNotifications.addListener('registrationError', (error) => {
                console.error('Error on registration: ' + JSON.stringify(error));
            });

            PushNotifications.addListener('pushNotificationReceived', (notification) => {
                console.log('Push received: ' + JSON.stringify(notification));
                toast(notification.title || 'New Notification', {
                    description: notification.body,
                });
            });

            PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
                console.log('Push action performed: ' + JSON.stringify(notification));
            });
        }
    }, []);
};
