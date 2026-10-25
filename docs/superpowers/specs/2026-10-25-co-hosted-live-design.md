# Co-hosted live: a seller invites an admin to sell with them

Date: 2026-10-25. Status: reviewed, awaiting approval.

## 1. Intent

A seller running a live sale can invite one admin to join it on camera. Once the admin accepts,
buyers see two videos, the seller full-screen and the admin in a small box, and both people talk
to the audience. The admin gets the seller's broadcast controls on the seller's session, so the
two can run the sale together: either can add, edit or delete plants and choose which plant is
on the card.

Why: a solo seller has to present, read the chat, switch plants and manage the list at the same
time. An admin who can co-host takes part of that load, and the admin team can step in on any
live without the seller handing over the phone. The reference is the "double live" layout in
Whatnot-style apps: full-screen host, guest in a bordered box at the left.

## 2. Goals, non-goals, anti-goals

Goals
- Seller invites an admin from the broadcast screen with an Invite button on the tools rail.
- The admin is told about the invite, accepts, and lands on the broadcast screen with their
  camera on, as a second broadcaster on the seller's session.
- Buyers, the seller and the admin all see both videos.
- The admin's screen has the seller's live controls (list, add, edit, delete, set active plant,
  Share, Notes, Snap, sold plants) and the chat, all against the seller's session.
- The seller keeps every control they have today.

Non-goals
- Two sellers (two different shops) in one live. The co-host is always an admin.
- More than one co-host at a time.
- Buyers being invited on camera.
- Picture-in-picture layout choices beyond the one fixed layout below.

Anti-goals (it is a failure if any of these happen)
- Sales, listings or payouts end up attributed to the admin instead of the seller.
- An admin can co-host a live without the seller inviting them.
- A non-admin can be invited.
- The seller's own live breaks or ends when the admin joins, leaves or loses connection.
- The admin can end the seller's live (they can only leave).

## 3. Roles and rules

| | Seller (host) | Admin (co-host) | Buyer |
|---|---|---|---|
| Camera + mic on the stream | yes, full-screen | yes, small box | no |
| Invite / remove co-host | yes | no | no |
| Leave | ends the live (as today) | leaves; live continues | leaves |
| End the live | yes | no | no |
| Add / edit / delete listings | yes | yes, on the seller's session | no |
| Set the active plant | yes | yes | no |
| Share, Notes, Snap, sold list | yes | yes | share only |
| Chat | yes | yes | yes |

Only accounts in the `admin` table with role `admin` or `sub_admin` and status `active` can be
invited or accept. One co-host at a time; a second invite while one is pending or active is
refused.

## 4. What each person sees

### 4.1 Seller's broadcast screen

As today, plus:
- An **Invite** button on the tools rail (icon: person-plus). Tapping opens a sheet listing
  active admins (name, photo). Picking one sends the invite; the button then shows "Invited…"
  with a cancel action until the admin answers or 60 seconds pass.
- When the admin is on air, the admin's video appears in a bordered box at the left, over the
  stream, above the chat (same place as the guest box in the reference). The Invite button
  becomes **Remove**, which drops the co-host.

### 4.2 Admin's co-host screen

The invite arrives as an alert in the admin's app (see 6.2). Accepting opens the broadcast screen
in co-host mode: the admin's own camera full-screen on their phone, the seller's video in the
small box, the chat, the plant card and the tools rail. Differences from the seller's screen:
- No Go Live / End Live. In its place: **Leave**, which stops the admin's camera and returns to
  the admin home. The live continues.
- No Invite button.
- The screen reads the session as the seller's (session id and seller uid come from the invite),
  so every listing action goes to the seller's session and IG numbering continues in it.

### 4.3 Buyer's screen

Seller full-screen as today. When a co-host is on air, the co-host's video shows in a bordered
box at the left, above the chat, same size and position as on the seller's screen. Nothing else
changes: card, Buy Now, cart, chat, shop, viewer count.

### 4.4 Layout of the small box

Portrait box, roughly 36% of the screen width and 16:9 (about 150 × 266 pt on a 402-wide
screen), 16 pt from the left edge, top at about 25% of the screen height, 2 pt bright-green
border (`#9EF01A`), 12 pt corners, non-interactive. Builder may tune the exact size so it does
not cover the top of the chat; it must not overlap the plant card or the input.

## 5. Data and backend

### 5.1 Session state

Add to the `live` table:

| column | type | meaning |
|---|---|---|
| `cohostuid` | text, null | the admin currently invited or on air |
| `cohoststatus` | text, null | `invited`, `live`, or null (none) |
| `cohostinvitedat` | text (ISO), null | when the invite was sent |

The existing `createdby` stays the seller. All listing writes keep using `sellercode = createdby`
of the session, never the caller, so attribution cannot drift to the admin.

### 5.2 Edge functions (Supabase, Firebase-token auth, `verify_jwt = false`)

- `live-cohost-invite` (POST `{ sessionId, adminUid }`): caller must be the session's
  `createdby`; session must be `live`; `adminUid` must be an active admin; no co-host may be
  invited or live. Sets `cohostuid`, `cohoststatus = invited`, `cohostinvitedat`. Returns the
  admin's display name and photo for the "Invited…" state.
