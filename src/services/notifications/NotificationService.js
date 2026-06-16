import messaging from '@react-native-firebase/messaging';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { navigationRef as defaultNavRef } from '../../navigation/navigationRef';
import { emit, on } from './notificationEvents';

const DENIED_KEY = 'notifications.denied';
const DISABLED_KEY = 'notifications.disabled';

// Mirrors firebase-functions messaging error codes we care about.
const FCM_INVALID_TOKEN_CODES = new Set([
  'messaging/registration-token-not-registered',
  'messaging/invalid-argument',
]);

class NotificationService {
  constructor() {
    this._navRef = defaultNavRef;
    this._writeToken = null;        // injected so tests can spy; defaults to firestore write in App.js
    this._removeToken = null;       // injected
    this._unsubs = [];
    this._currentUid = undefined;
    this._tapRetries = 0;
  }

  // Test-only — clears all internal state.
  _reset() {
    this._unsubs.forEach((u) => { try { u(); } catch (_) {} });
    this._unsubs = [];
    this._currentUid = undefined;
    this._tapRetries = 0;
  }

  init(navRef, deps = {}) {
    this._navRef = navRef || defaultNavRef;
    if (deps.writeToken) this._writeToken = deps.writeToken;
    if (deps.removeToken) this._removeToken = deps.removeToken;

    this._unsubs.push(messaging().onMessage((msg) => this._handleTap(msg)));
    this._unsubs.push(messaging().onTokenRefresh((newToken) => this._handleTokenRefresh(newToken)));
    this._unsubs.push(messaging().onNotificationOpenedApp((msg) => this._handleTap(msg)));
    // The background handler in index.js emits 'tap' on the event bus; subscribe
    // so we can route it once React is alive.
    this._unsubs.push(on('tap', ({ sessionId, broadcasterId }) => {
      if (sessionId) this._navigateToLive(sessionId, broadcasterId || '');
    }));

    // Killed-app case: drain any "initial" notification on mount.
    messaging()
      .getInitialNotification()
      .then((msg) => { if (msg) this._handleTap(msg); })
      .catch(() => {});
  }

  async requestPermissionAndRegister(uid, deps = {}) {
    if (deps.writeToken) this._writeToken = deps.writeToken;
    if (deps.removeToken) this._removeToken = deps.removeToken;
    this._currentUid = uid;

    // User has explicitly disabled notifications in our settings — never auto-prompt.
    const disabled = await AsyncStorage.getItem(DISABLED_KEY);
    if (disabled === 'true') return { status: 'disabled' };

    const denied = await AsyncStorage.getItem(DENIED_KEY);
    if (denied === 'true') return { status: 'denied' };

    const status = await messaging().requestPermission();
    // status: 0 NOT_DETERMINED, 1 AUTHORIZED, 2 PROVISIONAL, -1 DENIED
    if (status !== 1 && status !== 2) {
      await AsyncStorage.setItem(DENIED_KEY, 'true');
      return { status: 'denied' };
    }

    const token = await messaging().getToken();
    if (token && this._writeToken) {
      try {
        await this._writeToken(uid, token);
      } catch (e) {
        // Don't crash the app for a token-write failure.
        // eslint-disable-next-line no-console
        console.warn('[NotificationService] writeToken failed', e);
      }
    }
    return { status: 'granted', token };
  }

  // Register the FCM token without firing the OS permission prompt. Use this on
  // login so notifications are opt-out by default. If the user has explicitly
  // disabled notifications in our settings, do nothing.
  async registerWithoutPrompting(uid, deps = {}) {
    if (deps.writeToken) this._writeToken = deps.writeToken;
    if (deps.removeToken) this._removeToken = deps.removeToken;
    this._currentUid = uid;

    const disabled = await AsyncStorage.getItem(DISABLED_KEY);
    if (disabled === 'true') return { status: 'disabled' };

    let token;
    try {
      token = await messaging().getToken();
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn('[NotificationService] getToken failed', e);
      return { status: 'error' };
    }
    if (token && this._writeToken) {
      try {
        await this._writeToken(uid, token);
      } catch (e) {
        // eslint-disable-next-line no-console
        console.warn('[NotificationService] writeToken failed', e);
      }
    }
    return { status: 'registered', token };
  }

  async _handleTokenRefresh(newToken) {
    if (!this._writeToken) return;
    try {
      await this._writeToken(this._currentUid, newToken);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn('[NotificationService] token refresh write failed', e);
    }
  }

  _handleTap(remoteMessage) {
    const data = (remoteMessage && remoteMessage.data) || {};
    if (data.type !== 'live_started') return;
    const sessionId = data.sessionId;
    if (!sessionId) return;
    const broadcasterId = data.broadcasterId || '';
    emit('tap', { sessionId, broadcasterId });
    this._navigateToLive(sessionId, broadcasterId);
  }

  _navigateToLive(sessionId, broadcasterId) {
    if (!this._navRef || !this._navRef.isReady || !this._navRef.isReady()) {
      if (this._tapRetries < 3) {
        this._tapRetries += 1;
        setTimeout(() => this._navigateToLive(sessionId, broadcasterId), 200);
      }
      return;
    }
    this._tapRetries = 0;
    try {
      this._navRef.navigate('BuyerLiveStreamScreen', { sessionId, broadcasterId });
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn('[NotificationService] navigate failed', e);
    }
  }

  async dispose() {
    this._unsubs.forEach((u) => { try { u(); } catch (_) {} });
    this._unsubs = [];
    if (this._currentUid && this._removeToken) {
      try {
        await this._removeToken(this._currentUid);
      } catch (e) {
        // eslint-disable-next-line no-console
        console.warn('[NotificationService] removeToken failed', e);
      }
    }
    this._currentUid = null;
  }

  // Remove the FCM token from Firestore for the given user. Used by the
  // Notification Settings screen when the user disables notifications.
  async removeToken(uid, removeTokenFn) {
    if (removeTokenFn) this._removeToken = removeTokenFn;
    if (!uid || !this._removeToken) return;
    try {
      const token = await messaging().getToken();
      if (token) {
        await this._removeToken(uid, token);
      }
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn('[NotificationService] removeToken failed', e);
    }
  }
}

// Singleton.
const instance = new NotificationService();
export default instance;
export { NotificationService, FCM_INVALID_TOKEN_CODES };
