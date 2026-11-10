# Co-host invites for buyers and sellers

Extends the co-hosted live feature (`2026-10-25-co-hosted-live-design.md`). Read that spec first; everything there still holds unless this doc changes it.

## 1. Intent

Today a seller on air can invite one active admin to co-host. The client wants sellers to bring **any buyer or any seller** onto their live as a guest, and to limit admin invites to the iLeafU house account, **coshplantopia@gmail.com**.

The client hasn't decided yet what a buyer or seller guest is allowed to *do*. So this round connects the live UI only. A guest joins on camera and that's it. Their powers will be decided later, once the requirements are confirmed with the client.

A buyer can be on a live broadcast only when a seller invites them. Buyers still cannot start their own live.

## 2. Goals, non-goals, anti-goals

**Goals**
- The seller's invite sheet has three tabs: **Admin**, **Buyer**, **Seller**. It uses underline tabs (option B from the mockup).
- **Admin tab:** shows only coshplantopia@gmail.com, with no search box.
- **Buyer and Seller tabs:** a search box plus a list of suggested people.
- An invited buyer or seller gets a push notification when the app is closed or in the background. When the app is open, they get the in-app invite card instead. This is the same flow admins have today.
- After accepting, a buyer or seller guest sees the same co-host broadcast screen an admin co-host sees, without the listing controls.

**Non-goals (this round)**
- No guest powers that write to the backend: no adding or editing listings, no choosing the active listing, no ending the live.
- No change to what coshplantopia can do. As admin co-host, it keeps today's listing controls.
- No more than one co-host at a time, and no change to the 60-second invite expiry.

**Anti-goals (a failure even if it works)**
- A buyer or seller guest can change the seller's listings or session in any way. That includes using an old app build or calling the API directly. The backend must refuse it, not only the app.
- A store-app user sees something broken. The backend ships before the app update, so the store app must keep working. See the "Deploy backend with app release" rule in memory.

## 3. Who can be invited

| Tab | Who | How they're found |
|---|---|---|
| Admin | Only the admin row whose email is `coshplantopia@gmail.com` and whose status is active | Always shown. No search. |
| Buyer | Any active `buyer` | Suggestions plus search |
| Seller | Any active `supplier`, except the inviting seller | Suggestions plus search |

**Suggestions**
- **Buyer tab:**
  - "Watching your live": buyers in `live.viewers`.
  - Then "Bought from you": distinct `orders.buyerUid` where `orders.supplierUid` is the seller, most recent first, up to 20.
- **Seller tab:** search only, with no suggestions.
  - Change from the mockup: sellers can't follow each other in the app, so there's no "Sellers you follow".
  - "Watching your live" would almost always be empty: `add-viewer-to-live-session` only records viewers who have a `buyer` row.
  - Changing viewer tracking would affect every live, including store-app users, so it's out of scope.
- A group with no one in it is hidden. If both groups are empty, the empty state says "Search for a buyer by name or username" (or "a seller").

**Search**
- Starts after 2 or more characters.
- Matches name and username, case-insensitive.
- Returns up to 20 results. Inactive accounts are left out.

## 4. What each person sees

**Seller's invite sheet.** It's `InviteAdminSheet`, rebuilt as the mockup showed:
- Title "Invite a co-host", then the underline tabs, the search box (hidden on the Admin tab), and the list.
- Each row shows an avatar, the name, a secondary line (username, or email for the admin), and an **Invite** button.
- Opens on the Buyer tab (my call).
- While an invite is pending, the existing broadcast-screen button already shows "Invited" or "Cancel invite". The sheet closes after you invite, as it does today.

**The invited person (buyer, seller, or admin):**
- **App closed or in the background:** a push, "<Seller shop name> invited you to join their live". Tapping it opens the app and shows the invite card.
- **App open:** the invite card (`CohostInviteGate`) appears over whatever screen they're on, with Join and Later. "Later" keeps the invite under the bell (`CohostInviteBell`) until it's answered or expires.
- The bell goes in the buyer home header and the seller home header, in the same place it sits in the admin app.

