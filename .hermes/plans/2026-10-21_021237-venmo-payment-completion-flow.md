# Plan: make the hosted-page Venmo/PayPal flow complete the order reliably

**Created:** 2026-10-21 02:12
**Repos:** `~/projects/olla/ileafu_backend` (functions), `~/projects/olla/venmo-ileafu-payment-page` (hosted page), `~/projects/olla/ileafu` (app)
**Deploy target:** Firebase project `i-leaf-u`, Hosting site `i-leaf-u` + Cloud Functions

---

## Goal

When a buyer pays through the hosted payment page, the order must be marked paid (`Ready to Fly`), the seller notified, and the buyer returned to the app immediately with a "payment in progress" state — without depending on a PayPal webhook that does not reliably arrive.

---

## Current context / assumptions

### The two payment flows (only one is broken)

| flow | endpoints | page involved? | who marks the order paid |
|---|---|---|---|
| **In-app / vaulted** | `createAndCapturePaypalOrder` | no | `processPaymentCompletion(paypalOrderId)` called **inline** at `paypalVenmoPayment.js:1129` — **works** |
| **Hosted page** | `createPaypalOrder` → `capturePaypalOrder` | yes | **only** the PayPal webhook — **broken** |

Her APK test used the **hosted-page** flow (`createPaypalOrder`: 6 calls for `TXN1792515406510468`; `createAndCapturePaypalOrder`: 0 calls). It runs in a Chrome Custom Tab over the app, which is why it felt "in app".

### Evidence from production (2026-10-20)

```
16:56:57  createPaypalOrder  -> PayPal order A
16:57:18  createPaypalOrder  -> PayPal order B  (0VB75201N5501384P)  <- 2nd attempt overwrites paypalOrderId
16:57:20  capturePaypalOrder captures order A (7TV03732UB850535V)
16:57:23  PayPal capture COMPLETED  $1.00 taken
16:57:26  PayPal emits webhook for that capture
          -> our function logged NOTHING (never delivered)
17:26:51  capturePaypalOrder captures order C (96B06159YS4877909)
17:27:32  webhook finally arrives (30 min late)
17:27:32  "No order found for PayPal Order ID: 96B06159YS4877909"   <- stored id was B, captured C
```

Result: **`TXN1792515406510468` is `pending_payment` with a completed $1.00 capture** — money taken, order unpaid, seller never emailed, plant never released.

A control case proves the in-app path is fine: `TXN1792517155637139` → `Ready to Fly`, `paypalPaymentStatus COMPLETED`, `paidAt 17:27:11`.

### Root causes

1. **`capturePaypalOrder` does not mark the order paid.** `paypalVenmoPayment.js:912` has it commented out:
   ```js
   // await processPaymentCompletion(paypalOrderId); removed. this process will handle by the webhook
   ```
   The webhook is not a reliable substitute: for the 16:57 capture it never arrived, and for the 17:26 one it arrived 30 minutes late and then 404'd.
2. **`createPaypalOrder` overwrites `paypalOrderId`** (`paypalVenmoPayment.js:240-242`), so the second PayPal order for a transaction replaces the id the capture will be matched against.
3. **The page creates a second PayPal order** on every Venmo press *and* again on the post-return load.

### Assumptions to verify before coding

- `processPaymentCompletion(paypalOrderId)` is safe to call from the capture path: it is already called the same way at `:1129` (in-app path), it decrements stock, sets `Ready to Fly` + `payoutStatus: 'Complete'` + `paidAt`, emails the seller and mirrors to Supabase.
- The webhook `paymentCompletedWebhook` is registered and enabled on PayPal (verified: id `126307327V245353F`, url `…/paymentCompletedWebhook`, event `PAYMENT.CAPTURE.COMPLETED`).
- `PAYMENT.CAPTURE.COMPLETED` for a capture whose order id is not stored in Firestore is unrecoverable by the current lookup (matches on `paypalOrderId` only, `paypalVenmoPayment.js:350-352`).

---

## Architecture / proposed approach

Make the **capture** the authoritative completion point, exactly like the in-app path already is: when `capturePaypalOrder` gets `COMPLETED`, it calls the shared `processPaymentCompletion(paypalOrderId)` and the order is paid immediately. The PayPal webhook stays as a safety net for "buyer approved in Venmo but the app was killed before returning to the page".

On top of that, make the hosted page create **one** PayPal order per transaction (reuse the stored `paypalOrderId` instead of overwriting it), and let the page skip `createOrder` when PayPal's `?token=` is already present in the URL. In the app, treat `ileafu://payment-success` as "payment in progress": dismiss the sheet, navigate to Orders, show a non-blocking banner, and let the order sit in Pay to Board until the capture confirms it.

**Nothing in the in-app/vaulted flow changes.**

---

## Step-by-step tasks

### Task 1 — Repair the two stuck orders (data, not code)

A buyer has been charged and the order is unpaid. Do this first, before any code change, so the money and the order agree.

**Verify the capture is real before touching anything:**

```bash
cd ~/projects/olla/ileafu_backend/functions/firestore/paypal
export PAYPAL_CLIENT_ID=$(grep -m1 -oE "PAYPAL_CLIENT_ID['\"]?\s*[:=]\s*['\"][A-Za-z0-9_-]+" paypalVenmoPayment.js | grep -oE "[A-Za-z0-9_-]{60,}")
export PAYPAL_SECRET=$(grep -m1 -oE "PAYPAL_CLIENT_SECRET['\"]?\s*[:=]\s*['\"][A-Za-z0-9_-]+" paypalVenmoPayment.js | grep -oE "[A-Za-z0-9_-]{30,}")
TOKEN=$(curl -s -u "$PAYPAL_CLIENT_ID:$PAYPAL_SECRET" https://api-m.paypal.com/v1/oauth2/token -d grant_type=client_credentials | python3 -c "import json,sys; print(json.load(sys.stdin)['access_token'])")
curl -s -H "Authorization: Bearer $TOKEN" "https://api-m.paypal.com/v2/checkout/orders/7TV03732UB850535V" | python3 -c "
import json,sys; d=json.load(sys.stdin); pu=(d.get('purchase_units') or [{}])[0]
print('status', d.get('status'), '| custom_id', pu.get('custom_id'))
print('captures', [(c.get('id'), c.get('status')) for c in ((pu.get('payments') or {}).get('captures') or [])])
"
```

