import type { Severity } from '../types/severity';
import { daysUntil, todayMidnightMs, WARN_THRESHOLD_DAYS } from './expiry';

/** Status of a single "entity × document-type" cell in the compliance matrix.
 *  Separate from {@link Severity} because the matrix also needs to render
 *  "Valid" (green, no tier) and distinguish "Missing" (never uploaded) from
 *  "Expired" (uploaded but past its date). */
export type CellStatus = 'MISSING' | 'CRITICAL' | 'WARNING' | 'INFO' | 'VALID';

const CRITICAL_MAX_DAYS = 1;
const WARNING_MAX_DAYS = 14;

/** Derive the cell status + days remaining for a single expiry date.
 *  - `null` date → MISSING (document never uploaded)
 *  - days < 0 → CRITICAL (expired)
 *  - days ≤ 1 → CRITICAL (expires today or tomorrow)
 *  - 2 ≤ days ≤ 14 → WARNING
 *  - 15 ≤ days ≤ 30 → INFO
 *  - days > 30 → VALID */
export function computeCellStatus(
  date: string | null | undefined,
  todayMs: number = todayMidnightMs(),
): { status: CellStatus; days: number | null } {
  const days = daysUntil(date ?? null, todayMs);
  if (days === null) return { status: 'MISSING', days: null };
  if (days < 0 || days <= CRITICAL_MAX_DAYS) return { status: 'CRITICAL', days };
  if (days <= WARNING_MAX_DAYS) return { status: 'WARNING', days };
  if (days <= WARN_THRESHOLD_DAYS) return { status: 'INFO', days };
  return { status: 'VALID', days };
}

/** Map of cell-background + text tone Tailwind classes per status.
 *  MISSING uses neutral slate (literally "no file") rather than a red tone —
 *  the Kritik chip/filter still surfaces it because severity rank is shared.
 *  VALID uses emerald-50/700 (Tailwind default palette) because the project's
 *  `confirm-*` scale only defines 500/600/700 and we need a light tint. */
export const CELL_STYLE: Record<CellStatus, { bg: string; text: string }> = {
  MISSING:  { bg: 'bg-slate-100',    text: 'text-slate-500' },
  CRITICAL: { bg: 'bg-urgent-50',    text: 'text-urgent-700' },
  WARNING:  { bg: 'bg-attention-50', text: 'text-attention-700' },
  INFO:     { bg: 'bg-info-50',      text: 'text-info-700' },
  VALID:    { bg: 'bg-emerald-50',   text: 'text-emerald-700' },
};

/** Translate a CellStatus to a Severity when applicable. Non-severity statuses
 *  (MISSING, VALID) return null — callers tier-filter using this. */
export function severityForStatus(status: CellStatus): Severity | null {
  if (status === 'CRITICAL') return 'CRITICAL';
  if (status === 'WARNING') return 'WARNING';
  if (status === 'INFO') return 'INFO';
  return null;
}

/** Numeric rank used to compute a row's "worst" status for sorting. */
export const CELL_STATUS_RANK: Record<CellStatus, number> = {
  CRITICAL: 5,
  MISSING: 4,
  WARNING: 3,
  INFO: 2,
  VALID: 1,
};