**Guest's live screen (buyer or seller):**
- `LiveBroadcastScreen` in co-host mode, the same as admin co-host mode.
- Everything that writes listings or the session is hidden: add listing, edit listing, set active listing, and anything else the admin co-host can trigger that writes data.
- The guest keeps camera, mic, flip camera, chat (as their own account), the viewers sheet, and **Leave**.
- The builder should list every control that's visible in admin co-host mode and sort each one into "keep" or "hide". The rule: if it writes to the backend for the seller, hide it.

## 5. Backend

All changes go in `ileafu_backend/supabase/functions`.

### 5.1 Who the co-host is
- Add `COHOST_ADMIN_EMAIL = "coshplantopia@gmail.com"` to `_shared/liveCohost.ts`. This is a constant, not a setting, because it never changes (my call).
- Add `loadInvitee(uid)`. It returns `{ uid, kind: "admin" | "buyer" | "seller", name, photoUrl } | null`:
  - **admin** only when the uid is the active admin with that email
  - **seller** when the uid is an active `supplier`
  - **buyer** when the uid is an active `buyer`
  - Check in that order. A uid that has both a buyer row and a supplier row is treated as a seller.
- **live-cohost-invite POST**
  - Accept `inviteeUid`. Keep `adminUid` as an alias so the store app still works.
  - Replace the `loadActiveAdmin` check with `loadInvitee`, and refuse the inviting seller themselves.
  - The response returns `{ invitee }`. Also return `admin: invitee` so the store app still works.
- **live-cohost-invite GET**
  - Add `?tab=admin|buyer|seller&q=`.
  - With no `tab`, return `{ admins: [coshplantopia], enabled }`. That's the store app's call, so its admin list shrinks to the one house account, which is the intended change.
  - With `tab` set and no `q`, return the suggestions. With `q`, return the search results.
  - Response shape: `{ people: [{ uid, name, subtitle, photoUrl }], groups?: [{ title, people }] }`. The builder may simplify this, as long as the sheet can show the grouped suggestions.
- `live-cohost-pending`, `live-cohost-respond` and `live-cohost-leave` already match on `cohostuid` and don't care about role, so they need no role change. `respond` adds `guestKind` to its reply so the app knows which co-host mode to show.

### 5.2 Guests can't write (the backend half of "UI only")
- `_shared/effectiveSeller.ts`: a live co-host acts as the seller **only if they're an active admin** (`loadActiveAdmin`). A buyer or seller guest gets `EffectiveSellerError` (403).
- This covers `add-listing`, `update-listing` and `set-active-live-listing`.
- `live-detail` sticky mode **writes** `live.stickynote` (it uses the `isCohostOnAir` check, around line 122). Limit that co-host path to active admins as well.
  - Add the sticky-note control to the guest's "hide" list.
  - Add a 403 test for a buyer guest who tries to change the sticky note.
- The builder should check every other place that trusts `cohostuid` and make sure none of them lets a non-admin guest write.

### 5.3 Push to buyers and sellers
- **Buyers** already have `buyer.fcmtokens`.
- **Sellers have no push tokens today.**
  - New migration: `ALTER TABLE public.supplier ADD COLUMN IF NOT EXISTS fcmtokens jsonb NOT NULL DEFAULT '[]'`.
  - `fcm-token` adds `supplier` to the tables it checks.
- Generalize `notifyAdminCohostInvite` into `notifyCohostInvite({ uid, kind, ... })`. It still sends the `cohost_invite` data push. Where it reads tokens from:
  - **admin:** `admin`.
  - **buyer:** `buyer`.
  - **seller:** both `supplier` **and** `buyer`. Accounts that have both rows already keep their tokens on `buyer`, because `fcm-token` checks `buyer` first. Remove duplicate tokens before sending.
- Push copy for everyone, admins included: "<Seller shop name> invited you to join their live".
- **Before deploying:** confirm that coshplantopia@gmail.com exists in prod as an active admin. If it doesn't, the Admin tab and the store app's admin list will be empty.

## 6. App (`ileafu`)

