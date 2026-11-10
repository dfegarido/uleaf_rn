# Co-host invites for buyers and sellers: implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A seller on air can invite coshplantopia, any buyer, or any seller as a camera-only co-host. The invite reaches them by push or by the in-app card.

**Architecture:** Extend the existing co-host flow:
- the `live.cohost*` columns, and the `live-cohost-invite`, `live-cohost-respond`, `live-cohost-pending` and `live-cohost-leave` functions;
- `CohostInviteGate`, `CohostInviteBell` and `LiveBroadcastScreen`.

There are no new tables. Guest powers are enforced on the backend: `effectiveSeller` and `live-detail` sticky mode are open to admin co-hosts only. The app hides the same controls.

**Tech Stack:** Supabase edge functions (Deno and TypeScript, PostgREST through `supabaseFetch`), React Native, jest, FCM.

**Spec:** `ileafu/docs/superpowers/specs/2026-11-10-cohost-invite-any-user-design.md`. It builds on `2026-10-25-co-hosted-live-design.md`.

## Global Constraints

- **Repos and branches:** backend lives in `ileafu_backend`, the app in `ileafu`. Work on a new branch `feat/cohost-invite-any-user` in each repo, starting from `main`.
- **The only invitable admin:** `COHOST_ADMIN_EMAIL = "coshplantopia@gmail.com"`, matched case-insensitively. Status must be `active` and role `admin` or `sub_admin`.
- **Store app must keep working:**
  - `GET live-cohost-invite?sessionId=` with no `tab` still returns `{ admins, enabled }`.
  - `POST` still accepts `adminUid`.
  - The POST response still includes `admin`.
- **Push copy, for everyone:** title "Co-host invite", body `"<seller name> invited you to join their live"`. The data payload stays `{ type: "cohost_invite", sessionId }`.
- **Unchanged:** one co-host per live and the 60-second invite TTL (`COHOST_INVITE_TTL_MS`).
- **The co-host flag:** `cohost_enabled` stays true in prod. Never touch it.
- **App rules:**
  - All app API calls go through `API_ENDPOINTS`.
  - Loading states use the `Loading` component.
  - Invite sheet style: Inter font, green `#2E6B3E`, underline tabs.
- **Release order:** backend changes are safe for the store app and deploy first. Force update is a release step (Task 8), not code.

## Review Focus

1. **Search text with PostgREST special characters** (`,` `(` `)` `*` `%`). Searching `o'neil, (x)` must return results or an empty list, never a 500.
   - Test in Task 2: `search with special characters → 200`.
2. **A seller searching their own name on the Seller tab** must not see themselves. Inviting yourself is refused.
   - Tests in Task 1 and Task 2.
3. **A guest who was a buyer co-host, after the seller removes them,** must not be able to write.
   - Already covered: `resolveEffectiveSeller` checks status `live`.
   - Test in Task 3: `buyer guest refused even while live`.
4. **An account with both a buyer row and a supplier row** is invited as a seller. Its push tokens are on `buyer`.
   - Test in Task 4: `seller push reads supplier + buyer tokens, deduped`.
5. **The respond reply is missing `guestKind`** (an old server during rollout). The app must treat the guest as admin and keep today's behavior.
   - Test in Task 6: `canManageLive({ sellerUid })` returns `true`.

---

## Task 1: Backend: who can be invited (POST)

**Files:**
- Modify: `ileafu_backend/supabase/functions/_shared/liveCohost.ts`
- Modify: `ileafu_backend/supabase/functions/live-cohost-invite/index.ts` (the POST half)
- Test: `ileafu_backend/supabase/functions/t18-live-cohost.test.ts`

**Interfaces:**
- Produces, in `_shared/liveCohost.ts`:
  - `export const COHOST_ADMIN_EMAIL = "coshplantopia@gmail.com"`
  - `export type InviteeKind = "admin" | "buyer" | "seller"`
  - `export interface Invitee { uid: string; kind: InviteeKind; name: string; subtitle: string; photoUrl: string | null }`
  - `export async function loadInvitee(uid: string): Promise<Invitee | null>`
- Produces the POST body `{ sessionId, inviteeUid }`. `adminUid` is accepted as an alias. Response: `{ invitee, admin: invitee }`.

Steps:

- [ ] **Step 1: Write the failing tests.**
  - In `reset()`:
    - Add `tables.buyer = [{ id: "b1", username: "maria", firstname: "Maria", status: "active", fcmtokens: ["btok"] }, { id: "b0", username: "gone", status: "inactive" }]`.
    - Change `tables.admin[0]` to have `email: "coshplantopia@gmail.com"`.
    - Add another active admin, `{ id: "adm2", role: "admin", status: "active", email: "x@ileafu.com" }`.
    - Add `{ id: "s2", gardenorcompanyname: "Aroid Rep", status: "active" }` to `tables.supplier`, and give `seller` `status: "active"`.
    - Add `buyer` to the `tables` declaration.
  - New block `=== 1b. invite any user ===`:

```ts
check("invite buyer", [(await call(invite, "seller", "POST", { sessionId: "s1", inviteeUid: "b1" })).status, live().cohostuid], [200, "b1"]);
reset(); check("invite seller", (await call(invite, "seller", "POST", { sessionId: "s1", inviteeUid: "s2" })).body.invitee?.kind, "seller");
reset(); check("other active admin refused", (await call(invite, "seller", "POST", { sessionId: "s1", inviteeUid: "adm2" })).status, 403);
reset(); check("inactive buyer refused", (await call(invite, "seller", "POST", { sessionId: "s1", inviteeUid: "b0" })).status, 403);
reset(); check("self invite refused", (await call(invite, "seller", "POST", { sessionId: "s1", inviteeUid: "seller" })).status, 403);
reset(); check("adminUid alias still works", (await call(invite, "seller", "POST", { sessionId: "s1", adminUid: "adm" })).body.admin?.uid, "adm");
```

- [ ] **Step 2: Run the tests and watch them fail.**
  - Run from `ileafu_backend`: `deno run --allow-env --allow-read supabase/functions/t18-live-cohost.test.ts`
  - Expected: the new checks show FAIL (for example, "invite buyer" got 403), and the script exits 1.

- [ ] **Step 3: Implement `loadInvitee(uid)`.**
  - Check in this order and return the first match:
    1. **admin:** the `admin` row with role `admin` or `sub_admin`, status active, and `email` equal (ignoring case) to `COHOST_ADMIN_EMAIL`. Subtitle = email.
    2. **seller:** a `supplier` with status active. Name = `gardenorcompanyname`, or else first and last name. Subtitle = `@username`, or empty.
    3. **buyer:** a `buyer` with status active. Name = first and last name, or else username. Subtitle = `@username`.
  - Use lowercase column names in PostgREST paths, as the existing code does (`firstname`, `profilephotourl`).

- [ ] **Step 4: Update the POST handler.**
  - Read `inviteeUid || adminUid`.
  - If it equals the caller's uid, return 403 "You can't invite yourself.".
  - Replace the `loadActiveAdmin` check with `loadInvitee`. If it returns null: 403 "This person can't be invited.".
  - Patch `cohostuid` with the invitee's uid, as today.
  - Pass the invitee to the push step. Task 4 wires up the push itself; until then keep calling `notifyAdminCohostInvite` for admins only.
  - Return `createSuccessResponse({ invitee, admin: invitee })`.

- [ ] **Step 5: Run the tests again.**
  - Same command. Expected: `ALL PASS`.

- [ ] **Step 6: Commit.**
  - `git commit -m "feat(cohost): invite coshplantopia, any buyer or seller"` (in `ileafu_backend`)

## Task 2: Backend: invite list (GET with tabs, suggestions, search)

**Files:**
- Modify: `ileafu_backend/supabase/functions/live-cohost-invite/index.ts` (the GET half)
- Test: `ileafu_backend/supabase/functions/t18-live-cohost.test.ts`

**Interfaces:**
- **Consumes:** `COHOST_ADMIN_EMAIL` and `Invitee` from Task 1.
- **Produces:** `GET /live-cohost-invite?sessionId=&tab=admin|buyer|seller&q=`. Responses:
  - **No `tab`:** `{ admins: [{ uid, name, photoUrl }], enabled }`. `admins` holds only the coshplantopia row.
  - **With `tab`, `q` under 2 characters:** `{ groups: [{ title: string, people: Person[] }], enabled }`.
    - `admin`: one group "iLeafU admin".
    - `buyer`: "Watching your live", then "Bought from you".
    - `seller`: `groups: []`.
    - Empty groups are left out.
  - **With `tab`, `q` 2 or more characters:** `{ people: Person[], enabled }`.
  - Here `Person = { uid, name, subtitle, photoUrl }`.

Steps:

- [ ] **Step 1: Extend the test mock, then write the failing tests.**
  - In `mockFetch`:
    - Support `ilike.*x*` as a case-insensitive "contains".
    - Support `or=(col.ilike.*x*,col2.ilike.*x*)` as "any of these columns contains x".
    - Add an `orders` table, matched with `eq.` on `supplieruid`.
  - Tests:

```ts
reset();
tables.live[0].viewers = ["b1"]; tables.orders = [{ supplieruid: "seller", buyeruid: "b1" }];
const adm = await call(invite, "seller", "GET", undefined, "?sessionId=s1");
check("no tab → only coshplantopia", adm.body.admins?.map((a: Row) => a.uid), ["adm"]);
const bt = await call(invite, "seller", "GET", undefined, "?sessionId=s1&tab=buyer");
check("buyer tab groups", bt.body.groups?.map((g: Row) => g.title), ["Watching your live", "Bought from you"]);
check("seller tab no suggestions", (await call(invite, "seller", "GET", undefined, "?sessionId=s1&tab=seller")).body.groups, []);
check("buyer search", (await call(invite, "seller", "GET", undefined, "?sessionId=s1&tab=buyer&q=mar")).body.people?.map((p: Row) => p.uid), ["b1"]);
check("search hides inactive", (await call(invite, "seller", "GET", undefined, "?sessionId=s1&tab=buyer&q=gon")).body.people, []);
check("seller search hides self", (await call(invite, "seller", "GET", undefined, "?sessionId=s1&tab=seller&q=green")).body.people, []);
check("search with special characters → 200", (await call(invite, "seller", "GET", undefined, "?sessionId=s1&tab=buyer&q=" + encodeURIComponent("o'neil, (x)*"))).status, 200);
```

- [ ] **Step 2: Run the tests and watch them fail.**
  - Same command as Task 1. Expected: the new checks FAIL.

- [ ] **Step 3: Implement the GET handler.**
  - Keep the existing check that only the seller of this live can call it.
  - **Search terms:** strip everything except letters, digits, spaces, `.`, `_`, `@`, `'` and `-` before building the `or=(...)` filter. Search only when 2 or more characters are left.
  - **Buyer search:** filter `or=(username.ilike.*q*,firstname.ilike.*q*,lastname.ilike.*q*)&status=ilike.active&limit=20`.
  - **Seller search:** add `gardenorcompanyname` to the filter and `id=neq.<caller>`.
  - **"Watching your live":** the uids in `live.viewers`, looked up in `buyer` (status active). Leave out the caller and the current `cohostuid`.
  - **"Bought from you":**
    - Query `orders?select=buyeruid,createdat&supplieruid=eq.<caller>&order=createdat.desc&limit=200`.
    - Take the first 20 distinct buyer uids, leaving out anyone already in "Watching your live".
    - Look them up in `buyer` (status active).

- [ ] **Step 4: Run the tests again.**
  - Expected: `ALL PASS`.

- [ ] **Step 5: Commit.**
  - `git commit -m "feat(cohost): invite list tabs, suggestions and search"`

## Task 3: Backend: guests can't write; respond returns `guestKind`

**Files:**
- Modify: `ileafu_backend/supabase/functions/_shared/effectiveSeller.ts`
- Modify: `ileafu_backend/supabase/functions/live-detail/index.ts` (around lines 121–126)
- Modify: `ileafu_backend/supabase/functions/live-cohost-respond/index.ts`
- Test: `ileafu_backend/supabase/functions/t18-live-cohost.test.ts`

**Interfaces:**
- **Consumes:** `loadInvitee` from Task 1, and the existing `loadActiveAdmin`.
- **Produces:** the respond reply on accept adds `guestKind: InviteeKind`.

Steps:

- [ ] **Step 1: Write the failing tests.**
  - Import `live-detail` the same way the other handlers are imported.

```ts
reset(); Object.assign(live(), { cohostuid: "b1", cohoststatus: "live" });
let r = false; try { await resolveEffectiveSeller("b1", "s1"); } catch { r = true; }
check("buyer guest refused even while live", r, true);
Object.assign(live(), { cohostuid: "adm", cohoststatus: "live" });
check("admin guest still acts as seller", (await resolveEffectiveSeller("adm", "s1")).sellerUid, "seller");
Object.assign(live(), { cohostuid: "b1", cohoststatus: "live" });
check("buyer guest sticky note → 403", (await call(liveDetail, "b1", "POST", { sessionId: "s1", mode: "sticky", stickyNote: "hi" })).status, 403);
reset(); Object.assign(live(), { cohostuid: "b1", cohoststatus: "invited", cohostinvitedat: ago(1000) });
check("respond returns guestKind", (await call(respond, "b1", "POST", { sessionId: "s1", accept: true, agoraUid: 7 })).body.guestKind, "buyer");
```

  - Before writing the sticky-note test, read `live-detail/index.ts` to get the request method and body shape it really uses. Then adjust that test's `call(...)` to match.

