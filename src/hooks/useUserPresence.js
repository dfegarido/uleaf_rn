import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { API_ENDPOINTS } from '../config/apiConfig';
import { getStoredAuthToken } from '../utils/getStoredAuthToken';

/**
 * Track the user's online/active presence.
 *
 * WHY
 * This used to write the Firestore `userPresence` collection, while chat data
 * lives in Supabase — a second auth story and a second store to keep alive for a
 * single green dot. It now writes the Supabase `chat_presence` table through the
 * `chat-presence` Edge Function.
 *
 * CONTRACT PRESERVED: same timing as before — online immediately, refreshed every
 * 2 minutes while the app is active, set offline when it backgrounds or unmounts.
 * The reader applies the same "online, or seen within 5 minutes" rule, so what
 * counts as active in the UI does not change.
 *
 * @param {string} userId - Current user's UID
 */
export const useUserPresence = (userId) => {
  const presenceIntervalRef = useRef(null);
  const appStateRef = useRef(AppState.currentState);

  useEffect(() => {
    if (!userId) return;

    let cancelled = false;

    const setPresence = async (isOnline) => {
      try {
        const token = await getStoredAuthToken();
        const res = await fetch(API_ENDPOINTS.CHAT_PRESENCE, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ uid: userId, isOnline }),
        });
        if (!res.ok) {
          const text = await res.text();
          throw new Error(`Error ${res.status}: ${text}`);
        }
      } catch (error) {
        // Presence is cosmetic; never let it surface as a user-facing error.
        console.log(`Error setting presence (${isOnline ? 'online' : 'offline'}):`, error.message);
      }
    };

    if (!cancelled) setPresence(true);

    // Refresh every 2 minutes so the "recently active" window stays open.
    presenceIntervalRef.current = setInterval(() => {
      if (appStateRef.current === 'active' && !cancelled) {
        setPresence(true);
      }
    }, 2 * 60 * 1000);

    const handleAppStateChange = (nextAppState) => {
      if (cancelled) return;
      if (appStateRef.current.match(/inactive|background/) && nextAppState === 'active') {
        setPresence(true);
      } else if (appStateRef.current === 'active' && nextAppState.match(/inactive|background/)) {
        setPresence(false);
      }
      appStateRef.current = nextAppState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      cancelled = true;
      if (presenceIntervalRef.current) {
        clearInterval(presenceIntervalRef.current);
      }
      if (subscription) {
        subscription.remove();
      }
      setPresence(false);
    };
  }, [userId]);
};
