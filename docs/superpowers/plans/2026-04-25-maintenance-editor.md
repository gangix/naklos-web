# Maintenance Editor (Step 2) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Make the dashboard's maintenance row clickable into a per-truck "Bakım" section on `TruckDetailPage` where the manager can edit schedule intervals and log completed services. Without this, the dashboard maintenance row is read-only theater.

**Architecture:** Reuse the BE endpoints already shipped in Step 1 (`feat/maintenance-module` merged in `b33fc04`). New FE-only work plus a small BE addendum for **Service Log fields** (shop name + city), per §14 of the strategy doc — pure data accumulation that seeds future Layer 2 marketplace plays.

**Tech Stack:** React 19, TypeScript 5, Tailwind 3, react-i18next, lucide-react. BE: Java 21 + JPA + Flyway.

---

## 1. Scope

### What ships
- BE: V18 migration adding `shop_name VARCHAR(120)`, `shop_city VARCHAR(60)` to `fleet.maintenance_records`. `MaintenanceRecord` entity + `RecordRequest` DTO + `MaintenanceScheduleService.logRecord` updated.
- FE: New `MaintenanceTab` component on `TruckDetailPage` with three sections — schedule list (inline edit), "Servis girdim" CTA → modal, record history list.
- FE: New `maintenanceApi` methods (CRUD + records) extending the existing `due()` method.
- FE: New types for ScheduleDto/Request, RecordDto/Request.
- i18n keys for all new copy in tr/en/de.

### Out of scope
- Add-new-schedule UI (the V17 seed gives every truck 3 schedules; managers edit existing ones, not add new ones in v1). Add later if customers ask.
- Delete-schedule UI (same reasoning).
- Per-truck maintenance route or anchor scrolling — the dashboard row navigates to `/manager/trucks/{id}#maintenance`, the page just scrolls to the section if the hash matches.
- Cost rollup / monthly spend page (Step 3).
- Mobile/PWA polish — desktop-first.

---

## 2. File structure

| Path | Repo | New / Modified |
|---|---|---|
| `application/src/main/resources/db/migration/V18__maintenance_record_shop_fields.sql` | naklos | New |
| `fleet-module/src/main/java/com/naklos/fleet/domain/model/maintenance/MaintenanceRecord.java` | naklos | Modified (add 2 fields, update factory) |
| `fleet-module/src/main/java/com/naklos/fleet/application/maintenance/MaintenanceDtos.java` | naklos | Modified (extend RecordRequest, RecordDto) |
| `fleet-module/src/main/java/com/naklos/fleet/application/maintenance/MaintenanceScheduleService.java` | naklos | Modified (pass new fields through to entity factory) |
| `application/src/test/java/com/naklos/fleet/application/maintenance/MaintenanceScheduleServiceIntegrationTest.java` | naklos | Modified (one assertion in `log_record_*` test for the new fields) |
| `src/types/maintenance.ts` | naklos-web | Modified (add ScheduleDto/Request, RecordDto/Request) |
| `src/services/maintenanceApi.ts` | naklos-web | Modified (add 6 methods: listSchedules, createSchedule, updateSchedule, deleteSchedule, listRecords, logRecord) |
| `src/components/maintenance/MaintenanceTab.tsx` | naklos-web | New (~300 LOC) |
| `src/components/maintenance/ScheduleRow.tsx` | naklos-web | New (~120 LOC) |
| `src/components/maintenance/LogRecordModal.tsx` | naklos-web | New (~150 LOC) |
| `src/pages/TruckDetailPage.tsx` | naklos-web | Modified (mount the tab, hash-scroll behavior) |
| `public/locales/{tr,en,de}/translation.json` | naklos-web | Modified (~25 keys × 3 locales) |

**Total: 7 new files, 7 modified.** ~700 LOC end-to-end.

---

## 3. BE changes (do first — FE depends on the new wire fields)

### V18 migration

```sql
-- ============================================================================
-- V18 — Service Log fields on maintenance_records
-- See plan: naklos-web/docs/superpowers/plans/2026-04-25-maintenance-editor.md
--
-- Adds shop_name + shop_city to capture WHERE a service was performed.
-- Both nullable — the dashboard surface doesn't need them, but capturing
-- this data accumulates a structured "shops paying fleets actually use"
-- dataset for the eventual Layer 2 maintenance marketplace (Section 14
-- of STRATEGY_PIVOT_2026.md). Pure data accumulation, zero downside.
-- ============================================================================

ALTER TABLE fleet.maintenance_records
    ADD COLUMN shop_name VARCHAR(120),
    ADD COLUMN shop_city VARCHAR(60);
```