- [ ] **Step 2: Run the tests and watch them fail.**
  - Expected: the 3 guest checks FAIL.

- [ ] **Step 3: `resolveEffectiveSeller`.** In the co-host branch, also require `await loadActiveAdmin(callerUid)`. Anyone else gets `EffectiveSellerError`.

- [ ] **Step 4: `live-detail`.** Change `isCohostOnAir` so it is true only when `await loadActiveAdmin(uid)` is also true.

- [ ] **Step 5: `live-cohost-respond`.** On accept, set `guestKind = (await loadInvitee(uid))?.kind ?? "admin"` and add it to the reply.

- [ ] **Step 6: Look for other writes that trust the co-host.**
  - Run: `grep -rn "cohostuid" supabase/functions --include=index.ts`
  - Every write path that trusts `cohostuid` must go through `resolveEffectiveSeller` or `loadActiveAdmin`. Fix any that don't, each with its own 403 test.

- [ ] **Step 7: Run the tests again.**
  - Expected: `ALL PASS`.
  - Also run `t6-live-end-purge.test.ts`; expected `ALL PASS`.

- [ ] **Step 8: Commit.**
  - `git commit -m "feat(cohost): buyer/seller guests are camera-only on the backend"`

## Task 4: Backend: push to buyers and sellers

**Files:**
- Create: `ileafu_backend/supabase/migrations/0NN_supplier_fcmtokens.sql`. Use the next free number after the highest migration.
- Modify: `ileafu_backend/supabase/functions/_shared/adminPush.ts`. Rename the export; keep the file.
- Modify: `ileafu_backend/supabase/functions/fcm-token/index.ts` (`TokenTable` and `readTokens`)
- Modify: `ileafu_backend/supabase/functions/live-cohost-invite/index.ts` (the push call)
- Test: `ileafu_backend/supabase/functions/t18-live-cohost.test.ts`

**Interfaces:**
- **Consumes:** `Invitee` from Task 1.
- **Produces:**
  - `export async function notifyCohostInvite(p: { invitee: Invitee; sessionId: string; sellerName: string; title: string }): Promise<void>`. It replaces `notifyAdminCohostInvite`.
  - `__setAdminPushSender` keeps its name, so existing tests still work.

Steps:

- [ ] **Step 1: Write the failing tests.**

```ts
reset(); await call(invite, "seller", "POST", { sessionId: "s1", inviteeUid: "b1" });
check("buyer push uses buyer tokens", pushCalls[0]?.tokens, ["btok"]);
reset(); tables.supplier[1].fcmtokens = ["stok"]; tables.buyer.push({ id: "s2", status: "active", fcmtokens: ["stok", "btok2"] });
await call(invite, "seller", "POST", { sessionId: "s1", inviteeUid: "s2" });
check("seller push reads supplier + buyer tokens, deduped", pushCalls[0]?.tokens, ["stok", "btok2"]);
```

- [ ] **Step 2: Run the tests and watch them fail.**

- [ ] **Step 3: Write the migration.**
  - `ALTER TABLE public.supplier ADD COLUMN IF NOT EXISTS fcmtokens jsonb NOT NULL DEFAULT '[]'::jsonb;`
  - Add a header comment pointing to the spec.

- [ ] **Step 4: `notifyCohostInvite`.**
  - Which tables it reads tokens from:
    - **admin:** `admin`
    - **buyer:** `buyer`
    - **seller:** `supplier`, then `buyer`
  - Remove duplicate tokens before sending.
  - Use the push copy from Global Constraints.
  - Dead tokens get pruned from whichever table each one came from.
  - It stays best effort: errors are swallowed, as they are today.

- [ ] **Step 5: `fcm-token`.**
  - Add `"supplier"` to `TokenTable` and to the order `readTokens` checks, after `buyer` and `admin`.
  - Leave the existing buyer-first order alone.

- [ ] **Step 6: Run the tests again.**
  - Run `t18`. If an fcm-token test exists, run it too (`ls supabase/functions | grep -i fcm`). Expected: `ALL PASS`.

- [ ] **Step 7: Commit.**
  - `git commit -m "feat(cohost): invite push to buyers and sellers"`

