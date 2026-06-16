# Notification Settings Screen — Restyle & Copy Update Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restyle the `NotificationSettingsScreen` header to match the buyer profile white-header pattern from `AccountInformationScreen`, and update the four user-facing strings so they accurately describe the broadcast-to-all-buyers behavior of the live-sale push notification.

**Architecture:** Single-file UI/copy change. No backend, no service, no hook changes. The screen's logic (toggle, helper text, alerts) stays untouched.

**Tech Stack:** React Native 0.84, `react-native-safe-area-context`, `@react-native-firebase/messaging` (unchanged).

---

## File Structure

| Path | Action | Responsibility |
|---|---|---|
| `src/screens/Buyer/Profile/NotificationSettingsScreen.js` | Modify | Restyle header, update four copy strings, update `StatusBar` color |

No new files. No new tests (pure copy/styling change; behavior is unchanged and already covered by existing `useNotificationPermission` and `NotificationService` tests).

---

## Task 1: Update copy strings on `NotificationSettingsScreen`

**Files:**
- Modify: `src/screens/Buyer/Profile/NotificationSettingsScreen.js:127-130, 158-160, 172-176`

This task changes only the user-facing strings. Header style is left as-is until Task 2.

- [ ] **Step 1: Update the row subtitle**

In `src/screens/Buyer/Profile/NotificationSettingsScreen.js`, find the `<Text style={styles.rowSubtitle}>` (around line 128) and replace its content:

Before:
```jsx
              <Text style={styles.rowSubtitle}>
                Get notified when a seller you follow goes live.
              </Text>
```

After:
```jsx
              <Text style={styles.rowSubtitle}>
                Get a push notification every time a seller starts a live sale.
              </Text>
```

- [ ] **Step 2: Update the "toggle off" helper text**

Find the `{hydrated && disabled && (` block (around line 157) and replace the helper sentence:

Before:
```jsx
          {hydrated && disabled && (
            <Text style={styles.helperText}>
              Push notifications are off. You can re-enable them at any time.
            </Text>
          )}
```

After:
```jsx
          {hydrated && disabled && (
            <Text style={styles.helperText}>
              Push notifications are off. Toggle on to receive alerts when sellers go live.
            </Text>
          )}
```

- [ ] **Step 3: Update the About paragraph**

Find the second `<View style={styles.section}>` (the "About" section, around line 171) and replace its `<Text style={styles.aboutText}>` content:

Before:
```jsx
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <Text style={styles.aboutText}>
            We only send you notifications for sellers and listings you have
            shown interest in. We will never spam you.
          </Text>
        </View>
```

After:
```jsx
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <Text style={styles.aboutText}>
            When push notifications are on, we'll send you a push every time
            any seller starts a live sale. You can turn this off at any time.
          </Text>
        </View>
```

- [ ] **Step 4: Commit the copy change**

```bash
git add src/screens/Buyer/Profile/NotificationSettingsScreen.js
git commit -m "copy(notification-settings): update wordings to reflect broadcast-to-all behavior"
```

Expected: one file changed, commit succeeds. The screen still renders with the old green header — Task 2 fixes that.

---

## Task 2: Restyle the header to match `AccountInformationScreen`

**Files:**
- Modify: `src/screens/Buyer/Profile/NotificationSettingsScreen.js:101-112, 185-208`

This task replaces the green header with the white header from `AccountInformationScreen`, fixes the SafeAreaView top-edge gap, and updates the `StatusBar` color.

- [ ] **Step 1: Replace the `SafeAreaView` opening tag**

In `src/screens/Buyer/Profile/NotificationSettingsScreen.js`, find (around line 101):

Before:
```jsx
    <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
      <StatusBar backgroundColor="#DFECDF" barStyle="dark-content" />
```

After:
```jsx
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#FFFFFF" barStyle="dark-content" />
```

This drops the `edges` prop so the top edge is included in the safe area, and switches the status bar to white. The `container` style already uses `flex: 1` with `backgroundColor: '#FFFFFF'`.

- [ ] **Step 2: Replace the header `View` block**

Find the header `<View style={[styles.header, ...]}>` (around line 104) and replace:

Before:
```jsx
      <View style={[styles.header, { paddingTop: Math.min(insets.top, 40) }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}>
          <LeftIcon width={24} height={24} fill="#393D40" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notification Settings</Text>
        <View style={styles.headerSpacer} />
      </View>
```

After:
```jsx
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}>
          <LeftIcon width={24} height={24} fill="#393D40" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notification Settings</Text>
        <View style={styles.spacer} />
      </View>
```

