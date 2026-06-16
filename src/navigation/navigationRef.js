import { createNavigationContainerRef } from '@react-navigation/native';

// Module-level singleton ref. AppNavigation passes it to <NavigationContainer ref={navigationRef}>.
// NotificationService uses it to deep-link from a notification tap.
export const navigationRef = createNavigationContainerRef();
