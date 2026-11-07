# Port the remaining backend from Firebase to Supabase

**Date:** 2026-10-21
**Repos:** `~/projects/olla/ileafu` (app), `~/projects/olla/ileafu_backend` (backend),
`~/projects/olla/venmo-ileafu-payment-page` (hosted page)
**Supabase project:** `pjcquavlxknhmuszjmyh`

---

## Goal

Everything the app calls lives on **Supabase Edge Functions**. **Firebase Auth stays** — it is
the identity provider and nothing else. No business logic runs on Firebase Cloud Functions
after this plan.

The end state:

| | before | after |
|---|---|---|
| Firebase Auth (sign-in, ID token) | ✅ | ✅ **unchanged** — the login boundary |
| Firebase Cloud Functions the app calls | 16 live + 24 dead/stale | **0** |
| Firebase Cloud Functions overall | 275 exported | 0 (batch 9) |
| Supabase Edge Functions | 227 | 227 + 16 ported (+ the admin/scheduled surface, batch 9) |

---

## Current state (verified 2026-10-21)

### The split

`ileafu/src/config/apiConfig.js` resolves two base URLs:

- `getSupabaseBaseUrl()` → `https://pjcquavlxknhmuszjmyh.supabase.co/functions/v1` — **227 endpoints**
- `getBaseUrl()` → `https://us-central1-i-leaf-u.cloudfunctions.net` — **40 endpoints**

Both use the **same auth shape**: `Authorization: Bearer <firebase ID token>`. The Supabase side
already verifies that token in `_shared/auth.ts` (`verifyFirebaseToken`), so **the login
boundary is already exactly where it should be** — Firebase issues the token, Supabase verifies
it. Nothing about the port changes that.

### The 40 Firebase endpoints — the accurate scope

`apiConfig.js` has **40** entries pointing at `getBaseUrl()`. Verified against the Firebase
source tree, they break down as:

| | count | what |
|---|---|---|
| **Called by the app, function exists** | **16** | **the porting work — 6,528 lines** |
| Real function, but the app never calls it | 7 | dead config (1,804 lines) — delete the config, delete the function |
| **Stale config — no such Firebase function exists** | **17** | the app never calls them either — delete the config |

The 16 that are actually called:

| Endpoint | Firebase path | Lines | Called from |
|---|---|---|---|
| `CHECKOUT` | `checkout` | 1,401 | `checkoutApi.js`, `checkoutJoinerApi.js` |
| `CHECKOUT_JOINER` | `checkoutJoiner` | 1,269 | `checkoutJoinerApi.js` |
| `CALCULATE_CHECKOUT_SHIPPING_JOINER` | `calculateCheckoutShippingJoiner` | 589 | `checkoutShippingJoinerApi.js` |
| `UPLOAD_LISTING_IMAGE` | `uploadListingImage` | 522 | `uploadImageToBackend.js` |
| `PUBLIC_STATES` | `getStatesData` | 441 | `locationDropdownApi.js` |
| `PUBLIC_CITIES` | `getCitiesData` | 441 | `locationDropdownApi.js` |
| `BUYER_SIGNUP` | `buyerSignup` | 352 | `postBuyerSignupApi.js` |
| `SEND_LIVE_STARTED_NOTIFICATION` | `sendLiveStartedNotification` | 351 | `sendLiveStartedNotificationApi.js` |
| `CREATE_LIVE_REQUEST` | `createLiveRequest` | 280 | `liveRequestApi.js` |
| `SIGN_IN_SUPPLIER` | `signInSupplier` | 244 | `postSellerAfterSignInApi.js` |
| `VALIDATE_SIGN_IN_PIN` | `validateSignInPin` | 194 | `postSellerPinCodeApi.js` |
| `GET_LIVE_REQUESTS` | `getLiveRequests` | 105 | `liveRequestApi.js` |
| `LIST_PAYOUT` | `listPayout` | 99 | `getHomePayoutListingApi.js` |
| `UPDATE_BUYER_PASSWORD` | `updateBuyerPassword` | 98 | `postProfileUpdatePasswordApi.js`, `buyerProfileApi.js` |
| `SCHEDULE_LIVE_REMINDER` | `scheduleLiveReminder` | 79 | `liveReminderApi.js` |
| `DOWNLOAD_LIVE_LISTING_BATCH_TEMPLATE` | `downloadLiveListingBatchTemplate` | 63 | `ScreenLiveSaleExcelUpload.js` |

