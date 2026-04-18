import type { Truck } from '../types';
import { daysUntil, todayMidnightMs, WARN_THRESHOLD_DAYS } from './expiry';

export interface TruckWarning {
  key: string;
  params: Record<string, string | number>;
  /** 'error' = expired / missing / <=7 days left. 'warning' = 8–30 days left. */
  severity: 'error' | 'warning';
  type: 'compulsory-insurance' | 'comprehensive-insurance' | 'inspection';
}

const URGENT_DAYS = 7;

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
        severity: 'error',
        type,
      });
    }
    return;
  }
  if (days < 0) {
    out.push({
      key: keys.expired,
      params: { plate: truck.plateNumber },
      severity: 'error',
      type,
    });
  } else if (days <= WARN_THRESHOLD_DAYS) {
    out.push({
      key: keys.expiring,
      params: { plate: truck.plateNumber, count: days },
      severity: days <= URGENT_DAYS ? 'error' : 'warning',
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
