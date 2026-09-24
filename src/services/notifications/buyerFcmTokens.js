import { API_ENDPOINTS } from '../../config/apiConfig';
import { getStoredAuthToken } from '../../utils/getStoredAuthToken';

/**
 * FCM device-token registration for push notifications.
 *
 * Tokens live in Supabase `buyer.fcmtokens` (a jsonb array). Push sending
 * (`send-everyone-mention-notification`) reads from there, so registering only in
 * Firestore would leave those devices unreachable.
 *
 * The /fcm-token Edge Function enforces `uid === <caller's Firebase uid>`, so the
 * uid argument must be the signed-in user's own uid; passing someone else's is
 * rejected with 403.
 *
 * Both exported names/signatures are unchanged so the existing callers
 * (ScreenShop, NotificationSettingsScreen) needed no edit.
 */

// Add the token to the buyer's fcmTokens array (deduped server-side).
export async function addTokenToBuyer(uid, token) {
  if (!uid || !token) return;
  try {
    const authToken = await getStoredAuthToken();
    const res = await fetch(API_ENDPOINTS.FCM_TOKEN, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({ uid, token }),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Error ${res.status}: ${text}`);
    }
  } catch (error) {
    console.log('addTokenToBuyer error:', error.message);
    throw error;
  }
}

// Remove the token from the buyer's fcmTokens array.
export async function removeTokenFromBuyer(uid, token) {
  if (!uid || !token) return;
  try {
    const authToken = await getStoredAuthToken();
    const url = `${API_ENDPOINTS.FCM_TOKEN}?uid=${encodeURIComponent(uid)}&token=${encodeURIComponent(token)}`;
    const res = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Error ${res.status}: ${text}`);
    }
  } catch (error) {
    console.log('removeTokenFromBuyer error:', error.message);
    throw error;
  }
}