Note: the inline `paddingTop` is removed (the `SafeAreaView` top edge now handles it), the spacer is renamed from `headerSpacer` to `spacer` to match the `AccountInformationScreen` style key.

- [ ] **Step 3: Update the `header` and `spacer` style entries**

In the `StyleSheet.create({...})` block (around line 187), find the `header`, `backButton`, `headerTitle`, and `headerSpacer` entries and replace them with the `AccountInformationScreen` equivalents.

Before:
```js
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: '#DFECDF',
  },
  backButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#202325',
    fontFamily: 'Inter',
  },
  headerSpacer: { width: 32, height: 32 },
```

After:
```js
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 12,
    paddingHorizontal: 12,
    backgroundColor: '#FFFFFF',
    width: '100%',
  },
  backButton: {
    width: 24,
    height: 24,
  },
  headerTitle: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '600',
    fontSize: 16,
    lineHeight: 22,
    textAlign: 'center',
    color: '#202325',
    flex: 1,
  },
  spacer: {
    width: 24,
    height: 24,
  },
```

This is the same set of style keys used by `AccountInformationScreen.js` (lines 704–729 of that file), so the two headers render identically.

- [ ] **Step 4: Verify no orphan references remain**

Run from the repo root:

```bash
grep -n "headerSpacer\|paddingTop: Math.min(insets.top" src/screens/Buyer/Profile/NotificationSettingsScreen.js
```

Expected: no matches. If anything prints, that line still references the old style and the header will not match.

- [ ] **Step 5: Sanity-check the file loads**

If a Metro bundler is already running, just save the file and confirm no redbox. If not, run a quick syntax check:

```bash
node -e "require('@babel/parser').parse(require('fs').readFileSync('src/screens/Buyer/Profile/NotificationSettingsScreen.js','utf8'), {sourceType:'module', plugins:['jsx']})"
```

Expected: exits with no error. (If `@babel/parser` is not installed, skip this step — the Metro bundler / RN dev build will catch syntax errors at app load.)

- [ ] **Step 6: Commit the header restyle**

```bash
git add src/screens/Buyer/Profile/NotificationSettingsScreen.js
git commit -m "style(notification-settings): white header matching account information"
```

Expected: one file changed, commit succeeds.

---

## Task 3: Manual visual verification

**Files:** none — observation only.

- [ ] **Step 1: Open the screen on a real device or simulator**

Start the buyer app, log in, navigate to the profile tab, tap the notification-settings row. The screen should show:

- A white header bar that sits cleanly below the iOS notch / Android camera-cutout (no green background, no overlap).
- A centered "Notification Settings" title in 16pt Inter, font-weight 600.
- A left-aligned back chevron and a right-side invisible 24×24 spacer.
- The body content unchanged: a "Preferences" section with the bell-icon row, the green toggle, the helper text, and an "About" section.

- [ ] **Step 2: Confirm new copy**

Read the row subtitle, the toggle-off helper (toggle off, observe, toggle back on), and the About paragraph. Each should match the strings from Task 1, Step 1 / 2 / 3.

- [ ] **Step 3: Toggle the switch and confirm behavior is unchanged**

- Tap the toggle to turn it off → confirm dialog appears with the existing "Turn off notifications?" copy.
- Tap "Turn off" → helper text reads the new "Push notifications are off. Toggle on to receive alerts when sellers go live." string.
- Tap the toggle to turn it back on → OS prompt appears (or `Notifications disabled` alert if you previously denied).

If all three checks pass, the change is complete.

---

## Self-Review

- **Spec coverage:** §3.1 (header & layout) → Task 2. §3.2 (copy updates) → Task 1. §3.3 (body unchanged) — explicit "do not touch" preserved (no task touches it). §5 (files modified) → only `NotificationSettingsScreen.js`, matches both tasks. §6 / §7 (error handling / testing) → unchanged behavior, manual verification in Task 3.
- **Placeholder scan:** No "TBD", "TODO", "appropriate", or vague "add tests" steps. Every code block shows the exact before/after.
- **Type / style consistency:** The renamed `spacer` key is referenced in both Step 2 and Step 3 of Task 2 — no leftover `headerSpacer` references. The removed `paddingTop: Math.min(insets.top, 40)` is checked in Step 4.
- **No unrequested refactor:** The `BellIcon` SVG, the `handleToggle` logic, the `Alert` dialogs, the `Loading` overlay, and the `useNotificationPermission` hook are all left exactly as they were. Only the four copy strings, the `SafeAreaView` edges, the `StatusBar` color, the header `View` block, and the four style keys change.