### Entity + DTO + service updates

**MaintenanceRecord.java** — add two fields and parameters to `log(...)`:

```java
@Column(length = 120)
private String shopName;

@Column(length = 60)
private String shopCity;
```

Update `log(...)` to accept and assign both. Trim them when present.

**MaintenanceDtos.java** — extend `RecordDto` and `RecordRequest`:

```java
public record RecordDto(
    UUID id,
    UUID scheduleId,
    UUID truckId,
    LocalDate performedAt,
    Integer performedKm,
    Long costMinor,
    String costCurrency,
    String notes,
    String shopName,
    String shopCity
) {}

public record RecordRequest(
    @NotNull LocalDate performedAt,
    @PositiveOrZero Integer performedKm,
    @PositiveOrZero Long costMinor,
    @Size(min = 3, max = 3) String costCurrency,
    @Size(max = 2000) String notes,
    @Size(max = 120) String shopName,
    @Size(max = 60) String shopCity
) {}
```

**MaintenanceScheduleService.logRecord(...)** — pass the two new fields through to `MaintenanceRecord.log(...)` and to the response DTO.

**Test update:** in `MaintenanceScheduleServiceIntegrationTest.java`'s `log_record_advances_schedule_and_creates_audit_row()`, pass non-null `shopName="Mehmet Usta Garaj"` and `shopCity="Istanbul"` in the `RecordRequest`, then assert they round-trip via `recordRepo.findAllByScheduleId(...)`.

---

## 4. FE — types and API client

### `src/types/maintenance.ts` — extend the existing file

Add to the existing file:

```ts
export interface MaintenanceScheduleDto {
  id: string;
  truckId: string;
  fleetId: string;
  kind: MaintenanceKind;
  customLabel: string | null;
  intervalKm: number | null;
  intervalMonths: number | null;
  lastServicedAt: string;     // ISO date
  lastServicedKm: number | null;
  nextDueAt: string | null;
  nextDueKm: number | null;
}

export interface MaintenanceScheduleRequest {
  kind: MaintenanceKind;
  customLabel?: string | null;
  intervalKm?: number | null;
  intervalMonths?: number | null;
  lastServicedAt: string;
  lastServicedKm?: number | null;
}

export interface MaintenanceRecordDto {
  id: string;
  scheduleId: string;
  truckId: string;
  performedAt: string;
  performedKm: number | null;
  costMinor: number | null;
  costCurrency: string | null;
  notes: string | null;
  shopName: string | null;
  shopCity: string | null;
}

export interface MaintenanceRecordRequest {
  performedAt: string;
  performedKm?: number | null;
  costMinor?: number | null;
  costCurrency?: string | null;
  notes?: string | null;
  shopName?: string | null;
  shopCity?: string | null;
}
```

### `src/services/maintenanceApi.ts` — extend with 6 methods

Add to the existing object (alongside `due`):

```ts
listSchedules: (fleetId: string, truckId: string) =>
  apiCall<MaintenanceScheduleDto[]>(
    `/fleets/${fleetId}/maintenance/trucks/${truckId}/schedules`,
  ),

createSchedule: (fleetId: string, truckId: string, body: MaintenanceScheduleRequest) =>
  apiCall<MaintenanceScheduleDto>(
    `/fleets/${fleetId}/maintenance/trucks/${truckId}/schedules`,
    { method: 'POST', body: JSON.stringify(body) },
  ),

updateSchedule: (
  fleetId: string,
  truckId: string,
  scheduleId: string,
  body: MaintenanceScheduleRequest,
) =>
  apiCall<MaintenanceScheduleDto>(
    `/fleets/${fleetId}/maintenance/trucks/${truckId}/schedules/${scheduleId}`,
    { method: 'PUT', body: JSON.stringify(body) },
  ),

deleteSchedule: (fleetId: string, truckId: string, scheduleId: string) =>
  apiCall<void>(
    `/fleets/${fleetId}/maintenance/trucks/${truckId}/schedules/${scheduleId}`,
    { method: 'DELETE' },
  ),

listRecords: (fleetId: string, truckId: string) =>
  apiCall<MaintenanceRecordDto[]>(
    `/fleets/${fleetId}/maintenance/trucks/${truckId}/records`,
  ),

logRecord: (
  fleetId: string,
  truckId: string,
  scheduleId: string,
  body: MaintenanceRecordRequest,
) =>
  apiCall<MaintenanceRecordDto>(
    `/fleets/${fleetId}/maintenance/trucks/${truckId}/schedules/${scheduleId}/records`,
    { method: 'POST', body: JSON.stringify(body) },
  ),
```