- `live-cohost-respond` (POST `{ sessionId, accept }`): caller must equal `cohostuid` and status
  must be `invited`. Accept sets `cohoststatus = live` and returns an Agora broadcaster token for
  this session (reuse `generate-live-session`'s builder with the admin's uid); decline clears the
  three columns.
- `live-cohost-leave` (POST `{ sessionId }`): caller is the co-host (any status) or the seller.
  Clears the three columns. Also called by the seller's **Remove**.
- `live-cohost-pending` (GET): the caller's pending invite, if any, with session id, title,
  seller name and photo. Used by the admin app on open/foreground (6.2).
- `update-live-session-status`: when a session goes `ended`, clear the three columns.
- Invite expiry: an invite older than 60 s counts as expired. `respond` refuses it, `invite`
  may replace it, and `live-cohost-pending` and the detail response treat it as none. The
  seller's "Invited…" state also times out locally at 60 s.

### 5.3 Acting as the seller: the "effective seller" rule

Today the listing functions take the seller from the caller's token: `add-listing` loads the
`supplier` row by the caller's uid (404 without one) and takes `sellercode`, name, country and
USD account class from it; `update-listing` and `set-active-live-listing` filter listings by
`sellercode = uid`; `delete-listing` allows the owner or an admin. An admin has no `supplier`
row, so as written every admin call would fail.

Rule: these functions resolve an **effective seller** first, then run exactly as they do today
with that uid in place of the caller's:

1. Read the session named by `sessionId` in the request (required when the caller is not a
   supplier).
2. If `caller.uid == live.createdby` → effective seller = caller.
3. Else if `caller.uid == live.cohostuid` and `cohoststatus == live` → effective seller =
   `live.createdby`.
4. Else → 403.

Everything downstream (supplier profile for name / country / USD class, `sellercode`, the
`sellercode =` filters, IG numbering on the session) uses the effective seller. The session must
belong to the effective seller (`live.createdby`), so a co-host cannot reach another seller's
listings.

Functions this applies to: `add-listing`, `update-listing`, `delete-listing`,
`set-active-live-listing`, `listing-image-upload` (Snap uploads a photo to the active listing),
and `get-live-listings-by-session` (its `sessionId` path already reads `createdby` from the
session; confirm the sold list and List modal need no change). `live-sold-to` is per listing
and `update-live-session` (sticky note) is per session; both must accept the co-host under the
same rule. The builder audits every function the broadcast screen calls and applies the rule
where the caller's uid stands in for the seller.

### 5.4 Realtime

The app needs to learn about co-host changes without polling:
- Seller screen: invite accepted / declined / expired, co-host left.
- Admin app: a new invite (6.2).
- Buyer screen: co-host on/off, to show or hide the box.

No Realtime on the `live` table: exposing the row to clients is a bigger change than this needs,
and the buyer and seller screens already poll `getLiveDetailApi` every few seconds. Co-host
state rides on that poll (add `cohostUid`, `cohostStatus` to the detail response). The admin app
polls `live-cohost-pending` every 5 s while open and once on foreground (6.2). The Agora
`onUserJoined` / `onUserOffline` callbacks are the source of truth for whether the co-host video
is actually there: show the box when the co-host's uid is present, hide it when it leaves,
regardless of the row.

### 5.5 Video

Agora already runs the session as a live-broadcast channel (name = session id) with one
broadcaster. `generate-live-session` only builds a token for a given channel and uid with the
PUBLISHER role and has no side effects, so `live-cohost-respond` calls the same builder with
`getAgoraUid(adminUid)`. `getAgoraUid` derives a stable 32-bit uid from the account id, the same
way for sellers, buyers and admins, so the three never collide (collisions are already the
concern it solves).

The seller's Agora uid is `getAgoraUid(live.createdby)`; the detail response must expose
`createdby` (it does) and the screens compute the uid locally. Both the seller and buyer screens
must handle a second remote uid: today the buyer screen treats any `onUserJoined` as "the
broadcaster" and any `onUserOffline` as "the live ended, leave the screen". That becomes: the
uid equal to `getAgoraUid(createdby)` is the main video; any other remote broadcaster uid is the
co-host box; only the seller's uid leaving means the live ended. The seller screen does not
handle remote users today and must add the co-host handling. Viewer counts come from
`add-viewer-to-live-session` (buyer accounts only), not from Agora joins, and the heartbeat is
sent by the seller screen only; the co-host must not send it. So the admin joining or leaving
changes no count and no auto-end rule.

## 6. Flows

### 6.1 Invite → on air

1. Seller taps Invite, picks an admin. App calls `live-cohost-invite`.
2. Admin's app shows the invite (6.2). Admin taps Accept → `live-cohost-respond(accept)` →
   gets the token → opens the broadcast screen in co-host mode → joins the Agora channel as a
   broadcaster.
3. Seller's and buyers' Agora clients get `onUserJoined` for the admin uid → show the box.
4. Seller's screen (via Realtime or poll) switches Invite → Remove.

### 6.2 How the admin is told

