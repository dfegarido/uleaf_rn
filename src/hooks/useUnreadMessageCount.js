import { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase';
import { AuthContext } from '../auth/AuthProvider';

/**
 * Custom hook to track unread message count for the current user
 * Returns the total number of chats with unread messages
 * Updates in real-time using Firestore listeners
 */
/** Coalesce rapid Firestore chat metadata writes → fewer React commits (thermal). */
const UNREAD_EMIT_MIN_GAP_MS = 400;

export const useUnreadMessageCount = () => {
  const { userInfo } = useContext(AuthContext);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const emitThrottleRef = useRef({ timer: null, lastEmit: 0 });

  const currentUserUid = useMemo(
    () => userInfo?.data?.uid || userInfo?.user?.uid || userInfo?.uid || '',
    [userInfo?.data?.uid, userInfo?.user?.uid, userInfo?.uid],
  );

  useEffect(() => {
    if (!currentUserUid) {
      if (emitThrottleRef.current.timer) {
        clearTimeout(emitThrottleRef.current.timer);
        emitThrottleRef.current.timer = null;
      }
      setUnreadCount(0);
      setLoading(false);
      return;
    }

    const scheduleEmitCount = (count) => {
      const now = Date.now();
      const t = emitThrottleRef.current;
      if (now - t.lastEmit >= UNREAD_EMIT_MIN_GAP_MS) {
        t.lastEmit = now;
        if (t.timer) {
          clearTimeout(t.timer);
          t.timer = null;
        }
        setUnreadCount(count);
        setLoading(false);
        return;
      }
      if (t.timer) clearTimeout(t.timer);
      t.timer = setTimeout(() => {
        t.timer = null;
        t.lastEmit = Date.now();
        setUnreadCount(count);
        setLoading(false);
      }, UNREAD_EMIT_MIN_GAP_MS);
    };

    try {
      // Query all chats where the user is a participant
      const chatsQuery = query(
        collection(db, 'chats'),
        where('participantIds', 'array-contains', currentUserUid),
      );

      // Subscribe to real-time updates
      const unsubscribe = onSnapshot(
        chatsQuery,
        (snapshot) => {
          try {
            let count = 0;
            snapshot.forEach((doc) => {
              const chatData = doc.data();
              const unreadBy = chatData.unreadBy || [];
              
              // Check if current user is in the unreadBy array
              if (Array.isArray(unreadBy) && unreadBy.includes(currentUserUid)) {
                count++;
              }
            });

            scheduleEmitCount(count);
          } catch (error) {
            console.error('Error processing unread messages:', error);
            if (emitThrottleRef.current.timer) {
              clearTimeout(emitThrottleRef.current.timer);
              emitThrottleRef.current.timer = null;
            }
            setUnreadCount(0);
            setLoading(false);
          }
        },
        (error) => {
          console.error('Error listening to unread messages:', error);
          if (emitThrottleRef.current.timer) {
            clearTimeout(emitThrottleRef.current.timer);
            emitThrottleRef.current.timer = null;
          }
          setUnreadCount(0);
          setLoading(false);
        }
      );

      // Cleanup subscription on unmount
      return () => {
        if (emitThrottleRef.current.timer) {
          clearTimeout(emitThrottleRef.current.timer);
          emitThrottleRef.current.timer = null;
        }
        unsubscribe();
      };
    } catch (error) {
      console.error('Error setting up unread message listener:', error);
      setUnreadCount(0);
      setLoading(false);
    }
  }, [currentUserUid]);

  return { unreadCount, loading };
};