**Total: 6,528 lines across 16 endpoints.** All 16 have their source in the repo, so every one
is a *translation*, not a rewrite.

**The 7 dead-but-real ones** (`exchangeCustomToken`, `firebaseLogin`, `getBuyerInfo`,
`listPayoutDetail`, `redeemReferralReward`, `uploadChatVideo`, `uploadProfilePhoto` — 1,804
lines) are referenced only inside `apiConfig.js`. `firebaseLogin` and `exchangeCustomToken` are
the Firebase-generation login helpers — since **login stays on Firebase Auth**, these two are
naturally deleted, not ported.

### Beyond the app: 275 exported Firebase functions

The Firebase tree exports **275** functions (267 HTTP-callable, 10 Firestore triggers,
9 scheduled jobs). The app only reaches 40 of them. The rest are admin-panel surfaces, one-off
admin tools, backfill scripts and the **Firestore→Supabase sync triggers**.

That means "everything on Supabase" is a **bigger** job than the app's 40: the admin panel, the
website and the scheduled jobs are separate surfaces that need their own porting decisions
(below, in Open questions).

**Two callers outside the app** were found:
- `ileafu_website/live/index.html` → `getLiveSessionPublic` (a **public** endpoint, not in the
  app's 40). There is no Supabase twin — it must be ported before the Firebase tree goes away.
- `ileafu_backend/functions/firestore/docs/apiDocs.js` → only the OpenAPI `servers[].url`
  string. Documentation, not a call.

### The critical discovery — the checkout writes to Firestore

`functions/firestore/order/checkout.js` (1,401 lines) writes the order row to **Firestore**
(`db.collection('order').doc(...)` + `orderBatch.set(orderItemRef, orderItemData)`).
Supabase's `orders` table is populated by a **Firestore trigger**,
`functions/firestore/triggers/syncOrderToSupabase.js` → `syncDocument('order', …)`.

So today the order row is born in Firestore and reaches Postgres by way of a Firestore trigger.
`payment-completion` (Supabase) then reads and completes that row.

**Consequence:** porting `/checkout` is not a copy — it must **write the order row to Supabase
directly**, and the Firestore→Supabase trigger must then be retired for that path or it will
double-write. This is the single highest-risk item in the plan and it is why checkout goes
first and alone.

### The live page is still Firebase-generation

`payment.ileafu.com` serves `index-BSQx-0KH.js`, which calls
`us-central1-i-leaf-u.cloudfunctions.net/{createPaypalOrder,capturePaypalOrder,checkPaypalOrder}`.
Those three are **deployed and live** (HTTP 204). The Supabase page build exists only on the
preview channel `i-leaf-u--supabase-payment-e4rvymck.web.app` (expires 2026-11-20).

---

## Proposed approach

### Principles

1. **One endpoint per PR-sized batch, ordered by risk.** Checkout first (highest risk, most
   value), then the small read-only dropdowns (lowest risk), then the rest.
2. **Translate the business rules, not the syntax.** Each ported function is written fresh
   against the Supabase tables, reusing `_shared/` helpers. Where a Firebase function had a
   Firestore read, the port reads the Supabase table directly.
3. **The response shape is the contract.** The app's `src/components/Api/*.js` modules are the
   spec. A ported function must return a byte-compatible response, or the app module changes
   in the same batch.
4. **Never deploy both writers for the same order.** A batch deploys the Supabase function
   *after* the app points at it, and the Firebase function is deleted only once the app is
   confirmed on the new one.
5. **Delete, don't leave dead config.** The 15 uncalled Firebase endpoints are removed from
   `apiConfig.js` and their Firebase functions deleted.

### Shared work first

Both backends need a lot of the same thing. Before porting individual endpoints, extract the
duplicated logic into `_shared/`:

| New `_shared/` module | From | Used by |
|---|---|---|
| `_shared/checkout.ts` | `checkout.js` + `checkoutJoiner.js` | checkout, checkoutJoiner, calculateCheckoutShippingJoiner |
| `_shared/discount.ts` | the discount block in `checkout.js` | checkout, joiner checkout |
| `_shared/flightCycle.ts` | `util/flightCycleHelpers.js` | checkout, live, active-flight-dates |
| `_shared/shipping.ts` | `util/shippingConstants.js`, `util/listingExpirationUtils.js` | checkout, dropdowns |
| `_shared/live.ts` | `createLiveRequest.js`, `sendLiveStartedNotification.js` | the live group |
| `_shared/storage.ts` | `uploadListingImage.js`, `uploadProfilePhoto.js`, `uploadChatVideo.js` | the upload group |

Two of these (`_shared/listing.ts`, `_shared/orders.ts`, `_shared/cart.ts`,
`_shared/dropdown.ts`, `_shared/taxonomy.ts`) already exist — reuse them, do not duplicate.

### The batching

| # | Batch | Endpoints | Lines | Risk | Why this order |
|---|---|---|---|---|---|
| **0** | Shared modules | `_shared/checkout.ts` etc. | — | low | everything depends on them |
| **1** | **Checkout** | `checkout`, `checkoutJoiner`, `calculateCheckoutShippingJoiner` | 3,259 | **high** | the money path; must be right before the page goes live |
| **2** | Payment go-live | promote the preview page to `live`; `PAYPAL_ENVIRONMENT=live` | — | high | only valid once batch 1 is proven |
| **3** | Location | `getStatesData`, `getCitiesData` | 882 | low | read-only, pure table reads |
| **4** | Live | `createLiveRequest`, `getLiveRequests`, `scheduleLiveReminder`, `sendLiveStartedNotification` | 815 | medium | needs FCM + scheduling |
| **5** | Uploads | `uploadListingImage`, `downloadLiveListingBatchTemplate` | 585 | low | needs the storage bucket |
| **6** | Buyer / seller auth | `buyerSignup`, `updateBuyerPassword`, `signInSupplier`, `validateSignInPin` | 888 | medium | PIN + supplier session |
| **7** | Payout | `listPayout` | 99 | low | read-only |
| **8** | Cleanup | delete 7 dead + 17 stale config entries, delete their Firebase functions | 1,804 | low | last, once nothing calls them |
| **9** | The rest of Firebase | the admin panel, the website's `getLiveSessionPublic`, the 9 scheduled jobs, the 10 triggers | ? | ? | see Open questions — the app's 40 is only the visible part |

---

## Step-by-step plan

### Batch 0 — shared modules

1. Create `_shared/checkout.ts` with the order-line assembly, the discount application, the
   flight-cycle cutoff and the expiry rules, extracted from `checkout.js`.
2. Unit-test each extracted rule in the existing Deno test style (`t8-payment-completion.test.ts`
   is the model): discount stacking, `limitPerCustomer`/`limitTotal`, single-plant expiry,
   flight-date normalisation, credit application.
3. **Verify:** `deno test supabase/functions/` — no regressions against the current 364.

### Batch 1 — checkout (the money path)

1. Write `supabase/functions/checkout/index.ts`:
   - `verifyFirebaseToken(req)` → `buyerUid`.
   - Read the cart from the **Supabase** `cart` table (not Firestore).
   - Resolve the buyer, the listings, the discounts and the credits from Supabase.
   - Apply the discount, reserve the discount usage, decrement the listing stock **via the
     `decrement_listing_stock` RPC** (it is already the guarded path), and **INSERT the order
     row into Supabase** — the row is born here, not in Firestore.
   - Return the same response shape `checkoutApi.js` expects.
2. Write `supabase/functions/checkout-joiner/index.ts` and
   `supabase/functions/checkout-shipping-joiner/index.ts` the same way.
3. Point the app at them in `apiConfig.js`:
   `CHECKOUT: ${getSupabaseBaseUrl()}/checkout`, `CHECKOUT_JOINER: …/checkout-joiner`,
   `CALCULATE_CHECKOUT_SHIPPING_JOINER: …/checkout-shipping-joiner`.
4. **Verify end to end from the iOS simulator**: buy a listing → the order row appears in the
   Supabase `orders` table with `status='pending_payment'` → the Pay to Board screen shows it
   → pay it → `Ready to Fly`. Compare the new order row against a Firebase-generated one
   column by column.
5. **Then** delete the Firebase `checkout`, `checkoutJoiner` and `calculateCheckoutShippingJoiner`
   functions, and retire the `syncOrderToSupabase` trigger for the `order` collection.

> **Risk note.** This batch removes the Firestore→Supabase order trigger. If the port writes a
> row with a different column set than the trigger did, the `orders` table drifts from what the
> app expects. Mitigation: the batch-1 verification diffs a new row against a
> Firebase-generated row field by field, and the Firebase functions are deleted only after that
> diff is clean.

### Batch 2 — the page goes live

1. Rebuild the page with the **production** env (live client id, no `.env.local`) and
   `PAYPAL_API_BASE` = the deployed Supabase base.
2. `firebase hosting:clone i-leaf-u:supabase-payment i-leaf-u:live` — promote the exact
   channel version. Verify from the wire: the served bundle's SHA-256 equals the committed
   `src/dist` blob, and it greps for `supabase.co/functions/v1` and **not** for
   `us-central1-i-leaf-u.cloudfunctions.net`.
3. `supabase secrets set PAYPAL_ENVIRONMENT=live` on the deployed payment functions.
4. Point the app's `paymentPaypalVenmoUrl` back to `https://payment.ileafu.com/`.
5. Delete the three Firebase PayPal functions (`createPaypalOrder`, `capturePaypalOrder`,
   `checkPaypalOrder`) and `paymentCompletedWebhook` — **only after** the live page is verified.
6. **Verify:** one real (live) payment, from the iOS simulator, through to `Ready to Fly`.

### Batches 3–7 — the rest

For each endpoint group: write the Supabase function → test → point `apiConfig.js` at it →
delete the Firebase function. Each is independent; they can be reordered by appetite. Batch 3
(location, read-only) can go first if lower risk early is preferred.

### Batch 8 — cleanup

1. Delete the 7 dead `apiConfig.js` entries (`firebaseLogin`, `exchangeCustomToken`,
   `getBuyerInfo`, `listPayoutDetail`, `redeemReferralReward`, `uploadChatVideo`,
   `uploadProfilePhoto`) and their Firebase functions. `firebaseLogin` and
   `exchangeCustomToken` are the Firebase-generation login helpers — **login stays on Firebase
   Auth**, so deleting them is the point, not a loss.
2. Delete the 17 stale `apiConfig.js` entries — they point at functions that do not exist and
   are called by nothing.
3. Remove `getBaseUrl()` from `apiConfig.js` entirely — that is the proof the app's port is
   complete.
4. Remove the now-unused Firebase triggers (`syncOrderToSupabase` at minimum; audit the rest).
5. Delete the `functions/` Firebase tree once it is empty.

### Batch 9 — the rest of the Firebase surface

This is the part the app's 40 does not show. Before deleting the Firebase tree, decide what
happens to:
- the **admin panel's** functions (`getAdminOrders`, `getAdminOrderDetails` — 14 exports in one
  file, `getAdminListings`, `updateAdminPassword`, …),
