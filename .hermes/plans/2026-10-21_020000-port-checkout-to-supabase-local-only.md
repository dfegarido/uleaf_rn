# Port the checkout to Supabase — local only, production untouched

**Date:** 2026-10-21
**Repos:** `~/projects/olla/ileafu` (app), `~/projects/olla/ileafu_backend` (backend),
`~/projects/olla/venmo-ileafu-payment-page` (page)
**Supabase project:** `pjcquavlxknhmuszjmyh` (production — **read-only in this plan**)

---

## Goal

Write a **Supabase Edge Function** that implements the checkout, prove it works end to end
against the **sandbox**, and **change nothing in production**.

Explicitly out of scope for this plan:

- ❌ **no deploy** of any Supabase function
- ❌ **no push** of any commit, to any repo
- ❌ **no change** to the production checkout path
- ❌ **no change** to the live payment page (`payment.ileafu.com`)
- ❌ **no write** to the production database

The deliverable is: **a working local checkout + a staged webhook/page pair that points at
the sandbox, and a plan for the eventual production cut-over.**

---

## The safety model — how "production untouched" is guaranteed

The risk is that the checkout port writes to the production database, or that the staging work
reaches production. **Three independent layers**, each verified:

### Layer 1 — a Supabase **database branch** (the hosted staging)

A branch is a **complete, isolated copy** of the project: its own database, its own API keys,
its own edge functions. Created and **verified during the planning**:

| | |
|---|---|
| Branch | `checkout-staging` → project ref **`tihkfikghkgbtvrvwvsv`** |
| Its database | **60 tables, 1 view, 14 functions, 175 indexes** — byte-for-byte the same structure as production |
| Its edge functions | **225**, all ACTIVE, including `payment-completion`, `payment-webhook`, `payment-status` |
| Its API keys | its own `service_role` / `anon` — completely separate from production's |
| Its data | **empty** (a branch is created `with_data: false`) |

The branch's functions are already reachable:
`https://tihkfikghkgbtvrvwvsv.supabase.co/functions/v1/…` — they answered
`401 Invalid token signing key` (correct: no token) and `405 Only GET requests are allowed`
(correct: wrong method) on the first probe, which proves they are live and enforcing auth.

**The production project `pjcquavlxknhmuszjmyh` is not referenced by any staging config.**

### Layer 2 — the local stack (for the fast inner loop)

```
iOS simulator ──> local edge server :8010 ──> local PostgREST :3001 ──> local Postgres :5433
                                              (the same /rest/v1 API)     (an empty sandbox DB)
```

No route from the local stack to the production database either.

### Layer 3 — the preview channel (the hosted page)

The page is deployed to the **preview channel** (a Firebase Hosting channel, separate from
`live`). It is built against the **branch's** API base, so the hosted page calls the branch's
checkout and the branch's sandbox webhook. The live channel and `payment.ileafu.com` are
untouched.

| # | Guard | How it works | How it is verified |
|---|---|---|---|
| **G1** | **A separate database, not a schema** | The local stack points at `sbx_checkout` on **localhost:5433**. PostgREST cannot be pointed at the production project | `psql` to :5433 shows the sandbox DB; no production host appears in any local env |
| **G2** | **A read-only role** | The local PostgREST's anon role has `SELECT` only. Any write the checkout attempts is rejected by Postgres, not by our code | a deliberate `INSERT` returns `permission denied for table orders` |
| **G3** | **A separate env file** | `functions/.env.sandbox` is loaded by a **new** `local-dev-server.sandbox.ts` — a separate file, so the production-shaped server cannot pick up the sandbox env | the server logs which env file it loaded; the port differs (8000 vs 8010) |
| **G4** | **The production functions are never invoked** | The app's `apiConfig.js` is **not edited**. The staged path is reached by a **build-time** env switch (`.env` only) | `git diff` on the app repo shows no `apiConfig.js` change |
| **G5** | **The Firebase tree is untouched** | No Firebase file is edited | `git diff af79ede -- functions/` is empty |
| **G6** | **Nothing is deployed** | No `supabase functions deploy`, no `firebase hosting:channel:deploy` | the deploy commands are not run; the deployed function list is unchanged |

### Why not a schema on the production project?

