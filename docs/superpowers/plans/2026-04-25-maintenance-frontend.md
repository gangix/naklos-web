# Maintenance Frontend (Step 1 — Dashboard surfacing) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire the new BE `/maintenance/due` endpoint into the manager dashboard so the existing `PriorityBriefing` card surfaces "araç bakımı yaklaşıyor" rows alongside fuel + doc-expiry rows. **No new UI components, no new pages.** Just one new context, one new API client method, types, and a 1-line widening of the existing briefing card.

**Architecture:** Mirror `FuelCountsContext`'s shape exactly — context fetches once on `fleetId` change + on `refresh()`, exposes pre-shaped data for the briefing card. Widen `PriorityBriefing.PriorityDocGroup.entity` union by one value (`'truck-maintenance'`); the rest of the rendering reuses the existing tone system. `DashboardPage` merges maintenance groups into `warningGroups`, sorts by `worstDaysLeft`, and the card draws.

**Tech Stack:** React 19, TypeScript 5, Vite, react-i18next, Tailwind 3, lucide-react. No new dependencies.

---

## 1. Background & scope

### What's already there
- BE endpoint live (after merge of `feat/maintenance-module`): `GET /api/fleets/{fleetId}/maintenance/due?withinDays=30` returns `{ groups: [{ truckId, plate, items: [{ scheduleId, kind, label, daysLeft, reason }], worstDaysLeft }] }`.
- Existing `PriorityBriefing` card already handles `'truck' | 'driver'` rows with severity-driven tone (urgent/attention/info), filled day-pills, severity-aware header count. Shipped earlier today.
- `FuelCountsContext` is the precedent shape — see `src/contexts/FuelCountsContext.tsx`.
- `ManagerLayout.tsx` wraps the manager surface and is where new providers mount.
- `apiCall<T>` helper is at `src/services/api.ts` (line 31).
- i18n loader: `i18next-http-backend` reads `/locales/{tr,en,de}/translation.json`. Existing `dashboard.priority.*` keys live around line 68 of the tr file.

### What this plan delivers
- `src/types/maintenance.ts` — TS mirrors of the BE wire DTOs.
- `src/services/maintenanceApi.ts` — single method `due(fleetId, withinDays?)`.
- `src/contexts/MaintenanceWarningsContext.tsx` — fetch on `fleetId` change, expose pre-shaped `PriorityDocGroup[]` for the briefing card.
- `src/components/layout/ManagerLayout.tsx` — mount the provider next to `FuelCountsProvider`.
- `src/components/dashboard/PriorityBriefing.tsx` — widen `entity` union to include `'truck-maintenance'`, add Wrench icon branch in the icon picker, add href branch.
- `src/pages/DashboardPage.tsx` — read from new context, merge into `warningGroups`, re-sort by worst-first.
- `public/locales/{tr,en,de}/translation.json` — new label keys for the maintenance row.

### Out of scope (Step 2 — separate plan)
- `TruckDetailPage` "Bakım" tab with the schedule editor + record logger.
- Cost rollup / monthly maintenance spend page.
- The `MaintenanceWarningsContext` exposes a `refresh()` method but no caller invokes it yet (the editor in Step 2 will).

---

## 2. File structure

| Path | Responsibility | New / Modified |
|---|---|---|
| `src/types/maintenance.ts` | TS DTO mirrors of BE wire types | New |
| `src/services/maintenanceApi.ts` | `due()` API client | New |
| `src/contexts/MaintenanceWarningsContext.tsx` | Per-fleet rollup + provider/hook | New |
| `src/components/layout/ManagerLayout.tsx` | Mount provider | Modified |
| `src/components/dashboard/PriorityBriefing.tsx` | Widen entity union + icon/href branches | Modified |
| `src/pages/DashboardPage.tsx` | Merge maintenance groups into `warningGroups` | Modified |
| `public/locales/tr/translation.json` | New `dashboard.priority.maintenanceRow_*` + `dashboard.priority.maintenanceReason.*` keys | Modified |
| `public/locales/en/translation.json` | Same | Modified |
| `public/locales/de/translation.json` | Same | Modified |

**Total: 3 new files, 6 modified.** ~150 LOC end-to-end.

