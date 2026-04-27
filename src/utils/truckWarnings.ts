import type { Truck } from '../types';
import type { Severity } from '../types/severity';
import { daysUntil, todayMidnightMs, WARN_THRESHOLD_DAYS } from './expiry';
import { severityFromDays as canonicalSeverityFromDays } from './severity';

export interface TruckWarning {
  key: string;
  params: Record<string, string | number>;
  /** CRITICAL = expired / missing / ≤1 day left.
   *  WARNING  = 2–14 days left.
   *  INFO     = 15–30 days left (heads-up, no immediate action). */
  severity: Severity;
  type: 'compulsory-insurance' | 'comprehensive-insurance' | 'inspection';
  /** Days until expiry. Negative = already expired. null = date missing. */
  daysLeft: number | null;
}

// Severity thresholds come from the canonical mapping in utils/severity.ts
// (≤7=CRITICAL, ≤30=WARNING, >30=INFO). One source of truth shared with
// the dashboard, sidebar badge, and detail-page chips.

interface ExpiryKeys {
  missing?: string;
  expired: string;
  expiring: string;
}

const COMPULSORY_KEYS: ExpiryKeys = {
  missing: 'warning.compulsoryInsuranceMissing',
  expired: 'warning.compulsoryInsuranceExpired',
  expiring: 'warning.compulsoryInsuranceExpiring',
};
const COMPREHENSIVE_KEYS: ExpiryKeys = {
  // Comprehensive insurance is optional — no "missing" warning.
  expired: 'warning.comprehensiveInsuranceExpired',
  expiring: 'warning.comprehensiveInsuranceExpiring',
};
const INSPECTION_KEYS: ExpiryKeys = {
  missing: 'warning.inspectionMissing',
  expired: 'warning.inspectionExpired',
  expiring: 'warning.inspectionExpiring',
};

const severityFromDays = canonicalSeverityFromDays;

function checkOne(
  truck: Pick<Truck, 'plateNumber'>,
  date: string | null,
  type: TruckWarning['type'],
  keys: ExpiryKeys,
  todayMs: number,
  out: TruckWarning[],
): void {
  const days = daysUntil(date, todayMs);
  if (days === null) {
    if (keys.missing) {
      out.push({
        key: keys.missing,
        params: { plate: truck.plateNumber },
        severity: 'CRITICAL',
        type,
        daysLeft: null,
      });
    }
    return;
  }
  if (days < 0) {
    out.push({
      key: keys.expired,
      params: { plate: truck.plateNumber },
      severity: 'CRITICAL',
      type,
      daysLeft: days,
    });
  } else if (days <= WARN_THRESHOLD_DAYS) {
    out.push({
      key: keys.expiring,
      params: { plate: truck.plateNumber, count: days },
      severity: severityFromDays(days),
      type,
      daysLeft: days,
    });
  }
}

/** Build the expiry-warning list for a single truck. Shared between the
 *  trucks list page and the truck detail Genel tab so both surfaces word
 *  warnings identically. */
export function computeTruckWarnings(truck: Truck, todayMs: number = todayMidnightMs()): TruckWarning[] {
  const out: TruckWarning[] = [];
  checkOne(truck, truck.compulsoryInsuranceExpiry, 'compulsory-insurance', COMPULSORY_KEYS, todayMs, out);
  checkOne(truck, truck.comprehensiveInsuranceExpiry, 'comprehensive-insurance', COMPREHENSIVE_KEYS, todayMs, out);
  checkOne(truck, truck.inspectionExpiry, 'inspection', INSPECTION_KEYS, todayMs, out);
  return out;
}