It was tried first and **fails**: `supabaseFetch` builds `${SB_URL}/rest/v1${path}`, and
PostgREST exposes only the `public` schema. A schema-qualified path returns
**`PGRST125 Invalid path specified in request URL`** — verified against the live project.
A separate Postgres avoids the problem entirely *and* removes the write risk, so the schema
approach was dropped.

> A schema + read-only role on the production project was created and **dropped** during the
> planning probe. The production database was verified unchanged afterwards: 5,681 orders,
> 1,110 cart rows, no payments today.

---

## Current state (verified 2026-10-21)

### The production checkout path (untouched, still working)

```
app  ──POST /checkout──>  Firebase Cloud Function  checkout.js  (1,401 lines)
                                  │
                                  ├── reads  Firestore: buyer, cart, discount,
                                  │          discount_usage, order, supplier
                                  ├── writes Firestore: order (the new order row)
                                  ├── writes Firestore: buyer (shipping defaults)
                                  ├── deletes Firestore: cart (the bought items)
                                  └── deletes Supabase:  cart (the same items)
```

Two facts that shape the port:

- **The checkout does NOT touch stock.** The source says so explicitly: *"Per new flow, we DO
  NOT reserve or decrement stock at checkout time… The payment capture handler will perform
  an atomic availability check and decrement when payment is finalized."* So the port does
  **not** need `decrement_listing_stock` — the existing `payment-completion` already does that.
- **The order row is born in Firestore** and reaches the Supabase `orders` table only through
  the `syncOrderToSupabase` Firestore trigger. The port must write the row to Supabase
  directly — that is the whole point — and the trigger must not double-write.

### The request contract (from the app)

`checkoutApi(checkoutData)` posts:
`{ productData[], useCart, cargoDate, deliveryDetails, orderSummary{…}, discountId?,
discountCode? }` and expects
`{ success, data: { transactionNumber, … } }`.

`checkoutJoinerApi` and `checkoutShippingJoinerApi` have their own contracts.

### The page and the webhook

- The **live** page (`payment.ileafu.com`) calls the Firebase `createPaypalOrder` /
  `capturePaypalOrder`. Untouched.
- The **preview** channel (`i-leaf-u--supabase-payment-e4rvymck.web.app`, expires 2026-11-20)
  serves a **sandbox** build that calls the **deployed** Supabase `payment-completion` /
  `payment-status`.
- The deployed Supabase payment functions are currently on `PAYPAL_ENVIRONMENT=sandbox`.

**The gap this plan closes:** the preview page is already sandbox-connected, but the checkout
that *creates* the order it pays for still runs on Firebase. So today a preview-channel
payment completes an order that Firebase created — a cross-system order row.

### The existing local harness

- `supabase/local-dev-server.ts` — routes `/functions/v1/<name>` to
  `supabase/functions/<name>/index.ts`, loads `functions/.env.local`, binds `0.0.0.0:8000`.
- All 225 edge functions use the same shape: `export default { async fetch(req) {...} }`.
- The app can already be pointed at the local server with `USE_LOCAL_SUPABASE=true` +
  `LOCAL_SUPABASE_URL=http://<LAN IP>:8000/functions/v1` in `.env` (Metro restart needed —
  it caches `.env`).
- The Supabase CLI's **local Postgres is unavailable** (no Docker on this machine), so "local"
  means *a local server against a sandbox schema*, not an in-memory database.

---

## Proposed approach

### 1. The local stack (PROVEN working during planning)

| Piece | What | Where |
|---|---|---|
| Postgres 16.14 | already installed (Homebrew) | `initdb -D ~/.hermes/cache/scratch/sbx_pg` on **:5433** |
| PostgREST 16.5 | installed during the planning | `brew install postgrest`, on **:3001** |
| The edge server | a copy of `local-dev-server.ts` | `supabase/local-dev-server.sandbox.ts`, on **:8010** |

**Verified during planning:**

```
$ initdb -D ~/.hermes/cache/scratch/sbx_pg -U sbx --auth=trust     # ok
$ pg_ctl -D … -o "-p 5433" start                                     # accepting connections
$ psql -p 5433 -d postgres -c "create database sbx_checkout owner sbx;"   # CREATE DATABASE
$ postgrest /tmp/sbx_postgrest.conf                                 # API server listening on 0.0.0.0:3001
$ curl "http://127.0.0.1:3001/listing?select=*&limit=2"
[{"id":"SBX-TEST-L1","plantcode":"SBXPLANT1","availableqty":"1",…}]  -> HTTP 200
```

