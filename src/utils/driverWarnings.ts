import type { Driver } from '../types';
import { daysUntil, todayMidnightMs, WARN_THRESHOLD_DAYS } from './expiry';

export interface DriverWarning {
  key: string;
  params: Record<string, string | number>;
  severity: 'error' | 'warning';
  type: 'license' | 'src' | 'cpc';
}

const URGENT_DAYS = 7;

/** Driver warnings with TR-KOBİ-fleet semantics:
 *  - License: always required — warn on missing/expired/expiring.
 *  - SRC: required for commercial freight — warn on missing/expired/expiring.
 *  - CPC: optional (EU international) — warn ONLY when the cert exists on
 *    record but is expired/expiring. Drivers without a CPC aren't flagged. */
export function computeDriverWarnings(
  driver: Driver,
  todayMs: number = todayMidnightMs(),
): DriverWarning[] {
  const out: DriverWarning[] = [];
  const name = `${driver.firstName} ${driver.lastName}`;

  pushExpiry(out, 'license', driver.licenseExpiryDate, name, todayMs, {
    missing: 'warning.licenseMissing',
    expired: 'warning.licenseExpired',
    expiring: 'warning.licenseExpiring',
  });

  const src = driver.certificates?.find((c) => c.type === 'SRC');
  pushExpiry(out, 'src', src?.expiryDate ?? null, name, todayMs, {
    missing: 'warning.srcMissing',
    expired: 'warning.srcExpired',
    expiring: 'warning.srcExpiring',
  });

  // CPC — optional; skip `missing` because presence of the cert means the
  // driver enrolled, and absence shouldn't flag drivers who don't need CPC.
  const cpc = driver.certificates?.find((c) => c.type === 'CPC');
  if (cpc) {
    pushExpiry(out, 'cpc', cpc.expiryDate, name, todayMs, {
      expired: 'warning.cpcExpired',
      expiring: 'warning.cpcExpiring',
    });
  }

  return out;
}

interface ExpiryKeys {
  missing?: string;
  expired: string;
  expiring: string;
}

function pushExpiry(
  out: DriverWarning[],
  type: DriverWarning['type'],
  date: string | null,
  driverName: string,
  todayMs: number,
  keys: ExpiryKeys,
): void {
  const days = daysUntil(date, todayMs);
  if (days === null) {
    if (keys.missing) {
      out.push({ key: keys.missing, params: { driverName }, severity: 'error', type });
    }
    return;
  }
  if (days < 0) {
    out.push({ key: keys.expired, params: { driverName }, severity: 'error', type });
  } else if (days <= WARN_THRESHOLD_DAYS) {
    out.push({
      key: keys.expiring,
      params: { driverName, count: days },
      severity: days <= URGENT_DAYS ? 'error' : 'warning',
      type,
    });
  }
}