## Task 5: App: invite sheet with tabs and search

**Files:**
- Modify: `ileafu/src/config/apiConfig.js`. No new endpoint; reuse `LIVE_COHOST_INVITE`.
- Modify: `ileafu/src/components/Api/liveApi.js` (lines 348–352)
- Rename and modify: `ileafu/src/screens/Live/InviteAdminSheet.js` → `InviteCohostSheet.js`. Update its import in `LiveBroadcastScreen.js`.
- Modify: `ileafu/src/screens/Live/LiveBroadcastScreen.js`. The invite handler (around line 345) passes `person.uid`.

**Interfaces:**
- **Consumes:** the GET and POST shapes from Tasks 1 and 2.
- **Produces:**
  - `getCohostInviteesApi(sessionId: string, tab: 'admin'|'buyer'|'seller', q?: string)` resolves to `{ success, groups?, people?, error? }`.
  - `inviteCohostApi(sessionId: string, inviteeUid: string)`.
  - Remove `getCohostAdminsApi`.
  - `<InviteCohostSheet isVisible onClose sessionId onPick={(person) => …} />`.

Steps:

- [ ] **Step 1: API functions.** Write both in `liveApi.js`, following the existing `cohostCall` pattern. Encode `q` with `encodeURIComponent`.

- [ ] **Step 2: Build the sheet.** Match the approved mockup (option B):
  - Underline tabs in the order Admin, Buyer, Seller. Opens on **Buyer**.
  - Search box hidden on the Admin tab. Placeholder: `Search buyers by name or username` (or `sellers`).
  - Search waits 300 ms after typing stops, and starts at 2 or more characters.
  - Group titles in small grey text.
  - Rows: avatar (`ChatAvatar`), name, subtitle, and a green **Invite** button.
  - Loading inside the list uses `<Loading visible />` (inline).
  - **Empty and error text:**
    - Seller tab, or any empty group list: `Search for a buyer by name or username` (or `a seller`).
    - Search with no results: `No buyers match "<q>". Try another name or username.`
    - Load failure: `Couldn't load people. Pull down to try again.`
  - Keep the existing overlay, animation and back-button handling.
  - Drop the old line "The admin joins your live on camera and can manage your listings." Replace it with: `They join your live on camera.`

- [ ] **Step 3: Check it on the simulator.**
  - Seller account, go live, tap Invite. Check:
    - the tabs switch;
    - the Admin tab shows only coshplantopia;
    - typing "ma" on the Buyer tab shows results;
    - tapping Invite closes the sheet and the button shows "Invited".
  - Needs Tasks 1 and 2 deployed to staging (see the `staging-deploy-how` memory).

- [ ] **Step 4: Commit.**
  - `git commit -m "feat(cohost): invite sheet with admin/buyer/seller tabs and search"` (in `ileafu`)

## Task 6: App: guests are camera-only, and invites reach buyers and sellers

**Files:**
- Modify: `ileafu/src/utils/liveCohost.js`
- Test: `ileafu/src/utils/__tests__/liveCohost.test.js`
- Modify: `ileafu/src/components/CohostInviteGate.js` (around line 96: pass `guestKind`; update the header comment)
- Modify: `ileafu/src/components/AppNavigation/BuyerTabNavigator.js`: mount `<CohostInviteGate />`, as `AdminTabNavigator.js:222` does
- Modify: `ileafu/src/components/AppNavigation/AppNavigation.js`: mount `<CohostInviteGate />` in the seller stack
- Modify: `ileafu/src/screens/Buyer/Shop/ScreenShop.js`: put `<CohostInviteBell />` next to `SearchHeader` (around line 1378)
- Modify: `ileafu/src/screens/Seller/Home/ScreenHome.js`: put `<CohostInviteBell />` in `headerIcons` (around line 462)
- Modify: `ileafu/src/screens/Live/LiveBroadcastScreen.js`: side actions around lines 1727–1760, and `LiveListingsModal` / the create-listing modal around lines 1770–1830

**Interfaces:**
- **Consumes:** `guestKind` from the respond reply (Task 3).
- **Produces:** `export function canManageLive(cohost)` in `utils/liveCohost.js`. It returns `true` for the seller (`cohost` null), for an admin guest, or when `guestKind` is missing.

Steps:

- [ ] **Step 1: Write the failing test.**