---

## 5. FE — UI components

### `MaintenanceTab.tsx` — the section that lives on TruckDetailPage

Top-level layout:

```
┌─────────────────────────────────────────────────────────────┐
│ ## Bakım                                  [+ Yeni servis]   │  ← header + CTA
│                                                              │
│ ┌─ Schedule rows (one per kind) ──────────────────────────┐ │
│ │ Motor yağı     | Her 6 ay / 15.000 km | next: 15 May ⓘ│ │  ← inline edit
│ │ Fren bakımı    | Her 6 ay             | next: 25 Eki  │ │
│ │ Şanzıman       | Her 24 ay / 60.000   | next: 25 Nis 28│ │
│ └───────────────────────────────────────────────────────────┘
│                                                              │
│ ## Geçmiş servisler                                         │
│ ┌─ Records, newest first ──────────────────────────────────┐
│ │ 15 Mar 2026 · Motor yağı · 110.500 km · ₺850 · İst.    │
│ │ 22 Eyl 2025 · Fren bakımı · ...                        │
│ └───────────────────────────────────────────────────────────┘
└─────────────────────────────────────────────────────────────┘
```

Behavior:
- On mount, fetches both `listSchedules(fleetId, truckId)` and `listRecords(fleetId, truckId)` in parallel.
- Each `ScheduleRow` is its own component handling inline edit state.
- "Yeni servis" opens `LogRecordModal` (with a schedule selector inside the modal — pick which kind was serviced).
- After a successful log, closes the modal, refreshes both schedules + records, calls `useMaintenanceWarnings().refresh()` to update the dashboard badge.

### `ScheduleRow.tsx` — single schedule with inline edit

States:
- **Read mode** (default): label + interval summary + next-due badge + edit pencil
- **Edit mode**: form fields for `kind` (dropdown), `intervalKm` (number), `intervalMonths` (number), `lastServicedAt` (date), `lastServicedKm` (number) + Save/Cancel buttons

Behavior:
- On Save, calls `updateSchedule(...)`, refreshes parent, exits edit mode.
- Validation: at least one of intervalKm/intervalMonths must be set; intervals positive; lastServicedAt required. Mirrors BE entity validation client-side so users see errors before submitting.
- For CUSTOM kind, also shows a `customLabel` text input.

### `LogRecordModal.tsx` — the "Servis girdim" form

Fields:
- Schedule (dropdown, defaults to OIL or first in the list)
- Performed at (date, defaults to today)
- Performed km (number, optional — pre-filled with `currentOdometer + something` if available)
- Cost amount + currency (optional)
- Shop name (text, optional, max 120)
- Shop city (text, optional, max 60)
- Notes (textarea, optional, max 2000)

On submit: `logRecord(fleetId, truckId, scheduleId, body)`. On success, parent refreshes.

---

## 6. TruckDetailPage integration

Add the import:
```tsx
import MaintenanceTab from '../components/maintenance/MaintenanceTab';
```

Insert `<MaintenanceTab fleetId={...} truckId={...} />` as a new section at a sensible spot in the page (probably below the existing doc tiles but above any future cost analytics sections).

Hash-scroll: if `window.location.hash === '#maintenance'` on mount, scroll the maintenance section into view smoothly. Cheap effect:

```tsx
useEffect(() => {
  if (window.location.hash === '#maintenance') {
    document.getElementById('maintenance-section')?.scrollIntoView({ behavior: 'smooth' });
  }
}, []);
```

The section itself wraps in `<section id="maintenance-section">`.

---

## 7. i18n keys (~25 keys × 3 locales)

In `dashboard` block (no — actually create a new top-level `maintenance` block):

