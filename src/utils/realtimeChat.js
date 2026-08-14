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
 *   2. Call /chat-realtime-token → Supabase verifies it and mints a short-lived
 *      (10-min) Supabase-compatible JWT carrying the firebase_uid custom claim.
 *   3. Create an @supabase/supabase-js client with that JWT.
 *   4. Subscribe to postgres_changes on the `messages` table, filtered by chatId.
 *
 * The Realtime websocket ALWAYS connects to the REMOTE Supabase project because that
 * is where the data lives, even when Edge Functions run locally in dev.
 */

const REMOTE_SUPABASE_URL = 'https://pjcquavlxknhmuszjmyh.supabase.co';

// Cache the latest bridge JWT + expiry so we don't re-mint on every call.
let cachedJwt = null;
let cachedExpiresAt = 0;

/**
 * Fetch a fresh bridge JWT (or reuse the cached one if still valid).
 */
async function getBridgeJwt() {
  const now = Math.floor(Date.now() / 1000);
  if (cachedJwt && cachedExpiresAt > now + 30) {
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
 * @param {string} chatId   The chat to subscribe to.
 * @param {Object} opts
 * @param {(payload: Object) => void} opts.onInsert  Called on INSERT events.
 * @param {(payload: Object) => void} [opts.onUpdate] Called on UPDATE events.
 * @param {(payload: Object) => void} [opts.onDelete] Called on DELETE events.
 * @returns {() => Promise<void>}  An async unsubscribe function.
 */
export async function subscribeToChatMessages(chatId, opts = {}) {
  const jwt = await getBridgeJwt();
  const client = createClient(REMOTE_SUPABASE_URL, jwt, {
    auth: { persistSession: false, autoRefreshToken: false },
    realtime: { params: { eventsPerSecond: 10 } },
  });

  const channel = client
    .channel(`chat-messages-${chatId}`)
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

  return async () => {
    await client.removeChannel(channel);
    await client.removeAllChannels();
  };
}

export default { subscribeToChatMessages };
