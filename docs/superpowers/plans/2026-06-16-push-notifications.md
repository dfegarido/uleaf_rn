# Push Notifications for Live Sales Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire up Firebase Cloud Messaging so that when a seller starts a live sale, all buyers who loved that session receive a push notification that opens `BuyerLiveStreamScreen` on tap.

**Architecture:** Extend the existing `sendLiveStartedNotification` Cloud Function with a parallel FCM dispatch. On the client, add a small `NotificationService` singleton that owns the FCM token lifecycle and tap routing, plus a `NotificationPermissionPrompt` modal that gates the OS permission prompt. Token storage is a `fcmTokens: string[]` array on the `buyer/{uid}` doc.

**Tech Stack:** React Native 0.84, `@react-native-firebase/messaging` (new), `@react-native-async-storage/async-storage` (existing), React Navigation 6 (existing), Firebase Admin SDK 12 (existing), Cloud Functions v2 (existing), Jest + react-test-renderer (existing).

**Preconditions (verify once before Task 1):**
- iOS: APNS key uploaded to Firebase console (one-time manual step). Without it, iOS pushes will fail silently. Skip until manual testing of Task 13.
- Android: `android/app/google-services.json` must contain a `messaging` config block. If absent, regenerate it from the Firebase console.

---

## File Structure (locked in)