```json
"maintenance": {
  "sectionTitle": "Bakım",
  "addRecord": "Yeni servis",
  "noSchedules": "Bakım takvimi bulunamadı.",
  "scheduleEdit": "Düzenle",
  "scheduleSave": "Kaydet",
  "scheduleCancel": "İptal",
  "kind": {
    "OIL": "Motor yağı",
    "BRAKE": "Fren bakımı",
    "TRANSMISSION": "Şanzıman",
    "GEARBOX": "Vites kutusu",
    "TIRE_ROTATION": "Lastik rotasyonu",
    "INSPECTION": "Muayene",
    "CUSTOM": "Özel"
  },
  "intervalKm": "Her {{km}} km",
  "intervalMonths": "Her {{months}} ay",
  "intervalBoth": "Her {{months}} ay / {{km}} km",
  "lastServiced": "Son servis",
  "nextDue": "Sıradaki",
  "recordsTitle": "Geçmiş servisler",
  "noRecords": "Henüz servis kaydı yok.",
  "logModal": {
    "title": "Servis kaydı ekle",
    "schedule": "Hangi bakım?",
    "performedAt": "Tarih",
    "performedKm": "Kilometre",
    "cost": "Tutar",
    "shopName": "Servis adı",
    "shopCity": "Şehir",
    "notes": "Notlar (opsiyonel)",
    "submit": "Kaydet",
    "cancel": "İptal"
  },
  "errors": {
    "intervalRequired": "Km veya ay aralıklarından birini girin.",
    "intervalPositive": "Aralık sıfırdan büyük olmalı.",
    "customLabelRequired": "Özel bakım için ad girin."
  }
}
```

