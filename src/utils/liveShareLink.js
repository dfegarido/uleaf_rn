import { Alert, Platform } from 'react-native';
import Share from 'react-native-share';

const DEFAULT_SHARE_BASE = 'https://ileafu.com';

function getShareBaseUrl() {
  return DEFAULT_SHARE_BASE;
}

/**
 * Public HTTPS link for a live stream session.
 * @param {string} sessionId
 * @param {string} sellerId
 * @returns {string} empty string if sessionId is missing
 */
export function getLiveShareUrl(sessionId, sellerId) {
  const sid = String(sessionId ?? '').trim();
  if (!sid) {
    return '';
  }
  const url = `${getShareBaseUrl()}/live/?session=${encodeURIComponent(sid)}`;
  if (sellerId) {
    return `${url}&seller=${encodeURIComponent(sellerId)}`;
  }
  return url;
}

/**
 * Defer opening the native share sheet until after the current JS/UI work settles.
 */
export function runShareAfterInteractions(fn) {
  const delayMs = Platform.OS === 'ios' ? 250 : 100;
  const scheduleIdle =
    typeof requestIdleCallback === 'function'
      ? callback => requestIdleCallback(callback, { timeout: 500 })
      : callback => setTimeout(callback, 0);

  scheduleIdle(() => {
    setTimeout(fn, delayMs);
  });
}

/**
 * Open the native share sheet with a live stream link.
 * @param {string} sessionId
 * @param {string} sellerId
 * @param {string} sellerName
 * @param {string} [title]
 * @param {string} [buyerUid] - optional, if buyer wants to include referral in same share
 */
export function shareLiveStream(sessionId, sellerId) {
  if (!sessionId) {
    Alert.alert('Error', 'Cannot share: live session information is missing.');
    return;
  }

  const url = getLiveShareUrl(sessionId, sellerId);

  runShareAfterInteractions(async () => {
    try {
      await Share.open({
        message: url,
        url,
        title: 'Share LIVE sale',
      });
    } catch (error) {
      if (error?.message !== 'User did not share') {
        Alert.alert('Error', 'Could not open share sheet. Please try again.');
      }
    }
  });
}