---

## 3. Wire shape contract (from BE)

`GET /api/fleets/{fleetId}/maintenance/due?withinDays=30` →

```ts
{
  groups: [{
    truckId: string,
    plate: string,
    items: [{
      scheduleId: string,
      kind: 'OIL' | 'BRAKE' | 'TRANSMISSION' | 'GEARBOX' | 'TIRE_ROTATION' | 'INSPECTION' | 'CUSTOM',
      label: string,           // already localized by BE per fleet's preferredLocale
      daysLeft: number,        // negative = overdue
      reason: 'TIME' | 'KM' | 'BOTH'
    }],
    worstDaysLeft: number     // min(items[].daysLeft)
  }]
}
```

Server already filters `INSPECTION` + sorts groups by `worstDaysLeft` ascending + items within a group by `daysLeft` ascending. Client-side does no resort within groups.

**Auth/plan gating:** the BE returns `[]` for FREE-plan fleets. Client also gates with `useFleet().plan` to avoid the round-trip on every dashboard mount (mirrors `FuelCountsContext`'s pattern).

---

## 4. The `PriorityDocGroup` shape decision (most important architectural call)

The existing `PriorityBriefing` accepts `warningGroups: PriorityDocGroup[]`. Today:

```ts
export interface PriorityDocGroup {
  entity: 'truck' | 'driver';
  entityId: string;
  name: string;
  items: PriorityDocItem[];
  worstDaysLeft: number | null;
}
```

**Widen to:**

```ts
export interface PriorityDocGroup {
  entity: 'truck' | 'driver' | 'truck-maintenance';
  entityId: string;     // truckId for both 'truck' and 'truck-maintenance'
  name: string;         // plate for trucks, "First Last" for drivers
  items: PriorityDocItem[];
  worstDaysLeft: number | null;
}
```

This lets `DashboardPage` merge maintenance groups into the SAME array, sorted together. A brake job due in 4 days and a Muayene due in 12 days end up sorted in the right order without two parallel rendering paths.

`PriorityBriefing`'s only branch on `entity` today is the icon (Truck vs Users). Add a third branch for the Wrench (lucide-react) icon and a different href:

| `entity` | Icon | Href |
|---|---|---|
| `'truck'` | `Truck` (blue chip) | `/manager/trucks/{entityId}` |
| `'driver'` | `Users` (emerald chip) | `/manager/drivers/{entityId}` |
| `'truck-maintenance'` | `Wrench` (slate chip — neutral, not warning) | `/manager/trucks/{entityId}#maintenance` (Step 2 will wire the anchor) |

The slate chip color is deliberate — the row's stripe + day-pill already carry the urgency tone. The icon itself is just a glyph for "what kind of attention" — not a second urgency signal.

**`PriorityDocItem`** stays the same: `{ labelKey: string, daysLeft: number | null }`. Maintenance items aren't translated client-side (label comes pre-localized from BE), so the conversion to `PriorityDocItem` will use a sentinel `labelKey: '__raw__'` and stash the actual localized text on a new optional field — OR (simpler) the maintenance item just provides the localized label via `labelKey` directly being treated as the literal string when the entity is `'truck-maintenance'`.

**Decision: use a separate `rawLabel` field.** Cleanest:

```ts
export interface PriorityDocItem {
  labelKey: string;       // i18n key (existing path)
  rawLabel?: string;      // pre-localized label (used when labelKey is empty for maintenance items)
  daysLeft: number | null;
}
```

In the `docList` rendering at `PriorityBriefing.tsx:131-135`, change `t(i.labelKey)` to `i.rawLabel ?? t(i.labelKey)`. One-line change, backwards-compatible.

---

## 5. Tasks

> Each task ends with a commit. After every change to TS/TSX, run `npx tsc --noEmit` to keep the type-check green.

### Task 1: TypeScript types

**Files:**
- Create: `src/types/maintenance.ts`

- [ ] **Step 1: Write `src/types/maintenance.ts`**

```ts
/**
 * BE wire shapes for the maintenance module. Server pre-localizes `label`
 * using the fleet's preferredLocale, so the client doesn't translate kinds
 * itself — `label` is rendered verbatim. `kind` is still surfaced for the
 * icon switch and for future filtering UI.
 */
export const MAINTENANCE_KINDS = [
  'OIL',
  'BRAKE',
  'TRANSMISSION',
  'GEARBOX',
  'TIRE_ROTATION',
  'INSPECTION',
  'CUSTOM',
] as const;
export type MaintenanceKind = typeof MAINTENANCE_KINDS[number];

export type MaintenanceReason = 'TIME' | 'KM' | 'BOTH';

export interface MaintenanceDueItem {
  scheduleId: string;
  kind: MaintenanceKind;
  /** Already localized by the BE. Render verbatim. */
  label: string;
  /** Negative = overdue. */
  daysLeft: number;
  reason: MaintenanceReason;
}

export interface MaintenanceDueGroup {
  truckId: string;
  plate: string;
  items: MaintenanceDueItem[];
  /** min(items[].daysLeft) — server-computed. */
  worstDaysLeft: number;
}

export interface MaintenanceDueResponse {
  groups: MaintenanceDueGroup[];
}
```

- [ ] **Step 2: type-check**

```bash
cd /Users/olcay.bilir/IdeaProjects/naklos-web && npx tsc --noEmit
```

Expected: clean.

- [ ] **Step 3: commit**

```bash
git -C /Users/olcay.bilir/IdeaProjects/naklos-web add src/types/maintenance.ts
git -C /Users/olcay.bilir/IdeaProjects/naklos-web commit -m "types: maintenance wire shapes from BE"
```

---

### Task 2: API client

**Files:**
- Create: `src/services/maintenanceApi.ts`

- [ ] **Step 1: Write `src/services/maintenanceApi.ts`**

```ts
import { apiCall } from './api';
import type { MaintenanceDueResponse } from '../types/maintenance';

/**
 * Step 1 surface: dashboard aggregator only. Schedule CRUD + record logging
 * lives behind the same /maintenance prefix on the BE — those are added here
 * when the Step 2 schedule editor lands.
 */
export const maintenanceApi = {
  due: (fleetId: string, withinDays = 30) =>
    apiCall<MaintenanceDueResponse>(
      `/fleets/${fleetId}/maintenance/due?withinDays=${withinDays}`,
    ),
};
```

- [ ] **Step 2: type-check + commit**

```bash
cd /Users/olcay.bilir/IdeaProjects/naklos-web && npx tsc --noEmit
git -C /Users/olcay.bilir/IdeaProjects/naklos-web add src/services/maintenanceApi.ts
git -C /Users/olcay.bilir/IdeaProjects/naklos-web commit -m "services: maintenanceApi.due()"
```

---

### Task 3: Context

**Files:**
- Create: `src/contexts/MaintenanceWarningsContext.tsx`

- [ ] **Step 1: Write `src/contexts/MaintenanceWarningsContext.tsx`**

Mirrors `FuelCountsContext` exactly. The shape differs because the dashboard wants groups, not counts.

```tsx
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type { ReactNode } from 'react';
import { useFleet } from './FleetContext';
import { maintenanceApi } from '../services/maintenanceApi';
import type { MaintenanceDueGroup } from '../types/maintenance';

/**
 * Per-fleet "maintenance due soon" rollup for the dashboard priority briefing.
 * Mirrors FuelCountsContext: one fetch on fleet change, surfaced via a
 * stable refresh() that mutation sites (Step 2 schedule editor) call to
 * invalidate without a page reload.
 *
 * FREE plans skip the round-trip — BE also returns [] for FREE, but the
 * client gate spares an extra request on every dashboard mount.
 */
interface MaintenanceWarningsValue {
  groups: MaintenanceDueGroup[];
  loading: boolean;
  refresh: () => void;
}

const DEFAULT_VALUE: MaintenanceWarningsValue = {
  groups: [],
  loading: false,
  refresh: () => {},
};

const MaintenanceWarningsContext =
  createContext<MaintenanceWarningsValue>(DEFAULT_VALUE);

export function MaintenanceWarningsProvider({
  children,
}: {
  children: ReactNode;
}) {
  const { fleetId, plan } = useFleet();
  const [groups, setGroups] = useState<MaintenanceDueGroup[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchDue = useCallback(async () => {
    if (!fleetId || plan === 'FREE') {
      setGroups([]);
      return;
    }
    setLoading(true);
    try {
      const res = await maintenanceApi.due(fleetId).catch(() => null);
      setGroups(res?.groups ?? []);
    } finally {
      setLoading(false);
    }
  }, [fleetId, plan]);

  useEffect(() => {
    void fetchDue();
  }, [fetchDue]);

  // Stable refresh identity — same pattern as FuelCountsContext.
  const refresh = useCallback(() => void fetchDue(), [fetchDue]);

  const value = useMemo<MaintenanceWarningsValue>(
    () => ({ groups, loading, refresh }),
    [groups, loading, refresh],
  );

  return (
    <MaintenanceWarningsContext.Provider value={value}>
      {children}
    </MaintenanceWarningsContext.Provider>
  );
}

export function useMaintenanceWarnings(): MaintenanceWarningsValue {
  return useContext(MaintenanceWarningsContext);
}
```

- [ ] **Step 2: type-check + commit**

```bash
cd /Users/olcay.bilir/IdeaProjects/naklos-web && npx tsc --noEmit
git -C /Users/olcay.bilir/IdeaProjects/naklos-web add src/contexts/MaintenanceWarningsContext.tsx
git -C /Users/olcay.bilir/IdeaProjects/naklos-web commit -m "contexts: MaintenanceWarningsContext (mirrors FuelCountsContext shape)"
```

---

### Task 4: Mount provider in `ManagerLayout`

**Files:**
- Modify: `src/components/layout/ManagerLayout.tsx`

- [ ] **Step 1: Add the provider**

Current state of the file (read it first to confirm):

```tsx
import { Outlet } from 'react-router-dom';
import ManagerTopNav from './ManagerTopNav';
import { FuelCountsProvider } from '../../contexts/FuelCountsContext';
import { FleetRosterProvider } from '../../contexts/FleetRosterContext';

const ManagerLayout = () => {
  return (
    <FleetRosterProvider>
      <FuelCountsProvider>
        <div className="min-h-screen bg-gray-50">
          ...
        </div>
      </FuelCountsProvider>
    </FleetRosterProvider>
  );
};
```

Add `<MaintenanceWarningsProvider>` directly inside `<FuelCountsProvider>`. Order doesn't matter functionally — both providers depend only on `useFleet()`.

```tsx
import { Outlet } from 'react-router-dom';
import ManagerTopNav from './ManagerTopNav';
import { FuelCountsProvider } from '../../contexts/FuelCountsContext';
import { FleetRosterProvider } from '../../contexts/FleetRosterContext';
import { MaintenanceWarningsProvider } from '../../contexts/MaintenanceWarningsContext';

const ManagerLayout = () => {
  return (
    <FleetRosterProvider>
      <FuelCountsProvider>
        <MaintenanceWarningsProvider>
          <div className="min-h-screen bg-gray-50">
            <ManagerTopNav />
            <main className="pt-16">
              <div className="max-w-6xl mx-auto px-4 md:px-6 py-4 md:py-5">
                <Outlet />
              </div>
            </main>
          </div>
        </MaintenanceWarningsProvider>
      </FuelCountsProvider>
    </FleetRosterProvider>
  );
};

export default ManagerLayout;
```

- [ ] **Step 2: type-check + commit**

```bash
cd /Users/olcay.bilir/IdeaProjects/naklos-web && npx tsc --noEmit
git -C /Users/olcay.bilir/IdeaProjects/naklos-web add src/components/layout/ManagerLayout.tsx
git -C /Users/olcay.bilir/IdeaProjects/naklos-web commit -m "ManagerLayout: mount MaintenanceWarningsProvider"
```

---

### Task 5: Widen `PriorityBriefing` to handle `'truck-maintenance'`

**Files:**
- Modify: `src/components/dashboard/PriorityBriefing.tsx`

Three changes in this file. Read the file first; current state has `entity: 'truck' | 'driver'`, an icon picker that switches on `isTruck`, and an href constructor.

- [ ] **Step 1: Add `Wrench` to the lucide import**

```tsx
import { ChevronRight, Truck, Users, Fuel, Wrench } from 'lucide-react';
```

- [ ] **Step 2: Widen the `PriorityDocGroup` union**

```tsx
export interface PriorityDocGroup {
  entity: 'truck' | 'driver' | 'truck-maintenance';   // ← added third
  entityId: string;
  name: string;
  items: PriorityDocItem[];
  worstDaysLeft: number | null;
}
```

- [ ] **Step 3: Widen `PriorityDocItem` with the optional `rawLabel`**

```tsx
export interface PriorityDocItem {
  labelKey: string;
  rawLabel?: string;     // ← added; used by maintenance items (BE-localized)
  daysLeft: number | null;
}
```

- [ ] **Step 4: Replace the icon picker + href construction in the `rows.map(...)` block**

Find the existing block that does:

```tsx
const isTruck = group.entity === 'truck';
const href = isTruck
  ? `/manager/trucks/${group.entityId}`
  : `/manager/drivers/${group.entityId}`;
```

Replace with a switch-style function that handles all three entities:

```tsx
const isMaintenance = group.entity === 'truck-maintenance';
const isTruck = group.entity === 'truck';
const isDriver = group.entity === 'driver';
const href = isDriver
  ? `/manager/drivers/${group.entityId}`
  : isMaintenance
    ? `/manager/trucks/${group.entityId}#maintenance`
    : `/manager/trucks/${group.entityId}`;
```

And update the icon chip block to add the maintenance branch:

```tsx
<div
  className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
    isMaintenance
      ? 'bg-slate-100 text-slate-600'
      : isTruck
        ? 'bg-blue-50 text-blue-500'
        : 'bg-emerald-50 text-emerald-500'
  }`}
>
  {isMaintenance ? <Wrench className="w-4 h-4" /> : isTruck ? <Truck className="w-4 h-4" /> : <Users className="w-4 h-4" />}
</div>
```