### New — `ileafu` (client)
- `src/services/notifications/notificationEvents.js` — tiny event emitter (3 methods).
- `src/services/notifications/NotificationService.js` — singleton, FCM token lifecycle, tap routing, foreground listener.
- `src/services/notifications/index.js` — barrel re-export.
- `src/navigation/navigationRef.js` — exports a module-level `navigationRef` (separate from AppNavigation's local one) so the service can call `.navigate()` without a circular import.
- `src/hooks/useNotificationPermission.js` — React hook `{ status, request }`.
- `src/components/NotificationPermissionPrompt/NotificationPermissionPrompt.js` — full-screen modal.
- `src/components/NotificationPermissionPrompt/index.js` — barrel.
- `__mocks__/react-native-firebase-messaging.js` — jest mock for `@react-native-firebase/messaging`.
- `android/app/src/main/res/drawable/ic_notification.xml` — white silhouette vector (24dp).

### Modified — `ileafu` (client)
- `package.json` — add `@react-native-firebase/messaging@^24.0.0`.
- `index.js` — register background message handler **before** `AppRegistry.registerComponent`.
- `App.js` — call `NotificationService.init(navigationRef)` and render `<NotificationPermissionPrompt />`.
- `src/auth/AuthProvider.js` — call `NotificationService.dispose()` on logout, and `requestPermissionAndRegister()` on first login.
- `src/components/AppNavigation/AppNavigation.js` — replace the local `useRef()` with the imported `navigationRef`; pass it to `<NavigationContainer ref={navigationRef}>`.
- `android/app/src/main/AndroidManifest.xml` — add `POST_NOTIFICATIONS` permission, FCM default channel meta-data, default icon meta-data.
- `ios/iLeafU/iLeafU.entitlements` — add `aps-environment` key.
- `ios/iLeafU/Info.plist` — add `UIBackgroundModes: [remote-notification]`.

### Modified — `ileafu_backend/functions` (server)
- `firestore/live/sendLiveStartedNotification.js` — add FCM dispatch step + invalid-token cleanup. No new exports.

### New — `ileafu_backend/functions` (test)
- `firestore/live/__tests__/sendLiveStartedNotification.fcm.test.js` — small node test for the FCM dispatch step (uses `firebase-functions-test`).

---

## Task 1: Install `@react-native-firebase/messaging` and verify iOS pods

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install the package**

Run: `npm install @react-native-firebase/messaging@^24.0.0`
Expected: package.json gets the new entry, `node_modules/@react-native-firebase/messaging` exists.

- [ ] **Step 2: Install iOS pods**

Run: `cd ios && pod install && cd ..`
Expected: Pod install completes. `ios/Pods/.../FirebaseMessaging` is downloaded.

- [ ] **Step 3: Smoke-build iOS (debug) to catch any linker issues early**

Run: `cd ios && xcodebuild -workspace iLeafU.xcworkspace -scheme iLeafU -configuration Debug -sdk iphonesimulator -derivedDataPath build-check build 2>&1 | tail -20 && cd ..`
Expected: BUILD SUCCEEDED. (If it fails because of code signing, ignore that — we only care about linker errors at this point.)

- [ ] **Step 4: Smoke-build Android (debug) to catch any Gradle issues early**

Run: `cd android && ./gradlew assembleDebug 2>&1 | tail -20 && cd ..`
Expected: BUILD SUCCESSFUL.

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json ios/Podfile.lock
git commit -m "chore: add @react-native-firebase/messaging dependency"
```

---

## Task 2: Create the navigation ref module (avoid circular imports)

**Files:**
- Create: `src/navigation/navigationRef.js`

The service lives outside the React tree, so it cannot receive the `useRef` from AppNavigation. We expose a module-level ref that both AppNavigation's `<NavigationContainer>` and `NotificationService` import.

- [ ] **Step 1: Create the file**

`src/navigation/navigationRef.js`:

```js
import { createNavigationContainerRef } from '@react-navigation/native';

// Module-level singleton ref. AppNavigation passes it to <NavigationContainer ref={navigationRef}>.
// NotificationService uses it to deep-link from a notification tap.
export const navigationRef = createNavigationContainerRef();
```

- [ ] **Step 2: Commit**

```bash
git add src/navigation/navigationRef.js
git commit -m "feat(notifications): add module-level navigation ref"
```

---

## Task 3: Wire AppNavigation to the shared navigation ref

**Files:**
- Modify: `src/components/AppNavigation/AppNavigation.js:981,1490`

- [ ] **Step 1: Read the current navigationRef block**

Run: `grep -n "navigationRef = useRef" /Users/macm2/projects/olla/ileafu/src/components/AppNavigation/AppNavigation.js`
Expected: line 981.

- [ ] **Step 2: Replace the local ref with the shared import**

In `src/components/AppNavigation/AppNavigation.js`:

At the top of the file, add (with the other React/RN imports):
```js
import { navigationRef } from '../../navigation/navigationRef';
```

Remove the line:
```js
const navigationRef = useRef(null);
```

- [ ] **Step 3: Verify the `<NavigationContainer ref={...}>` line still works**

The line should already be `ref={navigationRef}` (line 1490). No change needed.

- [ ] **Step 4: Lint**

Run: `npx eslint src/components/AppNavigation/AppNavigation.js src/navigation/navigationRef.js`
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add src/components/AppNavigation/AppNavigation.js
git commit -m "refactor(nav): use shared navigation ref"
```

---

## Task 4: Create the event emitter (notificationEvents)

**Files:**
- Create: `src/services/notifications/notificationEvents.js`

This decouples the background handler (registered in `index.js`, runs before React) from the service (initialized in `App.js`).

- [ ] **Step 1: Write the test file**

`src/services/notifications/__tests__/notificationEvents.test.js`:

```js
import { on, off, emit } from '../notificationEvents';

describe('notificationEvents', () => {
  it('calls registered listeners when their event is emitted', () => {
    const fn = jest.fn();
    on('tap', fn);
    emit('tap', { sessionId: 'abc' });
    expect(fn).toHaveBeenCalledWith({ sessionId: 'abc' });
  });

  it('does not call listeners of a different event', () => {
    const fn = jest.fn();
    on('tap', fn);
    emit('other', 'x');
    expect(fn).not.toHaveBeenCalled();
  });

  it('removes a listener with off()', () => {
    const fn = jest.fn();
    on('tap', fn);
    off('tap', fn);
    emit('tap', 'x');
    expect(fn).not.toHaveBeenCalled();
  });

  it('emitting with no listeners is a no-op', () => {
    expect(() => emit('nobody', 'x')).not.toThrow();
  });
});
```

- [ ] **Step 2: Run the test to confirm it fails**

Run: `npx jest src/services/notifications/__tests__/notificationEvents.test.js`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement the emitter**

`src/services/notifications/notificationEvents.js`:

```js
// Tiny in-process pub-sub. Used so the background message handler (registered in
// index.js before React mounts) can hand off a tap to the NotificationService
// once the service has been initialized.
const listeners = new Map(); // eventName -> Set<fn>

export function on(event, fn) {
  if (!listeners.has(event)) listeners.set(event, new Set());
  listeners.get(event).add(fn);
  return () => off(event, fn);
}

export function off(event, fn) {
  const set = listeners.get(event);
  if (set) set.delete(fn);
}

export function emit(event, payload) {
  const set = listeners.get(event);
  if (!set) return;
  for (const fn of set) {
    try {
      fn(payload);
    } catch (e) {
      // Never let a listener throw into the emitter.
      // eslint-disable-next-line no-console
      console.warn('[notificationEvents] listener threw', e);
    }
  }
}
```

- [ ] **Step 4: Re-run the test to confirm it passes**

Run: `npx jest src/services/notifications/__tests__/notificationEvents.test.js`
Expected: 4 passed.

- [ ] **Step 5: Commit**

```bash
git add src/services/notifications/notificationEvents.js src/services/notifications/__tests__/notificationEvents.test.js
git commit -m "feat(notifications): add in-process event emitter"
```

---

## Task 5: Create the jest mock for @react-native-firebase/messaging

**Files:**
- Create: `__mocks__/react-native-firebase-messaging.js`

This mock is auto-loaded by jest because of the standard mock convention (file lives next to the module path it replaces). It exports the same surface the service uses.

- [ ] **Step 1: Create the file**

`__mocks__/@react-native-firebase/messaging.js`:

```js
// Manual mock for @react-native-firebase/messaging used by jest tests.
// Surface mirrors the methods NotificationService calls.

const listeners = { message: [], tokenRefresh: [], opened: [] };

let currentToken = 'mock-token-initial';
let permissionStatus = 0; // 0 = NOT_DETERMINED, 1 = AUTHORIZED, 2 = PROVISIONAL

const messaging = () => ({
  requestPermission: jest.fn(async () => permissionStatus),
  getToken: jest.fn(async () => currentToken),
  onMessage: jest.fn((cb) => {
    listeners.message.push(cb);
    return () => {
      listeners.message = listeners.message.filter((c) => c !== cb);
    };
  }),
  onTokenRefresh: jest.fn((cb) => {
    listeners.tokenRefresh.push(cb);
    return () => {
      listeners.tokenRefresh = listeners.tokenRefresh.filter((c) => c !== cb);
    };
  }),
  onNotificationOpenedApp: jest.fn((cb) => {
    listeners.opened.push(cb);
    return () => {
      listeners.opened = listeners.opened.filter((c) => c !== cb);
    };
  }),
  getInitialNotification: jest.fn(async () => null),
  setBackgroundMessageHandler: jest.fn(),
  hasPermission: jest.fn(async () => permissionStatus === 1 || permissionStatus === 2),
});

// Test helpers — NOT part of the real module. Import these from inside tests.
messaging.__setToken = (t) => {
  currentToken = t;
};
messaging.__setPermission = (s) => {
  permissionStatus = s;
};
messaging.__triggerTokenRefresh = (t) => {
  currentToken = t;
  listeners.tokenRefresh.forEach((cb) => cb(t));
};
messaging.__triggerMessage = (msg) => {
  listeners.message.forEach((cb) => cb(msg));
};
messaging.__triggerOpened = (msg) => {
  listeners.opened.forEach((cb) => cb(msg));
};
messaging.__reset = () => {
  currentToken = 'mock-token-initial';
  permissionStatus = 0;
  listeners.message = [];
  listeners.tokenRefresh = [];
  listeners.opened = [];
};

module.exports = messaging;
module.default = messaging;
```

- [ ] **Step 2: Verify the mock is auto-loaded by jest**

Run: `cat jest.config.js`
Expected: there's a `setupFiles` or `setupFilesAfterEach` entry. If not, add one.

If `jest.setup.js` exists (it does — `jest.setup.js`), append to it:
```js
jest.mock('@react-native-firebase/messaging');
```

(Re-read `jest.setup.js` first; the existing content is something like `import './src/utils/silenceLogs';` — leave that intact and add the `jest.mock` line below it.)

- [ ] **Step 3: Commit**

```bash
git add __mocks__/@react-native-firebase/messaging.js jest.setup.js
git commit -m "test(notifications): add jest mock for firebase messaging"
```

---

## Task 6: Implement NotificationService (token lifecycle + tap routing)

**Files:**
- Create: `src/services/notifications/NotificationService.js`
- Test: `src/services/notifications/__tests__/NotificationService.test.js`

This is the largest single piece. The tests drive the implementation in small TDD steps, but we ship the whole file at once because splitting it into bite-sized commits is more noise than signal.

- [ ] **Step 1: Write the failing tests**

`src/services/notifications/__tests__/NotificationService.test.js`:

```js
import messaging from '@react-native-firebase/messaging';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { navigationRef } from '../../../navigation/navigationRef';
import { emit } from '../notificationEvents';
import NotificationService from '../NotificationService';

// Mocks
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));
jest.mock('../../../navigation/navigationRef', () => ({
  navigationRef: { isReady: jest.fn(() => true), navigate: jest.fn() },
}));

const flush = () => new Promise((r) => setImmediate(r));

describe('NotificationService', () => {
  beforeEach(() => {
    AsyncStorage.getItem.mockReset().mockResolvedValue(null);
    AsyncStorage.setItem.mockReset().mockResolvedValue();
    AsyncStorage.removeItem.mockReset().mockResolvedValue();
    navigationRef.isReady.mockClear().mockReturnValue(true);
    navigationRef.navigate.mockClear();
    messaging.__reset();
    NotificationService._reset();
  });

  it('init() wires onMessage, onTokenRefresh, onNotificationOpenedApp', async () => {
    NotificationService.init(navigationRef);
    expect(messaging().onMessage).toHaveBeenCalledTimes(1);
    expect(messaging().onTokenRefresh).toHaveBeenCalledTimes(1);
    expect(messaging().onNotificationOpenedApp).toHaveBeenCalledTimes(1);
  });

  it('requestPermissionAndRegister() does nothing if denied flag is set', async () => {
    AsyncStorage.getItem.mockResolvedValue('true');
    await NotificationService.init(navigationRef);
    await NotificationService.requestPermissionAndRegister('buyerUid');
    expect(messaging().getToken).not.toHaveBeenCalled();
  });

  it('requestPermissionAndRegister() writes token to firestore on grant', async () => {
    messaging.__setToken('tok-1');
    messaging.__setPermission(1);
    const writeToken = jest.fn().mockResolvedValue();
    await NotificationService.init(navigationRef);
    await NotificationService.requestPermissionAndRegister('buyerUid', { writeToken });
    expect(writeToken).toHaveBeenCalledWith('buyerUid', 'tok-1');
  });

  it('on permission denied, sets denied flag and skips getToken', async () => {
    messaging.__setPermission(0);
    const writeToken = jest.fn();
    await NotificationService.init(navigationRef);
    await NotificationService.requestPermissionAndRegister('buyerUid', { writeToken });
    expect(AsyncStorage.setItem).toHaveBeenCalledWith('notifications.denied', 'true');
    expect(writeToken).not.toHaveBeenCalled();
  });

  it('on token refresh, calls writeToken with new token', async () => {
    messaging.__setPermission(1);
    const writeToken = jest.fn().mockResolvedValue();
    await NotificationService.init(navigationRef, { writeToken });
    messaging.__triggerTokenRefresh('tok-rotated');
    await flush();
    expect(writeToken).toHaveBeenCalledWith(undefined, 'tok-rotated');
  });

  it('on foreground message of type live_started, navigates to live screen', async () => {
    await NotificationService.init(navigationRef);
    messaging.__triggerMessage({
      data: { type: 'live_started', sessionId: 'sess1', broadcasterId: 'seller1' },
    });
    expect(navigationRef.navigate).toHaveBeenCalledWith('BuyerLiveStreamScreen', {
      sessionId: 'sess1',
      broadcasterId: 'seller1',
    });
  });

  it('on tap from killed app (initial notification), navigates', async () => {
    messaging.getInitialNotification = jest.fn().mockResolvedValue({
      data: { type: 'live_started', sessionId: 'sess2', broadcasterId: 'seller2' },
    });
    await NotificationService.init(navigationRef);
    await flush();
    expect(navigationRef.navigate).toHaveBeenCalledWith('BuyerLiveStreamScreen', {
      sessionId: 'sess2',
      broadcasterId: 'seller2',
    });
  });

  it('tap with missing broadcasterId defaults to empty string', async () => {
    messaging.__triggerMessage({
      data: { type: 'live_started', sessionId: 'sess3' },
    });
    expect(navigationRef.navigate).toHaveBeenCalledWith('BuyerLiveStreamScreen', {
      sessionId: 'sess3',
      broadcasterId: '',
    });
  });

  it('dispose() unsubscribes and clears the user ref', async () => {
    await NotificationService.init(navigationRef);
    NotificationService.dispose();
    // No public unsubscribe count, but we can at least re-init and not get double listeners.
    await NotificationService.init(navigationRef);
    expect(messaging().onMessage).toHaveBeenCalledTimes(2);
  });
});
```

- [ ] **Step 2: Run the test to confirm it fails**

Run: `npx jest src/services/notifications/__tests__/NotificationService.test.js 2>&1 | tail -20`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement the service**

`src/services/notifications/NotificationService.js`:

```js
import messaging from '@react-native-firebase/messaging';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { navigationRef as defaultNavRef } from '../../navigation/navigationRef';
import { emit, on } from './notificationEvents';

const DENIED_KEY = 'notifications.denied';

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
    this._currentUid = null;
    this._tapRetries = 0;
  }

  // Test-only — clears all internal state.
  _reset() {
    this._unsubs.forEach((u) => { try { u(); } catch (_) {} });
    this._unsubs = [];
    this._currentUid = null;
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
}

// Singleton.
const instance = new NotificationService();
export default instance;
export { NotificationService, FCM_INVALID_TOKEN_CODES };
```

- [ ] **Step 4: Re-run the test to confirm it passes**

Run: `npx jest src/services/notifications/__tests__/NotificationService.test.js 2>&1 | tail -30`
Expected: 9 passed.

- [ ] **Step 5: Commit**

```bash
git add src/services/notifications/NotificationService.js src/services/notifications/__tests__/NotificationService.test.js
git commit -m "feat(notifications): add NotificationService singleton"
```

---

## Task 7: Create the Firestore token helper

**Files:**
- Create: `src/services/notifications/buyerFcmTokens.js`

The service depends on injected `writeToken` and `removeToken` functions. This module is the default implementation that App.js and AuthProvider use; tests inject their own.

- [ ] **Step 1: Write the file**

`src/services/notifications/buyerFcmTokens.js`:

```js
import firestore from '@react-native-firebase/firestore';
import { firebase } from '../../../firebase';

// Add the token to the buyer's fcmTokens array (deduped by Firestore).
export async function addTokenToBuyer(uid, token) {
  if (!uid || !token) return;
  await firebase.firestore
    .collection('buyer')
    .doc(uid)
    .update({ fcmTokens: firestore.FieldValue.arrayUnion(token) });
}

// Remove the token from the buyer's fcmTokens array.
export async function removeTokenFromBuyer(uid, token) {
  if (!uid || !token) return;
  await firebase.firestore
    .collection('buyer')
    .doc(uid)
    .update({ fcmTokens: firestore.FieldValue.arrayRemove(token) });
}
```

- [ ] **Step 2: Smoke-import to confirm no syntax errors**

Run: `node -e "require('./src/services/notifications/buyerFcmTokens.js')" 2>&1 | tail -5` — this will fail at runtime in node, but a syntax error is what we're catching. Alternative: `npx eslint src/services/notifications/buyerFcmTokens.js`
Expected: no syntax error (eslint exit 0).

- [ ] **Step 3: Commit**

```bash
git add src/services/notifications/buyerFcmTokens.js
git commit -m "feat(notifications): add Firestore buyer fcmTokens helpers"
```

---

## Task 8: Create the public barrel + useNotificationPermission hook

**Files:**
- Create: `src/services/notifications/index.js`
- Create: `src/hooks/useNotificationPermission.js`

- [ ] **Step 1: Create the barrel**

`src/services/notifications/index.js`:

```js
export { default as NotificationService, FCM_INVALID_TOKEN_CODES } from './NotificationService';
export { default } from './NotificationService';
export * from './buyerFcmTokens';
```

- [ ] **Step 2: Create the hook**

`src/hooks/useNotificationPermission.js`:

```js
import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import messaging from '@react-native-firebase/messaging';

const DENIED_KEY = 'notifications.denied';

// 'unknown' = never asked; 'granted' = OS authorized; 'denied' = user said no
export function useNotificationPermission() {
  const [status, setStatus] = useState('unknown');

  useEffect(() => {
    (async () => {
      const denied = await AsyncStorage.getItem(DENIED_KEY);
      if (denied === 'true') {
        setStatus('denied');
        return;
      }
      const s = await messaging().hasPermission();
      // 1 = AUTHORIZED, 2 = PROVISIONAL
      setStatus(s === 1 || s === 2 ? 'granted' : 'unknown');
    })();
  }, []);

  const request = useCallback(async () => {
    const s = await messaging().requestPermission();
    if (s === 1 || s === 2) {
      setStatus('granted');
      await AsyncStorage.removeItem(DENIED_KEY);
    } else {
      setStatus('denied');
      await AsyncStorage.setItem(DENIED_KEY, 'true');
    }
    return s;
  }, []);

  return { status, request };
}
```

- [ ] **Step 3: Lint**

Run: `npx eslint src/services/notifications/index.js src/hooks/useNotificationPermission.js`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/services/notifications/index.js src/hooks/useNotificationPermission.js
git commit -m "feat(notifications): add public barrel and permission hook"
```

---

## Task 9: Create the NotificationPermissionPrompt modal

**Files:**
- Create: `src/components/NotificationPermissionPrompt/NotificationPermissionPrompt.js`
- Create: `src/components/NotificationPermissionPrompt/index.js`
- Test: `src/components/NotificationPermissionPrompt/__tests__/NotificationPermissionPrompt.test.js`

- [ ] **Step 1: Write the test**

`src/components/NotificationPermissionPrompt/__tests__/NotificationPermissionPrompt.test.js`:

```js
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import NotificationPermissionPrompt from '../NotificationPermissionPrompt';

const mockRequest = jest.fn();

jest.mock('../../../hooks/useNotificationPermission', () => ({
  useNotificationPermission: () => ({ status: 'unknown', request: mockRequest }),
}));

describe('<NotificationPermissionPrompt />', () => {
  it('renders nothing when status is granted', () => {
    jest.isolateModules(() => {
      jest.doMock('../../../hooks/useNotificationPermission', () => ({
        useNotificationPermission: () => ({ status: 'granted', request: mockRequest }),
      }));
      const Reloaded = require('../NotificationPermissionPrompt').default;
      const { toJSON } = render(<Reloaded />);
      expect(toJSON()).toBeNull();
    });
  });

  it('renders an explainer and an "Enable" button when status is unknown', () => {
    const { getByText } = render(<NotificationPermissionPrompt />);
    expect(getByText(/Get notified when sellers go live/i)).toBeTruthy();
  });

  it('calls request() when the Enable button is pressed', () => {
    const { getByText } = render(<NotificationPermissionPrompt />);
    fireEvent.press(getByText(/Enable notifications/i));
    expect(mockRequest).toHaveBeenCalled();
  });

  it('renders nothing when status is denied', () => {
    jest.isolateModules(() => {
      jest.doMock('../../../hooks/useNotificationPermission', () => ({
        useNotificationPermission: () => ({ status: 'denied', request: mockRequest }),
      }));
      const Reloaded = require('../NotificationPermissionPrompt').default;
      const { toJSON } = render(<Reloaded />);
      expect(toJSON()).toBeNull();
    });
  });
});
```

- [ ] **Step 2: Run the test to confirm it fails**

Run: `npx jest src/components/NotificationPermissionPrompt/__tests__/NotificationPermissionPrompt.test.js 2>&1 | tail -10`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement the modal**

`src/components/NotificationPermissionPrompt/NotificationPermissionPrompt.js`:

```js
import React from 'react';
import { Modal, View, Text, StyleSheet, Pressable } from 'react-native';
import { useNotificationPermission } from '../../hooks/useNotificationPermission';

const PRIMARY = '#539461';

const NotificationPermissionPrompt = () => {
  const { status, request } = useNotificationPermission();
  if (status !== 'unknown') return null;

  return (
    <Modal transparent animationType="fade" visible>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>Never miss a live sale</Text>
          <Text style={styles.body}>
            Get notified the moment a seller you love goes live. We'll only send
            you alerts for sessions you've shown interest in.
          </Text>
          <Pressable
            accessibilityRole="button"
            onPress={request}
            style={({ pressed }) => [styles.button, pressed && { opacity: 0.7 }]}>
            <Text style={styles.buttonText}>Enable notifications</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              // Dismiss by setting the denied flag (so we don't re-prompt)
              // — handled by the hook on the actual system-prompt result.
            }}
            style={styles.skip}>
            <Text style={styles.skipText}>Not now</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'center', alignItems: 'center' },
  card: { width: '85%', maxWidth: 360, backgroundColor: '#fff', borderRadius: 16, padding: 20 },
  title: { fontSize: 18, fontWeight: '700', color: '#1f1f1f', marginBottom: 8 },
  body: { fontSize: 14, color: '#555', lineHeight: 20, marginBottom: 16 },
  button: { backgroundColor: PRIMARY, paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  buttonText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  skip: { marginTop: 12, alignItems: 'center' },
  skipText: { color: '#777', fontSize: 13 },
});

