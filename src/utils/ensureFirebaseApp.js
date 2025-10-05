// firebaseHelper.js (React Native Firebase version)
import { getApp, getApps } from '@react-native-firebase/app';

export const ensureFirebaseApp = () => {
  // React Native Firebase auto-initializes from GoogleService-Info.plist (iOS)
  // and google-services.json (Android)
  if (getApps().length === 0) {
    // If no app exists, there's a configuration problem
    console.error('[Firebase] No Firebase app initialized. Check GoogleService-Info.plist');
    throw new Error('Firebase not initialized. Check native configuration files.');
  }
  return getApp();
};