**Expected:** `status COMPLETED | custom_id TXN1792515406510468` and one capture `90G56707VC0626815 COMPLETED`.

**Then repair it** — write `7TV03732UB850535V` into the order's `paypalOrderId` and run the existing completion helper so every side effect (stock decrement, `Ready to Fly`, `paidAt`, seller email, Supabase mirror) happens exactly as it would have:

```bash
cd ~/projects/olla/ileafu_backend
node -e "
const mod = require('./functions/node_modules/firebase-admin');
const admin = mod.default || mod;
admin.initializeApp({ credential: admin.credential.cert(require('./service-account-key.json')), projectId: 'i-leaf-u' });
const db = admin.firestore();
const TXN = 'TXN1792515406510468';
const PAYPAL_ORDER_ID = '7TV03732UB850535V';   // the order that was actually captured
(async () => {
  const snap = await db.collection('order').where('transactionNumber', '==', TXN).get();
  for (const d of snap.docs) {
    if (d.data().status === 'Ready to Fly') { console.log('  already paid, skipping', d.id); continue; }
    await d.ref.update({ paypalOrderId: PAYPAL_ORDER_ID });
    console.log('  set paypalOrderId =', PAYPAL_ORDER_ID, 'on', d.id);
  }
  process.exit(0);
})().catch(e => { console.error(e.message); process.exit(1); });
"
```

**Expected:** `set paypalOrderId = 7TV03732UB850535V on <docId>`

Then run the completion helper against the **real** backend so the seller email and stock decrement actually happen:

```bash
cd ~/projects/olla/ileafu_backend
node -e "
const mod = require('./functions/node_modules/firebase-admin');
const admin = mod.default || mod;
admin.initializeApp({ credential: admin.credential.cert(require('./service-account-key.json')), projectId: 'i-leaf-u' });
const { processPaymentCompletion } = require('./functions/firestore/paypal/paypalVenmoPayment.js');
processPaymentCompletion('7TV03732UB850535V')
  .then(r => { console.log('  result:', JSON.stringify(r)); process.exit(0); })
  .catch(e => { console.error('  ERR', e.message); process.exit(1); });
" 2>&1 | tail -20
```

**Expected (log lines):** `Processing payment completion for PayPal Order ID: 7TV03732UB850535V` … `Successfully updated 1 order document(s)` … `✅ Email sent successfully` … `✅ Seller notification process completed for transaction TXN1792515406510468`

**Verify:**

```bash
cd ~/projects/olla/ileafu_backend
node -e "
const mod = require('./functions/node_modules/firebase-admin');
const admin = mod.default || mod;
admin.initializeApp({ credential: admin.credential.cert(require('./service-account-key.json')), projectId: 'i-leaf-u' });
admin.firestore().collection('order').where('transactionNumber', '==', 'TXN1792515406510468').get().then(s => {
  for (const d of s.docs) { const o = d.data();
    console.log('  status', o.status, '| payStatus', o.paypalPaymentStatus, '| paidAt', o.paidAt ? o.paidAt.toDate() : '-', '| payout', o.payoutStatus); }
  process.exit(0);
});
"
```

**Expected:** `status Ready to Fly | payStatus COMPLETED | paidAt 2026-10-21T… | payout Complete`

**`TXN1792514839543106`** — its PayPal order `26U40453BY1234347` is `PAYER_ACTION_REQUIRED` (never approved, no money taken). Leave it, or delete it the same way the four earlier failed orders were deleted (Firestore doc `?` + Supabase mirror). Decision is open — see Open Questions.

**Commit:** none (data repair, not code). Record what was done in the PR/session notes.

---

### Task 2 — Write the failing test: capture must complete the order

Create `functions/__tests__/paypalCaptureCompletesOrder.test.js`.

The test asserts the **behavioural contract**: after `capturePaypalOrder` returns a `COMPLETED` capture, the order is updated to `Ready to Fly` — i.e. `processPaymentCompletion` is invoked with the captured order id.

Use the existing mocks in `functions/__mocks__/firebaseAdmin.js` (see `functions/__tests__/paymentStockDecrement.test.js` for the exact `require.cache` wiring of `firebase-admin/firestore` and `../firestore/util/firebaseAdmin`), and `makeRes` / `assert` from `functions/__tests__/testHelpers.js`.

Skeleton to fill in (the harness wiring is copied from `paymentStockDecrement.test.js:14-33`):