- the **9 scheduled jobs** (`autoExpireListings`, `autoPublishNurseryDrop`,
  `autoUpdateLiveSessionStatus`, `weeklyTask`, `checkAndResetBuddyTypes`,
  `singlePlantExpirationOnWrite`, `variationDenormOnWrite`, …) — Supabase has `pg_cron` for
  these,
- the **10 triggers** — 7 are Firestore→Supabase syncs, which become unnecessary once the
  writes happen on Supabase,
- the **website's** `getLiveSessionPublic` (public, no Supabase twin),
- the **one-off admin tools** (`migrateOrders`, `clearAndSeedOrders`, `seedOrders`,
  `importTaxonomyData`, `deduplicateReadyToFlyOrders`, …) — these are already done and can
  simply be deleted.

---

## Files likely to change

**Backend** (`~/projects/olla/ileafu_backend`)
- `supabase/functions/checkout/index.ts` (new)
- `supabase/functions/checkout-joiner/index.ts` (new)
- `supabase/functions/checkout-shipping-joiner/index.ts` (new)
- `supabase/functions/{upload-listing-image,states-data,cities-data,buyer-signup,update-buyer-password}/index.ts` (new)
- `supabase/functions/{create-live-request,get-live-requests,schedule-live-reminder,send-live-started-notification}/index.ts` (new)
- `supabase/functions/{sign-in-supplier,validate-sign-in-pin,list-payout,download-live-listing-batch-template}/index.ts` (new)
- `supabase/functions/_shared/{checkout,discount,flightCycle,shipping,live,storage}.ts` (new)
- `supabase/functions/t11-checkout.test.ts` … (new, one suite per batch)
- `supabase/config.toml` (add the new functions; `verify_jwt = false` only for public routes)
- `functions/firestore/order/checkout.js` → deleted (batch 1)
- `functions/firestore/triggers/syncOrderToSupabase.js` → deleted (batch 1)
- the 7 dead + 17 stale Firebase functions → deleted (batch 8)

