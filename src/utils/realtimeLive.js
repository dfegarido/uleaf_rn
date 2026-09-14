import { createClient } from '@supabase/supabase-js';
import { setupURLPolyfill } from 'react-native-url-polyfill';
import { getStoredAuthToken } from '../utils/getStoredAuthToken';
import { API_ENDPOINTS } from '../config/apiConfig';

// React Native's built-in URL has a getter-only `protocol`, but @supabase/supabase-js
// assigns `realtimeUrl.protocol = ...` when constructing the client, which throws.
// Replace the global URL with the WHATWG polyfill (writable protocol) before use.
setupURLPolyfill();

/**
 * Realtime live-stream client using the custom-JWT bridge (same pattern as
 * realtimeChat.js). The Realtime websocket ALWAYS connects to the REMOTE
 * Supabase project because that is where the data lives, even when Edge
 * Functions run locally in dev.
 */

const REMOTE_SUPABASE_URL = 'https://pjcquavlxknhmuszjmyh.supabase.co';

/**
 * Publishable (client-safe) project key.
 *
 * The bridge JWT CANNOT be the client key. `createClient(url, key)` passes `key`
 * to Realtime as the websocket `apikey`, and the gateway only accepts real
 * project keys — a bridge JWT (role/aud "authenticated", firebase_uid claim) is
 * rejected at the handshake with HTTP 401 UNAUTHORIZED_INVALID_API_KEY, so no
 * event is ever delivered. Verified against the live project.
 *
 * The identity-bearing bridge JWT therefore goes in through
 * `client.realtime.setAuth(jwt)`, which is the documented way to authenticate
 * postgres_changes. RLS on `live` authorizes the `authenticated` role, which the
 * bridge JWT carries, so events flow for signed-in buyers.
 */
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_q9L2eK2yWvQDjWKJyYUPUA_QospsDls';

/**
 * The bridge JWT is minted with a 10-minute TTL. An expired token closes the
 * channel for good, so refresh well inside that window. Refresh is deliberately
 * shorter than the TTL to leave room for network latency and a slow token mint.
 */
const JWT_REFRESH_MS = 5 * 60 * 1000;

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
 * Subscribe to changes on the `live` table.
 *
 * The subscription self-heals across the bridge-JWT expiry (see JWT_REFRESH_MS):
 * a fresh token is minted, handed to Realtime via setAuth, and the channel is
 * REBUILT — setAuth alone does not rejoin an expired channel, and the SDK only
 * allows a channel instance to be joined once ("tried to join multiple times").
 *
 * @param {Object} opts
 * @param {(payload: Object) => void} opts.onInsert  Called on INSERT events.
 * @param {(payload: Object) => void} [opts.onUpdate] Called on UPDATE events.
 * @param {(payload: Object) => void} [opts.onDelete] Called on DELETE events.
 * @returns {() => Promise<void>}  An async unsubscribe function.
 */
export async function subscribeToLiveStreams(opts = {}) {
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
      .channel(`live-streams-${buildSeq}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'live' },
        (payload) => opts.onInsert?.(payload),
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'live' },
        (payload) => opts.onUpdate?.(payload),
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'live' },
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
        console.warn('live realtime: old channel teardown failed:', e?.message);
      }
    } catch (e) {
      console.error('live realtime token refresh failed:', e?.message);
    }
  }, JWT_REFRESH_MS);

  return async () => {
    tornDown = true;
    if (refreshTimer) clearInterval(refreshTimer);
    try {
      await client.removeChannel(channel);
    } catch (e) {
      console.warn('live realtime: channel teardown failed:', e?.message);
    }
    await client.removeAllChannels();
  };
}

export default { subscribeToLiveStreams };
