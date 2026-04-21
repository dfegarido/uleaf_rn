# RN 0.84 upgrade — pre-upgrade baseline checklist

Use this **before** and **after** the upgrade to compare behavior (see `react-native-0.84-upgrade-checklist.md` §0).

**Recorded baseline date:** _fill before testing_  
**Devices:** _Android API / device model; iOS version / device model_

## Build

- [ ] `npm run android` succeeds (Debug)
- [ ] `npm run ios` succeeds (Debug)

## Auth and navigation

- [ ] Login works
- [ ] Buyer tab flow loads
- [ ] Seller tab flow loads
- [ ] Admin / Sub-admin flow loads (if applicable)

## Shop / browse

- [ ] Browse or shop list loads
- [ ] Search works

## Chat

- [ ] Open Messages / group chat
- [ ] Pagination loads older messages without duplicates
- [ ] Deleted messages stay hidden
- [ ] Seller display names / masking as expected

## Live (Agora)

- [ ] Can start or join a live session
- [ ] Video renders; permissions OK

## Camera (vision-camera)

- [ ] Open listing or chat camera path
- [ ] Capture works

## Commerce (if must-not-break)

- [ ] Cart / checkout smoke (optional per product priority)

---

## Post-upgrade (0.84) — engineering smoke

- [ ] `npm test` passes
- [ ] `npm run lint:ci-gate` passes (Jest/config/metro entrypoints; full-repo `npm run lint` may still list historical warnings)
- [ ] Android: `cd android && ./gradlew assembleDebug` (or `npm run android`)
- [ ] iOS: `cd ios && pod install`, then `npm run ios` or Xcode **Debug** build

---

_Create branch `rn-0.84-upgrade` when starting the upgrade (if using git)._