- **Invite sheet:** `InviteAdminSheet.js` gets the tabs, search, suggestions and grouped list. Renaming it to `InviteCohostSheet` is the builder's call.
- **API calls:** `liveApi.js` gets `getCohostInviteesApi(sessionId, tab, q)` and passes `inviteeUid` to `inviteCohostApi`. These go through `API_ENDPOINTS`; no hardcoded URLs.
- **Invite card and bell:**
  - Mount `CohostInviteGate` in `BuyerTabNavigator` and in the seller navigator (`AppNavigation.js`).
  - Add `CohostInviteBell` to the buyer and seller home headers.
  - The gate already registers push and polls every 5 s.
  - The seller side has to register its push token. That means a call to the `fcm-token` endpoint, which now accepts sellers. Today it registers with buyer-named helpers.
- **The guest's screen:**
  - `LiveBroadcastScreen` reads `cohost.guestKind` (from the respond reply, passed through the gate's navigation).
  - When `guestKind` isn't `admin`, it hides the write controls (§4).
  - If `guestKind` is missing (an old server), treat the guest as admin. That's today's behavior.
- **Loading states:** use the `Loading` component.

## 7. Constraints

- **Order of release:**
  - The backend has to be safe for the store app, so it can deploy before the app update.
  - The only visible change for store-app users: a seller's admin list shrinks to coshplantopia.
  - **Open: an updated seller inviting someone still on the store app.**
    - Only the inviter needs the new app; the person invited can be on any build.
    - A store-app buyer gets the push, but their app has no invite card or bell, so the invite goes nowhere. The seller's co-host slot stays tied up for the 60 seconds.
    - **Decided: force update.**
      - Once the new app is live in both stores, an admin sets the minimum version to this release and turns on **Force update** in Admin → Version control (`AdminVersionControlScreen`).
      - The existing `AppUpdateCard` on the buyer and seller home screens then blocks older builds.
      - No new code. It's a release step and goes on the deploy checklist.
- **The co-host flag:** `cohost_enabled` stays true in prod. Don't touch it.
- **Unchanged:** one co-host per live, the 60-second invite expiry, and the Agora channel setup.

## 8. Testing (required before done)

**Backend tests**, extending `t18-live-cohost.test.ts`:
- **Inviting:**
  - A seller can invite a buyer, a seller, or coshplantopia.
  - Inviting a different active admin is refused.
  - Inviting yourself is refused.
- **Guest writes:** a buyer guest who is on air gets 403 on `add-listing`, `update-listing` and `set-active-live-listing`. An admin guest still gets through.
- **Store-app compatibility:**
  - GET with no `tab` still returns `admins`.
  - POST with `adminUid` still works.
- **Push:** goes to the right token table for each kind.

**App test:** a unit test for the sheet's tab and search logic, if any of it lives outside the component.

**Run on devices:**
- Seller on Android invites a buyer on iOS, both with the app closed and with it open. The buyer joins, appears on camera, has no listing controls, and leaves.
- Repeat with a seller as the guest.
- Repeat with coshplantopia, and check that it still has listing controls.

## 9. Left to the builder

- Exact visual details within the mockup's direction: the existing sheet's style, Inter, the brand green `#2E6B3E`, and the underline tabs.
- Search debounce.
- How many results per page.
- The exact list of hidden controls (rule in §4).
- Whether to rename the sheet file.

## 10. Calls I made (check these)

- coshplantopia is matched by **email**, held in a code constant.
- A buyer or seller guest is blocked from listing and session writes **on the backend too**, not only hidden in the app.
- **Seller tab is search-only.** There's no follow feature, and seller viewers aren't tracked.
- **No opt-out, block or rate limit for invites this round.** Today's limit stays: one pending invite per live, expiring after 60 seconds. Raise it with the client together with the guest-powers question.
- **The sticky note is blocked for buyer and seller guests,** following your rule of no backend writes.
- The sheet opens on the **Buyer** tab.
- An account that is both a buyer and a seller is treated as a **seller**.
- **Sellers get push tokens** for the first time (new `supplier.fcmtokens` column).
