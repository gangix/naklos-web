/** Days between today (midnight-normalized) and the given date. Negative when
 *  the date is in the past. Returns null for missing input. Shared helper so
 *  attention-count hooks, the dashboard, and the expiry badge all agree on
 *  the math (earlier drift: ceil vs floor on non-integer fractions). */
export function daysUntil(dateStr: string | null | undefined): number | null {
  if (!dateStr) return null;
  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.floor((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

/** How many days ahead we start flagging a document as "needs renewal". */
export const WARN_THRESHOLD_DAYS = 30;

/** True when a document date is missing, expired, or expiring within the
 *  warn threshold. The canonical "should this truck/driver show a warning
 *  badge?" check. */
export function needsAttention(dateStr: string | null | undefined): boolean {
  if (!dateStr) return true;
  const days = daysUntil(dateStr);
  return days !== null && days <= WARN_THRESHOLD_DAYS;
}
