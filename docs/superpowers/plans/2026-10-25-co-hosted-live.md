# Co-hosted Live Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A seller on air invites one active admin, who joins the same Agora channel as a second broadcaster and gets the seller's live controls on the seller's session; buyers see both videos.

**Architecture:** Co-host state lives on the `live` row (`cohostuid`, `cohoststatus`, `cohostinvitedat`). Four small edge functions drive invite / respond / leave / pending; listing functions resolve an "effective seller" from the session so a co-host's writes are the seller's. The app reuses `LiveBroadcastScreen` with a `cohost` route param and adds a second remote video box on the seller, co-host and buyer screens. Invites reach the admin by push (new admin token column) and an in-app poller.

**Tech Stack:** React Native 0.87, react-native-agora, Supabase edge functions (Deno), Firebase Auth tokens, FCM via `_shared/fcm.ts`.

**Spec:** `docs/superpowers/specs/2026-10-25-co-hosted-live-design.md`

## Global Constraints

- One co-host at a time; only `admin` rows with role `admin`/`sub_admin` and status `active`.
- Invite expires after 60 s.
- Listings written by a co-host carry `sellercode = live.createdby`.
- A co-host can leave, never end the live; co-host never sends the heartbeat or status updates.
- Co-host box: about 36% screen width, 16:9 portrait, left 16 pt, top ~25% height, 2 pt `#9EF01A` border, 12 pt radius, must not overlap the plant card or input.
- Kill switch: `live-cohost-invite` refuses unless `app_settings` key `cohost_enabled` = `true`; Invite button hidden unless detail returns `cohostEnabled: true`.
- Edge functions authenticate Firebase tokens in-function; `verify_jwt = false` in `config.toml`.
- Push payload `data.type = "cohost_invite"`, `data.sessionId`.

## Review Focus

- Seller's Agora uid leaves while the co-host is on → buyers must treat the live as ended, not show the co-host full-screen. (Task 6 test: buyer handler with seller uid offline navigates away; co-host uid offline only hides the box.)
- Co-host taps Accept after 60 s → refused with "This invite has expired". (Task 2 test.)
- Seller removes co-host while the admin is mid-add → the admin's add-listing call returns 403, not a listing on someone else's session. (Task 3 test: co-host with status cleared is refused.)
- Session ends while a co-host is on → co-host columns cleared. (Task 2 test via update-live-session-status.)
- Admin with no push token → invite still succeeds (push is best effort). (Task 4 test.)

---

### Task 1: Schema + settings flag

**Files:**
- Create: `ileafu_backend/supabase/migrations/041_live_cohost.sql`

- [ ] Add `live.cohostuid text`, `live.cohoststatus text`, `live.cohostinvitedat text`; `admin.fcmtokens jsonb default '[]'`; table `app_settings(key text primary key, value text)` (if not exists), revoke from anon/authenticated, grant to service_role; insert `('cohost_enabled','false') on conflict do nothing`.
- [ ] Apply to staging, check columns exist; apply to production; record in `supabase_migrations.schema_migrations` (version `041`).
- [ ] Commit.

### Task 2: Co-host lifecycle functions

**Files:**
- Create: `functions/_shared/liveCohost.ts`, `functions/live-cohost-invite/index.ts`, `functions/live-cohost-respond/index.ts`, `functions/live-cohost-leave/index.ts`, `functions/live-cohost-pending/index.ts`, `functions/t18-live-cohost.test.ts`
- Modify: `functions/update-live-session-status/index.ts` (clear co-host columns on `ended`), `functions/live-detail/index.ts` (`get` returns `cohostUid`, `cohostStatus` (null when expired), `cohostEnabled`), `supabase/config.toml`

**Interfaces:**
- Produces: `COHOST_INVITE_TTL_MS = 60000`; `isInviteExpired(invitedAt: string, now?: Date): boolean`; `effectiveCohostStatus(row): 'invited'|'live'|null`; `isActiveAdmin(uid): Promise<{id, name, photoUrl} | null>`; `isCohostEnabled(): Promise<boolean>`; `buildAgoraToken(channel: string, uid: number): {appId, token}` (moved out of `generate-live-session`, which then imports it).
- `POST live-cohost-invite {sessionId, adminUid}` → `{success, admin:{uid,name,photoUrl}}`; errors 403 not seller / 409 already has co-host / 400 not live / 403 "Co-hosting is not available yet".
- `POST live-cohost-respond {sessionId, accept, agoraUid}` → accept: `{success, appId, token, channelName, sellerUid}`; decline: `{success}`; 410 "This invite has expired".
- `POST live-cohost-leave {sessionId}` → `{success}` (caller = co-host or seller).
- `GET live-cohost-pending` → `{success, invite: null | {sessionId, title, sellerName, sellerPhoto, invitedAt}}`.

- [ ] Write `t18-live-cohost.test.ts` (mock fetch style of t16): seller invites active admin → row invited; non-seller invite 403; inactive admin 403; second invite while one live 409; flag off → 403; respond by wrong uid 403; respond after 61 s → 410; accept → status live + token; decline clears; leave by co-host clears; leave by seller clears; `ended` clears; pending returns invite only for that admin and not when expired; detail returns `cohostStatus: null` for expired invite.
- [ ] Run, see it fail; implement; run, see it pass; type-check every touched function.
- [ ] Commit.

### Task 3: Effective seller in listing functions