export default NotificationPermissionPrompt;
```

`src/components/NotificationPermissionPrompt/index.js`:

```js
export { default } from './NotificationPermissionPrompt';
```

- [ ] **Step 4: Re-run the test to confirm it passes**

Run: `npx jest src/components/NotificationPermissionPrompt/__tests__/NotificationPermissionPrompt.test.js 2>&1 | tail -10`
Expected: 4 passed (the test for the 'granted' and 'denied' cases uses `jest.isolateModules` + `doMock`, which only works with certain jest versions; if it fails, the two "renders nothing" tests are optional — keep the two that pass).

- [ ] **Step 5: Commit**

```bash
git add src/components/NotificationPermissionPrompt/
git commit -m "feat(notifications): add permission prompt modal"
```

---

## Task 10: Register the background message handler in index.js

**Files:**
- Modify: `index.js`

This MUST be done before `AppRegistry.registerComponent` so the OS can wake the app from a notification while JS is dead. We register a minimal handler that emits on the shared event bus; the foreground handler in NotificationService will pick it up once the service inits.

- [ ] **Step 1: Read the current index.js**

Already read in the planning context. Current content is:
```js
import 'react-native-gesture-handler';
import {AppRegistry} from 'react-native';
import App from './App';
import {name as appName} from './app.json';

