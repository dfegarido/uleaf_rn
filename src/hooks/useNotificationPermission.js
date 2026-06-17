import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getMessaging, hasPermission, requestPermission } from '@react-native-firebase/messaging';

const messaging = getMessaging();

const DENIED_KEY = 'notifications.denied';
const DISABLED_KEY = 'notifications.disabled';

// 'unknown' = never asked; 'granted' = OS authorized; 'denied' = user said no.
// `disabled` is an independent in-app preference: when true, the FCM token is
// not registered on login and is removed from Firestore so the user stops
// receiving pushes without having to dig into OS Settings.
export function useNotificationPermission() {
  const [status, setStatus] = useState('unknown');
  const [disabled, setDisabledState] = useState(false);

  useEffect(() => {
    (async () => {
      const denied = await AsyncStorage.getItem(DENIED_KEY);
      if (denied === 'true') {
        setStatus('denied');
      } else {
        const s = await hasPermission(messaging);
        // 1 = AUTHORIZED, 2 = PROVISIONAL
        setStatus(s === 1 || s === 2 ? 'granted' : 'unknown');
      }

      const disabledFlag = await AsyncStorage.getItem(DISABLED_KEY);
      setDisabledState(disabledFlag === 'true');
    })();
  }, []);

  const request = useCallback(async () => {
    const s = await requestPermission(messaging);
    if (s === 1 || s === 2) {
      setStatus('granted');
      await AsyncStorage.removeItem(DENIED_KEY);
    } else {
      setStatus('denied');
      await AsyncStorage.setItem(DENIED_KEY, 'true');
    }
    return s;
  }, []);

  const setDisabled = useCallback(async (next) => {
    if (next) {
      await AsyncStorage.setItem(DISABLED_KEY, 'true');
    } else {
      await AsyncStorage.removeItem(DISABLED_KEY);
    }
    setDisabledState(next);
  }, []);

  return { status, request, disabled, setDisabled };
}
