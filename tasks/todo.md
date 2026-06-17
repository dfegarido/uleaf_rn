# Fix RN Firebase messaging deprecation + iOS APNS token error

## Problem
On every app open, the console shows two warnings from `NotificationService.js:99`:

1. `This method is deprecated (as well as all React Native Firebase namespaced API)... Please use getApp() instead.`
2. `Method called was getToken. Please use getToken() instead.`

And `getToken` fails with:

```
[messaging/unknown] The operation couldn’t be completed. No APNS token specified before fetching FCM Token
```

Root causes:
- `NotificationService.js` still imports the namespaced default export `import messaging from '@react-native-firebase/messaging'` and calls `messaging().getToken()`. RN Firebase v22+ deprecated this in favor of the Web-modular SDK style (`getMessaging()`, `getToken(messaging)`, etc.).
- On iOS, `getToken()` needs an APNS device token. The silent registration path (`registerWithoutPrompting`) calls `getToken()` without first ensuring the device is registered for remote notifications / has permission, so iOS returns the APNS error.

## Plan

1. **Migrate `NotificationService.js` to modular RN Firebase messaging API**
   - Replace default import with named imports: `getMessaging`, `getToken`, `onMessage`, `onTokenRefresh`, `onNotificationOpenedApp`, `getInitialNotification`, `requestPermission`, `registerDeviceForRemoteMessages`, `isDeviceRegisteredForRemoteMessages`.
   - Create a singleton `messaging` instance via `getMessaging()` once at module load.
   - Rewrite every `messaging().method(...)` call to `method(messaging, ...)`.
   - Keep the public API of `NotificationService` unchanged so callers in `App.js` / `NotificationSettingsScreen.js` don't need edits.

2. **Fix iOS APNS token error in silent registration**
   - In `registerWithoutPrompting`, before `getToken(messaging)`, check `isDeviceRegisteredForRemoteMessages(messaging)`.
   - If not registered, await `registerDeviceForRemoteMessages(messaging)` (wrap in try/catch; swallow expected first-time user-denial cases).
   - Keep `requestPermissionAndRegister` unchanged in flow (it already requests permission, which registers the device on iOS), but migrate to modular calls.

3. **Migrate `index.js` background handler to modular API**
   - Replace `import messaging from '@react-native-firebase/messaging'` with `import { getMessaging, setBackgroundMessageHandler }`.
   - Replace `messaging().setBackgroundMessageHandler(...)` with `setBackgroundMessageHandler(messaging, ...)`.

4. **Update Jest mock for modular API**
   - Change `__mocks__/@react-native-firebase/messaging.js` from a default function export to named exports that mirror the modular API.
   - Keep existing test helpers (`__setToken`, `__setPermission`, `__trigger*`, `__reset`) so existing test assertions stay valid.

5. **Update tests to use modular imports**
   - Update `NotificationService.test.js` to import named functions from the mock and adjust assertions from `messaging().method` to `method`.

6. **Verify**
   - Run `npm test` / `npx jest src/services/notifications` and ensure all notification tests pass.
   - Run `npm run lint` on touched files and clean any new warnings.
   - Confirm no other production files import the deprecated namespaced messaging API.

## Files touched
- `src/services/notifications/NotificationService.js`
- `index.js`
- `src/hooks/useNotificationPermission.js`
- `__mocks__/@react-native-firebase/messaging.js`
- `src/services/notifications/__tests__/NotificationService.test.js`

## Out of scope
- No changes to `App.js`, `NotificationSettingsScreen.js`, or `buyerFcmTokens.js` (their public `NotificationService` contract stays the same).
- No native iOS project changes; the APNS fix is in JS by ensuring remote-notification registration before token fetch.

## Remaining issue (2026-06-17) — RESOLVED
On iOS the APNS error still occurred because `registerDeviceForRemoteMessages()` resolves **before** iOS asynchronously delivers the APNs device token to Firebase. Calling `getToken()` immediately afterwards still hit `No APNS token specified before fetching FCM Token`. Fixed by:
1. Adding a 400 ms wait after `registerDeviceForRemoteMessages()` to let the native APNs token delegate fire.
2. Adding `_getTokenWithRetry()` helper that retries `getToken()` up to 5 times with 400–1200 ms backoff **only** for errors whose message contains “APNS token”. Other errors fail immediately.
3. Replacing every `getToken()` call in `NotificationService` with `_getTokenWithRetry()`.

## Review / Verification
- [x] Migrated all `@react-native-firebase/messaging` usage to the modular Web-SDK-style API.
- [x] Added `_ensureRegisteredForRemoteMessages()` helper and called it before every `getToken()` path.
- [x] Added `_getTokenWithRetry()` and `_isApnsNotReadyError()` helpers; wired into `requestPermissionAndRegister`, `registerWithoutPrompting`, and `removeToken`.
- [x] Rewrote the Jest manual mock to export named modular functions (`getMessaging`, `getToken`, etc.) and kept test helpers (`__setToken`, `__setPermission`, `__setRegistered`, `__setTokenErrors`, `__trigger*`, `__reset`).
- [x] Updated `NotificationService.test.js` to import named mocks; added tests for iOS remote-message registration, transient APNS retry success, APNS retry exhaustion, and non-APNS immediate failure.
- [x] `npx jest --no-coverage` → 23/23 tests pass.
- [x] `npx eslint` on all changed files → 0 errors, 0 warnings.
- [x] `grep` confirmed no remaining `import messaging from '@react-native-firebase/messaging'` or `messaging().` calls in source (outside `node_modules`).