Same structure in `en/translation.json` (English copy) and `de/translation.json` (German copy). Drop the `kind.*` block on the FE side if labels come pre-localized from BE — verify which is the right path during implementation. (BE sends pre-localized labels in the `due` response; for the schedule editor, the FE picks labels itself since it has the `kind` enum and BE doesn't return labels in the `listSchedules` response.)

---

## 8. Tasks

> Each task ends with a commit. After every code change, type-check (FE: `npx tsc --noEmit`; BE: `./gradlew :fleet-module:compileJava`) before committing.

### Task 1: BE — V18 migration + entity + DTO + service updates

**Files:**
- Create: `application/src/main/resources/db/migration/V18__maintenance_record_shop_fields.sql`
- Modify: `fleet-module/src/main/java/com/naklos/fleet/domain/model/maintenance/MaintenanceRecord.java`
- Modify: `fleet-module/src/main/java/com/naklos/fleet/application/maintenance/MaintenanceDtos.java`
- Modify: `fleet-module/src/main/java/com/naklos/fleet/application/maintenance/MaintenanceScheduleService.java`
- Modify: `application/src/test/java/com/naklos/fleet/application/maintenance/MaintenanceScheduleServiceIntegrationTest.java`

- [ ] **Step 1:** Write V18 SQL (per §3 of this plan).

- [ ] **Step 2:** Add `shopName` + `shopCity` columns to `MaintenanceRecord` entity. Extend `log(...)` factory to accept both, trim when present, persist nulls when blank.

- [ ] **Step 3:** Extend `MaintenanceDtos.RecordDto` and `MaintenanceDtos.RecordRequest` with the two new fields and `@Size` constraints (per §3).

- [ ] **Step 4:** Update `MaintenanceScheduleService.logRecord()` to pass `req.shopName()` and `req.shopCity()` into `MaintenanceRecord.log(...)`. Update `toRecordDto()` to map the new fields back.

- [ ] **Step 5:** Update the existing integration test `log_record_advances_schedule_and_creates_audit_row` — pass `"Mehmet Usta Garaj"` for `shopName` and `"Istanbul"` for `shopCity` in the `RecordRequest`, then assert both round-trip via `recordRepo.findAllByScheduleId(...)`.

- [ ] **Step 6:** Run all maintenance tests, expect 16/16 still passing:
  ```bash
  cd /Users/olcay.bilir/IdeaProjects/naklos && ./gradlew :application:test --tests "*Maintenance*" 2>&1 | tail -15
  ```

- [ ] **Step 7:** Commit:
  ```bash
  git -C /Users/olcay.bilir/IdeaProjects/naklos add application/src/main/resources/db/migration/V18__maintenance_record_shop_fields.sql fleet-module/src/main/java/com/naklos/fleet/domain/model/maintenance/MaintenanceRecord.java fleet-module/src/main/java/com/naklos/fleet/application/maintenance/MaintenanceDtos.java fleet-module/src/main/java/com/naklos/fleet/application/maintenance/MaintenanceScheduleService.java application/src/test/java/com/naklos/fleet/application/maintenance/MaintenanceScheduleServiceIntegrationTest.java
  git -C /Users/olcay.bilir/IdeaProjects/naklos commit -m "V18: add shop_name + shop_city to maintenance_records (Service Log fields)"
  ```

  Then merge straight into main (`git checkout main && git merge --no-ff feat/maintenance-editor-be -m "..."` if you want a branch, or commit directly on main per the FE-side workflow choice). Push.

### Task 2: FE types + API client

**Files:**
- Modify: `naklos-web/src/types/maintenance.ts`
- Modify: `naklos-web/src/services/maintenanceApi.ts`

- [ ] Add the 4 new TS types (per §4) to the existing `maintenance.ts`.
- [ ] Add the 6 new methods to `maintenanceApi`.
- [ ] Type-check + commit: `types+services: maintenance schedule + record CRUD client`

### Task 3: i18n keys

**Files:**
- Modify: `public/locales/{tr,en,de}/translation.json`

- [ ] Add the `maintenance.*` block (per §7) to all 3 locales. Skip `kind.*` if BE pre-localizes — see §7 note. The schedule list uses kinds the FE knows by enum, so include `kind.*` to avoid double-source-of-truth issues.
- [ ] Commit: `i18n: maintenance editor copy for tr/en/de`

### Task 4: `LogRecordModal.tsx`

**Files:**
- Create: `src/components/maintenance/LogRecordModal.tsx`

Build the form-in-a-modal with all fields per §5. Validation: `performedAt` required, `costMinor` and `costCurrency` paired-or-both-null on the BE so handle that client-side too. Call `maintenanceApi.logRecord(...)` on submit; close modal + emit a callback on success.

Reuse modal styling from existing modals in the codebase (look at `AddTruckModal.tsx` for the pattern).

- [ ] Type-check + commit: `MaintenanceTab: LogRecordModal for "Servis girdim" flow`

### Task 5: `ScheduleRow.tsx`

**Files:**
- Create: `src/components/maintenance/ScheduleRow.tsx`

Per §5. Read mode shows label + interval summary + next-due badge + edit pencil. Edit mode shows the form. Save calls `maintenanceApi.updateSchedule(...)`; emits a callback on success.

- [ ] Type-check + commit: `MaintenanceTab: ScheduleRow with inline edit`

### Task 6: `MaintenanceTab.tsx`

**Files:**
- Create: `src/components/maintenance/MaintenanceTab.tsx`

The container. Fetches schedules + records on mount, renders header + `ScheduleRow[]` + record history list. Manages the `LogRecordModal` open/close state. On any successful CRUD, refreshes itself and calls `useMaintenanceWarnings().refresh()` so the dashboard badge updates without a full page reload.

- [ ] Type-check + commit: `MaintenanceTab: schedule list + record history`

### Task 7: `TruckDetailPage` integration

**Files:**
- Modify: `src/pages/TruckDetailPage.tsx`

Add the import + render `<section id="maintenance-section"><MaintenanceTab .../></section>` at a sensible spot. Add the hash-scroll effect.

- [ ] Type-check + commit: `TruckDetailPage: mount MaintenanceTab section`

### Task 8: Lint + tests + manual smoke

- [ ] FE lint: `npx eslint src/types/maintenance.ts src/services/maintenanceApi.ts src/components/maintenance/*.tsx src/pages/TruckDetailPage.tsx 2>&1 | tail -10` — zero new errors.
- [ ] FE tests: `npx vitest run --reporter=default 2>&1 | tail -15` — still green.
- [ ] Manual: dev server up. Click the maintenance row from dashboard → lands on TruckDetailPage scrolled to the Bakım section → can edit a schedule → can log a service → dashboard badge updates after closing modal.
- [ ] If everything works without changes, no extra commit needed.

### Task 9: Push to main

- [ ] Push naklos-web main commits: `git -C /Users/olcay.bilir/IdeaProjects/naklos-web push origin main`

---

## 9. Self-review checklist

- [x] **Spec coverage** — every section maps to a task: BE→T1, types/API→T2, i18n→T3, modal→T4, row→T5, tab→T6, page→T7, verify→T8, ship→T9.
- [x] **No placeholders** — every step references concrete code or files.
- [x] **Type consistency** — `MaintenanceScheduleDto`/`MaintenanceScheduleRequest` and `MaintenanceRecordDto`/`MaintenanceRecordRequest` names match BE DTOs (just prefixed `Maintenance` on the FE side for clarity inside `types/maintenance.ts`).
- [x] **No "add new schedule" UI in v1** — managers edit the 3 seeded ones. Documented in §1.
- [x] **No fleet-level changes** — TruckDetailPage scope only.
- [x] **Service Log shop fields included** per §14 of strategy doc.

---

**Plan complete.** Ready for subagent-driven execution.
