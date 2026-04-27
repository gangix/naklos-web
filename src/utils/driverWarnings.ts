import type { Driver } from '../types';
import type { Severity } from '../types/severity';
import { daysUntil, todayMidnightMs, WARN_THRESHOLD_DAYS } from './expiry';
import { severityFromDays as canonicalSeverityFromDays } from './severity';

export interface DriverWarning {
  key: string;
  params: Record<string, string | number>;
  /** CRITICAL = expired / missing / ≤1 day left.
   *  WARNING  = 2–14 days left.
   *  INFO     = 15–30 days left. */
  severity: Severity;
  type: 'license' | 'src' | 'cpc';
  /** Days until expiry. Negative = already expired. null = date missing.
   *  Mirrors {@link TruckWarning.daysLeft} so callers (e.g. dashboard rollup)
   *  can sort/aggregate driver and truck warnings the same way. */
  daysLeft: number | null;
}

// Use the canonical app-wide mapping (≤7=CRITICAL, ≤30=WARNING, >30=INFO)
// so dashboard rollup, sidebar badge, and detail-page chips agree on tones.
const severityFromDays = canonicalSeverityFromDays;

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
      out.push({
        key: keys.missing,
        params: { driverName },
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
      params: { driverName },
      severity: 'CRITICAL',
      type,
      daysLeft: days,
    });
  } else if (days <= WARN_THRESHOLD_DAYS) {
    out.push({
      key: keys.expiring,
      params: { driverName, count: days },
      severity: severityFromDays(days),
      type,
      daysLeft: days,
    });
  }
}
