import { useEffect } from 'react';

/**
 * Auto-cleanup hook - runs on app startup
 * Validates localStorage and clears corrupted data
 */
export function useAutoCleanup() {
    useEffect(() => {
        try {
            // Check installed_app data
            const savedApp = localStorage.getItem('installed_app');

            if (savedApp) {
                const appData = JSON.parse(savedApp);

                // Validate - if it has invalid package name, clear it
                if (!appData.package_name ||
                    appData.package_name === 'com.app' ||
                    appData.package_name.length < 5 ||
                    !appData.activity) {

                    console.log('[Auto-Cleanup] Invalid app data detected, clearing...');
                    localStorage.removeItem('installed_app');
                    console.log('[Auto-Cleanup] ✅ Cleaned up!');
                }
            }
        } catch (error) {
            // If any error parsing, just clear it
            console.log('[Auto-Cleanup] Error detected, clearing localStorage...');
            localStorage.removeItem('installed_app');
        }
    }, []);
}
