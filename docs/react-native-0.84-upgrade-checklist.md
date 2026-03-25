# React Native 0.75.x → 0.84 Upgrade Checklist

## Goal
Upgrade the `ileafu` React Native app from `react-native@0.75.4` to `react-native@0.84` with minimal regressions and a clear verification path.

## Scope (what this checklist considers)
- Your current `ileafu/package.json` dependencies (notably: reanimated, gesture-handler, vision-camera, Agora, Firebase, reanimated-carousel).
- Platform build configuration changes commonly required by RN upgrades.
- Known RN 0.84 platform/runtime behavior changes (Hermes V1 default, legacy architecture removal).

---

## 0. Pre-flight: baseline your current release behavior
Before upgrading dependencies:
1. Confirm you can run:
   - `npm run android`
   - `npm run ios` (if you do iOS work)
2. Record “golden” behaviors:
   - Auth/login and role-based navigation (`buyer`/`seller`/`admin`)
   - Shop/browse lists and search flows
   - Chat + group chat (message pagination, avatar masking, deletion behavior)
   - Live entry (Agora session start)
   - Any screens using camera / vision-camera
3. Note device/OS versions used for testing (Android API level, iOS version).

---

## 1. Environment prerequisites (RN 0.84 requirement checks)
RN `0.84` requires:
1. **Node.js 22.11+** (RN 0.84 blog specifies Node 22 minimum).
2. **Hermes V1 is default** in RN 0.84.
3. **Legacy Architecture code removal** continues on both iOS and Android in RN 0.84.

Also verify:
- Your repo currently satisfies `engines.node` in `ileafu/package.json` (it currently says `>=18`, so update your local runtime to Node 22.11+ for the upgrade process).

---

## 2. Dependency alignment plan (your current dependency risks)
Before the RN bump, identify the libraries that are most likely to require peer updates or native config changes:
1. **React**
   - RN 0.84 syncs with **React 19.2.3**.
   - Your app currently uses `react@18.3.1`, so expect a React bump and peer compatibility checks across UI libs.
2. **Rendering/runtime**
   - `react-native-reanimated` (`3.19.0`)
   - `react-native-gesture-handler` (`2.25.0`)
   - `react-native-screens` (`4.8`)
3. **Native-heavy integrations**
   - `react-native-vision-camera` (`4.7.2`)
   - `react-native-agora` (`^4.5.3`)
4. **Firebase**
   - `@react-native-firebase/*` pinned to `20.5.0`
   - Ensure Firebase libs remain compatible with the RN bump you apply.

Recommendation:
- Upgrade react-native in the smallest steps possible, and update libraries in lockstep based on peer compatibility notes from their release docs.

---

## 3. Upgrade execution steps (recommended order)
1. **Create a dedicated branch**
   - e.g. `rn-0.84-upgrade`
2. **Use the React Native Upgrade Helper**
   - Compare your current RN version to `0.84` and follow its “manual changes” list.
3. **Bump core runtime**
   - Update `react-native` to `0.84`.
   - Update `react` to the version RN expects (React 19.2.3).
4. **Reconcile ESLint / tooling**
   - RN 0.84 supports ESLint v9 flat config.
   - Your repo currently pins `eslint@^8`, so lint tooling likely needs updating.
5. **Rebuild native projects**
   - Android: expect possible Gradle/compileSdk adjustments.
   - iOS: CocoaPods changes are likely if RN core changes native build behavior.
6. **Resolve/verify Hermes V1 behavior**
   - If already on Hermes, you usually only need to validate performance and correctness.

---

## 4. Required “post-upgrade” checks (must run)
These are the highest-risk areas for runtime regressions:
1. **Cold start + navigation**
   - Validate the app boots cleanly with no Metro/Hermes errors.
2. **Chat + group chat**
   - Group chat avatar stability (no “avatar flicker” regressions).
   - Sender masking and skeleton expectations.
   - Message deletion: deleted messages are not visible in chat history.
   - Message pagination (older/newer loading) doesn’t duplicate items.
3. **Live / Agora**
   - Start/stop live sessions.
   - Verify permissions and that the video stack renders.
4. **Camera / vision-camera**
   - Open camera screens and validate capture flow.
5. **Performance smoke test**
   - Scroll in group list / messages for a minute.
   - Watch for overheating or sustained JS-thread load.

---

## 5. Common breaking points to watch for
1. **ESLint / tooling breakage**
   - RN 0.84’s tooling changes can make CI/lint fail unless you align ESLint config.
2. **Native dependency mismatches**
   - Vision-camera, Agora, and reanimated are the most common native conflict sources.
3. **Hermes changes**
   - Hermes V1 default may change debugging behavior, stack traces, and performance characteristics.
4. **Legacy Architecture removals**
   - If you have any explicit legacy toggles, expect them to be ignored/removed.

---

## 6. Suggested “verification metrics” (lightweight)
For each milestone (before upgrade / after upgrade):
- Time to open:
  - Messages screen
  - Groups tab
  - A group chat thread
- Time to fetch first visible chat rows
- Average FPS / subjective jank during scroll (manual)
- Memory stability (no obvious app restarts/crashes during 3–5 minutes of use)

---

## 7. Rollback strategy
1. Keep the previous `node_modules` / lockfile state available (or stash changes) until you’ve validated all critical paths.
2. If native build breaks:
   - Revert only the last dependency group changes (e.g., Agora or vision-camera first), not the entire RN bump.

---

## References
- React Native 0.84 release highlights:
  - Hermes V1 default
  - Node.js 22 minimum
  - Legacy architecture removal
  - https://reactnative.dev/blog/2026/02/11/react-native-0-84