```js
const { describe, it, beforeEach, afterEach } = require('node:test');
const { assert, makeRes } = require('./testHelpers');
const admin = require('../__mocks__/firebaseAdmin');

require.cache[require.resolve('../firestore/util/firebaseAdmin')] = {
  id: require.resolve('../firestore/util/firebaseAdmin'),
  filename: require.resolve('../firestore/util/firebaseAdmin'),
  loaded: true,
  exports: admin,
};
require.cache[require.resolve('firebase-admin/firestore')] = {
  id: require.resolve('firebase-admin/firestore'),
  filename: require.resolve('firebase-admin/firestore'),
  loaded: true,
  exports: {
    FieldValue: admin.firestore().FieldValue,
    Timestamp: { fromMillis: (ms) => new Date(ms), now: () => new Date() },
  },
};

// The module under test. The PayPal HTTP call is stubbed via global.fetch.
const paypal = require('../firestore/paypal/paypalVenmoPayment.js');

describe('capturePaypalOrder', () => {
  beforeEach(() => { admin.__resetAllMocks(); });
  afterEach(() => { global.fetch = originalFetch; });

  it('marks the order paid when PayPal returns a COMPLETED capture', async () => {
    // Arrange: one order doc, status pending_payment, finalTotal 1, paypalOrderId 'ORDER_1'
    // Stub global.fetch so the oauth token call and the capture call both succeed:
    //   - POST .../v1/oauth2/token            -> { access_token: 'tok' }
    //   - POST .../v2/checkout/orders/ORDER_1/capture -> { id: 'CAP_1', status: 'COMPLETED' }
    // Act: await paypal.capturePaypalOrder({ body: { orderId: 'ORDER_1', ileafuOrderId: 'TXN1' } }, res)
    // Assert: res.statusCode is 200, and the order doc was updated to status 'Ready to Fly'
    //         with paypalPaymentStatus 'COMPLETED' and a paidAt timestamp.
  });
});
```

**Run it and watch it FAIL:**

```bash
cd ~/projects/olla/ileafu_backend/functions
node --test __tests__/paypalCaptureCompletesOrder.test.js
```

**Expected before the fix:** the assertion on `status === 'Ready to Fly'` fails (the order stays `pending_payment`), because `processPaymentCompletion` is not called from the capture path.

**Commit the failing test:**

```bash
cd ~/projects/olla/ileafu_backend
git add functions/__tests__/paypalCaptureCompletesOrder.test.js
git commit -m "test(paypal): capture must complete the order (fails: webhook-only path)"
```

---

### Task 3 — Make the capture complete the order

Edit `functions/firestore/paypal/paypalVenmoPayment.js`, inside `exports.capturePaypalOrder` (around line 906-916).

**Before:**
```js
        // Get the paypalOrderId from the first order (should be same for all in transaction)
        const firstDoc = querySnapshot.docs[0];
        const paypalOrderId = firstDoc.data().paypalOrderId || orderId;
        
        // Use the shared payment processing function
        try {
          // await processPaymentCompletion(paypalOrderId); removed. this process will handle by the webhook
          return res.status(httpStatusCode).json(jsonResponse);
        } catch (error) {
```

**After:**
```js
        // Get the paypalOrderId from the first order (should be same for all in transaction)
        const firstDoc = querySnapshot.docs[0];
        const paypalOrderId = firstDoc.data().paypalOrderId || orderId;
        
        // Complete the payment here, not in the PayPal webhook.
        //
        // The webhook is only a safety net: it was measured arriving 30 minutes late for one
        // capture and not at all for another, and a late webhook can no longer match the order
        // because a later createPaypalOrder may have replaced its paypalOrderId. The in-app
        // path (createAndCapturePaypalOrder) already completes the payment this way, so the
        // hosted-page path now does the same.
        try {
          const completion = await processPaymentCompletion(paypalOrderId);
          if (!completion || completion.success === false) {
            console.error('Capture succeeded but order completion did not:', completion);
          }
        } catch (error) {
          console.error('Error processing payment completion:', error);
        }

        try {
          return res.status(httpStatusCode).json(jsonResponse);
        } catch (error) {
```

**Note the deliberate difference from the current code:** the completion failure is logged but **does not** fail the HTTP response. The money is already captured at PayPal; returning 500 would make the page show "Sorry, your transaction could not be processed" for a payment that actually succeeded. The `catch` around `res.status(...).json(...)` is kept as-is from the original.

**Run the test and watch it PASS:**

```bash
cd ~/projects/olla/ileafu_backend/functions
node --test __tests__/paypalCaptureCompletesOrder.test.js
```

**Expected:** the test passes (`# pass 1`, `# fail 0`).

**Run the whole backend suite to check for regressions:**

```bash
cd ~/projects/olla/ileafu_backend/functions
node --test __tests__/*.test.js 2>&1 | tail -15
```

**Expected:** the same pass/fail counts as before the change, plus the new test. (`node --test` prints `# pass N` / `# fail N` at the end; record the numbers before and after.)

**Commit:**

```bash
cd ~/projects/olla/ileafu_backend
git add functions/firestore/paypal/paypalVenmoPayment.js
git commit -m "fix(paypal): complete the order on capture, not only via the webhook

The hosted-page payment flow marked the order paid only when PayPal's
PAYMENT.CAPTURE.COMPLETED webhook arrived. In production that webhook was
30 minutes late for one capture and never arrived for another, leaving a
buyer charged with the order still pending_payment.

capturePaypalOrder now calls the same processPaymentCompletion() helper the
in-app path already calls, so the order becomes Ready to Fly, the seller is
emailed and stock is decremented as soon as PayPal confirms the capture.
The webhook remains as a safety net for an approved-but-abandoned payment."
```

---

### Task 4 — Write the failing test: one PayPal order per transaction

Create `functions/__tests__/paypalCreateReusesExistingOrder.test.js`.

**Contract:** if the order already has a `paypalOrderId`, `createPaypalOrder` must NOT create a new PayPal order — it must return the existing one.

