import type { Truck } from '../types';
import type { Severity } from '../types/severity';
import { daysUntil, todayMidnightMs, WARN_THRESHOLD_DAYS } from './expiry';

export interface TruckWarning {
  key: string;
  params: Record<string, string | number>;
  /** CRITICAL = expired / missing / ≤1 day left.
   *  WARNING  = 2–14 days left.
   *  INFO     = 15–30 days left (heads-up, no immediate action). */
  severity: Severity;
  type: 'compulsory-insurance' | 'comprehensive-insurance' | 'inspection';
}

/** CRITICAL range: expired (<0), today (0), or tomorrow (1). Acting today is
 *  indistinguishable from acting on an already-expired doc from the manager's
 *  perspective — bump "expires tomorrow" up to Critical so the badge matches
 *  the required response. */
const CRITICAL_MAX_DAYS = 1;
/** WARNING range: 2–14 days. Matches typical Turkish insurance/inspection
 *  renewal lead time. */
const WARNING_MAX_DAYS = 14;
// INFO tops out at WARN_THRESHOLD_DAYS (30).

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

function severityFromDays(days: number): Severity {
  if (days < 0 || days <= CRITICAL_MAX_DAYS) return 'CRITICAL';
  if (days <= WARNING_MAX_DAYS) return 'WARNING';
  return 'INFO';
}

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
    });
  } else if (days <= WARN_THRESHOLD_DAYS) {
    out.push({
      key: keys.expiring,
      params: { plate: truck.plateNumber, count: days },
      severity: severityFromDays(days),
      type,
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
