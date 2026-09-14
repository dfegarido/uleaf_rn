import { createClient } from '@supabase/supabase-js';
import { setupURLPolyfill } from 'react-native-url-polyfill';
import { getStoredAuthToken } from '../utils/getStoredAuthToken';
import { API_ENDPOINTS } from '../config/apiConfig';

// React Native's built-in URL has a getter-only `protocol`, but @supabase/supabase-js
// assigns `realtimeUrl.protocol = ...` when constructing the client (index.cjs:627),
// which throws "Cannot assign to property 'protocol' which has only a getter".
// Replace the global URL with the WHATWG polyfill (writable protocol) before use.
setupURLPolyfill();

/**
 * Realtime chat client using the custom-JWT bridge.
 *
 * Flow:
 *   1. Get the Firebase ID token.
 *   2. Call /chat-realtime-token -> Supabase verifies it and mints a short-lived
 *      (10-min) Supabase-compatible JWT carrying the firebase_uid custom claim.
 *   3. Create an @supabase/supabase-js client with the PUBLISHABLE KEY (not the JWT).
 *   4. Hand the bridge JWT to Realtime via client.realtime.setAuth(jwt).
 *   5. Subscribe to postgres_changes on the `messages` table, filtered by chatId.
 *
 * The Realtime websocket ALWAYS connects to the REMOTE Supabase project because that
 * is where the data lives, even when Edge Functions run locally in dev.
 */

const REMOTE_SUPABASE_URL = 'https://pjcquavlxknhmuszjmyh.supabase.co';

/**
 * Publishable (client-safe) project key.
 *
 * The bridge JWT CANNOT be the client key. `createClient(url, key)` passes `key`
 * to Realtime as the websocket `apikey`, and the gateway only accepts real
 * project keys — a bridge JWT (role/aud "authenticated", firebase_uid claim) is
 * rejected at the handshake, so no event is ever delivered. Verified against the
 * live project: the wrong key yields `CHANNEL_ERROR: transport failure` while the
 * publishable key yields `SUBSCRIBED`.
 *
 * The identity-bearing bridge JWT therefore goes in through
 * `client.realtime.setAuth(jwt)`, which is the documented way to authenticate
 * postgres_changes. The `messages` RLS policy authorizes on the `firebase_uid`
 * claim that JWT carries.
 */
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_q9L2eK2yWvQDjWKJyYUPUA_QospsDls';

/**
 * The bridge JWT is minted with a 10-minute TTL. An expired token closes the
 * channel for good, so refresh well inside that window.
 */
const JWT_REFRESH_MS = 5 * 60 * 1000;

// Cache the latest bridge JWT + expiry so we don't re-mint on every call.
let cachedJwt = null;
let cachedExpiresAt = 0;

/**
 * Fetch a bridge JWT (or reuse the cached one if still valid).
 * @param {boolean} force  Re-mint even if the cached token is still valid.
 */
export async function getBridgeJwt(force = false) {
  const now = Math.floor(Date.now() / 1000);
  if (!force && cachedJwt && cachedExpiresAt > now + 30) {
    return cachedJwt;
  }

  const firebaseToken = await getStoredAuthToken();
  if (!firebaseToken) {
    throw new Error('No Firebase auth token');
  }

  const response = await fetch(API_ENDPOINTS.GET_CHAT_REALTIME_TOKEN, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${firebaseToken}`,
    },
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`chat-realtime-token failed: ${response.status} ${errText}`);
  }

  const data = await response.json();
  const token = data?.token || data?.data?.token;
  if (!token) {
    throw new Error('chat-realtime-token returned no token');
  }

  cachedJwt = token;
  cachedExpiresAt = data?.expiresAt || now + 10 * 60;
  return cachedJwt;
}

/**
 * Subscribe to new/changed messages in a chat.
 *
 * The subscription self-heals across the bridge-JWT expiry (see JWT_REFRESH_MS):
 * a fresh token is minted, handed to Realtime via setAuth, and the channel is
 * REBUILT — setAuth alone does not rejoin an expired channel, and the SDK only
 * allows a channel instance to be joined once ("tried to join multiple times").
 *
 * @param {string} chatId   The chat to subscribe to.
 * @param {Object} opts
 * @param {(payload: Object) => void} opts.onInsert  Called on INSERT events.
 * @param {(payload: Object) => void} [opts.onUpdate] Called on UPDATE events.
 * @param {(payload: Object) => void} [opts.onDelete] Called on DELETE events.
 * @returns {() => Promise<void>}  An async unsubscribe function.
 */
export async function subscribeToChatMessages(chatId, opts = {}) {
  const jwt = await getBridgeJwt();
  const client = createClient(REMOTE_SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
    realtime: { params: { eventsPerSecond: 10 } },
  });

  // Hand the identity-bearing bridge JWT to Realtime (the publishable key above
  // is only the transport credential).
  await client.realtime.setAuth(jwt);

  let channel = null;
  let tornDown = false;
  let refreshTimer = null;
  let buildSeq = 0;

  const buildChannel = () => {
    // Unique topic per build: a rebuilt channel must not reuse the old topic.
    buildSeq += 1;
    return client
      .channel(`chat-messages-${chatId}-${buildSeq}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `chatid=eq.${chatId}` },
        (payload) => opts.onInsert?.(payload),
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'messages', filter: `chatid=eq.${chatId}` },
        (payload) => opts.onUpdate?.(payload),
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'messages', filter: `chatid=eq.${chatId}` },
        (payload) => opts.onDelete?.(payload),
      )
      .subscribe();
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
        console.warn('chat realtime: old channel teardown failed:', e?.message);
      }
    } catch (e) {
      console.error('chat realtime token refresh failed:', e?.message);
    }
  }, JWT_REFRESH_MS);

  return async () => {
    tornDown = true;
    if (refreshTimer) clearInterval(refreshTimer);
    try {
      await client.removeChannel(channel);
    } catch (e) {
      console.warn('chat realtime: channel teardown failed:', e?.message);
    }
    await client.removeAllChannels();
  };
}

export default { subscribeToChatMessages };
