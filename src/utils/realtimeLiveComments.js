import { createClient } from '@supabase/supabase-js';
import { setupURLPolyfill } from 'react-native-url-polyfill';
import { getBridgeJwt } from './realtimeChat';

// React Native's built-in URL has a getter-only `protocol`, but
// @supabase/supabase-js assigns `realtimeUrl.protocol = ...` when constructing
// the client, which throws. Replace the global URL with the WHATWG polyfill
// (writable protocol) before use.
setupURLPolyfill();

/**
 * Realtime LIVE CHAT client — postgres_changes on `live_comments`, filtered by
 * live_id. Same bridge-JWT pattern as realtimeChat.js (`messages`) and
 * realtimeLive.js (`live`); the token mint is shared with realtimeChat so both
 * screens reuse one cached JWT instead of each minting their own.
 *
 * Server side must already be in place (migration 033_live_comments_realtime.sql):
 *   * live_comments in the `supabase_realtime` publication
 *   * RLS on + `live_comments_select_authenticated` SELECT policy
 *   * GRANT SELECT to `authenticated`
 * Without all three Realtime reports SUBSCRIBED and delivers nothing.
 */

const REMOTE_SUPABASE_URL = 'https://pjcquavlxknhmuszjmyh.supabase.co';

/**
 * Publishable (client-safe) project key. The bridge JWT can NOT be used as the
 * client key: `createClient(url, key)` passes `key` to Realtime as the websocket
 * `apikey` and the gateway only accepts real project keys. The identity-bearing
 * bridge JWT goes in through `client.realtime.setAuth(jwt)`.
 */
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_q9L2eK2yWvQDjWKJyYUPUA_QospsDls';

// The bridge JWT has a 10-minute TTL; refresh well inside it.
const JWT_REFRESH_MS = 5 * 60 * 1000;

/**
 * Row shape the live screens consume. `live_comments.createdat`/`updatedat` are
 * TEXT columns, so they are wrapped into the Firestore-Timestamp shape the
 * screens already expect (mirrors liveApi.toFirestoreTimestamp).
 */
const toFirestoreTimestamp = (value) => {
  if (value === null || value === undefined) return null;
  if (value && typeof value.toDate === 'function') return value;
  if (value && typeof value === 'object' && value.seconds !== undefined) return value;
  const d = new Date(value);
  if (isNaN(d.getTime())) return null;
  return {
    seconds: Math.floor(d.getTime() / 1000),
    nanoseconds: (d.getTime() % 1000) * 1e6,
    toDate: () => new Date(d.getTime()),
  };
};

/** Normalize a raw `live_comments` row (snake_case, text timestamps). */
export const normalizeLiveCommentRow = (row = {}) => ({
  id: row.id,
  liveId: row.live_id ?? row.liveId ?? null,
  message: row.message || '',
  name: row.name || '',
  avatar: row.avatar || '',
  uid: row.uid || '',
  createdAt: toFirestoreTimestamp(row.createdat ?? row.createdAt),
  updatedAt: toFirestoreTimestamp(row.updatedat ?? row.updatedAt),
});

/**
 * Local id for an optimistic comment awaiting its write. The CLIENT owns the id
 * (like the Firestore doc ids it replaces) and the server stores it verbatim, so
 * the optimistic row and the stored row share one identity: no reconciliation
 * step, no duplicate when the realtime echo arrives, and no window where a poll
 * response predating the write can drop the sender's own message.
 */