```js
describe('canManageLive', () => {
  it('seller', () => expect(canManageLive(null)).toBe(true));
  it('admin guest', () => expect(canManageLive({ sellerUid: 's', guestKind: 'admin' })).toBe(true));
  it('missing guestKind = old server = admin', () => expect(canManageLive({ sellerUid: 's' })).toBe(true));
  it('buyer guest', () => expect(canManageLive({ sellerUid: 's', guestKind: 'buyer' })).toBe(false));
  it('seller guest', () => expect(canManageLive({ sellerUid: 's', guestKind: 'seller' })).toBe(false));
});
```

- [ ] **Step 2: Run the test and watch it fail.**
  - Run from `ileafu`: `npx jest src/utils/__tests__/liveCohost.test.js`
  - Expected: FAIL, "canManageLive is not a function".

- [ ] **Step 3: Implement `canManageLive`.** It's one line: `!cohost || !cohost.guestKind || cohost.guestKind === 'admin'`.

- [ ] **Step 4: Run the test again.** Expected: PASS.

- [ ] **Step 5: Pass `guestKind` through the gate.**
  - `CohostInviteGate` navigates with `cohost: { sellerUid, guestKind: res.guestKind }`.
  - Before using it, check what `respondCohostApi` returns. If it doesn't pass `guestKind` through from the reply, fix `cohostCall` so it does.

- [ ] **Step 6: Hide guest controls in `LiveBroadcastScreen`.**
  - Add `const canManage = canManageLive(cohost);`.
  - Wrap these in `canManage &&`:
    - the sticky note side action
    - the B2B listing edit
    - the live listings button and `LiveListingsModal`
    - the create-listing button and its modal
    - the snapshot action, if `handleManualSnapshot` calls an API
  - Keep the likes counter, chat, viewers, camera, mic, flip and Leave.

- [ ] **Step 7: Mount the gate and the bell.**
  - Mount `CohostInviteGate` in the buyer and seller navigators.
  - Add the bell to the buyer and seller home headers.
  - The gate already registers push through `addTokenToBuyer`, which posts to `API_ENDPOINTS.FCM_TOKEN` (checked). Since Task 4 that endpoint accepts `supplier` too, so sellers need no new helper.

- [ ] **Step 8: Run all the jest tests.**
  - Run `npx jest`. Expected: all pass. The only failures allowed are ones already failing on `main`; note any.

- [ ] **Step 9: Commit.**
  - `git commit -m "feat(cohost): buyer/seller guests join camera-only; invite gate + bell for buyers and sellers"`

## Task 7: Check it on devices (staging)

- [ ] **Step 1:** Deploy the backend branch to staging and run the migration there (see the `staging-deploy-how` memory). Run `t18` one more time first.

- [ ] **Step 2: Test each case on real devices.** Seller on the Android device, guest on the iOS simulator. For each case, record pass or fail with a screenshot:
  - **(a) Buyer guest, app closed:** the push arrives; tapping it opens the invite card.
  - **(b) Buyer guest, app open:** the card shows with no push banner. Join puts them on camera. They have no sticky-note or listing controls. Leave works. The seller sees the co-host box go away.
  - **(c) Seller guest:** same as (b).
  - **(d) coshplantopia:** joins and **still has** listing controls.
  - **(e) "Later" then the bell:** brings the card back. It expires after 60 s.

- [ ] **Step 3:** Write the results into the review section of `tasks/todo.md`.

## Task 8: Release (deploy checklist, after the user approves)

- [ ] **Step 1:** Check prod: is there an `admin` row with email `coshplantopia@gmail.com`, status active, role admin or sub_admin? Read-only query. If not, stop and tell the user.

- [ ] **Step 2:** Ship the backend to prod: migration, then functions. It's safe for the store app. Only after the user says "push".

- [ ] **Step 3:** Once the app is approved in both stores, an admin sets the minimum version to this release and turns on **Force update** in Admin → Version control.

---

## Self-review notes

- **Spec coverage:**
  - §3 (who can be invited): Tasks 1 and 2
  - §4 (sheet, card, guest screen): Tasks 5 and 6
  - §5.1: Tasks 1 and 2
  - §5.2: Task 3
  - §5.3: Task 4
  - §6: Tasks 5 and 6
  - §7 (store app, force update): Global Constraints and Task 8
  - §8 (testing): Tasks 1–4, 6 and 7
- **Names used across tasks:** `loadInvitee`, `Invitee`, `InviteeKind`, `guestKind`, `notifyCohostInvite`, `getCohostInviteesApi`, `inviteCohostApi(sessionId, inviteeUid)`, `canManageLive`.
