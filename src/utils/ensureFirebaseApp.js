// firebaseHelper.js (React Native Firebase version)
import { getApp, getApps, initializeApp } from '@react-native-firebase/app';

export const ensureFirebaseApp = () => {
  if (getApps().length === 0) {
    console.log('[Firebase] Initializing app');
    return initializeApp();
  }
  return getApp();
};