export const createPendingCommentId = () =>
  `lc_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

/**
 * Build the row rendered the instant the sender hits send, before the network
 * call. `pending: true` marks it as not-yet-confirmed so the poll never drops it.
 */
export const createPendingLiveComment = ({ id, message, name, avatar, uid }) => ({
  id: id || createPendingCommentId(),
  message,
  name: name || '',
  avatar: avatar || '',
  uid: uid || '',
  createdAt: toFirestoreTimestamp(new Date().toISOString()),
  updatedAt: null,
  pending: true,
});

/**
 * Merge a comment arriving over the websocket (INSERT) into state.
 *
 * Realtime is an ENHANCEMENT, not the source of truth: it may deliver a comment
 * the 10s poll already fetched, so dedupe by id. Ordering is by `createdAt`
 * (matching the endpoint's ascending order) so a merged comment lands where the
 * poll would have put it. `createdAt` is compared as seconds because the client
 * shape carries a Firestore-Timestamp-like object, not a string.
 *
 * The one exception to "already have it, skip": a row that is still `pending`
 * is the sender's own optimistic row that this event now CONFIRMS, so the event
 * replaces it (clearing the flag) instead of being discarded.
 */
export const mergeLiveComment = (list = [], row) => {
  if (!row?.id) return list;
  const seconds = (c) => c?.createdAt?.seconds ?? 0;
  const existing = list.findIndex((c) => c.id === row.id);
  if (existing !== -1) {
    if (!list[existing].pending) return list;
    const next = [...list];
    next[existing] = row;
    return next;
  }
  const next = [...list, row];
  next.sort((a, b) => seconds(a) - seconds(b));
  return next;
};

/**
 * Merge an UPDATE event (edit) into state, preserving position.
 *
 * `pending` is derived from the incoming row rather than inherited, so an edit
 * confirmed by the server (no `pending` key) clears the optimistic flag — the
 * same reason mergeLiveComment replaces a pending row on INSERT.
 */
export const mergeLiveCommentUpdate = (list = [], row) => {
  if (!row?.id) return list;
  return list.map((c) => (c.id === row.id ? { ...c, ...row, pending: row.pending ?? false } : c));
};

/**
 * Reconcile local state with an authoritative server list (the poll response).
 *
 * The server list wins: a comment deleted or purged server-side must disappear
 * (chat is ephemeral). Two exceptions, both "not yet confirmed by the server":
 *
 *  1. a row still flagged `pending` — the sender's own optimistic comment whose
 *     write this response predates. It is kept until the server returns its id
 *     (which clears the flag), so a failed write surfaces as the explicit
 *     rollback in the send handler, never as a silent vanish.
 *  2. a row newer than everything the server returned — a comment whose write
 *     raced this response, from any sender.
 *
 * An empty server response is treated as authoritative too (the end-of-session
 * purge clears every row), so nothing survives it — including pending rows,
 * whose parent session is over.
 */
export const mergeLiveCommentsFromServer = (local = [], server = []) => {
  if (server.length === 0) return [];
  const seconds = (c) => c?.createdAt?.seconds ?? 0;
  const serverIds = new Set(server.map((c) => c?.id).filter(Boolean));
  const newest = Math.max(...server.map(seconds));
  const pending = local.filter(
    (c) => c?.id && !serverIds.has(c.id) && (c.pending || seconds(c) > newest),
  );
  return [...server, ...pending].sort((a, b) => seconds(a) - seconds(b));
};

/**
 * Subscribe to a live session's chat.
 *
 * The subscription self-heals across the bridge-JWT expiry: a fresh token is
 * minted, handed to Realtime via setAuth, and the channel is REBUILT — setAuth
 * alone does not rejoin an expired channel, and the SDK only allows a channel
 * instance to be joined once ("tried to join multiple times"), so each rebuild
 * gets a unique topic.
 *
 * NOTE for the caller: `live_comments` is purged when the session ends, which
 * arrives as a bulk DELETE. Treat onDelete as "this comment is gone" (a full
 * refetch is the safest response) rather than tracking individual ids.
 *
 * @param {string} sessionId  The live session id (live_comments.live_id).
 * @param {Object} opts
 * @param {(payload: Object) => void} opts.onInsert  Called on INSERT events.
 * @param {(payload: Object) => void} [opts.onUpdate] Called on UPDATE events.
 * @param {(payload: Object) => void} [opts.onDelete] Called on DELETE events.
 * @param {(status: string, err?: Error) => void} [opts.onStatus] Subscribe status.
 * @returns {() => Promise<void>}  An async unsubscribe function.
 */
export async function subscribeToLiveComments(sessionId, opts = {}) {
  if (!sessionId) {
    throw new Error('subscribeToLiveComments: sessionId is required');
  }

  const jwt = await getBridgeJwt();
  const client = createClient(REMOTE_SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
    realtime: { params: { eventsPerSecond: 10 } },
  });

  // Identity-bearing bridge JWT (the publishable key above is only transport).
  await client.realtime.setAuth(jwt);

  let channel = null;
  let tornDown = false;
  let refreshTimer = null;
  let buildSeq = 0;
  const filter = `live_id=eq.${sessionId}`;

  const buildChannel = () => {
    buildSeq += 1;
    return client
      .channel(`live-comments-${sessionId}-${buildSeq}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'live_comments', filter },
        (payload) => opts.onInsert?.(payload),
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'live_comments', filter },
        (payload) => opts.onUpdate?.(payload),
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'live_comments', filter },
        (payload) => opts.onDelete?.(payload),
      )
      .subscribe((status, err) => {
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          console.warn(`live comments realtime: ${status}`, err?.message || '');
        }
        opts.onStatus?.(status, err);
      });
  };

  channel = buildChannel();

  refreshTimer = setInterval(async () => {
    if (tornDown) return;
    try {
      const fresh = await getBridgeJwt(true);
      if (tornDown) return;
      await client.realtime.setAuth(fresh);
      const previous = channel;
      channel = buildChannel();
      try {
        await client.removeChannel(previous);
      } catch (e) {
        console.warn('live comments realtime: old channel teardown failed:', e?.message);
      }
    } catch (e) {
      console.error('live comments realtime token refresh failed:', e?.message);
    }
  }, JWT_REFRESH_MS);

  return async () => {
    tornDown = true;
    if (refreshTimer) clearInterval(refreshTimer);
    try {
      await client.removeChannel(channel);
    } catch (e) {
      console.warn('live comments realtime: channel teardown failed:', e?.message);
    }
    await client.removeAllChannels();
  };
}

export default { subscribeToLiveComments, normalizeLiveCommentRow };
