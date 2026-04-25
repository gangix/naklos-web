import type { Severity } from '../types/severity';
import type { EntityWarning } from '../types/entityWarning';

/**
 * Doc categories whose absence is itself an urgent problem (you can't legally
 * operate the truck/driver without them in TR). Hardcoded for v1; the
 * doc-applicability config plan ('docs/superpowers/plans/2026-04-25-doc-applicability-config.md')
 * will let fleet managers expand this set per-fleet.
 */
export const MANDATORY_TRUCK_DOCS = [
  'compulsoryInsurance',
  'comprehensiveInsurance',
  'inspection',
] as const;

export const MANDATORY_DRIVER_DOCS = ['license'] as const;

/**
 * Day-count → severity mapping shared by docs + maintenance.
 *  - ≤7 days OR overdue → CRITICAL (act this week)
 *  - 8–30 days          → WARNING (act this month)
 *  - >30 days           → INFO (heads-up; usually filtered out upstream)
 */
export function severityFromDays(daysLeft: number): Severity {
  if (daysLeft <= 7) return 'CRITICAL';
  if (daysLeft <= 30) return 'WARNING';
  return 'INFO';
}

/**
 * Reads the embedded `severity` field on a warning. Exists as a function
 * (not a property access) so callers can be refactored later if/when the
 * computation moves out of the warning's source.
 */
export function severityForWarning(w: EntityWarning): Severity {
  return w.severity;
}

const SEVERITY_RANK: Record<Severity, number> = {
  CRITICAL: 3,
  WARNING: 2,
  INFO: 1,
};

/**
 * Picks the worst severity across a list. Used by anything that aggregates
 * per-entity warnings (rollup card header, dashboard row tone, tab badges).
 * Returns INFO for empty lists so callers don't need null handling.
 */
export function worstSeverity(warnings: EntityWarning[]): Severity {
  let worst: Severity = 'INFO';
  for (const w of warnings) {
    const s = severityForWarning(w);
    if (SEVERITY_RANK[s] > SEVERITY_RANK[worst]) worst = s;
  }
  return worst;
}
