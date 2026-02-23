import { useState, useEffect } from 'react';

export function useVisualViewport() {
    const [viewportHeight, setViewportHeight] = useState<number>(0);

    useEffect(() => {
        // Initialize with current window height
        setViewportHeight(window.innerHeight);

        const handleResize = () => {
            // Visual Viewport API is more reliable for mobile keyboards
            if (window.visualViewport) {
                setViewportHeight(window.visualViewport.height);
            } else {
                setViewportHeight(window.innerHeight);
            }
        };

        // Initial check
        handleResize();

        // Add listeners
        if (window.visualViewport) {
            window.visualViewport.addEventListener('resize', handleResize);
            window.visualViewport.addEventListener('scroll', handleResize);
        } else {
            window.addEventListener('resize', handleResize);
        }

        return () => {
            if (window.visualViewport) {
                window.visualViewport.removeEventListener('resize', handleResize);
                window.visualViewport.removeEventListener('scroll', handleResize);
            } else {
                window.removeEventListener('resize', handleResize);
            }
        };
    }, []);

    return viewportHeight;
}