**Files:**
- Create: `functions/_shared/effectiveSeller.ts`, `functions/t19-effective-seller.test.ts`
- Modify: `add-listing`, `update-listing`, `set-active-live-listing`, `live-detail` (`sticky` mode)

**Interfaces:**
- Produces: `resolveEffectiveSeller(callerUid: string, sessionId: string | null): Promise<{ sellerUid: string, isCohost: boolean }>` — caller is seller → caller; caller is `cohostuid` with effective status `live` → `createdby`; no `sessionId` → caller (unchanged behaviour); else throws `EffectiveSellerError` (403).
- Each function replaces its `uid` with `sellerUid` for supplier lookup, `sellercode` and filters. `update-listing` and `set-active-live-listing` read optional `sessionId` from the body.

- [ ] Tests: seller passes through; live co-host maps to seller; invited-not-live co-host 403; cleared co-host 403; random admin 403; no sessionId → caller; add-listing as co-host writes `sellercode` = seller (mocked supplier lookup is by seller id).
- [ ] Fail → implement → pass; run t6, t16, t17 to check nothing regressed.
- [ ] Commit.

### Task 4: Admin push tokens + invite push

**Files:**
- Modify: `functions/fcm-token/index.ts` (caller with an `admin` row and no `buyer` row reads/writes `admin.fcmtokens`), `functions/live-cohost-invite/index.ts` (best-effort push via `_shared/fcm.ts`)
- Create: `functions/_shared/adminPush.ts` (`notifyAdminCohostInvite({adminUid, sessionId, sellerName, title})`, prunes dead tokens)

- [ ] Tests (extend t18): invite succeeds and returns 200 when the admin has no tokens or the sender throws; push called with `data.type = "cohost_invite"`.
- [ ] Implement, pass, deploy all functions from Tasks 2–4 to production with `--no-verify-jwt`.
- [ ] Commit.

### Task 5: App API + admin push registration + invite card

**Files:**
- Modify: `src/config/apiConfig.js` (`LIVE_COHOST_INVITE`, `LIVE_COHOST_RESPOND`, `LIVE_COHOST_LEAVE`, `LIVE_COHOST_PENDING`), `src/components/Api/liveApi.js` (`inviteCohostApi`, `respondCohostApi`, `leaveCohostApi`, `getPendingCohostInviteApi`, `getActiveAdminsApi` via existing admin list endpoint), `src/services/notifications/NotificationService.js` (route `cohost_invite` → emit to the invite card), `src/components/AppNavigation/AdminTabNavigator.js` (mount `CohostInviteGate`, register push for admins)
- Create: `src/components/CohostInviteGate.js` (polls pending every 5 s + on foreground; full-screen card Accept/Decline; Accept → `respondCohostApi` → `navigate('LiveBroadcastScreen', {sessionId, cohost: {appId, token, channelName, sellerUid}})`)

- [ ] Implement; lint; check on the iOS admin that the card appears for a pending invite inserted on the staging copy… (verified end-to-end in Task 7).
- [ ] Commit.

### Task 6: Broadcast and buyer screens: invite, co-host mode, video box

**Files:**
- Create: `src/screens/Live/CohostVideoBox.js` (renders `RtcSurfaceView`/`RtcTextureView` for a remote uid in the fixed box), `src/screens/Live/InviteAdminSheet.js` (overlay sheet like the viewers sheet, lists active admins), `src/utils/liveCohost.js` (`classifyRemoteUid(uid, sellerUid) → 'seller'|'cohost'`) + `src/utils/__tests__/liveCohost.test.js`
- Modify: `src/screens/Live/LiveBroadcastScreen.js`:
  - `route.params.cohost` → co-host mode: join with the given token as broadcaster, no Go Live/End Live (show Leave), no heartbeat, no status changes, no auto-end, no Invite; own camera full-screen, the seller's video in the box via `onUserJoined` (spec 4.2). Seller leaving (`classify = seller`) → toast + leave.
  - Host mode: Invite button on the rail when `cohostEnabled`; Invited… (60 s local timeout, cancel = leave); Remove when live; render co-host in the box on `onUserJoined`.
  - Pass `sessionId` to `setLiveListingActiveApi` (already), `updateListingApi` (Snap), and sticky note update.
  - List modal: add Delete with confirm (calls existing delete endpoint), both modes.
- Modify: `src/screens/Buyer/Live/BuyerLiveStreamScreen.js`: main video = seller uid (`getAgoraUid(brodcasterId)`), other broadcaster → box; only seller offline ends the live.

- [ ] Jest: `classifyRemoteUid` seller/cohost; buyer offline rule.
- [ ] Implement; lint counts unchanged; bundles for iOS and Android.
- [ ] Commit.

### Task 7: End-to-end on devices (production, test accounts)

Seller = Redmi (Ruth), admin = iOS simulator (Darwin Admin), buyer = Nubia.

- [ ] Flip `cohost_enabled` to `true` for the test only.
- [ ] Ruth creates a live request; approve via DB as before; go live.
- [ ] Ruth invites Darwin → push and card on iOS → Accept → both cameras; buyer on Nubia sees seller full + admin box.
- [ ] Darwin adds a listing → appears in Ruth's List, buyer shop; `sellercode` = Ruth. Darwin sets it active → card updates on Ruth + buyer.
- [ ] Darwin leaves → box gone everywhere, live continues. Re-invite, Ruth removes → admin screen leaves. Ruth ends live.
- [ ] Set `cohost_enabled` back to `false`; delete test listings; end test sessions.

### Task 8: Commit and push both repos
