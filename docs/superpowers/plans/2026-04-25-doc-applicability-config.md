# Document Applicability Configuration — Plan (deferred execution)

> **Status:** Spec written; execution deferred until after the maintenance editor (Step 2) ships and is validated. Revise this plan before starting.

**Goal:** Stop showing every doc-category tile (tachograph, K-belgesi, ADR-vehicle, ADR-driver, psychotechnical, etc.) on every truck/driver detail page regardless of whether the fleet needs them. Today, that clutter trains users to ignore the doc surface — which kills the painkiller.

**Architecture:** Fleet-level config persisted on `Fleet` (and applied via inheritance to all trucks/drivers), with a per-entity override for outliers. Configurable via:
1. A one-question vertical picker on `FleetSetupPage` that pre-checks sensible categories.
2. An editable doc-list section inside `SettingsPage` (no new top-level nav).
3. A small "özel belge listesi" link on `TruckDetailPage` / `DriverDetailPage` for the rare outlier truck.

---

## 1. Core data model

### Fleet entity addition

```sql
-- BE migration V19 (or whichever is next)
ALTER TABLE fleet.fleets
    ADD COLUMN applicable_doc_categories TEXT[] NOT NULL DEFAULT '{}';

-- Optional: vertical hint, drives sensible defaults
ALTER TABLE fleet.fleets
    ADD COLUMN business_vertical VARCHAR(30);  -- 'LOGISTICS' | 'CONSTRUCTION' | 'SERVICE' | 'HAZMAT' | 'MIXED' | NULL
```

`applicable_doc_categories` lists the optional doc categories tracked at fleet level. Mandatory ones (insurance/inspection on Truck; license on Driver) are NOT in this list — they're always tracked.

### Truck + Driver override

```sql
ALTER TABLE fleet.trucks
    ADD COLUMN applicable_doc_categories_override TEXT[];  -- NULL = inherit fleet's set

ALTER TABLE fleet.drivers
    ADD COLUMN applicable_doc_categories_override TEXT[];  -- NULL = inherit
```

When NOT NULL, this entity tracks **exactly** these categories (still plus mandatory). Used for the rare outlier case (the one hazmat truck in an otherwise-normal fleet).

### Effective-categories computation

A small service helper:

```java
public Set<DocCategory> effectiveDocCategories(Truck t, Fleet f) {
    Set<DocCategory> base = MANDATORY_TRUCK_CATEGORIES;
    Set<DocCategory> optional = t.getApplicableDocCategoriesOverride() != null
        ? Set.of(t.getApplicableDocCategoriesOverride())
        : Set.of(f.getApplicableDocCategories());
    return Sets.union(base, optional);
}
```

Same shape for Driver.

---

## 2. UI surfaces

### A. FleetSetupPage — onboarding question (one new field)

Add to the existing setup form: **"Hangi sektördesiniz?"** with options:
- Lojistik / Nakliye
- İnşaat
- Servis (servis aracı)
- Tehlikeli madde (hazmat)
- Karma / Diğer

On select, pre-check categories on a small "Takip edeceğiniz belgeler:" panel below:
- LOGISTICS → K_BELGESI, TACHOGRAPH on; ADR off
- HAZMAT → ADR_VEHICLE, ADR_DRIVER on
- CONSTRUCTION/SERVICE/MIXED → minimal (none of the optional ones)

User can adjust the checkboxes before saving the fleet. No separate step in the wizard.

### B. SettingsPage — editable doc-list section

Inside the existing `SettingsPage`, add a "Filo ayarları → Takip edilen belgeler" section. Same checkbox grid as onboarding. On change, modal warns:

> "Bu değişiklik `{truckCount}` aracı ve `{driverCount}` sürücüyü etkileyecek. Devam edilsin mi?"

On confirm, persist via `PUT /fleets/{fleetId}/applicable-docs`. All inheriting entities update instantly (no migration of overrides).

### C. TruckDetailPage / DriverDetailPage — per-entity override link

Below the existing doc tiles, a small "özel belge listesi" link → opens a modal showing all optional doc categories with checkboxes. Defaults to inheriting the fleet's set; toggling switches to override mode for that entity only. "Filo varsayılanına dön" button clears the override.