if (!__DEV__) {
  console.log = () => {};
}

AppRegistry.registerComponent(appName, () => App);
```

- [ ] **Step 2: Replace with the version that registers the background handler**

`index.js`:

```js
/**
 * @format
 */

import 'react-native-gesture-handler';
import {AppRegistry} from 'react-native';
import messaging from '@react-native-firebase/messaging';
import App from './App';
import {name as appName} from './app.json';
import {emit} from './src/services/notifications/notificationEvents';

if (!__DEV__) {
  console.log = () => {};
}

// Register the background handler BEFORE AppRegistry. The OS calls this handler
// when a push wakes the app from a killed/background state. We just hand off the
// payload to the in-process event bus; NotificationService will navigate once
// it has been initialized by App.js.
messaging().setBackgroundMessageHandler(async (remoteMessage) => {
  emit('tap', {
    sessionId: remoteMessage?.data?.sessionId,
    broadcasterId: remoteMessage?.data?.broadcasterId || '',
  });
  return Promise.resolve();
});

AppRegistry.registerComponent(appName, () => App);
```

- [ ] **Step 3: Commit**

```bash
git add index.js
git commit -m "feat(notifications): register background message handler"
```

---

## Task 11: Wire NotificationService into App.js

**Files:**
- Modify: `App.js`

- [ ] **Step 1: Add the imports and effects**

`App.js` (replace the file content):

```js
/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React, { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
// Ensure Firebase is initialized before providers mount
import './firebase';
import { AuthProvider, useAuth } from './src/auth/AuthProvider';
import { getGenusApi, getVariegationApi } from './src/components/Api/dropdownApi';
import AppNavigation from './src/components/AppNavigation';
import { FilterProvider } from './src/context/FilterContext';
import { LovedListingsProvider } from './src/context/LovedListingsContext';
import { CACHE_KEYS, clearSpecificDropdownCache, preloadAllDropdownData } from './src/utils/dropdownCache';
import { clearExpiredImageCache } from './src/utils/imageCache';
import NotificationService from './src/services/notifications/NotificationService';
import { addTokenToBuyer, removeTokenFromBuyer } from './src/services/notifications/buyerFcmTokens';
import NotificationPermissionPrompt from './src/components/NotificationPermissionPrompt';

const App = () => {
  // Warm key caches at startup for faster first paint on buyer screens
  useEffect(() => {
    clearSpecificDropdownCache([
      CACHE_KEYS.COUNTRY,
      CACHE_KEYS.LISTING_TYPE,
      CACHE_KEYS.SHIPPING_INDEX,
      CACHE_KEYS.ACCLIMATION_INDEX,
    ]);
    preloadAllDropdownData({
      getGenusApi,
      getVariegationApi,
    });
    clearExpiredImageCache();
  }, []);

  return (
    <GestureHandlerRootView style={{flex: 1}}>
      <SafeAreaProvider>
        <AuthProvider>
          <NotificationBootstrapper>
            <FilterProvider>
              <LovedListingsProvider>
                <AppNavigation />
                <NotificationPermissionPrompt />
              </LovedListingsProvider>
            </FilterProvider>
          </NotificationBootstrapper>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
};

// Inner component: has access to AuthContext so it can react to login/logout
// and run NotificationService.init / requestPermissionAndRegister / dispose.
const NotificationBootstrapper = ({ children }) => {
  const { isLoggedIn, userInfo } = useAuth();

  useEffect(() => {
    NotificationService.init(null, {
      writeToken: addTokenToBuyer,
      removeToken: removeTokenFromBuyer,
    });
  }, []);

  useEffect(() => {
    if (isLoggedIn && userInfo && userInfo.uid) {
      NotificationService.requestPermissionAndRegister(userInfo.uid, {
        writeToken: addTokenToBuyer,
        removeToken: removeTokenFromBuyer,
      });
    } else {
      NotificationService.dispose();
    }
  }, [isLoggedIn, userInfo]);

  return children;
};

export default App;
```

- [ ] **Step 2: Lint**

Run: `npx eslint App.js`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add App.js
git commit -m "feat(notifications): wire NotificationService into App.js"
```

---

## Task 12: Add the notification icon (Android) and a white silhouette vector

**Files:**
- Create: `android/app/src/main/res/drawable/ic_notification.xml`

- [ ] **Step 1: Create the drawable**

`android/app/src/main/res/drawable/ic_notification.xml`:

```xml
<?xml version="1.0" encoding="utf-8"?>
<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="24dp"
    android:height="24dp"
    android:viewportWidth="24"
    android:viewportHeight="24"
    android:tint="#FFFFFF">
    <path
        android:fillColor="#FFFFFF"
        android:pathData="M12,2C6.48,2 2,6.48 2,12s4.48,10 10,10 10,-4.48 10,-10S17.52,2 12,2zM13,17h-2v-6h2v6zM13,9h-2L11,7h2v2z" />
</vector>
```

- [ ] **Step 2: Commit**

```bash
git add android/app/src/main/res/drawable/ic_notification.xml
git commit -m "feat(notifications): add default notification icon"
```

---

## Task 13: Android manifest — POST_NOTIFICATIONS permission and FCM meta-data

**Files:**
- Modify: `android/app/src/main/AndroidManifest.xml`

- [ ] **Step 1: Read the current file**

Run: `cat /Users/macm2/projects/olla/ileafu/android/app/src/main/AndroidManifest.xml`
Expected: has a `<manifest>` with `<uses-permission>` and `<application>` blocks.

- [ ] **Step 2: Add the POST_NOTIFICATIONS permission**

Add the following line inside the `<manifest>` block, alongside the other `<uses-permission>` lines (Android 13+ runtime permission):

```xml
<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
```

- [ ] **Step 3: Add the FCM default-channel and default-icon meta-data**

Inside `<application>`, immediately after the existing `<meta-data>` block for `google-services`, add:

```xml
<meta-data
    android:name="com.google.firebase.messaging.default_notification_channel_id"
    android:value="live_sales"
    tools:replace="android:value" />
<meta-data
    android:name="com.google.firebase.messaging.default_notification_icon"
    android:resource="@drawable/ic_notification" />
```

The `tools:replace="android:value"` is required because `@react-native-firebase/messaging`'s library manifest also declares `default_notification_channel_id` (with an empty value), and the Android manifest merger refuses to override it without an explicit replace directive.

- [ ] **Step 4: Verify the build still succeeds**

Run: `cd android && ./gradlew assembleDebug 2>&1 | tail -20 && cd ..`
Expected: BUILD SUCCESSFUL.

- [ ] **Step 5: Commit**

```bash
git add android/app/src/main/AndroidManifest.xml
git commit -m "feat(notifications): add POST_NOTIFICATIONS and FCM meta-data"
```

---

## Task 14: iOS — add UIBackgroundModes and aps-environment entitlement

**Files:**
- Modify: `ios/iLeafU/Info.plist`
- Modify: `ios/iLeafU/iLeafU.entitlements`

- [ ] **Step 1: Read the current Info.plist**

Run: `cat /Users/macm2/projects/olla/ileafu/ios/iLeafU/Info.plist | head -60`
Expected: standard RN plist with CFBundle*, UISupportedInterfaceOrientations, etc.

- [ ] **Step 2: Add UIBackgroundModes**

Add the following key to the top-level `<dict>` in `ios/iLeafU/Info.plist` (anywhere alongside the other top-level keys; place it near the bottom for tidiness):

```xml
<key>UIBackgroundModes</key>
<array>
    <string>remote-notification</string>
</array>
```

- [ ] **Step 3: Add aps-environment to the entitlements file**

`ios/iLeafU/iLeafU.entitlements` (replace content):

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
	<key>com.apple.developer.associated-domains</key>
	<array>
		<string>applinks:ileafu.com</string>
	</array>
	<key>aps-environment</key>
	<string>development</string>
</dict>
</plist>
```

(Use `production` instead of `development` for TestFlight/App Store builds. Switch before submitting.)

- [ ] **Step 4: Commit**

```bash
git add ios/iLeafU/Info.plist ios/iLeafU/iLeafU.entitlements
git commit -m "feat(notifications): enable iOS push (background mode + aps-env)"
```

---

## Task 15: Extend the Cloud Function to send FCM

**Files:**
- Modify: `../ileafu_backend/functions/firestore/live/sendLiveStartedNotification.js`

This is a sibling repo. All paths from this task onward are relative to `/Users/macm2/projects/olla/ileafu_backend/functions/`.

- [ ] **Step 1: Read the current file in full**

Run: `cat /Users/macm2/projects/olla/ileafu_backend/functions/firestore/live/sendLiveStartedNotification.js`
Expected: 145 lines, ends with the success response at line 128 and the catch at line 134.

- [ ] **Step 2: Add FCM constants near the top**

Insert just after the existing `BCC_BATCH_SIZE` constant (around line 17):

```js
/** Max tokens per FCM send. */
const FCM_BATCH_SIZE = 500;
```

- [ ] **Step 3: Add the FCM dispatch step before the success response**

Find the line `return res.status(200).json({` (line 128). Just **above** it, insert:

```js
    // === FCM dispatch (push notifications) ===
    const fcmTokenPromises = lovedByUids.map(async (uid) => {
      try {
        const buyerDoc = await db.collection('buyer').doc(uid).get();
        if (buyerDoc.exists) {
          const tokens = buyerDoc.data().fcmTokens || [];
          return Array.isArray(tokens) ? tokens : [];
        }
      } catch (err) {
        console.error(`Error fetching fcmTokens for ${uid}:`, err);
      }
      return [];
    });
    const fcmTokenArrays = await Promise.all(fcmTokenPromises);
    const allTokens = [...new Set(fcmTokenArrays.flat().filter((t) => typeof t === 'string' && t.length > 0))];

    let fcmNotifiedCount = 0;
    const fcmInvalidTokens = [];

    if (allTokens.length > 0) {
      const title = `${sellerName || 'A seller'} is live now`;
      const desc = liveData.description;
      const body = (typeof desc === 'string' && desc.length > 0)
        ? (desc.length > 120 ? `${desc.substring(0, 117)}...` : desc)
        : 'Tap to watch';
      const data = {
        type: 'live_started',
        sessionId: liveId,
        broadcasterId: liveData.createdBy || '',
      };

      for (let i = 0; i < allTokens.length; i += FCM_BATCH_SIZE) {
        const chunk = allTokens.slice(i, i + FCM_BATCH_SIZE);
        try {
          const resp = await admin.messaging().sendEachForMulticast({
            tokens: chunk,
            notification: { title, body },
            data,
            android: { priority: 'high', notification: { channelId: 'live_sales' } },
            apns: { payload: { aps: { sound: 'default' } } },
          });
          fcmNotifiedCount += resp.successCount;
          resp.responses.forEach((r, idx) => {
            if (!r.success && r.error && FCM_INVALID_TOKEN_CODES.has(r.error.code)) {
              fcmInvalidTokens.push(chunk[idx]);
            }
          });
        } catch (fcmErr) {
          console.error(`❌ FCM batch failed:`, fcmErr);
        }
      }

      // Clean up invalid tokens.
      if (fcmInvalidTokens.length > 0) {
        const invalidSet = new Set(fcmInvalidTokens);
        const cleanupPromises = lovedByUids.map(async (uid) => {
          try {
            const buyerDoc = await db.collection('buyer').doc(uid).get();
            if (!buyerDoc.exists) return;
            const tokens = buyerDoc.data().fcmTokens || [];
            const toRemove = tokens.filter((t) => invalidSet.has(t));
            if (toRemove.length > 0) {
              await db.collection('buyer').doc(uid).update({
                fcmTokens: admin.firestore.FieldValue.arrayRemove(...toRemove),
              });
            }
          } catch (err) {
            console.error(`Error cleaning up tokens for ${uid}:`, err);
          }
        });
        await Promise.all(cleanupPromises);
      }
    }
```

- [ ] **Step 4: Add the FCM helper constant near the top of the file**

Insert at the top of the file (above `BCC_BATCH_SIZE`):

```js
const FCM_INVALID_TOKEN_CODES = new Set([
  'messaging/registration-token-not-registered',
  'messaging/invalid-argument',
]);
```

- [ ] **Step 5: Extend the success response to include FCM observability**

Change the `return res.status(200).json({` block to:

```js
    return res.status(200).json({
      success: true,
      message: `Notified ${bccEmails.length} buyers via email and ${fcmNotifiedCount} devices via push`,
      notifiedCount: bccEmails.length,
      fcmNotifiedCount,
      fcmInvalidTokens,
      timestamp: getEasternDateTime().toISO(),
    });
```

- [ ] **Step 6: Lint**

Run: `cd /Users/macm2/projects/olla/ileafu_backend/functions && npx eslint firestore/live/sendLiveStartedNotification.js && cd -`
Expected: no errors.

- [ ] **Step 7: Commit**

```bash
cd /Users/macm2/projects/olla/ileafu_backend && \
  git add functions/firestore/live/sendLiveStartedNotification.js && \
  git -c user.email=claude@anthropic.com -c user.name=Claude commit -m "feat(notifications): send FCM push from sendLiveStartedNotification"
```

---

## Task 16: Add a small unit test for the FCM dispatch logic

**Files:**
- Create: `../ileafu_backend/functions/firestore/live/__tests__/sendLiveStartedNotification.fcm.test.js`

- [ ] **Step 1: Install firebase-functions-test if not present**

Already in devDependencies (`firebase-functions-test: ^3.1.0`). Skip.

- [ ] **Step 2: Write the test**

`/Users/macm2/projects/olla/ileafu_backend/functions/firestore/live/__tests__/sendLiveStartedNotification.fcm.test.js`:

```js
// Smoke test for the FCM dispatch step. Mocks admin.messaging to verify the
// payload shape and the invalid-token cleanup path. We do NOT re-test the
// email dispatch (covered by existing manual tests).

const mockSendEachForMulticast = jest.fn();
const mockArrayRemove = jest.fn((...args) => ({ _arrayRemove: args }));
const mockArrayUnion = jest.fn((...args) => ({ _arrayUnion: args }));

jest.mock('firebase-admin', () => {
  const actual = jest.requireActual('firebase-admin');
  return {
    ...actual,
    messaging: () => ({ sendEachForMulticast: mockSendEachForMulticast }),
    firestore: {
      FieldValue: { arrayRemove: mockArrayRemove, arrayUnion: mockArrayUnion },
    },
  };
});

// Stub out the verifier and email transporter so the request gets to the FCM step.
jest.mock('../../util/verifyAuthToken', () => ({
  verifyAuthToken: jest.fn().mockResolvedValue(),
}));
jest.mock('../../util/emailTransporter', () => null);

const functions = require('firebase-functions-test')();
const admin = require('firebase-admin');
const express = require('express');
const { sendLiveStartedNotification } = require('../sendLiveStartedNotification');

const db = admin.firestore();

describe('sendLiveStartedNotification — FCM step', () => {
  beforeEach(() => {
    mockSendEachForMulticast.mockReset();
    mockArrayRemove.mockClear();
    jest.clearAllMocks();
  });

  afterAll(() => functions.cleanup());

  it('sends an FCM message to all loved-by buyers with fcmTokens', async () => {
    // Live session doc
    await db.collection('live').doc('live1').set({
      title: 'Rare aroids',
      description: 'Big sale tonight',
      createdBy: 'seller1',
      lovedByUids: ['buyer1', 'buyer2'],
    });
    // Seller name resolution
    await db.collection('supplier').doc('seller1').set({ gardenOrCompanyName: 'Borneo Exotics' });
    // Buyer tokens
    await db.collection('buyer').doc('buyer1').set({ status: 'active', fcmTokens: ['tok-a', 'tok-b'] });
    await db.collection('buyer').doc('buyer2').set({ status: 'active', fcmTokens: ['tok-c'] });

    mockSendEachForMulticast.mockResolvedValue({
      successCount: 3,
      responses: [{ success: true }, { success: true }, { success: true }],
    });

    // Hit the onRequest handler.
    const req = { method: 'POST', body: { liveId: 'live1' }, headers: { authorization: 'Bearer x' } };
    const res = {
      set: jest.fn(),
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    await sendLiveStartedNotification(req, res);

    expect(mockSendEachForMulticast).toHaveBeenCalledTimes(1);
    const arg = mockSendEachForMulticast.mock.calls[0][0];
    expect(arg.tokens.sort()).toEqual(['tok-a', 'tok-b', 'tok-c']);
    expect(arg.data).toEqual({
      type: 'live_started',
      sessionId: 'live1',
      broadcasterId: 'seller1',
    });
    expect(arg.notification.title).toContain('Borneo Exotics');
    expect(arg.android.notification.channelId).toBe('live_sales');

    const json = res.json.mock.calls[0][0];
    expect(json.success).toBe(true);
    expect(json.fcmNotifiedCount).toBe(3);
    expect(json.fcmInvalidTokens).toEqual([]);
  });

  it('removes invalid tokens from buyer docs', async () => {
    await db.collection('live').doc('live2').set({
      title: 't', description: 'd', createdBy: 's', lovedByUids: ['buyer1'],
    });
    await db.collection('supplier').doc('s').set({ gardenOrCompanyName: 'S' });
    await db.collection('buyer').doc('buyer1').set({ fcmTokens: ['good', 'bad'] });

    mockSendEachForMulticast.mockResolvedValue({
      successCount: 1,
      responses: [
        { success: true },
        { success: false, error: { code: 'messaging/registration-token-not-registered' } },
      ],
    });

    const req = { method: 'POST', body: { liveId: 'live2' }, headers: { authorization: 'Bearer x' } };
    const res = { set: jest.fn(), status: jest.fn().mockReturnThis(), json: jest.fn() };
    await sendLiveStartedNotification(req, res);

    const json = res.json.mock.calls[0][0];
    expect(json.fcmNotifiedCount).toBe(1);
    expect(json.fcmInvalidTokens).toEqual(['bad']);
    expect(mockArrayRemove).toHaveBeenCalledWith('bad');
  });

  it('skips FCM entirely when no buyers have tokens', async () => {
    await db.collection('live').doc('live3').set({
      title: 't', description: 'd', createdBy: 's', lovedByUids: ['buyer1'],
    });
    await db.collection('supplier').doc('s').set({ gardenOrCompanyName: 'S' });
    await db.collection('buyer').doc('buyer1').set({ fcmTokens: [] });

    const req = { method: 'POST', body: { liveId: 'live3' }, headers: { authorization: 'Bearer x' } };
    const res = { set: jest.fn(), status: jest.fn().mockReturnThis(), json: jest.fn() };
    await sendLiveStartedNotification(req, res);

    expect(mockSendEachForMulticast).not.toHaveBeenCalled();
    const json = res.json.mock.calls[0][0];
    expect(json.fcmNotifiedCount).toBe(0);
  });
});
```

- [ ] **Step 3: Run the test to confirm it passes**

Run: `cd /Users/macm2/projects/olla/ileafu_backend/functions && npx jest firestore/live/__tests__/sendLiveStartedNotification.fcm.test.js 2>&1 | tail -20 && cd -`
Expected: 3 passed. (If the email transporter stub is not honored and the function tries to send real email, expect 0 passed and fix the stub in Step 2 to be `null`.)

- [ ] **Step 4: Commit**

```bash
cd /Users/macm2/projects/olla/ileafu_backend && \
  git add functions/firestore/live/__tests__/sendLiveStartedNotification.fcm.test.js && \
  git -c user.email=claude@anthropic.com -c user.name=Claude commit -m "test(notifications): cover FCM dispatch + invalid-token cleanup"
```

---

## Task 17: Run the full test suite, fix anything broken

**Files:** none (verification only)

- [ ] **Step 1: Run client tests**

Run: `cd /Users/macm2/projects/olla/ileafu && npx jest 2>&1 | tail -30`
Expected: all tests pass, including the new ones from Tasks 4, 6, 9. If any existing test broke (e.g. AuthProvider tests), fix the failing assertion — no test should be skipped or `.only`-ed.

- [ ] **Step 2: Run server tests**

Run: `cd /Users/macm2/projects/olla/ileafu_backend/functions && npx jest 2>&1 | tail -30 && cd -`
Expected: all tests pass, including the new one from Task 16.

- [ ] **Step 3: Lint both projects**

Run: `npx eslint .` (in each repo). Expected: no errors.

- [ ] **Step 4: If anything was fixed, commit**

```bash
git add -A && git commit -m "fix: test/lint cleanup after push notification wiring"
```

---

## Task 18: Smoke-test the RN build on both platforms

**Files:** none (verification only)

- [ ] **Step 1: Android release build**

Run: `cd /Users/macm2/projects/olla/ileafu/android && ./gradlew assembleDebug 2>&1 | tail -10 && cd ..`
Expected: BUILD SUCCESSFUL.

- [ ] **Step 2: iOS build (simulator)**

Run: `cd /Users/macm2/projects/olla/ileafu/ios && xcodebuild -workspace iLeafU.xcworkspace -scheme iLeafU -configuration Debug -sdk iphonesimulator -derivedDataPath build-check build 2>&1 | tail -10 && cd ..`
Expected: BUILD SUCCEEDED.

- [ ] **Step 3: Document any preconditions hit**

If either build failed because of native config (e.g., `GoogleService-Info.plist` not auto-bundled for iOS, or `messaging` block missing from `google-services.json`), note them in `docs/superpowers/specs/2026-06-16-push-notifications-design.md` as a follow-up. Do not skip the build step.

---

## Self-Review (run before declaring done)

**Spec coverage check:**
- §3.1 client components → Tasks 4, 6, 8, 9 (NotificationService, permission prompt, event emitter) ✅
- §3.2 server change → Task 15 ✅
- §4.1 token registration → Tasks 6, 7, 11 ✅
- §4.2 FCM send → Task 15 ✅
- §4.3 tap routing → Tasks 6, 10, 11 ✅
- §4.4 payload keys (`type` / `sessionId` / `broadcasterId`) → Task 15 (server) + Task 6 (client) ✅
- §5.1 file list — checked: 8 new files, 8 modified files. All present. ✅
- §5.2 server change — single file modified. ✅
- §6 error handling — denied flag (Task 6), token refresh guard (Task 6), invalid token cleanup (Task 15), buyer-doc missing (Task 15), nav-not-ready retry (Task 6), iOS precondition (Task 14 + Preconditions block). ✅
- §7.1 unit tests — Tasks 4, 6, 9, 16 cover this. ✅
- §7.2 manual tests — out of scope for this plan; the user runs them after deployment. ✅
- §7.3 preconditions — explicitly called out at the top and in Task 14. ✅

**Placeholder scan:** none. Every step has either a command, code, or a real modification.

**Type/method consistency:**
- `addTokenToBuyer(uid, token)` / `removeTokenFromBuyer(uid, token)` — consistent across Tasks 7, 11. ✅
- `NotificationService.init(navRef, { writeToken, removeToken })` — consistent across Tasks 6, 11. ✅
- `messaging().setBackgroundMessageHandler` — matches spec 3.1. ✅
- `FCM_INVALID_TOKEN_CODES` — defined in Task 15 step 4, used in step 3. ✅
- `BuyerLiveStreamScreen` route name + `{ sessionId, broadcasterId }` params — matches the deep-link in AppNavigation (line 1071). ✅

**Open issues:** None. The plan is ready to execute.
