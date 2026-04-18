import type { Truck, Driver } from '../types';

/** Visual status derived from real signals (documents + assignments).
 *  Replaces the manually-flipped TruckStatus/DriverStatus enums for display. */
export type DerivedStatus = 'MISSING_DOCS' | 'READY' | 'ACTIVE';

// Day-keyed cache — derive*Status fires N times per render on list pages,
// each computing midnight-today. Cache invalidates when the local date string
// flips, which is correct across midnight transitions.
let _todayKey = '';
let _todayDate: Date = new Date(0);
const today = (): Date => {
  const key = new Date().toDateString();
  if (key !== _todayKey) {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    _todayDate = d;
    _todayKey = key;
  }
  return _todayDate;
};

const isExpiredOrMissing = (dateStr: string | null | undefined): boolean => {
  if (!dateStr) return true;
  return new Date(dateStr) < today();
};

/**
 * MISSING_DOCS = strictly "can't legally operate" — compulsory traffic
 * insurance + inspection for trucks, license + SRC for commercial-freight
 * drivers. Comprehensive insurance (kasko) is optional financial coverage;
 * CPC is optional (EU international only). These must stay aligned with
 * `computeTruckWarnings` / `computeDriverWarnings` — the filter chip, row
 * badge, and attention row all need to agree on what counts as "missing".
 */
export function deriveTruckStatus(truck: Truck): DerivedStatus {
  if (
    isExpiredOrMissing(truck.compulsoryInsuranceExpiry) ||
    isExpiredOrMissing(truck.inspectionExpiry)
  ) {
    return 'MISSING_DOCS';
  }
  return truck.currentDriverId ? 'ACTIVE' : 'READY';
}

export function deriveDriverStatus(driver: Driver): DerivedStatus {
  if (isExpiredOrMissing(driver.licenseExpiryDate)) return 'MISSING_DOCS';
  const src = driver.certificates?.find((c) => c.type === 'SRC');
  if (!src || isExpiredOrMissing(src.expiryDate)) return 'MISSING_DOCS';
  return driver.assignedTruckId ? 'ACTIVE' : 'READY';
}

/** Tone tokens for the derived status badge. Keep aligned with the
 *  outcome banner palette used on FuelImportBatchDetailPage. */
export const STATUS_BADGE: Record<DerivedStatus, { bg: string; text: string }> = {
  MISSING_DOCS: { bg: 'bg-red-100',   text: 'text-red-700' },
  READY:        { bg: 'bg-green-100', text: 'text-green-700' },
  ACTIVE:       { bg: 'bg-blue-100',  text: 'text-blue-700' },
};