---

## 3. BE endpoints to add

| Method | Path | Purpose |
|---|---|---|
| `PUT` | `/api/fleets/{fleetId}/applicable-docs` | Update fleet-level set + vertical |
| `PUT` | `/api/fleets/{fleetId}/trucks/{truckId}/applicable-docs-override` | Set or clear truck-level override |
| `PUT` | `/api/fleets/{fleetId}/drivers/{driverId}/applicable-docs-override` | Same for driver |

`GET /trucks/{truckId}` and `GET /drivers/{driverId}` extended to return `effectiveDocCategories` (server-computed) so FE doesn't have to merge sets itself.

---

## 4. FE — what files to touch

| Path | Change |
|---|---|
| `src/types/document.ts` (or wherever DocumentCategory lives) | Add the existing 5 optional categories to a constant `OPTIONAL_DOC_CATEGORIES` and `MANDATORY_DOC_CATEGORIES_TRUCK/DRIVER` |
| `src/types/fleet.ts` | Extend Fleet type with `applicableDocCategories` + `businessVertical` |
| `src/types/index.ts` (Truck/Driver) | Add `applicableDocCategoriesOverride: DocCategory[] \| null` |
| `src/services/api.ts` | Three new methods for the endpoints above |
| `src/pages/FleetSetupPage.tsx` | Add the vertical-picker section + checkbox grid |
| `src/pages/SettingsPage.tsx` | Add the "Takip edilen belgeler" section |
| `src/pages/TruckDetailPage.tsx` | Filter doc tiles by `effectiveDocCategories`; add the override link/modal |
| `src/pages/DriverDetailPage.tsx` | Same |
| `src/components/docs/DocOverrideModal.tsx` | New (~120 LOC) — the per-entity override UI |
| `src/components/docs/DocCategoryCheckboxGrid.tsx` | New (~80 LOC) — shared between FleetSetup, Settings, override modal |
| i18n keys | Add `vertical.*` + `applicableDocs.*` blocks |

**Estimated total: ~600 LOC across BE + FE.**

---

## 5. Open questions (resolve before execution)

1. **Where does the override modal live UX-wise?** — A small inline link on TruckDetailPage that opens a modal, OR a dropdown menu item ("Bu araç için ek belgeler düzenle")? Modal is more discoverable; dropdown is less cluttered. Recommend modal triggered by a small text-link.
2. **Vertical enum coverage** — Are 5 verticals enough? Strategy doc mentions electricians, plumbers, couriers, regional logistics, construction. Most map to SERVICE or LOGISTICS. Recommend the 5 listed in §2.A; add more if customer interviews surface real gaps.
3. **What about retroactively setting overrides for existing trucks?** — When this ships, existing fleets' trucks all inherit. That's fine. If a manager has historically uploaded an ADR doc to a non-ADR truck, that doc still exists — we just don't show the tile by default. Should we auto-set an override on any truck that has historical doc data outside the fleet's default set? Recommend YES: a one-time data migration that, for each existing truck/driver, sets `override = (categories of all uploaded docs ∪ fleet defaults)` so historical data stays visible.
4. **Should "MIXED" / "Diğer" vertical exist?** — Yes; it's the safe default that doesn't pre-check anything. Use as fallback when the user skips the question.

---

## 6. Sequencing — this plan vs. the maintenance editor

Maintenance editor ships first (separate plan, `2026-04-25-maintenance-editor.md`). Reasoning:

- Maintenance is more visible value to a manager opening their dashboard today.
- This (doc applicability) is a refinement that matters more once they've explored the product.
- Both touch `TruckDetailPage` — sequencing avoids merge conflicts.
- The maintenance editor PR ships customer-facing capability; this PR ships customer-facing cleanup.

---

## 7. Estimated effort

- **BE:** ~250 LOC (migration, entity changes, 3 endpoints, service helper, tests)
- **FE:** ~600 LOC (types, services, 2 page changes, 2 new components, i18n)
- **Plan-first → subagent-driven execution:** ~3–4 hours end-to-end.

---

**Status:** Deferred. Revisit after the maintenance editor lands and you've talked to 3+ customers about which verticals they identify with.