**App** (`~/projects/olla/ileafu`)
- `src/config/apiConfig.js` — the 16 live entries move to `getSupabaseBaseUrl()`; the 7 dead
  and 17 stale entries removed; `getBaseUrl()` deleted in batch 8
- `src/components/Api/checkoutApi.js` — only if the response shape changes
- `config.js` — `paymentPaypalVenmoUrl` back to `https://payment.ileafu.com/` (batch 2)

**Page** (`~/projects/olla/venmo-ileafu-payment-page`)
- `src/dist/` — the production rebuild (batch 2)

---

## Tests / validation

**Per batch**
- `deno test supabase/functions/` — the whole suite stays green (currently 364 + the new ones).
- A Deno integration test per ported endpoint, in the style of `t9-payment-completion-integration.test.ts`:
  the real handler against a mocked Supabase/Push/Firebase seam, asserting the response shape
  and the side effects.

**End to end (iOS simulator, the gate for every batch)**
1. Buy a listing → the order row lands in the Supabase `orders` table.
2. Pay to Board → pay → the sheet opens the hosted page → approve → the order becomes
   `Ready to Fly`, the stock is decremented once, the seller is emailed, the buyer is pushed.
3. Replay the capture at the webhook → `alreadyPaid: true` (idempotent).
4. A cancelled/closed sheet → the Pay button comes back (the flag-release fix from this session).

