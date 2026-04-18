import type { TruckFuelEntryDto } from '../types/fuel';

export interface MonthlyBucket {
  /** "2026-04" — YYYY-MM key for stable sort + display */
  yearMonth: string;
  /** 0-11 month index — for locale-aware month name */
  monthIdx: number;
  year: number;
  totalLiters: number;
  totalPrice: number;
  fillCount: number;
}

/**
 * Roll up fuel entries into the last N calendar months (relative to today),
 * sorted oldest-to-newest. Months with zero entries are still included so the
 * trend strip always renders a fixed-width grid — easier for the eye to scan
 * than a variable-length one.
 */
export function monthlyRollup(entries: TruckFuelEntryDto[], months: number): MonthlyBucket[] {
  const now = new Date();
  const buckets = new Map<string, MonthlyBucket>();

  // Seed the last N months so empty months show as zero-height bars.
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    buckets.set(key, {
      yearMonth: key,
      monthIdx: d.getMonth(),
      year: d.getFullYear(),
      totalLiters: 0,
      totalPrice: 0,
      fillCount: 0,
    });
  }

  for (const e of entries) {
    const d = new Date(e.occurredAt);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const b = buckets.get(key);
    if (!b) continue; // entry older than our window
    b.totalLiters += parseFloat(e.liters) || 0;
    b.totalPrice += parseFloat(e.totalPrice) || 0;
    b.fillCount += 1;
  }

  return Array.from(buckets.values());
}

export type EfficiencyStatus = 'normal' | 'attention' | 'warning';

/** Deviation thresholds — product rules. 10% slack before we warn; 25% before
 *  we call it high. Under-target (negative pct) is always "normal" — doing
 *  better than expected is never a warning. */
const ATTENTION_OVER_PCT = 10;
const WARNING_OVER_PCT = 25;

/**
 * Classify how the actual rolling average compares to the manager's target.
 *   normal    ≤ {@link ATTENTION_OVER_PCT}% over target (or no target set)
 *   attention above that, up to {@link WARNING_OVER_PCT}%
 *   warning   beyond {@link WARNING_OVER_PCT}%
 */
export function efficiencyStatus(
  actual: number | null,
  target: number | null,
): { status: EfficiencyStatus; deviationPct: number | null } {
  if (actual === null || target === null || target === 0) {
    return { status: 'normal', deviationPct: null };
  }
  const pct = Math.round(((actual - target) / target) * 100);
  if (pct <= ATTENTION_OVER_PCT) return { status: 'normal', deviationPct: pct };
  if (pct <= WARNING_OVER_PCT) return { status: 'attention', deviationPct: pct };
  return { status: 'warning', deviationPct: pct };
}