```js
const { describe, it, beforeEach, afterEach } = require('node:test');
const { assert, makeRes } = require('./testHelpers');
const admin = require('../__mocks__/firebaseAdmin');
// ... same require.cache wiring as Task 2 ...

describe('createPaypalOrder', () => {
  it('reuses the stored paypalOrderId instead of creating a second PayPal order', async () => {
    // Arrange: order doc has paypalOrderId 'ORDER_EXISTING', finalTotal 1
    // Stub global.fetch and count the POSTs to /v2/checkout/orders
    // Act: await paypal.createPaypalOrder({ body: { amount: '1', ileafuOrderId: 'TXN1' } }, res)
    // Assert: only ONE POST to /v2/checkout/orders was made (the oauth token call is not
    //         counted), and res.jsonBody.id === 'ORDER_EXISTING'.
  });
});
```

**Run and watch it FAIL:**

```bash
cd ~/projects/olla/ileafu_backend/functions
node --test __tests__/paypalCreateReusesExistingOrder.test.js
```

**Expected before the fix:** two POSTs to `/v2/checkout/orders` (a new PayPal order was created) and `res.jsonBody.id` is the new id, not `ORDER_EXISTING`.

**Commit the failing test** with the same message pattern as Task 2.

---

### Task 5 — Reuse the stored PayPal order in createPaypalOrder

Edit `functions/firestore/paypal/paypalVenmoPayment.js` in `exports.createPaypalOrder`, just before the `const { jsonResponse, httpStatusCode } = await createOrder(...)` call (around line 229).

**Before:**
```js
    const { jsonResponse, httpStatusCode } = await createOrder(cart, amount, ileafuOrderId, savePaymentMethod, paymentSource);
    
    const batch = db.batch();
    
    querySnapshot.forEach((doc) => {
      const orderData = doc.data();
      const finalTotal = orderData?.finalTotal || '0.00';
      if (parseFloat(finalTotal) !== parseFloat(amount)) {
        return res.status(400).json({ error: 'Amount mismatch', timestamp: getEasternDateTime().toISO(), success: false });
      }
    
      let updateData = {
        paypalOrderId: jsonResponse.id,
      };
    
      batch.update(doc.ref, updateData);
    });
```

**After:**
```js
    // One PayPal order per transaction. The page can call createOrder more than once for the
    // same transaction (once per Venmo press, once when the page reloads after the return).
    // Creating a second PayPal order overwrote the stored paypalOrderId, so the capture that
    // actually completed could no longer be matched to the order by the webhook lookup.
    // Reuse the existing id instead.
    const existingPaypalOrderId = querySnapshot.docs
      .map((doc) => doc.data().paypalOrderId)
      .find((id) => !!id);

    if (existingPaypalOrderId) {
      console.log(`Reusing existing PayPal order ${existingPaypalOrderId} for ${ileafuOrderId}`);
      return res.status(200).json({ id: existingPaypalOrderId, status: 'REUSED' });
    }

    const { jsonResponse, httpStatusCode } = await createOrder(cart, amount, ileafuOrderId, savePaymentMethod, paymentSource);
    
    const batch = db.batch();
    
    querySnapshot.forEach((doc) => {
      const orderData = doc.data();
      const finalTotal = orderData?.finalTotal || '0.00';
      if (parseFloat(finalTotal) !== parseFloat(amount)) {
        return res.status(400).json({ error: 'Amount mismatch', timestamp: getEasternDateTime().toISO(), success: false });
      }
    
      let updateData = {
        paypalOrderId: jsonResponse.id,
      };
    
      batch.update(doc.ref, updateData);
    });
```

> **Known limitation of this step, accepted for now:** the reused response is a minimal `{ id, status }` object, not the full PayPal order body the page's `createOrder` callback expects. The page only reads `orderData.id` (see `venmo-ileafu-payment-page/src/App.jsx:256`), so this is sufficient today. If the page later needs `status`/`links`, fetch the order from PayPal here instead of returning the stub.

**Run both new tests plus the suite:**

```bash
cd ~/projects/olla/ileafu_backend/functions
node --test __tests__/paypalCreateReusesExistingOrder.test.js __tests__/paypalCaptureCompletesOrder.test.js
node --test __tests__/*.test.js 2>&1 | tail -15
```

**Expected:** both new tests pass; suite counts unchanged apart from the additions.

**Commit:**

```bash
cd ~/projects/olla/ileafu_backend
git add functions/firestore/paypal/paypalVenmoPayment.js
git commit -m "fix(paypal): one PayPal order per transaction

createPaypalOrder created a new PayPal order on every call, and the page
calls it more than once per transaction. The second call overwrote the
order's paypalOrderId, so the capture that actually completed could not be
matched to the order any more. Reuse the stored id when one exists."
```

---

### Task 6 — Write the failing test: webhook lookup falls back to custom_id

Create `functions/__tests__/paypalWebhookFallbackLookup.test.js`.

**Contract:** `processPaymentCompletion` must find the order even when the stored `paypalOrderId` does not match, by falling back to the PayPal `custom_id` (the transaction number).

```js
const { describe, it, beforeEach, afterEach } = require('node:test');
const { assert, makeRes } = require('./testHelpers');
const admin = require('../__mocks__/firebaseAdmin');
// ... same require.cache wiring as Task 2 ...

describe('processPaymentCompletion', () => {
  it('finds the order by custom_id when the stored paypalOrderId does not match', async () => {
    // Arrange: one order doc with paypalOrderId 'STALE_ID' and transactionNumber 'TXN1'.
    //           The PayPal API returns a capture whose purchase_units[0].custom_id is 'TXN1'.
    // Act:   await paypal.processPaymentCompletion('CAPTURED_ORDER_ID')
    // Assert: the order doc was updated to status 'Ready to Fly' (not left pending_payment).
  });
});
```

**Run and watch it FAIL:**

```bash
cd ~/projects/olla/ileafu_backend/functions
node --test __tests__/paypalWebhookFallbackLookup.test.js
```

**Expected before the fix:** `No order found for PayPal Order ID: …` and the order is not updated.

**Commit the failing test.**

