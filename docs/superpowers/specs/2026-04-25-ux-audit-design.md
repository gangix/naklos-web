# UX Audit — Cross-Page Severity, Per-Entity Warnings Rollup, Tab Badges

**Date:** 2026-04-25
**Status:** Spec — design approved, plan pending
**Scope:** Frontend-only (`naklos-web`). BE already exposes everything needed.

---

## Why this exists

Today three independent warning systems (doc expiry, fuel anomalies, maintenance schedules) surface in different places with inconsistent rules:

1. The dashboard `PriorityBriefing` paints a truck blue when a mandatory document has no date entered, even though "missing inspection date" is more urgent than "inspection in 25 days."
2. `TruckDetailPage` Genel tab only surfaces doc warnings — the manager has to check Yakıt and Bakım tabs separately to see if a CRITICAL fuel anomaly fired or a brake job is overdue.
3. The `TrucksPage` list-level expiry badge only considers docs — fuel + maintenance issues are invisible at list level.
4. CTAs are single-target ("Belgelere git") even when multiple warning types exist on the same entity.

The audit unifies these into a single severity model + a shared rollup component used everywhere.

---

## §1 — Severity model

A new helper `severityForWarning(warning): Severity` returns `'urgent' | 'attention' | 'info'` for any warning. Rules:

| Signal | Tone |
|---|---|
| Date set, ≤7 days remaining OR overdue | `urgent` |
| Date set, 8–30 days remaining | `attention` |
| Date set, >30 days | (not surfaced — filtered out upstream) |
| **Date missing AND doc category is mandatory** | `urgent` ← new behavior |
| Date missing AND doc category is optional | `info` |
| Fuel anomaly: BE-supplied `severity = CRITICAL` | `urgent` |
| Fuel anomaly: BE-supplied `severity = WARNING` | `attention` |
| Fuel anomaly: BE-supplied `severity = INFO` | `info` |
| Maintenance: `daysLeft ≤ 7` OR overdue | `urgent` |
| Maintenance: `daysLeft 8–30` | `attention` |
| Maintenance: `daysLeft > 30` | (not surfaced — BE filters at `withinDays=30`) |

### Mandatory list (hardcoded for v1)

```ts
// src/utils/severity.ts
export const MANDATORY_TRUCK_DOCS = [
  'compulsoryInsurance',
  'comprehensiveInsurance',
  'inspection',
] as const;

export const MANDATORY_DRIVER_DOCS = ['license'] as const;
```

When the doc-applicability config plan ships (`docs/superpowers/plans/2026-04-25-doc-applicability-config.md`), the severity helper consults the config instead of these constants — same function signature, swappable internals. Until then, hardcoded.

### Worst-aggregation rule

Today `worstDaysLeft = min(items[].daysLeft)` ignores `null` (missing dates). New rule:

```ts
export function worstSeverity(warnings: EntityWarning[]): Severity {
  if (warnings.some(w => severityForWarning(w) === 'urgent')) return 'urgent';
  if (warnings.some(w => severityForWarning(w) === 'attention')) return 'attention';
  return 'info';
}
```

Tone of an aggregate row is `worstSeverity(items)`, not `toneFromDays(min(daysLeft))`. A single missing-mandatory item dominates the row tone regardless of other items' day counts.

---

## §2 — Unified per-entity rollup card

New shared component `<EntityWarningsRollup>` used on TruckDetailPage Genel and DriverDetailPage Genel.

### Layout

```
┌─ Bu araç için · 3 konu (1 acil) ────────────────────┐
│ 🔴 Muayene · 3 gün                  Belgelere git → │
│ 🔴 Yakıt: ODOMETER_ROLLBACK · 5dk    Yakıt'a git → │
│ 🟡 Motor yağı bakımı · 25 gün         Bakım'a git → │
└─────────────────────────────────────────────────────┘
```

### Per-row content

- **Severity stripe** (left edge, 4px wide) + **icon chip** (rounded square with category-appropriate icon: AlertTriangle for docs, Fuel for fuel anomalies, Wrench for maintenance). Color from §1.
- **Localized label**: BE-supplied for fuel anomalies (rule code) and maintenance (kind label). i18n key for docs (`doc.compulsoryInsurance`, etc.).
- **Day pill / time pill**:
  - Docs / maintenance: "3 gün", "Xg geçti", "bugün", "tarih eksik" — reuses the same `common.daysRemainingShort` / `common.daysExpiredShort` / `common.today` / `common.dateMissing` keys as `PriorityBriefing`'s `<DayLabel>`.
  - Fuel anomalies: relative time of detection ("5dk önce", "2sa önce") via existing `RelativeTime` component.
- **Per-row CTA** (right side): "Belgelere git →" / "Yakıt'a git →" / "Bakım'a git →". Uses `→` arrow to indicate in-page navigation, not external link.

### Per-row CTA destinations

In TruckDetailPage context, the CTA switches the active tab:

| Warning kind | Action |
|---|---|
| `doc` | `setActiveTab('belgeler')` |
| `fuel` | `setActiveTab('yakit')` and (best-effort) scroll to / highlight the specific anomaly row |
| `maintenance` | `setActiveTab('bakim')` and (best-effort) scroll to / highlight the specific schedule |

