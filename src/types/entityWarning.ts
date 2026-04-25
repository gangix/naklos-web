import type { Severity } from './severity';

/**
 * Single warning surfaced on a per-entity surface (TruckDetail rollup,
 * DriverDetail rollup). Discriminated by `kind` so the rollup component
 * can render kind-specific labels and route to the right destination tab.
 *
 * Sources:
 *  - 'doc'         → Truck doc fields or Driver license/SRC/CPC. Day-based.
 *  - 'fuel'        → AnomalyPendingItem from fuelAnomalyApi. Time-based.
 *  - 'maintenance' → MaintenanceDueItem from /maintenance/due. Day-based.
 */
export type EntityWarning =
  | DocWarning
  | FuelWarning
  | MaintenanceWarning;

export interface DocWarning {
  kind: 'doc';
  severity: Severity;
  /** i18n key for the doc category label (e.g. 'doc.compulsoryInsurance'). */
  labelKey: string;
  /** Days until expiry. Negative = expired. null = date missing. */
  daysLeft: number | null;
  /** Whether this doc is mandatory (drives missing-date severity). */
  isMandatory: boolean;
}

export interface FuelWarning {
  kind: 'fuel';
  severity: Severity;
  /** Anomaly rule code (e.g. 'ODOMETER_ROLLBACK'). */
  ruleCode: string;
  /** ISO timestamp when the anomaly was detected. */
  detectedAt: string;
  /** For navigation deep-link to the specific anomaly. */
  anomalyId: string;
}

export interface MaintenanceWarning {
  kind: 'maintenance';
  severity: Severity;
  /** Pre-localized label from BE (e.g. "Motor yağı"). */
  label: string;
  /** Days until next due. Negative = overdue. */
  daysLeft: number;
  scheduleId: string;
  reason: 'TIME' | 'KM' | 'BOTH';
}

const SEVERITY_RANK: Record<Severity, number> = {
  CRITICAL: 3,
  WARNING: 2,
  INFO: 1,
};

/**
 * Stable sort comparator: worst severity first, then within severity by
 * recency / urgency. Used by EntityWarningsRollup to render a triage list.
 */
export function compareWarnings(a: EntityWarning, b: EntityWarning): number {
  const sevDelta = SEVERITY_RANK[b.severity] - SEVERITY_RANK[a.severity];
  if (sevDelta !== 0) return sevDelta;
  if (a.kind === 'fuel' && b.kind === 'fuel') {
    return b.detectedAt.localeCompare(a.detectedAt);
  }
  if (a.kind !== 'fuel' && b.kind !== 'fuel') {
    const aDays = 'daysLeft' in a ? a.daysLeft : null;
    const bDays = 'daysLeft' in b ? b.daysLeft : null;
    if (aDays === null && bDays === null) return 0;
    if (aDays === null) return 1;
    if (bDays === null) return -1;
    return aDays - bDays;
  }
  return 0;
}