**Parity check** — for the checkout, diff a Supabase-generated order row against a
Firebase-generated one, column by column, before the Firebase function is deleted.

**Old vs new** — for every ported endpoint, call the Firebase function and the Supabase
function with the same request and diff the JSON responses.

---

## Risks and tradeoffs

| Risk | Severity | Mitigation |
|---|---|---|
| The checkout write path changes (Firestore → Supabase) | **high** | port it first, alone; diff a real row against a legacy one; keep the Firebase function deployable until the diff is clean |
| The Firestore→Supabase trigger double-writes after the port | **high** | delete the trigger in the same batch as the checkout port, not later |
| Promoting the page to live while the functions are on sandbox | **high** | batch 2 flips the page **and** the secret together, in one change |
| 16 ports = 16 chances to regress a screen | medium | one batch per endpoint group; the simulator E2E is the gate; the app change is one line each (`apiConfig.js`) |
| The **admin panel** may be a separate surface with its own ~100 functions | **high** | decide the admin panel's fate before batch 9; it is not visible in the app's 40 |
| The 9 scheduled jobs need a deliberate `pg_cron` translation | medium | port them one at a time, each with its own schedule verification |
| The website's public `getLiveSessionPublic` has no Supabase twin | medium | port it in batch 9 before the Firebase tree is deleted; review it for abuse exposure |
| The Firebase `paypalVenmoPayment.js` still holds a hardcoded `PAYPAL_CLIENT_SECRET` in a tracked file | **high** | rotate the secret and move it to Firebase secrets **before** deleting the function (batch 2) |
| The app's `apiConfig.js` has a pre-existing `no-dupe-keys` lint error at `480:3` | low | leave it; it is pre-existing and unrelated |

