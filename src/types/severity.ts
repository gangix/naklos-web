/** Shared severity type for both fuel anomaly alerts and document expiry
 *  warnings. Kept in its own module so consumers don't pick up unrelated fuel
 *  types when they just need the tier enum. */
export type Severity = 'CRITICAL' | 'WARNING' | 'INFO';

/** Tailwind bg-* class for the small severity dot used in chips, rule rows,
 *  and accordion summaries. Single source of truth — don't re-inline. */
export const SEVERITY_DOT_CLASS: Record<Severity, string> = {
  CRITICAL: 'bg-urgent-500',
  WARNING: 'bg-attention-500',
  INFO: 'bg-info-500',
};

/** Tailwind text-* class for text rendered in a severity tone. */
export const SEVERITY_TEXT_CLASS: Record<Severity, string> = {
  CRITICAL: 'text-urgent-700',
  WARNING: 'text-attention-700',
  INFO: 'text-info-700',
};

/** Tailwind background class for tinted surfaces (e.g. list row badges). */
export const SEVERITY_BG_TINT_CLASS: Record<Severity, string> = {
  CRITICAL: 'bg-urgent-50',
  WARNING: 'bg-attention-50',
  INFO: 'bg-info-50',
};

/** Numeric rank so consumers can sort worst-first without a lookup table. */
export const SEVERITY_RANK: Record<Severity, number> = {
  CRITICAL: 3,
  WARNING: 2,
  INFO: 1,
};

/** Given a list of severities, return the most severe (or undefined if empty). */
export function worstSeverity(severities: Severity[]): Severity | undefined {
  let worst: Severity | undefined;
  for (const s of severities) {
    if (!worst || SEVERITY_RANK[s] > SEVERITY_RANK[worst]) worst = s;
  }
  return worst;
}