**The decisive property:** PostgREST serves the **identical `/rest/v1/...` API** that
`supabaseFetch` uses in production. So the ported checkout calls the **same helper, with the
same code** — the only difference is which host `SB_URL` points at. That is the minimum
possible divergence between the sandbox and production.

### 2. The sandbox schema and the fixtures

The sandbox database gets the tables the checkout reads/writes, **generated from the
production schema** so they cannot drift:

```sql
-- generated from information_schema against public, then rewritten to the sandbox DB
-- orders, cart, buyer, supplier, discount, discount_usage, listing, variation,
-- listing_buyer_view (a VIEW - its definition is a plain SELECT, so it ports as-is)
```

`listing_buyer_view` was confirmed to be a **VIEW** whose definition is a plain `SELECT`
over the base tables — it ports without rewriting.

The fixtures are **small and obviously fake** (`SBX-TEST-*`): one buyer, one cart with two
items, two listings (one single plant, one grower), one discount, one supplier. A clone of
production data is neither needed nor wanted.

A re-runnable seed script (`sql/sbx_seed.sql`) so the fixtures can be reset between runs.

### 3. A read-only role for the local PostgREST

```sql
create role sbx_readonly nologin;
grant usage on schema public to sbx_readonly;
grant select on all tables in schema public to sbx_readonly;
-- no insert/update/delete: a write attempt fails with permission denied
```

`db-anon-role = "sbx_readonly"` in the PostgREST config. **G2's verification:** a deliberate
`POST /listing` through PostgREST must return `permission denied for table listing`.

> The test suite and the manual sandbox run need to write, so they use a **second**
> credential (the `sbx` owner role) that the running app never has.

### 4. A second local server on its own port

`supabase/local-dev-server.sandbox.ts` — a copy of the existing dev server that:
- loads `functions/.env.sandbox` (not `.env.local`),
- sets `SB_URL` → `http://127.0.0.1:3001` and `SB_SERVICE_ROLE_KEY` → the read-only key,
- sets `PAYPAL_ENVIRONMENT=sandbox` + the sandbox PayPal credentials,
- binds `0.0.0.0:8010`.

A separate file, not a flag on the existing one, so the production-shaped server cannot
accidentally pick up the sandbox env.

### 5. The ported checkout

`supabase/functions/checkout/index.ts` (new, local only — never deployed in this plan):

| Firebase behaviour | Supabase port |
|---|---|
| read `buyer` | `supabaseFetch('/buyer?…')` |
| read `cart` | `supabaseFetch('/cart?…')` |
| read `discount`, `discount_usage` | `supabaseFetch('/discount…')`, `supabaseFetch('/discount_usage…')` |
| read `supplier` | `supabaseFetch('/supplier?…')` |
| read `listing` + variations | `supabaseFetch('/listing_buyer_view…')`, `/variation` |
| write the order row | `supabaseFetch('/orders', { method: 'POST' })` |
| write the buyer's shipping defaults | `supabaseFetch('/buyer?id=eq.…', { method: 'PATCH' })` |
| delete the bought cart items | `supabaseFetch('/cart?id=in.(…)', { method: 'DELETE' })` |
| the discount-usage reservation | `supabaseFetch('/discount_usage…', { method: 'POST' })` |
| the idempotency check | `supabaseFetch('/orders?select=id&status=eq.pending_payment&transactionnumber=eq.…')` |

**Every call is the existing `supabaseFetch` helper with the existing table names.** The
port is a *behaviour* port, not a *namespace* port — the schema is the production `public`
schema, and only the **host** differs (local PostgREST vs the hosted one). That means the
cut-over is: change `SB_URL` from local to production. No code change, no table-name change.

Reuse the existing `_shared/` helpers rather than re-deriving the rules:
`_shared/listing.ts` (price conversion, single-plant expiry), `_shared/orders.ts` (flight
dates, cutoff), `_shared/discountUsage.ts` (discount usage counting),
`_shared/cart.ts`, `_shared/taxonomy.ts`, `_shared/response.ts`, `_shared/supabase.ts`.

