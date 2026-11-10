import AsyncStorage from '@react-native-async-storage/async-storage';
import {jwtDecode} from 'jwt-decode';
import { auth } from '../../firebase';

// On a cold start Firebase restores the persisted user asynchronously, so
// auth.currentUser is null for a moment. Without waiting, an expired stored token
// made us return null and the first API calls went out as "Bearer null"
// (backend: 500 "Invalid JWT format").
const AUTH_RESTORE_TIMEOUT_MS = 5000;

const waitForAuthRestore = () =>
  new Promise(resolve => {
    const timer = setTimeout(resolve, AUTH_RESTORE_TIMEOUT_MS);
    auth
      .authStateReady()
      .catch(() => {})
      .finally(() => {
        clearTimeout(timer);
        resolve();
      });
  });

export const getStoredAuthToken = async () => {
  const token = await AsyncStorage.getItem('authToken');
  if (!token) return null;

  const decoded = jwtDecode(token);
  const now = Math.floor(Date.now() / 1000);

  if (decoded.exp < now) {
    if (!auth) return null;
    if (!auth.currentUser) await waitForAuthRestore();

    const user = auth.currentUser;
    if (!user) return null;

    // No force refresh: the SDK refreshes an expired token itself, and the many
    // calls made at startup then share one refresh instead of each forcing one.
    const freshToken = await user.getIdToken();
    await AsyncStorage.setItem('authToken', freshToken);
    return freshToken;
  }

  return token;
};
