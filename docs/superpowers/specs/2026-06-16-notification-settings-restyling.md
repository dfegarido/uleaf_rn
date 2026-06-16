# Notification Settings Screen — Restyle & Copy Update

**Date:** 2026-06-16
**Status:** Approved for design
**Scope:** `src/screens/Buyer/Profile/NotificationSettingsScreen.js` only
**Author:** brainstorming session

## 1. Goal

The push notifications feature shipped earlier today, and the `sendLiveStartedNotification` Cloud Function has been fixed to broadcast to **all** active buyers (not just those who "loved" a session). The Notification Settings screen was built before that decision and now has two issues:

1. **Visual inconsistency** — the screen uses a green (`#DFECDF`) header that doesn't match the rest of the buyer profile flow (Account Information, Privacy Policy, etc., all use a white header with a centered title). The header also has manual `paddingTop: Math.min(insets.top, 40)` and a `SafeAreaView` that excludes the top edge, which causes the header to overlap with the iOS status bar / Android camera-cutout area.
2. **Stale copy** — the screen still says "Get notified when a seller **you follow** goes live" and "sellers and listings **you have shown interest in**". This was true under the old loved-only design, but the function now broadcasts to every active buyer.

## 2. Non-Goals (YAGNI)

- No changes to `NotificationService`, `useNotificationPermission`, the `buyerFcmTokens` service, or any backend code.
- No new toggles, no per-seller or per-category preferences. This is still a single binary on/off.
- No i18n. Strings stay in English to match the rest of the buyer app for now.
- No analytics events.
- No restructuring of the toggle, the alert dialogs, or the helper-text logic.

## 3. Changes

### 3.1 Header & layout (matches `AccountInformationScreen.js`)

| Aspect | Before | After |
|---|---|---|
| `SafeAreaView` `edges` prop | `['left', 'right', 'bottom']` | omitted (defaults to all four) |
| Header `backgroundColor` | `#DFECDF` (light green) | `#FFFFFF` |
| Header `paddingTop` | `Math.min(insets.top, 40)` inline | `16` (handled by `SafeAreaView`'s top edge) |
| Header `paddingHorizontal` | `16` | `12` (matches Account Information) |
| Header title font | `Inter, 18pt, fontWeight: '700'` | `Inter, 16pt, fontWeight: '600', lineHeight: 22, textAlign: 'center', flex: 1` |
| Back button size | `32 × 32` | `24 × 24` (matches Account Information) |
| Right spacer | `32 × 32` | `24 × 24` (matches Account Information) |
| `StatusBar` `backgroundColor` | `#DFECDF` | `#FFFFFF` |

The white-background header now sits cleanly below the iOS status bar / Android camera-cutout because the `SafeAreaView` owns the top inset. The header is visually identical to Account Information, Privacy Policy, Terms of Use, and the other buyer profile sub-screens.

### 3.2 Copy updates (only the four strings below change)

| Element | Old | New |
|---|---|---|
| Row subtitle | "Get notified when a seller you follow goes live." | "Get a push notification every time a seller starts a live sale." |
| About paragraph | "We only send you notifications for sellers and listings you have shown interest in. We will never spam you." | "When push notifications are on, we'll send you a push every time any seller starts a live sale. You can turn this off at any time." |
| Helper — toggle off | "Push notifications are off. You can re-enable them at any time." | "Push notifications are off. Toggle on to receive alerts when sellers go live." |
| Helper — OS denied | "Notifications are turned off in your phone's settings. Update your system settings to receive push alerts again." | (unchanged) |
| "Turn off" confirm alert | (unchanged) | (unchanged) |
| "Notifications disabled" alert | (unchanged) | (unchanged) |

The "sellers you follow" phrasing is dropped because the function does not actually do that — it broadcasts to every active buyer. The new copy makes it explicit what the user is opting into, which is the user's stated intent ("the wordings that this will received a notification if this toggle on").

### 3.3 Body content (unchanged)

- The Preferences / About section structure, the row card, the bell icon, the green toggle, and the helper-text logic all stay as-is.
- The toggle behavior (`NotificationService.requestPermissionAndRegister` / `NotificationService.removeToken`) is unchanged.
- The two `Alert` dialogs are unchanged.
- The bell SVG icon, the toggle thumb animation, the `Loading` overlay, and the `useNotificationPermission` hook are unchanged.

## 4. Data Flow

No data flow changes. The screen still reads from the same hook and calls the same `NotificationService` methods.

## 5. Files Modified

| Path | Change |
|---|---|
| `src/screens/Buyer/Profile/NotificationSettingsScreen.js` | Header restyle, four copy strings updated, `StatusBar` background updated |

No other files (RN, Android, iOS, backend, tests) are touched.

## 6. Error Handling

No changes. The screen still surfaces failures via the existing `Alert.alert('Something went wrong', 'Please try again.')` catch block.

## 7. Testing Strategy

### 7.1 Manual (recommended)

| # | Scenario | Expected |
|---|---|---|
| 1 | Open the screen on iOS with a notch / Dynamic Island | Header title sits below the notch; no overlap with the system status bar |
| 2 | Open the screen on Android with a centered camera-cutout | Header title sits below the cutout; no overlap |
| 3 | Toggle notifications off then back on | Helper text, alerts, and OS prompt behavior are unchanged |
| 4 | Verify the row subtitle and About text reflect the new copy | Match the strings in §3.2 |

### 7.2 Automated

No new automated tests. The existing `useNotificationPermission` hook and `NotificationService` tests still cover the underlying behavior; the changes here are pure copy and styling.

## 8. Out-of-Spec Follow-Ups (deferred)

- Per-seller mute list. (Out of scope — the toggle is global.)
- Notification categories (live-started vs. order updates vs. chat). (The chat push already exists as a separate code path.)
- A future "preview" of what a push will look like.
- Localizing all new copy to Filipino/Chinese/etc. when the rest of the app is localized.