The port uses the **production table names** (`public.orders`, `public.cart`, …) from the
start — only the **host** differs. So the production cut-over is a change of `SB_URL` from
the local PostgREST to the hosted one, with **no code change**. That cut-over is deliberately
**not** part of this plan.

### 6. The staged webhook + page

The user asked for a **separate staging webhook connected to the sandbox** and a **preview
page**. Both already partly exist; the plan wires them into one coherent staging path:

```
iOS simulator (app, USE_LOCAL_SUPABASE=true, LOCAL_SUPABASE_URL=http://<LAN>:8010)
   │
   ├─ POST /checkout ────────────> LOCAL sandbox server :8010
   │                                 └─> the sandbox DB's orders table  (a row is born HERE)
   │
   └─ opens the payment page ────> preview channel (sandbox build)
                                     └─> PAYPAL_API_BASE = the LOCAL sandbox server
                                          └─> payment-completion (local, sandbox PayPal)
                                               └─> capture → the sandbox order row updated
```

Concretely:

| Piece | Change | Where |
|---|---|---|
| **Page** | `PAYPAL_API_BASE=http://<LAN IP>:8010/functions/v1` + the sandbox client id | a **new** build served locally on `:5303`. The **deployed** preview channel is **not** re-deployed in this plan unless the user asks |
| **Webhook** | a **new** `supabase/functions/payment-webhook.sandbox/index.ts` that runs locally on :8010 against the sandbox DB | local only |
| **PayPal** | the local functions run with `PAYPAL_ENVIRONMENT=sandbox` + the sandbox client id/secret | `functions/.env.sandbox` |
| **Firebase** | **untouched** — the production checkout keeps running | — |

**The staging webhook must be a *separate* function from the production one.** The production
`payment-webhook` is deployed and points at the production `orders` table. The staging one is
a **local file** that points at the local stack. Two files, two environments, no shared
state — and the deployed production webhook is not redeployed.

**The staging webhook reuses `_shared/paymentCompletion.ts`** — the same rules module the
production webhook uses — so the two cannot drift in behaviour, only in target.

### 5b. The page, staged locally

The page's `PAYPAL_API_BASE` is baked in at **build** time by Vite. So the staged page is a
**separate build** with the sandbox env, served on a free port. The already-deployed preview
channel is left exactly as it is — it is the *other* half of the staging pair (it proves the
sandbox page + the deployed Supabase payment functions work), and it is not touched.

### 7. How the app is pointed at the staging path without editing source

`apiConfig.js` reads `USE_LOCAL_SUPABASE` + `LOCAL_SUPABASE_URL` from `.env` at **build**
time (Metro). So:

- `.env` → `USE_LOCAL_SUPABASE=true`, `LOCAL_SUPABASE_URL=http://192.168.1.12:8010/functions/v1`
- `config.js` → the payment page URL. **This one is a source file and IS tracked.** To avoid
  touching it, the staged page URL is injected by a **Metro/`.env` read** — if `config.js`
  cannot read `.env`, an alternative is a small untracked `config.local.js` that
  `config.js` imports. That is a **tracked** change to `config.js` (one line), which must be
  flagged to the user, or the change is done by editing `config.js` locally and **not
  committing** it (it is already dirty in the working tree from the preview-channel work).

> Decision needed: is a one-line tracked change to `config.js` acceptable, or must the staged
> page URL be injected without touching any tracked file? See Open questions.

---

## Proven locally (during the planning, 2026-10-21)

The isolation stack was **built and verified** while writing this plan, so the plan starts
from a working baseline rather than a hypothesis:

| Check | Result |
|---|---|
| `initdb` a dedicated cluster on :5433 | ✅ `initdb ok` |
| `pg_ctl start` | ✅ `127.0.0.1:5433 - accepting connections` |
| `create database sbx_checkout owner sbx` | ✅ `CREATE DATABASE` |
| `postgrest` (installed via Homebrew, 16.5) | ✅ `API server listening on 0.0.0.0:3001` |
| `GET /listing?select=*&limit=2` through PostgREST | ✅ HTTP 200, the fixture row |
| the **same** `/rest/v1/...` shape the production functions use | ✅ identical — `supabaseFetch` is reused unchanged |
| a schema-qualified path on the **production** project | ❌ `PGRST125 Invalid path` — so the schema approach was dropped |
| the production database after the probe | ✅ unchanged: 5,681 orders, 1,110 cart rows, newest `paidat` Dec 5 2025. The probe schema and role were **dropped** |

