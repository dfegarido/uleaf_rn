# Lessons learned

## iOS APNs token is delivered asynchronously after `registerDeviceForRemoteMessages()`

**What happened:** After adding `registerDeviceForRemoteMessages()` before `getToken()`, the iOS warning still appeared:
`[messaging/unknown] No APNS token specified before fetching FCM Token`.

**Why:** On iOS, `registerDeviceForRemoteMessages()` resolves as soon as the registration request is made, but the actual APNs device token is delivered later via the app delegate. Calling `getToken()` immediately races that delivery and fails.

**Rule for future:** When a native SDK method “registers” or “requests permission” but the actual token/credential is delivered through a separate async delegate/path, always:
1. Wait a short moment after the registration call (e.g. 400 ms) for the native callback to fire.
2. Retry the token fetch with backoff, scoped **only** to the specific transient race error.
3. Fail fast for unrelated errors so we don’t mask real bugs.

**How to apply:** Use a small helper like `_getTokenWithRetry()` that inspects the error message for the race signature (`apns` + `token`) and retries a limited number of times. Add unit tests that queue transient errors and assert success after retries, plus a test that unrelated errors do not retry.

**Reference:** `src/services/notifications/NotificationService.js` `_ensureRegisteredForRemoteMessages`, `_getTokenWithRetry`, `_isApnsNotReadyError`.
