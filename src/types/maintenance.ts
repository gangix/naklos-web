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

export interface MaintenanceScheduleDto {
  id: string;
  truckId: string;
  fleetId: string;
  kind: MaintenanceKind;
  customLabel: string | null;
  intervalKm: number | null;
  intervalMonths: number | null;
  lastServicedAt: string;     // ISO date YYYY-MM-DD
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