**The local stack is currently running** (Postgres :5433, PostgREST :3001) with a
`sbx_checkout` database and two fixture rows. It is scratch state in
`~/.hermes/cache/scratch/sbx_pg`, not in any repo.

---

## Step-by-step plan

### Step 1 — the local stack (already proven; formalise it)

1. A script `scripts/sbx_stack.sh` that: `initdb`s the cluster (if absent), starts it on
   :5433, creates the `sbx_checkout` database + the read-only role, starts PostgREST on :3001,
   and writes the PostgREST config. `stop` / `restart` / `status` subcommands.
2. Generate the sandbox DDL **from the production schema** (`information_schema` against
   `public`) so it cannot drift — written to `sql/sbx_schema.sql` for review.
3. `sql/sbx_seed.sql` — the fixtures, re-runnable, with `SBX-TEST-*` identifiers.
4. **Verify:** the fixture rows are visible in the sandbox DB and the production row counts
   are unchanged.

### Step 2 — the read-only role (the guard)

1. `create role sbx_readonly nologin;` with `select` only.
2. `db-anon-role = "sbx_readonly"` in the PostgREST config.
3. **Verify (the guard test):** a deliberate `POST /listing` through PostgREST must fail with
   `permission denied for table listing`, while `GET /listing` works. This is the test that
   proves the app-under-test cannot write.

### Step 3 — the sandbox local server

1. `supabase/local-dev-server.sandbox.ts` — a copy of the dev server that loads
   `functions/.env.sandbox` and binds `:8010`.
2. `functions/.env.sandbox` — `SB_URL=http://127.0.0.1:3001`, `SB_SERVICE_ROLE_KEY=` (the
   read-only key), `PAYPAL_ENVIRONMENT=sandbox`, the sandbox PayPal client id/secret,
   `FIREBASE_PROJECT_ID`, `SUPABASE_JWT_SECRET` (for the storage JWT).
3. **Verify:** `curl localhost:8010/functions/v1/checkout` answers, and the log shows the
   sandbox env file was loaded.

### Step 4 — port the checkout

1. `supabase/functions/checkout/index.ts` — the port. Work through the Firebase function in
   order, and keep the **response shape** byte-identical.
2. Extract the shared rules into `_shared/checkout.ts` as the port proceeds (the discount
   rules, the flight-cycle rules, the price conversion) so the joiner port can reuse them.
3. **Test-first for the rules**: a Deno suite `t11-checkout.test.ts` pinning the discount
   stacking, `limitPerCustomer` / `limitTotal`, the single-plant expiry, the flight-date
   normalisation, the credit application and the idempotency check — each rule compared
   against the Firebase implementation's behaviour.
4. **Verify:** `deno test supabase/functions/` — the existing 364 must stay green.

### Step 5 — the staging webhook and the staged page

1. `supabase/functions/payment-webhook.sandbox/index.ts` — the staging webhook, pointing at
   the local PostgREST, with its own idempotency guard.
2. The page: a **new** build with `PAYPAL_API_BASE=http://<LAN IP>:8010/functions/v1` and the
   sandbox client id. Served locally on a free port (e.g. `:5303`) so the **deployed preview
   channel is not re-deployed**.
3. **Verify:** the staging webhook answers `alreadyPaid: true` on a replayed capture, and the
   staged page's pre-check reaches the local server.

### Step 6 — the end-to-end run in the simulator

1. The app points at the local sandbox server (`.env` only — no tracked change):
   `USE_LOCAL_SUPABASE=true`, `LOCAL_SUPABASE_URL=http://192.168.1.12:8010/functions/v1`.
2. Buy a listing → the order row appears in the **sandbox** database's `orders` table with
   `status='pending_payment'`.
3. Pay to Board → the sheet opens the **staged** page → approve → the capture completes →
   the sandbox database's `orders` row becomes `Ready to Fly`.
4. The staging webhook is exercised with the same capture event → `alreadyPaid: true`
   (idempotent — no double decrement, no duplicate seller email).
5. **The production database is checked after the run:** the `orders` / `cart` row counts and
   the newest `paidat` are unchanged from before the run. This is the proof that the guard
   held.
