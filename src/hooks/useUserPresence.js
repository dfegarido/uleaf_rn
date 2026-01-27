import { useEffect, useRef } from 'react';
import { doc, setDoc, Timestamp, onDisconnect, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import { AppState } from 'react-native';

/**
 * Hook to track user's online/active presence in Firestore
 * Automatically updates user's status when app is active/inactive
 * 
 * @param {string} userId - Current user's UID
 */
export const useUserPresence = (userId) => {
  const presenceIntervalRef = useRef(null);
  const appStateRef = useRef(AppState.currentState);

  useEffect(() => {
    if (!userId) return;

    const userPresenceRef = doc(db, 'userPresence', userId);

    // Function to set user as online
    const setOnline = async () => {
      try {
        await setDoc(userPresenceRef, {
          isOnline: true,
          lastSeen: Timestamp.now(),
          userId: userId,
        }, { merge: true });
      } catch (error) {
        console.log('Error setting online status:', error);
      }
    };

    // Function to set user as offline
    const setOffline = async () => {
      try {
        await setDoc(userPresenceRef, {
          isOnline: false,
          lastSeen: Timestamp.now(),
        }, { merge: true });
      } catch (error) {
        console.log('Error setting offline status:', error);
      }
    };

    // Set online immediately
    setOnline();

    // Update presence every 2 minutes to keep "active" status
    presenceIntervalRef.current = setInterval(() => {
      if (appStateRef.current === 'active') {
        setOnline();
      }
    }, 2 * 60 * 1000); // 2 minutes

    // Handle app state changes
    const handleAppStateChange = (nextAppState) => {
      if (appStateRef.current.match(/inactive|background/) && nextAppState === 'active') {
        // App came to foreground
        setOnline();
      } else if (appStateRef.current === 'active' && nextAppState.match(/inactive|background/)) {
        // App went to background
        setOffline();
      }
      appStateRef.current = nextAppState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    // Cleanup
    return () => {
      if (presenceIntervalRef.current) {
        clearInterval(presenceIntervalRef.current);
      }
      if (subscription) {
        subscription.remove();
      }
      // Set offline when component unmounts
      setOffline();
    };
  }, [userId]);
};
