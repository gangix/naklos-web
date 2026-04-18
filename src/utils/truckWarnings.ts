import type { Truck } from '../types';

export interface TruckWarning {
  /** i18n key of the warning message (e.g. 'warning.compulsoryInsuranceMissing') */
  key: string;
  /** Interpolation params passed to the i18n key ({{plate}}, {{count}}) */
  params: Record<string, string | number>;
  /** 'error' = expired / missing / <=7 days left. 'warning' = 8–30 days left. */
  severity: 'error' | 'warning';
  /** Document category this warning is about — used for keys/filters. */
  type: 'compulsory-insurance' | 'comprehensive-insurance' | 'inspection';
}

/** 7-day threshold for "urgent" severity elevation. */
const URGENT_DAYS = 7;
/** 30-day threshold for "warn early" — anything beyond is silent. */
const WARN_DAYS = 30;

interface ExpiryKeys {
  missing?: string;
  expired: string;
  expiring: string;
}

const MSVC_INS_KEYS: ExpiryKeys = {
  missing: 'warning.compulsoryInsuranceMissing',
  expired: 'warning.compulsoryInsuranceExpired',
  expiring: 'warning.compulsoryInsuranceExpiring',
};
const KASKO_KEYS: ExpiryKeys = {
  // Comprehensive insurance is optional — no "missing" warning.
  expired: 'warning.comprehensiveInsuranceExpired',
  expiring: 'warning.comprehensiveInsuranceExpiring',
};
const INSP_KEYS: ExpiryKeys = {
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
  if (!date) {
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
  const days = Math.ceil((new Date(date).getTime() - todayMs) / (1000 * 60 * 60 * 24));
  if (days < 0) {
    out.push({
      key: keys.expired,
      params: { plate: truck.plateNumber },
      severity: 'error',
      type,
    });
  } else if (days <= WARN_DAYS) {
    out.push({
      key: keys.expiring,
      params: { plate: truck.plateNumber, count: days },
      severity: days <= URGENT_DAYS ? 'error' : 'warning',
      type,
    });
  }
}

/**
 * Build the expiry-warning list for a single truck. Shared between the
 * trucks list page and the truck detail Genel tab so both surfaces word
 * warnings identically. Caller may pass a pre-computed `todayMs` to avoid
 * per-truck `Date.now()` allocations when iterating a fleet.
 */
export function computeTruckWarnings(truck: Truck, todayMs: number = Date.now()): TruckWarning[] {
  const out: TruckWarning[] = [];
  checkOne(truck, truck.compulsoryInsuranceExpiry, 'compulsory-insurance', MSVC_INS_KEYS, todayMs, out);
  checkOne(truck, truck.comprehensiveInsuranceExpiry, 'comprehensive-insurance', KASKO_KEYS, todayMs, out);
  checkOne(truck, truck.inspectionExpiry, 'inspection', INSP_KEYS, todayMs, out);
  return out;
}
