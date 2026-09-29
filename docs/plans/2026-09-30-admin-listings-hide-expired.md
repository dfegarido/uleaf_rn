# Hide expired listings from the Admin Listings Viewer

Date: 2026-09-30
Status: DONE — backend fix, API + device verified with control

## Request

> also on admin listing viewer, it should not appear if it expired

## Root cause

`admin-listings/index.ts` excluded only `Draft` / `Inactive` (`EXCLUDED_STATUSES`).
Listings whose `expirationdate` had passed — or which carried a stored `Expired`
status — were still returned to the admin viewer.

Measured on prod data:

| | count |
|---|---|
| rows behind the default view (`status not in Draft,Inactive`) | 11,930 |
| … already past their expiry date | 11,190 |
| … carrying `status = 'Expired'` | 8,513 |
| **genuinely live rows** | **737** |

So ~94% of the default view was expired inventory. The rows surface on the deep
pages (the view is newest-first): `sort=oldest` page 1 was 36 expired of 50.

Two expiry definitions exist and must not diverge:

1. stored `status = 'Expired'`
2. a **Single Plant** whose `publishdate + 15 days` (seller-local timezone) has
   passed — `shouldTreatSinglePlantAsExpired()` in `_shared/listing.ts`

Grower's Choice / Wholesale are **exempt from date expiry by design** (verified:
0 of 273 carry an `expirationdate`).

## Fix (backend only, `supabase/functions/admin-listings/index.ts`)

Two layers, both skipped when the admin explicitly asks for `Status → Expired`:

1. **DB pre-filter** — `status=neq.Expired` plus an `or=(...)` that keeps
   non-single-plant, null-expiry, and future-expiry rows. Coarse only.
2. **In-memory pass** — the authoritative `shouldTreatSinglePlantAsExpired()`
   from `_shared/listing.ts`, the same single source of truth the seller-facing
   `sync-seller-expired-listings` uses.

Both layers also skip when an explicit **garden** filter is active: that view is
documented to span every status so admins can audit one seller's full history.

## Why the DB layer cannot wrongly drop a row

`expirationdate` is a **TEXT** column holding ISO instants in two shapes
(`…17:00:00.000Z` and `…17:00:00Z`), so a raw lexicographic compare is unsafe at
second boundaries. The clause is safe anyway because the stored instant always
lands after the local-timezone day boundary that `shouldTreatSinglePlantAsExpired`
tests — verified directly: of 12,202 non-null values, 0 rows disagree between the
text compare and a `::timestamptz` cast, and the in-memory pass reports
**0 false drops** across all 737 kept rows.

## Verification

Control run — old code restored, dev server restarted, app relaunched:

| check | pre-fix | post-fix |
|---|---|---|
| default view (`sort=oldest`) page 1 first row | `AVHOY080001` (Active, expired 2025-09-02) | `AVHOY080002` (Grower's Choice, correctly kept) |
| default view page 1 expired rows | 36 | 0 |
| default view page 10 (`sort=latest`) expired | 8 | 0 |
| default view page 20 | 50 (all `Expired`) | 0 rows |
| default view total | 11,930 | 737 |
| `Status → Expired` | 504 listings / 11 pages | 504 / 11 (unchanged) |
| `Status → Active` | — | 394 |
| garden view (`Drunk Growers`) | 5,376 | 5,376 (exemption intact) |

Device: Android `NX666J`, `com.ileafu`, dev API `:8000`. Expired rows absent from
the default view; the `Expired` filter still returns 504 listings.

Suites: `deno check` clean; `scripts/expiry-parity.ts` PASS (737 kept, 0 false
drops, 25/25 stored-Expired caught). Existing deno suites pass except
`search-user-cohort.test.ts`, which fails identically on pristine HEAD (pre-existing).

## Out of scope (reported, not changed)

- Default view shows `50 total listings` because that path uses server-side
  `limit=50`, so `totalItems` equals the page size. Pre-existing; unrelated.
- `getAdminListingsApi.js` has its own client-side Draft/Inactive exclusion that
  is now redundant but harmless (and excludes a different set).