---

### Task 7 — Webhook lookup fallback

Edit `functions/firestore/paypal/paypalVenmoPayment.js` in `processPaymentCompletion` (around lines 346-357).

**Before:**
```js
async function processPaymentCompletion(paypalOrderId) {
  console.log(`Processing payment completion for PayPal Order ID: ${paypalOrderId}`);
  
  // Find the order(s) in Firestore using the paypalOrderId and update the status.
  const orderQuery = db.collection("order")
    .where("paypalOrderId", "==", paypalOrderId)
    .where("status", "!=", "Ready to Fly");
  const querySnapshot = await orderQuery.get();
  
  if (querySnapshot.empty) {
    console.error(`No order found for PayPal Order ID: ${paypalOrderId}`);
    return { success: false, message: 'No matching order found' };
  }
```

**After:**
```js
async function processPaymentCompletion(paypalOrderId) {
  console.log(`Processing payment completion for PayPal Order ID: ${paypalOrderId}`);
  
  // Find the order(s) in Firestore using the paypalOrderId and update the status.
  let orderQuery = db.collection("order")
    .where("paypalOrderId", "==", paypalOrderId)
    .where("status", "!=", "Ready to Fly");
  let querySnapshot = await orderQuery.get();
  
  if (querySnapshot.empty) {
    // Fallback: the stored paypalOrderId can be stale (a later createPaypalOrder replaced it).
    // PayPal sends the transaction number as the purchase unit's custom_id, so match on that
    // before giving up — otherwise a paid order is left pending forever.
    const customId = await getTransactionNumberForPaypalOrder(paypalOrderId);
    if (customId) {
      console.warn(`No order by paypalOrderId ${paypalOrderId}; retrying with custom_id ${customId}`);
      orderQuery = db.collection("order")
        .where("transactionNumber", "==", customId)
        .where("status", "!=", "Ready to Fly");
      querySnapshot = await orderQuery.get();
    }
  }
  
  if (querySnapshot.empty) {
    console.error(`No order found for PayPal Order ID: ${paypalOrderId}`);
    return { success: false, message: 'No matching order found' };
  }
```

Add the helper just above `processPaymentCompletion` (around line 345):

```js
/**
 * Read the transaction number (PayPal purchase unit custom_id) for a PayPal order.
 * Returns null when the order cannot be read.
 */
async function getTransactionNumberForPaypalOrder(paypalOrderId) {
  try {
    const collect = { id: paypalOrderId, prefer: 'return=minimal' };
    const paypalOrder = await ordersController.getOrder(collect);
    const purchaseUnits = paypalOrder?.result?.purchase_units || [];
    const customId = purchaseUnits[0]?.custom_id;
    return customId || null;
  } catch (error) {
    console.error('Could not read PayPal order for custom_id fallback:', error.message || error);
    return null;
  }
}
```

> `ordersController` is already imported and used in this file (`paypalVenmoPayment.js` uses `ordersController.getOrder(collect)` in `checkPaypalOrderStatus`). Confirm the identifier before running the test.

**Run the test and watch it PASS, then the suite:**

```bash
cd ~/projects/olla/ileafu_backend/functions
node --test __tests__/paypalWebhookFallbackLookup.test.js
node --test __tests__/*.test.js 2>&1 | tail -15
```

**Commit:**

```bash
cd ~/projects/olla/ileafu_backend
git add functions/firestore/paypal/paypalVenmoPayment.js
git commit -m "fix(paypal): find the order by custom_id when paypalOrderId is stale

A capture whose PayPal order id is no longer the one stored on the order
could not be matched, so a paid order stayed pending_payment. PayPal sends
the transaction number as the purchase unit custom_id, so use it as a
fallback before giving up."
```

---

### Task 8 — The page must not create a second order

Repo: `~/projects/olla/venmo-ileafu-payment-page`, branch `ileafu/payment-page` (currently `86bd38d`).

**File:** `src/App.jsx` — inside the `createOrder` callback of `<PayPalButtons>` (around line 237).

