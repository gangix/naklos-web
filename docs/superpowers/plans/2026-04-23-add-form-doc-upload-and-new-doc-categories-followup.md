# Followup — backend sync for new document categories

## Why this exists

Phase B of the 2026-04-23 plan added five new uploadable document categories:
- `tachograph` (Takograf Kalibrasyonu) — truck
- `k-certificate` (K Yetki Belgesi) — truck
- `adr-vehicle` (ADR – Araç) — truck
- `adr-driver` (ADR – Sürücü) — driver
- `psychotechnical` (Psikoteknik Belgesi) — driver

Documents persist correctly in `fleet.truck_documents` / `fleet.driver_documents` — `document_type` is a free-form `VARCHAR(50)` column, no enum constraint, so uploads land without any backend change.

However, the Truck/Driver entity's **denormalized `*_expiry` columns** are only populated for the original three truck categories (`compulsory_insurance_expiry`, `comprehensive_insurance_expiry`, `inspection_expiry`) and the driver's `license_expiry_date`. The logic lives at `application/src/main/java/com/naklos/application/service/TruckDocumentService.java:195-224` — a `switch` on `documentType` that falls through to a `log.debug(...)` for everything else.

**Consequence:** The **Dashboard summary warnings** computed in `src/utils/truckWarnings.ts` and `driverWarnings.ts` read the denormalized columns directly. They do NOT surface expiring tachograph / K / ADR / psikoteknik documents. The **detail-page tiles** (which read the documents list via `getDocuments` on demand) DO surface them, so managers still see the warning once they open a truck/driver. But the at-a-glance rollup is incomplete.

The same is true on the frontend: `Truck` / `Driver` interfaces in `src/types/index.ts` don't carry expiry fields for the new categories; the tiles pass `date={null}` to `ExpiryBadge` which renders a neutral "not specified" pill.

## Scope of the followup

### Option 1 — Backend sync (recommended)

**Backend (`naklos` repo):**
- `fleet.trucks` → add three nullable `DATE` columns: `tachograph_expiry`, `k_certificate_expiry`, `adr_vehicle_expiry`.
- `fleet.drivers` → add two nullable `DATE` columns: `adr_expiry`, `psychotechnical_expiry`.
- Extend `TruckDocumentService.updateTruckExpiryDate` switch with the three new truck cases.
- Add a corresponding `updateDriverExpiryDate` method (currently the driver service only syncs `license_expiry`) handling `adr-driver` and `psychotechnical`.
- Expose the new columns in `TruckDto` / `DriverDto`.
- Flyway/Liquibase migrations for both tables.

**Frontend (`naklos-web` repo):**
- Extend `Truck` and `Driver` interfaces in `src/types/index.ts` with the new nullable expiry fields.
- Pass the real expiry to `date={...}` in each new tile (TruckDetailPage.tsx + DriverDetailPage.tsx).
- Extend the `handleDocumentSave` switch in `TruckDetailPage.tsx:200-219` with the three new cases — otherwise the modal's save call won't update the denormalized field post-upload. (The early-return guard added in commit `66054d9` is a placeholder for this.)
- Extend `computeTruckWarnings` / `computeDriverWarnings` with the new warning branches + i18n `warning.*Missing|Expired|Expiring` keys in TR/EN/DE.

Estimated effort: ~1 dev-day backend + ~0.5 day frontend.

### Option 2 — Frontend-only aggregation (rejected)

Fetch all documents alongside the truck/driver list pages and max-expiry on the client. Too chatty without a batch endpoint and doubles payload size for pages with many rows. Rejected.

## Decision

TBD — Option 1 preferred. Raise as a separate branch + spec when prioritized.

## Additional cleanup candidates (lower priority)

These surfaced during Phase B reviews and are worth capturing, but not part of the sync followup:

1. **Extract a `<DocTile>` component.** `TruckDetailPage.tsx` and `DriverDetailPage.tsx` now contain 10+ near-identical doc tiles (6 on truck, 3 on driver including the existing license + 2 new, plus the cert cards with a slightly different shape). A small `<DocTile title={...} category={...} date={...} onManage={...} />` helper would delete ~100 lines of duplicated JSX and make future tile additions trivial.

2. **i18n deduplication.** Each new doc now has a translation string in three places:
   - `categoryLabel.<key>` (used by the two doc modals)
   - `doc.<key>` (used by upload history rows on truck/driver pages)
   - `truck.<key>` or `driver.<key>` (used by the tile title on each detail page)
   All three contain the same literal string per locale. A single source (e.g., reuse `categoryLabel.*` everywhere) would halve the translation surface and eliminate a class of drift bugs. Requires updating every `t()` call site and removing the duplicates from `doc` / `truck` / `driver` blocks — a mechanical but cross-cutting change.

3. **`handleDocumentSave` divergence.** `TruckDetailPage.tsx:200-219` uses an if/else-if switch on category strings. `DriverDetailPage.tsx:154-166` uses a single guard-return for license. If/when a `<DocTile>` extraction lands, this handler can be simplified to `if (syncCategory(category, expiryDate)) await updateXxx(...)` with the mapping lifted into a shared util.

4. **`ExpiryBadge label=""` smell.** Every tile passes `label=""` because the `<h2>`/`<h3>` above already carries the title, producing an empty `<p>` in the DOM. Harmless but visible in dev tools. If `ExpiryBadge` is revisited during the `<DocTile>` extraction, `label` should become optional with a cleaner null path.

## Known limitation during the deferral window

Managers uploading tachograph / K-cert / ADR / psikoteknik documents get:
- ✅ The file persists correctly
- ✅ The document appears in the per-entity documents list
- ✅ The detail-page tile becomes the entry point to manage it
- ❌ The tile's expiry pill stays "not specified" until Option 1 lands
- ❌ The Dashboard rollup doesn't count these as expiring/expired

Communicate to pilot users: these 5 document types are "tracked, viewable, searchable — warnings coming in a follow-up release."
