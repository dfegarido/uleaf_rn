import { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AuthContext } from '../auth/AuthProvider';
import { getChatsApi } from '../components/Api/chatApi';

/**
 * Custom hook to track unread message count for the current user.
 * Returns the total number of chats with unread messages.
 *
 * WHY THIS IS A POLL, NOT A SUBSCRIPTION
 * This used to be a Firestore `onSnapshot` on the `chats` collection. Chat data
 * moved to Supabase, and `chats` is deliberately NOT in the Supabase realtime
 * publication (migration 026: only `messages` needs to stream — adding `chats`
 * would mean an RLS/publication change for one badge). So the count comes from the
 * `chats` Edge Function instead.
 *
 * Trade-off, stated plainly: the badge updates on an interval rather than in real
 * time. `messages` still streams live inside an open chat, so conversations are
 * unaffected — only the tab badge lags by up to UNREAD_POLL_MS.
 *
 * The count itself is computed server-side (`unreadChatCount`), BEFORE the
 * endpoint filters chat-shop groups out of the Rooms list. Counting client-side
 * from `memberChats` would miss shop groups that carry unread flags.
 */

/** Poll cadence — badge latency is at most this. */
const UNREAD_POLL_MS = 60000;

/** Coalesce rapid updates -> fewer React commits (thermal). */
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

    let cancelled = false;

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

    const fetchCount = async () => {
      try {
        const res = await getChatsApi();
        if (cancelled) return;

        if (!res?.success) {
          // Transient failure: keep the last known count rather than flapping the
          // badge to 0, which looks like the messages were lost.
          setLoading(false);
          return;
        }

        // Server-computed, includes chat-shop groups (see the endpoint's note).
        if (typeof res?.data?.unreadChatCount === 'number') {
          scheduleEmitCount(res.data.unreadChatCount);
          return;
        }

        // Defensive fallback if the field is ever absent: count the returned
        // chats client-side. Under-counts shop groups, but better than 0.
        const chats = [
          ...(res.memberChats || []),
          ...(res.adminGroupChats || []),
          ...(res.publicGroupChats || []),
        ];
        let count = 0;
        for (const chat of chats) {
          const unreadBy = chat?.unreadBy;
          let list = [];
          if (Array.isArray(unreadBy)) list = unreadBy;
          else if (typeof unreadBy === 'string') {
            try { list = JSON.parse(unreadBy) || []; } catch { list = []; }
          }
          if (Array.isArray(list) && list.map(String).includes(currentUserUid)) count++;
        }
        scheduleEmitCount(count);
      } catch (error) {
        console.error('Error computing unread messages:', error);
        if (!cancelled) setLoading(false);
      }
    };

    fetchCount();
    const interval = setInterval(fetchCount, UNREAD_POLL_MS);

    return () => {
      cancelled = true;
      clearInterval(interval);
      if (emitThrottleRef.current.timer) {
        clearTimeout(emitThrottleRef.current.timer);
        emitThrottleRef.current.timer = null;
      }
    };
  }, [currentUserUid]);

  return { unreadCount, loading };
};