- [ ] **Step 5: Update `docList` rendering to honor `rawLabel`**

Find the existing block:

```tsx
const docsSummary = group.items.map((i) => t(i.labelKey)).join(', ');
```

Change to:

```tsx
const docsSummary = group.items.map((i) => i.rawLabel ?? t(i.labelKey)).join(', ');
```

- [ ] **Step 6: type-check + commit**

```bash
cd /Users/olcay.bilir/IdeaProjects/naklos-web && npx tsc --noEmit
git -C /Users/olcay.bilir/IdeaProjects/naklos-web add src/components/dashboard/PriorityBriefing.tsx
git -C /Users/olcay.bilir/IdeaProjects/naklos-web commit -m "PriorityBriefing: support truck-maintenance entity (Wrench icon, raw labels)"
```

---

### Task 6: i18n keys for the maintenance row

**Files:**
- Modify: `public/locales/tr/translation.json`
- Modify: `public/locales/en/translation.json`
- Modify: `public/locales/de/translation.json`

The maintenance row's title (the equivalent of "10 yakıt uyarısı" for fuel) needs an i18n key. The items themselves come pre-localized from BE.

- [ ] **Step 1: tr — add under `dashboard.priority`**

Inside the existing `"priority": { ... }` block (around line 68 of the tr file), add:

```json
"maintenanceRow_one": "{{count}} bakım yaklaşıyor",
"maintenanceRow_other": "{{count}} bakım yaklaşıyor",
"maintenanceRowSubtitle": "Aracın detayında düzenle"
```

- [ ] **Step 2: en — same keys**

```json
"maintenanceRow_one": "{{count}} maintenance due",
"maintenanceRow_other": "{{count}} maintenance items due",
"maintenanceRowSubtitle": "Edit on the truck detail page"
```

- [ ] **Step 3: de — same keys**

```json
"maintenanceRow_one": "{{count}} Wartung fällig",
"maintenanceRow_other": "{{count}} Wartungen fällig",
"maintenanceRowSubtitle": "Auf der Fahrzeugdetailseite bearbeiten"
```

Note: these row-title keys will be unused in this MVP — `DashboardPage` merges maintenance groups directly into per-truck rows (each truck gets a row with the truck's plate as title and its maintenance items as the subtitle). The `maintenanceRow_*` / `Subtitle` keys are reserved for a future "rolled-up" mode (single row showing total count). Keeping them now means the next step doesn't need an i18n migration. **If you'd rather defer keys until they're used, skip this task entirely.**

- [ ] **Step 4: commit**

```bash
git -C /Users/olcay.bilir/IdeaProjects/naklos-web add public/locales/tr/translation.json public/locales/en/translation.json public/locales/de/translation.json
git -C /Users/olcay.bilir/IdeaProjects/naklos-web commit -m "i18n: maintenance row keys for tr/en/de"
```

---

### Task 7: Merge maintenance groups into `DashboardPage`'s `warningGroups`

**Files:**
- Modify: `src/pages/DashboardPage.tsx`

Current state pulls `warningGroups` from a `useMemo` over `trucks` + `drivers`, then renders `<PriorityBriefing warningGroups={warningGroups} ...>`. Maintenance groups need to slot into the SAME array.

- [ ] **Step 1: Import the new context**

Add to existing imports:

```tsx
import { useMaintenanceWarnings } from '../contexts/MaintenanceWarningsContext';
```

- [ ] **Step 2: Read maintenance groups from context**

Below the existing `useFuelCounts()` line:

```tsx
const { groups: maintenanceGroups } = useMaintenanceWarnings();
```

- [ ] **Step 3: Add a second useMemo that converts maintenance groups → `PriorityDocGroup[]`**

Insert after the existing `warningGroups` useMemo:

```tsx
const maintenanceWarningGroups = useMemo<PriorityDocGroup[]>(() => {
  return maintenanceGroups.map((g) => ({
    entity: 'truck-maintenance' as const,
    entityId: g.truckId,
    name: g.plate,
    items: g.items.map((i) => ({
      labelKey: '',          // unused — rawLabel takes precedence
      rawLabel: i.label,
      daysLeft: i.daysLeft,
    })),
    worstDaysLeft: g.worstDaysLeft,
  }));
}, [maintenanceGroups]);
```

- [ ] **Step 4: Merge + re-sort before passing to `PriorityBriefing`**

Find the existing `warningGroups` variable. Either rename the existing one to `docWarningGroups` and create a merged `mergedWarningGroups`, OR (simpler) just merge inline at the prop site. Prefer the explicit name for readability:

```tsx
// Rename the existing useMemo:
const docWarningGroups = useMemo<PriorityDocGroup[]>(() => {
  // ... existing body unchanged
}, [trucks, drivers]);

// Then add:
const warningGroups = useMemo<PriorityDocGroup[]>(() => {
  const merged = [...docWarningGroups, ...maintenanceWarningGroups];
  // Same sort the existing useMemo uses internally — pull it out as a helper
  // or inline it here (matches the doc-warning sort already in the file).
  merged.sort((a, b) => {
    if (a.worstDaysLeft === null && b.worstDaysLeft === null) return 0;
    if (a.worstDaysLeft === null) return 1;
    if (b.worstDaysLeft === null) return -1;
    return a.worstDaysLeft - b.worstDaysLeft;
  });
  return merged;
}, [docWarningGroups, maintenanceWarningGroups]);
```

- [ ] **Step 5: Update `hasPriorities`**

Find:

```tsx
const hasPriorities =
  warningGroups.length > 0 || (fuelTrackingEnabled && fuelAttentionCount > 0);
```

It already checks `warningGroups.length > 0`, which now includes maintenance. No change needed unless maintenance should also be plan-gated — for Step 1 it isn't (BE returns `[]` on FREE so `maintenanceGroups` will be empty). Leave the line alone.

- [ ] **Step 6: type-check + commit**

```bash
cd /Users/olcay.bilir/IdeaProjects/naklos-web && npx tsc --noEmit
git -C /Users/olcay.bilir/IdeaProjects/naklos-web add src/pages/DashboardPage.tsx
git -C /Users/olcay.bilir/IdeaProjects/naklos-web commit -m "DashboardPage: merge maintenance groups into priority briefing"
```

---

### Task 8: Manual verification + lint/test pass

- [ ] **Step 1: Lint**

```bash
cd /Users/olcay.bilir/IdeaProjects/naklos-web && npx eslint src/types/maintenance.ts src/services/maintenanceApi.ts src/contexts/MaintenanceWarningsContext.tsx src/components/layout/ManagerLayout.tsx src/components/dashboard/PriorityBriefing.tsx src/pages/DashboardPage.tsx 2>&1 | tail -10
```

Expected: zero NEW errors (the existing `react-hooks/set-state-in-effect` and `react-refresh/only-export-components` errors in the contexts file are pre-existing).

- [ ] **Step 2: Test suite**

```bash
cd /Users/olcay.bilir/IdeaProjects/naklos-web && npx vitest run --reporter=default 2>&1 | tail -20
```

Expected: all green (currently 60 tests pass — no new tests added in this plan).

- [ ] **Step 3: Manual smoke test**

```bash
cd /Users/olcay.bilir/IdeaProjects/naklos-web && npm run dev
```

Open the dashboard. With BE merged + V17 having seeded 3 schedules per truck (TIME-only, due in 6/6/24 months from migration date), no maintenance rows should appear yet (none are within 30 days). To validate the wiring works:

1. Manually insert a schedule via psql or curl: set `last_serviced_at = CURRENT_DATE - INTERVAL '5 months'` on one truck's OIL schedule (so `nextDueAt = CURRENT_DATE + 1 month` ≈ within 30 days).
2. Refresh the dashboard. Expect a row with the truck's plate, "Motor yağı" subtitle (from BE locale), and a day-left pill in attention or urgent tone depending on the actual day count.

If it doesn't render, check:
- Network tab — is `/api/fleets/{fleetId}/maintenance/due?withinDays=30` being called?
- Response — does it return non-empty `groups`?
- React devtools — is `MaintenanceWarningsProvider` mounted? Does the context value have non-empty `groups`?

- [ ] **Step 4: Commit (only if you needed to fix anything in step 3)**

If everything works without changes, no extra commit needed.

---

### Task 9: Push branch + open PR (or merge to main)

- [ ] **Step 1: Decide workflow**

Same question as the BE branch — feature branch + PR, or commit straight on `main`?

For consistency with the BE choice (`feat/maintenance-module` branch), recommend a parallel `feat/maintenance-frontend` branch on the FE repo.

- [ ] **Step 2: Push and open PR**

If branch path:

```bash
git -C /Users/olcay.bilir/IdeaProjects/naklos-web checkout -b feat/maintenance-frontend
# (only needed if you've been on main this whole time — check git status first)
git -C /Users/olcay.bilir/IdeaProjects/naklos-web push -u origin feat/maintenance-frontend
```

Then open via the URL printed by `git push` (gh CLI is not installed locally per the BE branch experience).

If straight-to-main path: just `git push origin main`.

---

## 6. Self-review checklist

- [x] **Spec coverage** — every section of §1 maps to a task: types→T1, API→T2, context→T3, mount→T4, briefing widening→T5, i18n→T6, dashboard merge→T7, verification→T8, ship→T9.
- [x] **No placeholders** — all code blocks are complete.
- [x] **Type consistency** — `MaintenanceDueGroup` (BE shape) → `PriorityDocGroup with entity='truck-maintenance'` (briefing shape) is a deterministic 1:1 mapping in `maintenanceWarningGroups` useMemo.
- [x] **`PriorityDocItem.rawLabel`** is added to the type definition (T5 step 3) AND consumed where existing code calls `t(i.labelKey)` (T5 step 5). No half-finished interface.
- [x] **`Wrench` import** is added (T5 step 1) before the icon picker references it (T5 step 4).
- [x] **`useFleet().plan` gate** mirrors `FuelCountsContext` exactly — FREE plans skip the round-trip.
- [x] **Sort order** in T7 step 4 matches the existing sort in `DashboardPage` (expired-first, missing-dates-last).
- [x] **No new dependencies.**

---

## 7. Open question for the user (resolve before T9)

**Workflow:** branch + PR, or direct commit to `main` like the earlier `PriorityBriefing` severity work? Either is fine — I lean PR (consistent with the BE branch, easier to coordinate the BE/FE deploy) but the choice is yours.

---

**Plan complete and saved to `docs/superpowers/plans/2026-04-25-maintenance-frontend.md`.**