Admins use the same app and login as sellers and buyers: the admin role lands in
`AdminTabNavigator`, and `LiveBroadcastScreen` is registered on the root stack, so it is
reachable from the admin shell with a `navigate`. The invite reaches the admin two ways:

**Push notification** (decided: yes). Today only buyers register push tokens
(`buyer.fcmtokens`, via `/fcm-token`, requested from the Shop screen). Add the same for admins:
- `admin.fcmtokens` jsonb column (migration), and `/fcm-token` accepts an admin caller and
  writes that column (it currently asserts the uid is the caller and writes `buyer` only).
- The admin app asks for notification permission once after login (reuse `NotificationService`
  and `NotificationPermissionGate`; the admin shell mounts the gate the way the buyer Shop
  screen does) and registers on login / token refresh, unregisters on logout.
- `live-cohost-invite` sends the push through the shared sender in `_shared/fcm.ts` (token
  list in, dead tokens pruned, as `buyerPush.ts` does for buyers): title "<Seller> invited you
  to co-host", body the live title, `data.type = "cohost_invite"`, `data.sessionId`.
- `NotificationService` routes a tap on `cohost_invite` to the invite card (below), the way
  `live_started` routes to the buyer live screen. It must ignore the tap if the invite has
  expired (check `live-cohost-pending` first).

**In-app card** (always). While the admin app is open it polls `live-cohost-pending` every
5 s (the admin tab navigator mounts the poller) and once on foreground. A pending invite shows a
full-screen card ("<Seller> invited you to co-host <title>", Accept / Decline) over whatever
screen is open. The push is a doorbell; the card is the source of truth.

### 6.3 Leaving and failure

- Admin taps Leave, or kills the app: `live-cohost-leave` (best effort) + Agora leave. Seller and
  buyers get `onUserOffline` → hide the box; seller's button returns to Invite. If the leave call
  never arrives (app killed), the seller's Remove still clears it, and `ended` clears it.
- Seller taps Remove: `live-cohost-leave`; the admin's screen (via Realtime/poll) sees status
  cleared and leaves the channel with a toast "The seller ended the co-host".
- Seller ends the live: as today; the admin's screen sees `ended` and leaves.
- Seller loses connection: live continues (heartbeat/auto-end rules unchanged); the admin stays
  on air until the live ends.

## 7. Constraints

- No new native modules: Agora, Realtime and the existing UI components cover it.
- Backend changes deploy to production; app changes ship with the next store release. Until
  buyers update, old buyer apps treat the admin joining as a second "broadcaster joined" and
  may show the admin's video full-screen (5.5); nothing in the old app can prevent that.
  Decided: **co-hosting is held until the release is out.** The backend ships with a kill
  switch: `live-cohost-invite` refuses with "Co-hosting is not available yet" unless an
  `app_settings` row `cohost_enabled = true` exists (create the table if there is none; a
  single-row key/value table is enough). The Invite button is only rendered when the detail
  response says `cohostEnabled: true`. The team flips the flag once the store release is live.
- Listing attribution rule (5.3) is a hard requirement; a test must prove an admin-added listing
  carries the seller's `sellercode`.

## 8. Testing (required before done)

- Deno tests: invite/respond/leave permission matrix (seller-only invite, admin-only accept,
  expiry, one co-host at a time, non-admin refused); `add-listing` as co-host writes
  `sellercode = createdby`; `ended` clears the co-host.
- Device test on a real session with the test seller (Ruth) and a test admin: invite, accept on
  the admin phone, both videos on seller/admin/buyer screens, admin adds a listing and sets it
  active (buyer shop and card update), admin leaves, seller removes, seller ends.
- iOS buyer + Android seller + Android admin covers the three screens across both platforms.

## 9. Left to the builder

- Exact box size/position within the constraints in 4.4.
- Whether the buyer/seller box uses Realtime or the existing detail poll (5.4).
- Admin list sheet design (reuse the viewers sheet's row style).
- Whether the admin's co-host screen is the same `LiveBroadcastScreen` component with a
  `cohost` route param (preferred: one screen, fewer diverging copies) or a wrapper.
- Toast/alert wording.

## 10. Follow-ups (not in this work)

- Co-host mute / camera-off controls.
- More than one co-host.
- Push for other admin events (the token plumbing added here makes those small).

## 11. Decisions made during review (check these while reading)

Settled by me from the code, not asked:
- 5.3: the "effective seller" rule, and the list of functions it applies to.
- 5.4: no Realtime on `live`; co-host state rides on the existing detail poll, the admin polls
  `live-cohost-pending`.
- 5.5: the co-host token comes from the existing token builder with `getAgoraUid(adminUid)`;
  the seller's main video is identified as `getAgoraUid(createdby)`; viewer counts and the
  heartbeat are untouched by the co-host.
- 5.2: expired invites are treated as none everywhere, and the seller UI times out at 60 s.
- 6.2: one app for admins, sellers and buyers; the admin reaches the broadcast screen from the
  root stack.

Decided by the product owner:
- Admins get a push notification for invites (6.2), which adds admin token registration.
- Co-hosting is held behind a server flag until the store release is out (7).