---

## Open questions

1. **The admin panel.** The admin panel's functions are a separate app surface. Is the admin
   panel the same React Native app (on an admin build), or a web app? If it is the RN app under
   a different flag, its endpoints are in the same `apiConfig.js` and are covered. If it is a
   separate web panel, its porting is a second project. **This is the biggest open question** —
   it decides whether batch 9 is a week or a month.
2. **The 9 scheduled jobs.** Supabase `pg_cron` replaces Firebase scheduled functions, but the
   semantics differ (timezone, retry, concurrency). Each needs a deliberate translation, not a
   copy. Do they run on a strict schedule that anything depends on (`autoExpireListings`,
   `autoPublishNurseryDrop`)?
3. **Is the joiner checkout (`checkoutJoiner`) in active use?** It is 1,269 lines of the largest
   batch. If joiner orders are rare or paused, it can be ported last or left on Firebase
   temporarily.
4. **Should the 24 dead/stale `apiConfig.js` entries be deleted, or kept as Firebase
   fallbacks?** Recommendation: delete them in batch 8 — nothing calls them.
5. **The 16 stale entries point at functions that do not exist.** Are they simply dead, or do
   some of them 404 at runtime today (a screen that silently fails)? Worth a quick check: if a
   screen is currently broken because its endpoint is gone, that is a bug to fix, not to port.
6. **Should `getBaseUrl()` be deleted entirely**, or kept as a kill-switch for a rollout
   period? Recommendation: keep it until batch 8, so a single flag can send the app back to
   Firebase in an emergency.
7. **The website's `getLiveSessionPublic`.** It is public (no auth) and has no Supabase twin.
   It needs porting before the Firebase tree can go, and because it is public it must be
   checked for abuse exposure in the new home.

---

## Change log

- **2026-10-21** — initial plan written after the verified inventory of the 40 Firebase
  endpoints (25 called, 15 dead), the Firestore→Supabase order-sync discovery, and the
  live-page-is-still-Firebase finding.
- **2026-10-21** — **scope corrected against the source tree.** The first estimate counted
  dead config and source-less endpoints. The verified numbers are **16 called endpoints /
  6,528 lines**, plus 7 real-but-uncalled and 17 stale config entries. The larger discovery is
  that the Firebase tree exports **275** functions in total — the app's 40 is only the visible
  part, and the admin panel, the 9 scheduled jobs, the 10 triggers and the website's public
  `getLiveSessionPublic` are a separate surface (new batch 9, new open question 1).