6. **The production app is checked**: the app's `apiConfig.js` still points `CHECKOUT` at
   Firebase, so the production checkout is demonstrably still the one in production.

### Step 7 — the production cut-over plan (written, not executed)

A written, reviewed cut-over document — the *plan* for going live, to be executed only after
this plan is approved and the E2E is green:

1. Change `SB_URL` from the local PostgREST (`http://127.0.0.1:3001`) to the hosted one
   (`https://pjcquavlxknhmuszjmyh.supabase.co/rest/v1`) — **no code change**, because the
   ported functions use the production table names.
2. Deploy the checkout functions.
3. Flip the app's `CHECKOUT` endpoint to the Supabase base (one line in `apiConfig.js`).
4. Verify in production with a **real** order, then promote the page channel and switch
   `PAYPAL_ENVIRONMENT=live` in the same change.
5. Delete the Firebase `checkout` / `checkoutJoiner` / `calculateCheckoutShippingJoiner`
   functions **and** the `syncOrderToSupabase` trigger.
6. Rotate the hardcoded `PAYPAL_CLIENT_SECRET` in `paypalVenmoPayment.js` before that
   function is deleted.

---

## Files likely to change

**New (all untracked, all local-only)**
- `ileafu_backend/supabase/functions/checkout/index.ts`
- `ileafu_backend/supabase/functions/payment-webhook.sandbox/index.ts`
- `ileafu_backend/supabase/functions/_shared/checkout.ts`
- `ileafu_backend/supabase/functions/t11-checkout.test.ts`
- `ileafu_backend/supabase/local-dev-server.sandbox.ts`
- `ileafu_backend/functions/.env.sandbox` (gitignored — `functions/.gitignore` has `.env*`)
- `ileafu_backend/sql/sbx_schema.sql` (the DDL, generated from the production schema)
- `ileafu_backend/sql/sbx_seed.sql` (the fixtures)
- `ileafu_backend/scripts/sbx_stack.sh` (start/stop/status for the local stack)
- `ileafu_backend/scripts/sbx_postgrest.conf` (the PostgREST config)

