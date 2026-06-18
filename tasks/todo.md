# App Update Card Refactor

## Goal
Consolidate the duplicated app-update card JSX from the buyer shop, seller home, and admin home screens into a single reusable `AppUpdateCard` component. Apply the new green-themed wording already drafted in `ScreenShop.js` to all three screens.

## Context
The same update card is copy-pasted inline in three screens:
- `ileafu/src/screens/Buyer/Shop/ScreenShop.js` (lines ~1287–1376)
- `ileafu/src/screens/Seller/Home/ScreenHome.js` (lines ~586–673)
- `ileafu/src/screens/Admin/Home/Home.js` (lines ~454–542)

All three duplicate:
- `showUpdateCard` state
- a `useEffect` calling `getAppVersionApi()` and `isAppUpdateRequired()`
- the store-link `handleUpdatePress` handler
- the same card JSX, colors, close button, and decorative icon

Only the surrounding margins differ slightly between screens.

## Plan
- [x] 1. Create `src/components/AppUpdateCard/AppUpdateCard.js` with self-contained logic:
  - own `showUpdateCard` state
  - mount-time version check using `getAppVersionApi`, `isAppUpdateRequired`, and `appVersion`
  - store-link handler using `Linking` and `Platform`
  - default green-themed copy from ScreenShop (heading, body, CTA)
  - optional `title`, `body`, `ctaText`, and `style` props for flexibility
- [x] 2. Create `src/components/AppUpdateCard/index.js` to re-export the component (matches existing project convention).
- [x] 3. Replace the inline card in `ScreenShop.js` with `<AppUpdateCard style={{ marginHorizontal: 10, marginTop: 10 }} />` and remove duplicated state, effect, handler, and related imports.
- [x] 4. Replace the inline card in `ScreenHome.js` with `<AppUpdateCard style={{ marginBottom: 16 }} />` and remove duplicated state, effect, handler, and related imports.
- [x] 5. Replace the inline card in `Home.js` with `<AppUpdateCard style={{ marginHorizontal: 20, marginTop: 16 }} />` and remove duplicated state, effect, handler, and related imports.
- [x] 6. Run ESLint on the touched files and verify no new errors.
- [x] 7. Confirm no `ActivityIndicator` usage and no hardcoded Cloud Function URLs were introduced.
- [x] 8. Update this todo with a short review note.

## Files touched
- `ileafu/src/components/AppUpdateCard/AppUpdateCard.js` (new)
- `ileafu/src/components/AppUpdateCard/index.js` (new)
- `ileafu/src/screens/Buyer/Shop/ScreenShop.js`
- `ileafu/src/screens/Seller/Home/ScreenHome.js`
- `ileafu/src/screens/Admin/Home/Home.js`

## Review
- Created `AppUpdateCard` as a self-contained component that handles its own version check, visibility state, and store-link navigation.
- Used the green-themed copy from ScreenShop as the default heading/body/CTA so all three screens share the same wording.
- Added optional `title`, `body`, `ctaText`, and `style` props so the card remains reusable without sacrificing flexibility.
- Replaced the duplicated inline JSX in all three screens with a single `<AppUpdateCard />` usage, passing a `style` prop to preserve each screen's original margins.
- Cleaned up now-redundant imports: removed `getAppVersionApi`, `isAppUpdateRequired`, `appVersion`, and `Platform`/`Linking` where they were no longer used.
- Fixed the hardcoded `{true && (...)}` guard in ScreenShop; the card now respects the version-check result.
- Implemented the new component with `StyleSheet.create`, so it introduces no new inline-style warnings.
- ESLint shows only pre-existing warnings/errors in the touched screens; no new errors were introduced by this refactor.
- No `ActivityIndicator` or hardcoded Cloud Function URLs were added.

---

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

---

# Fix "Browse Plants by Genus" stuck on skeletons

## Problem
The buyer shop screen's "Browse Plants by Genus" grid stayed on skeleton placeholders and never loaded genus images/names.

## Root cause
Recent uncommitted changes in `src/screens/Buyer/Shop/ScreenShop.js` introduced a `browseGenusLoadInitiatedRef` guard and an early-return check `if (loadingGenusData) { return; }` inside `loadBrowseGenusData`. Because `loadingGenusData` is initialized to `true`, the very first call to `loadBrowseGenusData` returned immediately without ever starting the API request, leaving the grid in a permanent loading/skeleton state.

## Files touched
- `src/screens/Buyer/Shop/ScreenShop.js`

## Fix
Removed the redundant `if (loadingGenusData) { return; }` guard. The `browseGenusLoadInitiatedRef` already prevents duplicate concurrent automatic loads; `loadingGenusData` remains the UI state and is correctly set to `false` in the `finally` block after the API call completes or fails.

## Verification
- Confirmed `API_ENDPOINTS.BROWSE_PLANTS_BY_GENUS` is defined in `src/config/apiConfig.js`.
- Confirmed `browsePlantsByGenusApi` in `src/components/Api/listingBrowseApi.js` uses that endpoint.
- Made a real GET to `https://us-central1-i-leaf-u.cloudfunctions.net/browsePlantsByGenus?limit=20&sortBy=genus&sortOrder=asc` and received HTTP 200 with `{"success":true,"genusGroups":[...]}` in the expected shape.
- Ran `npx eslint src/screens/Buyer/Shop/ScreenShop.js`: only pre-existing warnings/errors remain; the change introduced no new issues.
