import { useState, useEffect } from 'react';
import { Keyboard, KeyboardResize } from '@capacitor/keyboard';
import { Capacitor } from '@capacitor/core';

export function useKeyboardHeight() {
    const [keyboardHeight, setKeyboardHeight] = useState(0);
    const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);

    useEffect(() => {
        if (!Capacitor.isNativePlatform()) return;

        Keyboard.addListener('keyboardWillShow', info => {
            setKeyboardHeight(info.keyboardHeight);
            setIsKeyboardOpen(true);
        });

        Keyboard.addListener('keyboardDidShow', info => {
            setKeyboardHeight(info.keyboardHeight);
            setIsKeyboardOpen(true);
        });

        Keyboard.addListener('keyboardWillHide', () => {
            setKeyboardHeight(0);
            setIsKeyboardOpen(false);
        });

        Keyboard.addListener('keyboardDidHide', () => {
            setKeyboardHeight(0);
            setIsKeyboardOpen(false);
        });

        return () => {
            Keyboard.removeAllListeners();
        };
    }, []);

    return { keyboardHeight, isKeyboardOpen };
}