**Modified (tracked — needs the user's agreement)**
- `ileafu/config.js` — the payment page URL for the staged run, **or** a one-line change to
  read it from `.env` instead (see Open questions).
- `ileafu_backend/supabase/config.toml` — only if a new function needs a `verify_jwt = false`
  entry. The staging functions are **not** deployed, so this is not needed yet.

**Explicitly NOT changed**
- `ileafu/src/config/apiConfig.js` — the production `CHECKOUT` URL stays on Firebase.
- `ileafu_backend/functions/**` — every Firebase file, byte-identical.
- The deployed Supabase functions — no `supabase functions deploy`.
- The deployed preview channel — no `firebase hosting:channel:deploy` unless asked.
- Any git commit or push.

---

## Tests / validation

**The guard tests (run first, before any code)**
| Test | Passes when |
|---|---|
| G1 | `SB_URL` in `functions/.env.sandbox` points at `127.0.0.1:3001` and at **no** production host |
| G2 | a write through PostgREST fails with `permission denied for table …`, while a read works |
| G3 | the sandbox server logs that it loaded `.env.sandbox`, and it is listening on :8010 |
| G4 | `git diff` on `ileafu` shows no `apiConfig.js` change |
| G5 | `git diff af79ede -- functions/` in `ileafu_backend` is **empty** — the Firebase tree is untouched |
| G6 | the production `orders` / `cart` row counts and the newest `paidat` are unchanged after the whole E2E |
| G7 | `git status` shows **no** new commit and the remotes are untouched (`git log origin/main..HEAD` is empty) |

**The port's tests**
- `t11-checkout.test.ts` — the rules, pinned against the Firebase behaviour.
- A parity harness: the same request sent to the **Firebase** function and the **ported**
  function, with the responses diffed. (The Firebase function is called read-only — a
  request that would write is not used for the diff, or is run against a throwaway buyer.)

**The end-to-end gate (iOS simulator)**
1. Buy → the order row is in the sandbox database's `orders` table.
2. Pay → approve → `Ready to Fly`, the capture recorded.
3. The webhook replay → `alreadyPaid: true`.
4. The production database is unchanged (G6).

---

## Risks and tradeoffs

| Risk | Severity | Mitigation |
|---|---|---|
| The local checkout writes to the production database | **critical** | **there is no route to it**: the local stack talks to localhost:5433. G1 verifies no production host is in the local env. G2 is the second line of defence |
| The port changes the checkout's behaviour and a real buyer hits it | **high** | the port is never deployed in this plan; production keeps the Firebase function until the cut-over is separately approved |
| The Firestore→Supabase trigger double-writes | **high** | the trigger is untouched in this plan (it only fires on Firestore writes, and the port writes to Supabase directly) — it is removed in the cut-over plan, not here |
| The staged page needs a URL that is not in a tracked file | medium | the `config.js` question below; the default is a local-only edit that is **not committed** |
| The ported checkout diverges from the Firebase one in a rule nobody noticed | medium | the rule-by-rule test suite + the parity harness; every rule the Firebase function applies must have a pinned test |
| The sandbox schema drifts from the production schema | medium | the DDL is **generated** from `information_schema` against `public`, not hand-written; a script regenerates it |
| The local Postgres/PostgREST are not running when the test needs them | low | `scripts/sbx_stack.sh` has `start`/`stop`/`status`; the stack is started as part of the test run |
| The staging webhook duplicates the production webhook's logic and the two diverge | medium | the staging webhook reuses the **same** `_shared/paymentCompletion.ts`; only the target differs |
| A local `git commit` slips in | low | G7: `git log origin/main..HEAD` must stay empty. Nothing is pushed either way — the user asked for no commits and no pushes |

---

## Open questions

1. **How should the app reach the staged payment page without a tracked change?**
   `config.js` is tracked and currently holds the preview-channel URL. Options:
   (a) edit it locally and **do not commit** it — the file is already dirty;
   (b) add a one-line tracked change so `config.js` reads the page URL from `.env`
   (like `apiConfig.js` already does) — cleaner long term, but it is a tracked change now;
   (c) point the app at the **deployed** preview channel (already sandbox) and let the
   page call the local server through the LAN IP — no `config.js` change at all, but the
   page's `PAYPAL_API_BASE` is baked into the deployed build, so the local server must be
   reachable from the public internet (it is not). **Recommendation: (a) for this run.**
2. ~~Should the sandbox schema live on the production project?~~ **Resolved: no.** A schema on
   the production project is not reachable through `supabaseFetch` (PostgREST returns
   `PGRST125 Invalid path`), and it would put production data within reach. The plan uses a
   **local Postgres + local PostgREST** instead — proven working, and strictly safer.
   *PostgREST 16.5 was installed via Homebrew during the planning; the local Postgres 16.14
   was already present.*
3. **Should the staging webhook be a separate function file, or the same function with a
   different env?** Separate file — so the production one cannot be pointed at the sandbox by
   accident. The plan assumes separate.
4. **Do the joiner checkout (`checkoutJoiner`, 1,269 lines) and
   `calculateCheckoutShippingJoiner` (589 lines) go in this plan too?** The plan covers
   `checkout` first; the other two are the natural follow-up in the same schema.
   Recommendation: port `checkout` first, prove the E2E, then the other two.
5. **Should the sandbox fixtures be created by a script or by hand?** A script
   (`sql/sbx_checkout_seed.sql`) that is idempotent and re-runnable is better — it can be
   reset between test runs.

---

## Change log

- **2026-10-21** — initial plan for the checkout port: local only, no deploy, no push,
  production untouched. Verified the checkout's real write set (Firestore `order`/`buyer`/
  `cart`, Supabase `cart` delete), that it does **not** touch stock, the app's request
  contract, and the local dev-server harness.
- **2026-10-21** — **isolation strategy reworked after proving the first approach fails.**
  The plan originally used a `sbx_checkout` **schema on the production project** with a
  read-only role. Probing showed PostgREST returns `PGRST125 Invalid path` for a
  schema-qualified path, so `supabaseFetch` could not reach it — and a schema on the
  production project would have put production data within reach of the test.
  **Replaced with a fully local stack: Postgres 16.14 on :5433 + PostgREST 16.5 on :3001**,
  which was built and verified during the planning. It serves the *identical* `/rest/v1`
  API, so the ported checkout reuses `supabaseFetch` unchanged, and there is **no route from
  the test to the production database at all**. The probe schema and role were dropped and
  the production database verified unchanged.