The rollup component receives a callback `onNavigate(warning) => void` from the parent rather than knowing about tabs itself — keeps it reusable on DriverDetailPage too.

### Sort

Worst-severity-first, then within severity:
- Time-based items: smaller `daysLeft` first; missing-date items sort to end of severity tier
- Fuel anomalies: most recently detected first

### Header

`{t('entityWarnings.title.truck', { count })}` for trucks → "Bu araç için · 3 konu". Same for drivers (`title.driver`).

When `criticalCount > 0`, append `(N acil)` (matching `PriorityBriefing`'s pattern).

### Empty state

Card hidden entirely (`return null`) when `warnings.length === 0`. No empty-state copy — clean dashboard signal that all is well.

---

## §3 — Tab severity badges

Each tab in TruckDetailPage's tab bar that has surfaceable warnings shows a small severity dot + count next to its label:

```
[Genel] [Yakıt 🔴2] [Bakım 🟡1] [Belgeler 🔴2]
```

### Component: `<TabSeverityBadge severity count />`

Inline pill rendering:
- `severity = 'urgent'` → `bg-urgent-100 text-urgent-700`
- `severity = 'attention'` → `bg-attention-100 text-attention-700`
- Hidden when `count === 0`
- Style: `inline-flex items-center gap-0.5 px-1.5 py-px rounded text-[10px] font-bold tabular-nums ml-1.5`

### Rules

- Genel tab never shows a badge — it's the rollup surface, not an issue surface.
- DriverDetailPage tab bar gets one badge max (Belgeler, since drivers have no fuel/maintenance domains).
- Count = items with severity ≥ `attention` (urgent + attention combined; info-only items hidden — too noisy for the tab bar).
- Severity = `worstSeverity(items)` for that domain.
- Badge updates in real-time as the parent's warnings array updates (no separate state).

---

## §4 — Cross-page application

### Dashboard `PriorityBriefing`

- Replace `toneFromDays()` calls with `severityForWarning()`.
- Update `worstDaysLeft` aggregation to also consider missing-mandatory dates as urgent (or replace `worstDaysLeft` field with `worstSeverity` field on `PriorityDocGroup`).
- Existing fuel row and maintenance row rendering unchanged (they already pass severity directly).
- Truck doc rows now correctly show urgent for missing-mandatory dates instead of info.
- "X acil · M konu" header count updates accordingly.

### `TruckDetailPage` Genel

- Drop the existing `EntityWarningsCard` (or repurpose — see implementation plan).
- Hoist fuel anomaly fetch + maintenance schedule fetch up to TruckDetailPage level so the rollup has all 3 sources without duplicate calls.
  - For fuel: add `fuelAnomalyApi.listPendingForTruck(fleetId, truckId)` (new BE-side helper OR client-side filter from the existing global `listPending`).
  - For maintenance: hoist `MaintenanceTab`'s internal `listSchedules` fetch to the page level; pass schedules down to MaintenanceTab as a prop.
- Build an `EntityWarning[]` array combining doc warnings (from existing `truckWarnings`), fuel anomalies (filtered to truck), and maintenance schedules (filtered to those within the 30-day window).
- Render `<EntityWarningsRollup warnings={...} onNavigate={...} entityType="truck" />`.

### `TruckDetailPage` tab bar

- Compute per-domain warnings inside the page render.
- Pass `<TabSeverityBadge>` next to each tab label.

### `DriverDetailPage` Genel + tab bar

- Same as TruckDetailPage but doc-only (drivers have no fuel/maintenance).
- Tab bar gets one badge max.

### `TrucksPage` list-level

- Extend `truckWarnings.ts` to optionally include fuel + maintenance signals (or build a separate `truckSummary.ts` that combines them).
- The existing `TruckTable`'s docStatus column ("Muayene · 3 gün" + "+N") accepts the extended sources unchanged — it just displays the worst.
- Existing sort-by-urgency works against the new combined signal source.
- New per-truck data source: piggyback `useFuelCounts` and `useMaintenanceWarnings` (both already global per-fleet contexts) — page-level `useMemo` joins them by truckId. No N+1 fetches.

### `DriversPage` list-level

- Same as TrucksPage but doc-only (drivers have no fuel/maintenance).

### `MaintenanceTab` (already shipped)

- Receives schedules as a prop instead of fetching internally (when called from TruckDetailPage). Self-fetches when used elsewhere (driver portal — though driver-side already uses driverMaintenanceApi separately).
- No visible UX change.

### `FuelAlertsPage`

- No changes — already domain-specific by design.

---

## §5 — File structure & estimates

### New files (~310 LOC)

| Path | Purpose | Est LOC |
|---|---|---|
| `src/utils/severity.ts` | `severityForWarning()`, `worstSeverity()`, mandatory-doc constants | ~80 |
| `src/types/entityWarning.ts` | `EntityWarning` discriminated union (kind: doc / fuel / maintenance) + helpers | ~50 |
| `src/components/common/EntityWarningsRollup.tsx` | Shared rollup card (§2) | ~150 |
| `src/components/common/TabSeverityBadge.tsx` | Inline tab badge (§3) | ~30 |

### Modified files (~250 LOC delta)

| Path | Change | Est LOC delta |
|---|---|---|
| `src/components/dashboard/PriorityBriefing.tsx` | Use new severity helpers; missing-mandatory → urgent | ~30 |
| `src/utils/truckWarnings.ts` | Add `severity` field + mandatory-aware tone | ~20 |
| `src/utils/driverWarnings.ts` | Same | ~20 |
| `src/pages/TruckDetailPage.tsx` | Hoist fetches; render rollup; add tab badges | ~80 |
| `src/pages/DriverDetailPage.tsx` | Render rollup; add tab badge | ~40 |
| `src/pages/TrucksPage.tsx` | Pass extended warning sources to TruckTable | ~20 |
| `src/pages/DriversPage.tsx` | Same | ~10 |
| `src/components/trucks/TruckTable.tsx` | Accept extended warning sources | ~10 |
| `src/components/maintenance/MaintenanceTab.tsx` | Accept schedules-as-prop alongside self-fetch fallback | ~20 |
| i18n: `public/locales/{tr,en,de}/translation.json` | New keys (entityWarnings.*, navigation CTAs) | ~30 (10 each) |

### Total

**~560 LOC across 14 files.** ~3–4 hours via subagent-driven execution.

---

## §6 — i18n keys to add

```json
"entityWarnings": {
  "title": {
    "truck_one": "Bu araç için · {{count}} konu",
    "truck_other": "Bu araç için · {{count}} konu",
    "driver_one": "Bu sürücü için · {{count}} konu",
    "driver_other": "Bu sürücü için · {{count}} konu"
  },
  "criticalSuffix": "({{count}} acil)",
  "goToDocs": "Belgelere git",
  "goToFuel": "Yakıt'a git",
  "goToMaintenance": "Bakım'a git",
  "kind": {
    "doc": "Belge",
    "fuel": "Yakıt",
    "maintenance": "Bakım"
  }
}
```

Same shape in en (English) and de (German). Existing day/time pill keys (`common.daysRemainingShort`, `common.daysExpiredShort`, `common.today`, `common.dateMissing`) are reused as-is.

---

## §7 — Acceptance criteria

After ship, the following manual tests should pass:

1. **Dashboard:** A truck with missing inspection date renders RED, not blue. The header "X acil · M konu" reflects the new count.
2. **TruckDetail Genel:** Card shows up when the truck has any combination of doc / fuel / maintenance warnings. Each row's tone matches §1. Per-row CTA navigates to the right tab.
3. **TruckDetail tabs:** Yakıt / Bakım / Belgeler tabs show severity badges with counts when applicable. Genel never has a badge.
4. **DriverDetail:** Same rollup pattern, scoped to docs. Belgeler tab gets a badge when applicable.
5. **TrucksPage list:** A truck with NO doc issues but a CRITICAL fuel anomaly shows in the docStatus cell as "Yakıt · ODOMETER_ROLLBACK" with urgent tone.
6. **DriversPage list:** Same pattern, docs-only signals.
7. **No regressions:** existing tests pass; lint green; type-check green; existing badges/cards on PriorityBriefing render unchanged for non-missing-mandatory cases.

---

## §8 — Out of scope (explicit non-goals)

- Doc-applicability per-fleet config (separate plan, deferred).
- Fuel anomaly per-truck filtering on the BE (use client-side filter from existing global `listPending` for v1).
- Highlighting / scroll-to behavior on the destination tab (per-row CTA switches the tab; deeper "select this row" interaction is best-effort and may be a follow-up).
- Cost-rollup / spend analytics (Step 3 maintenance work).
- DriverDetailPage assigned-truck health card (could surface "your driver's truck has an issue" but the manager already sees it on TruckDetail; deferred).
- FuelAlertsPage redesign (already domain-specific; not in audit scope).
- Mobile / driver portal — only manager surface.

---

## §9 — Open questions for the implementer

1. **Hoist or duplicate fetches?** TruckDetailPage needs maintenance schedules for the rollup; MaintenanceTab also fetches them today. The cleanest path is hoist-to-page-level + pass-as-prop, but if MaintenanceTab is also rendered from non-page contexts, we keep self-fetch as a fallback. Implementer chooses between (a) full hoist with prop-only; (b) hoist + optional self-fetch fallback.
2. **Fuel anomaly per-truck data source.** Option (i): client-side filter from existing global `useFuelCounts` (no new fetch — BUT today the context only stores counts, not items per truck — would need to extend it). Option (ii): new dedicated `fuelAnomalyApi.listPendingForTruck()` BE call. Implementer evaluates and picks; recommend (i) since adding a `pendingByTruck: Map<truckId, Item[]>` to FuelCountsContext is one extra reduce on already-fetched data.
3. **Tab badge count: severity-tier sum or worst-only?** Spec says count = items with severity ≥ attention. If tabs feel too noisy with two-digit counts on a busy fleet, fall back to "show only worst severity dot, no number." Implementer can A/B with a stakeholder during dev preview.