PayPal returns the buyer to the page with `?token=EC-…` (and the backend's `returnUrl` also adds `&capture=true`). When the page loads with that token, the SDK expects to **resume** the existing order, not create a new one. Today `createOrder` runs again and creates a second PayPal order.

**Add near the top of the `App` component** (after the `urlParams` block, around line 116):

```js
  // PayPal returns the buyer to this page with ?token=EC-… (and the backend's returnUrl adds
  // &capture=true). The order already exists at that point — creating another one replaced the
  // order's paypalOrderId, which broke matching the capture back to the order.
  const isResumingExistingOrder = urlParams.get('token') !== null || urlParams.get('capture') === 'true';
```

**And in the `createOrder` callback, before the fetch:**

```js
                  createOrder={async (data) => {
                    if (isResumingExistingOrder) {
                      // The PayPal order already exists; the SDK will resume it with the
                      // token in the URL. Creating a new one would orphan the capture.
                      console.log('Resuming existing PayPal order (token present in URL)');
                      return null;
                    }
                    try {
```

> **Verify this with PayPal's SDK contract before shipping.** `@paypal/react-paypal-js` types `createOrder` as `(data, actions) => Promise<string>`; returning `null` may be rejected by the SDK. If it is, the correct alternative is to **not render the buttons at all** when `isResumingExistingOrder` is true (the order is already approved — the page should just show the "awaiting completion" message and poll `checkPaypalOrderStatus`). Check the installed SDK's behaviour in `node_modules/@paypal/react-paypal-js` before choosing.

**Build and verify the output changes:**

```bash
cd ~/projects/olla/venmo-ileafu-payment-page/src
npm run client-build
```

**Expected:** a new hashed asset, e.g. `dist/assets/index-<newHash>.js`, and `dist/assets/index-Zi7mIhOT.js` gone.

**Commit:**

```bash
cd ~/projects/olla/venmo-ileafu-payment-page
git add -A
git commit -m "fix(payment): do not create a second PayPal order on the return

PayPal returns the buyer to the page with ?token=…, so the order already
exists. createOrder ran again on load and created a second PayPal order,
replacing the order's paypalOrderId so the capture could no longer be
matched to it."
```

---

### Task 9 — App: "payment in progress" on return

Repo: `~/projects/olla/ileafu`, file `src/components/AppNavigation/AppNavigation.js` (the deep-link handler around line 1338).

**Current behaviour** (verified):
```js
      if (
        url.startsWith('ileafu://payment-success') ||
        url.startsWith('ileafu://payment-cancel')
      ) {
        console.log('💳 [payment-sheet] return from page, dismissing sheet:', url.slice(0, 80));
        closePaymentSheet();
        return;
      }
```

**Required behaviour:**
1. `ileafu://payment-success` → dismiss the sheet, **navigate to the Orders screen**, show a "Payment in progress" banner, and leave the order in Pay to Board.
2. `ileafu://payment-cancel` → dismiss the sheet, no banner.

**Implementation sketch** (the exact navigation call must match how the rest of the app navigates to Orders — check `src/screens/Buyer/Orders/ScreenOrders.js` and the navigation names in `src/navigation/`):

```js
      if (url.startsWith('ileafu://payment-success') || url.startsWith('ileafu://payment-cancel')) {
        const isSuccess = url.startsWith('ileafu://payment-success');
        console.log('💳 [payment-sheet] return from page, dismissing sheet:', url.slice(0, 80));
        closePaymentSheet();

        if (isSuccess) {
          // The capture has not necessarily been confirmed yet — the order stays in Pay to
          // Board until the backend completes it. Send the buyer to Orders and say so.
          setTimeout(() => {
            navigationRef?.navigate('Orders', { screen: 'PayToBoard' });
            // show the "payment in progress" banner (see the banner component below)
          }, 450);
        }
        return;
      }
```

**The banner** — a new small component, e.g. `src/components/PaymentInProgressBanner.js`:

```jsx
import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';

/**
 * Non-blocking banner shown after a successful Venmo/PayPal return. The payment is not
 * confirmed until the backend completes the capture, so the order stays in Pay to Board.
 */
export default function PaymentInProgressBanner({ visible, onDismiss }) {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: visible ? 1 : 0,
      duration: 250,
      useNativeDriver: true,
    }).start();
    if (visible) {
      const timer = setTimeout(() => onDismiss?.(), 8000);
      return () => clearTimeout(timer);
    }
  }, [visible, opacity, onDismiss]);

  if (!visible) return null;

  return (
    <Animated.View style={[styles.container, { opacity }]} pointerEvents="none">
      <View style={styles.card}>
        <Text style={styles.title}>Payment in progress</Text>
        <Text style={styles.body}>
          We are confirming your Venmo payment. This usually takes a moment — your order stays
          in Pay to Board until it is confirmed, and you will get a notification.
        </Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(83, 148, 97, 0.25)',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  title: { fontSize: 15, fontWeight: '600', color: '#1F2A24', marginBottom: 4 },
  body: { fontSize: 13, lineHeight: 19, color: '#5A6B60' },
});
```

**Where to mount it:** inside the Orders screen (`src/screens/Buyer/Orders/ScreenOrders.js`) is simplest and keeps the banner scoped to where the buyer lands — pass a prop through the navigation params instead of a global context.

> **Decision needed (see Open Questions):** the banner's trigger is a navigation event, so the simplest wiring is `navigation.navigate('Orders', { screen: 'PayToBoard', paymentInProgress: true })` and the Orders screen reads `route.params?.paymentInProgress` in a `useEffect` to show the banner.

**Test:**

```bash
cd ~/projects/olla/ileafu
npx eslint src/components/PaymentInProgressBanner.js src/components/AppNavigation/AppNavigation.js
```

**Expected:** no new errors (the repo has a pre-existing baseline of 15 problems / 2 errors on the touched files — compare against `git stash` output before claiming a clean run).

```bash
cd ~/projects/olla/ileafu
npm test 2>&1 | tail -20
```

**Expected:** 108 passing, 11/12 suites (the pre-existing red suite is `__tests__/liveListingSessionId.test.js` — it was already failing before this work).

**Commit:**

```bash
cd ~/projects/olla/ileafu
git add src/components/PaymentInProgressBanner.js src/components/AppNavigation/AppNavigation.js
git commit -m "feat(payments): return to Orders with a payment-in-progress banner

After a successful Venmo/PayPal return the order is not confirmed yet — the
capture has to complete first — so the buyer is sent to Orders where the
order stays in Pay to Board, with a banner explaining that the payment is
being confirmed."
```

---

### Task 10 — App: Orders refreshes when the payment is confirmed

Repo: `~/projects/olla/ileafu`.

The Orders screen only refreshes on pull-to-refresh or `route.params?.refreshData` (`src/screens/Buyer/Orders/ScreenPayToBoard.js:382`), so when the capture completes and the order moves to `Ready to Fly`, the buyer would keep seeing a stale Pay to Board card.

**Implementation:** in `src/screens/Buyer/Orders/ScreenPayToBoard.js`, refetch when the screen regains focus:

```js
  // Refetch when the screen regains focus so a payment confirmed in the background shows up.
  useFocusEffect(
    useCallback(() => {
      fetchOrders(true);   // use the existing loader's signature — check the function name
    }, []),
  );
```

> The existing loader is an async function inside the component — read lines 100-220 to get its exact name and parameters (`isRefresh` vs `append`) and wire it correctly. `useFocusEffect` comes from `@react-navigation/native`; verify it is already imported in this file, otherwise import it.

**Also disable the "Pay $X" button while a payment is in flight**, so a buyer cannot pay twice. The order must carry a marker; see Open Questions for the chosen field.

**Test:** manual on a device — open Orders, complete a payment, return to Orders, pull to refresh, and confirm the order moved to `Ready to Fly`.

**Commit:**

```bash
cd ~/projects/olla/ileafu
git add src/screens/Buyer/Orders/ScreenPayToBoard.js
git commit -m "feat(payments): refresh Orders on focus so a confirmed payment appears"
```

---

### Task 11 — Backend: notify the buyer when the payment is confirmed

Repo: `~/projects/olla/ileafu_backend`, file `functions/firestore/paypal/paypalVenmoPayment.js`.

The seller is already notified by `processPaymentCompletion` (it emails + sends FCM). The **buyer** gets nothing.

**Where:** inside `processPaymentCompletion`, right after the order batch commits (around line 430-470, where the seller notification is triggered).

**Contract:** send an FCM push to the buyer of every order in the transaction with a "Payment confirmed" title/body.

The app already has the plumbing:
- `functions/firestore/paypal/paypalVenmoPayment.js` already has FCM/seller-notification code to copy the pattern from (search for the seller notification call and reuse it).
- The app registers buyer tokens via `src/services/notifications/buyerFcmTokens.js` and the `fcm-token` Supabase edge function.
- The app receives foreground pushes via `NotificationService` (`src/services/notifications/NotificationService.js:50`, `onMessage`).

**Sketch** (mirror the existing seller-notification helper — do not invent a new one):

```js
  // Notify the buyer that the payment is confirmed. The seller notification above is the
  // pattern to copy; the buyer's FCM tokens live in the same store the app writes them to.
  for (const doc of querySnapshot.docs) {
    const buyerUid = doc.data().buyerUid;
    if (!buyerUid) continue;
    try {
      await notifyBuyerPaymentConfirmed(buyerUid, ileafuOrderId);
    } catch (err) {
      console.warn('Buyer payment-confirmed notification failed:', err.message || err);
    }
  }
```

> Implement `notifyBuyerPaymentConfirmed` by reusing the existing seller-notification helper in this file, changing only the recipient lookup (buyer instead of seller) and the message. Read the existing helper first and copy it — do not write a new FCM client.

**Verify on device:** Android only for now — iOS push does not work for this project (`i-leaf-u` has no valid APNs credential; the log shows `messaging/third-party-auth-error` / "Invalid APNs credential" ×144).

**Commit:**

```bash
cd ~/projects/olla/ileafu_backend
git add functions/firestore/paypal/paypalVenmoPayment.js
git commit -m "feat(paypal): notify the buyer when the payment is confirmed"
```

---

### Task 12 — Deploy and verify end to end

**Deploy the functions:**

```bash
cd ~/projects/olla/ileafu_backend
firebase deploy --only functions:capturePaypalOrder,functions:createPaypalOrder
```

**Deploy the page** (to the preview channel first, never straight to live):

```bash
cd ~/projects/olla/venmo-ileafu-payment-page/src
npm run client-build
firebase hosting:channel:deploy redesign-payment --expires 30d
```

**Verify the deploy actually changed the code** (do not trust "Deploy complete"):

```bash
cd ~/projects/olla/venmo-ileafu-payment-page
git rev-parse HEAD
curl -sL "https://i-leaf-u--redesign-payment-soyzi0iu.web.app/" | grep -oE '/assets/index-[A-Za-z0-9_-]+\.js'
```

**Expected:** the served asset name matches the freshly built `dist/assets/index-<hash>.js`.

**End-to-end test** (use a real order, real device, and watch the logs):

```bash
cd ~/projects/olla/ileafu_backend
firebase functions:log --only capturePaypalOrder --project i-leaf-u
```

**Expected, in order:**
```
… Capturing order with ID: <id>
… Response 201 …            (PayPal captured)
… Processing payment completion for PayPal Order ID: <id>
… Successfully updated 1 order document(s) for PayPal Order: <id>
… ✅ Seller notification process completed for transaction TXN…
```

And in Firestore the order must be `Ready to Fly` **within seconds of the capture**, not minutes later.

**Rollback path** (if the deploy misbehaves):

```bash
cd ~/projects/olla/venmo-ileafu-payment-page/src
firebase hosting:clone i-leaf-u:live i-leaf-u:live   # re-publish the current live version
```

For the functions, redeploy the previous commit:
```bash
cd ~/projects/olla/ileafu_backend
git log --oneline -5 -- functions/firestore/paypal/paypalVenmoPayment.js
git checkout <previous-sha> -- functions/firestore/paypal/paypalVenmoPayment.js
firebase deploy --only functions:capturePaypalOrder,functions:createPaypalOrder
```

---

## Tests / validation

### Per-task TDD cycle

Every code task above follows: **write the failing test → run it and watch it fail → implement minimally → run it and watch it pass → commit.** The failing-test commit is separate so the red state is visible in history.

### Commands

```bash
# Single new test
cd ~/projects/olla/ileafu_backend/functions
node --test __tests__/paypalCaptureCompletesOrder.test.js
node --test __tests__/paypalCreateReusesExistingOrder.test.js
node --test __tests__/paypalWebhookFallbackLookup.test.js

# Full backend suite
cd ~/projects/olla/ileafu_backend/functions
node --test __tests__/*.test.js 2>&1 | tail -15

# App lint + tests
cd ~/projects/olla/ileafu
npx eslint src/components/PaymentInProgressBanner.js src/components/AppNavigation/AppNavigation.js src/screens/Buyer/Orders/ScreenPayToBoard.js
npm test 2>&1 | tail -20

# Page build
cd ~/projects/olla/venmo-ileafu-payment-page/src
npm run client-build
```

### Manual end-to-end validation

1. New order in the app with `OLLATEST` applied → the amount shown is $1.00 and the order's `finalTotal` is 1.
2. Pay via Venmo → Face ID → approval.
3. The app returns to Orders **within a second** of the approval, with the "Payment in progress" banner.
4. The order is still in Pay to Board, and the **Pay button is disabled** (Task 10).
5. Within ~5 seconds the order moves to **Ready to Fly**, the banner is replaced by the "Payment confirmed" push (Android), and the seller email arrives.
6. `firebase functions:log --only capturePaypalOrder` shows the capture, the completion, and the seller notification — all in one run.

### Regression guard

The in-app/vaulted flow must be unaffected. After Task 3, re-run the full suite and confirm the pass/fail counts are unchanged apart from the new tests, and manually complete one vaulted payment to confirm it still marks the order paid in one call.

---

## Risks, tradeoffs, and open questions

### Risks

| risk | mitigation |
|---|---|
| `processPaymentCompletion` is now called from two places (capture + webhook) → it could run twice for one payment | It is idempotent for the order update (it filters `status != 'Ready to Fly'`), but the **seller email would be sent twice**. Before shipping Task 3, check the seller-notification code for a guard, and add one if missing (e.g. skip when the order is already `Ready to Fly`). **This is the highest-risk item in the plan.** |
| Reusing the stored `paypalOrderId` returns a stub `{ id, status }` instead of the full PayPal order | The page only reads `.id`; verified at `venmo-ileafu-payment-page/src/App.jsx:256`. Documented in Task 5. |
| The page change (Task 8) depends on the PayPal SDK accepting a `null` return from `createOrder` | The task includes an explicit "verify the SDK contract" step and an alternative (hide the buttons when resuming). Must be checked before shipping. |
| FCM "payment confirmed" will not reach iOS | `i-leaf-u` has no valid APNs credential ("Invalid APNs credential" ×144 in the push logs). Android only for now; iOS needs an APNs `.p8` uploaded to Firebase. The in-app banner covers iOS in the meantime. |
| `createPaypalOrder` currently returns **200** (not 400) on an amount mismatch, and creates a PayPal order *before* validating | Pre-existing; not fixed by this plan. It is the source of the orphan PayPal orders. Worth a follow-up task. |
| Two stale discount copies (`GROWFOLDS`, `THE1PLANTNINJA`) where Supabase and Firestore disagree | Not touched by this plan. |

### Tradeoffs

- **Making the capture authoritative** means the order is marked paid a few seconds earlier than before, and the webhook becomes redundant in the normal path. That is the point — the webhook's 30-minute latency is the bug.
- **Reusing the PayPal order** means a buyer who genuinely abandons one attempt and starts a new one keeps the first (unapproved) PayPal order. That is harmless: an unapproved PayPal order expires and no money moves. The alternative (always create a new one) is what caused the orphaned paid order.
- **The "payment in progress" state** adds a visible intermediate step. It removes the double-pay risk, at the cost of a slightly longer wait for the order to move tabs.

### Open questions — these need answers before Task 9 / 10 / 11

1. **"Payment in progress" — banner, local notification, or FCM push?** The plan assumes an **in-app banner** (no new dependency; the app has no local-notification library — no `notifee`) plus an **FCM push** for "payment confirmed". Confirm, or say if you want a local notification instead (that needs a new dependency).
2. **How is "payment in progress" represented in the data?** Options:
   - (a) a new order status (e.g. `payment_processing`) — needs a backend change to `checkout` + the Orders filters (`status: 'pending_payment'` in `getBuyerOrdersGrouped.js` / `ScreenPayToBoard.js:119`) and a new tab or a filtered tab;
   - (b) no new status — the order stays `pending_payment` and the **Pay button is disabled** while a local flag says a payment is in flight. Simple, but the flag is lost if the app is killed, and the Pay to Board card still says "Pay $1.00".
   The plan assumes **(b)** for Task 10's button-disable, and defers (a) until you decide.
3. **Does the "payment confirmed" notification go to the buyer only, or the seller as well?** The seller already gets an email; the buyer currently gets nothing.
4. **`TXN1792514839543106`** — never paid, no money taken. Delete it (like the four earlier failed orders) or leave it as `pending_payment` so the buyer can retry?
5. **Should the "payment in progress" flow also apply to the in-app/vaulted path?** Today the vaulted path completes in a single call, so there is no in-between state and the buyer never needs the banner. Assumed **no**.

---

## Notes / constraints

- **Do not run `gradlew clean` before an Android build** — it deletes every library's New-Arch codegen. Recovery: `./gradlew generateCodegenArtifactsFromSchema`. (Documented in the app README as of commit `3948f04c`.)
- **The app repo is `dfegarido/uleaf_rn.git`**, not `ileafu`. The page repo is `dfegarido/ileafu_payment.git`; `upstream` (`ryanquin/venmo-ileafu-payment-page`) is read-only.
- **The backend has a hardcoded `PAYPAL_CLIENT_SECRET`** at `paypalVenmoPayment.js:40` in a tracked file. It should be rotated and moved to Firebase secrets. Out of scope for this plan, but it is a live finding.
- **Never put credentials in an artifact.** The PayPal client id is public by design and already ships in the browser bundle; the secret must not.
- **Backend tests use Node's built-in runner** (`node --test`), not jest, and the mocks live in `functions/__mocks__/firebaseAdmin.js` with `admin.__resetAllMocks()`.
- **The payment page's `src/dist` is committed** — always rebuild before deploying.
