/** LRU of entities the user has recently opened. Surfaced as the empty-state
 *  of the ⌘K palette so "jump to my last truck" is instant. Persists to
 *  localStorage so it survives reloads. Capacity is intentionally small —
 *  the list is a shortcut, not a history log. */

export type RecentEntityType = 'truck' | 'driver';

export interface RecentEntity {
  type: RecentEntityType;
  id: string;
  /** Display label shown in the palette (plate or full name at the moment
   *  of the visit — snapshot so deletions don't break the list). */
  label: string;
  sublabel?: string;
  visitedAt: number;
}

const KEY = 'naklos.recentEntities';
const CAP = 5;

export function readRecent(): RecentEntity[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    // Tolerate shape drift — drop anything that doesn't match.
    return parsed.filter(
      (x): x is RecentEntity =>
        x && typeof x === 'object' &&
        (x.type === 'truck' || x.type === 'driver') &&
        typeof x.id === 'string' &&
        typeof x.label === 'string' &&
        typeof x.visitedAt === 'number',
    );
  } catch {
    return [];
  }
}

/** Record a visit — moves the entry to the top, dedupes on type+id, caps
 *  the list. Silent-no-ops if localStorage is unavailable (private browsing
 *  mode, Safari iframe sandboxing). */
export function pushRecent(entity: Omit<RecentEntity, 'visitedAt'>): void {
  try {
    const list = readRecent();
    const deduped = list.filter((e) => !(e.type === entity.type && e.id === entity.id));
    const next: RecentEntity[] = [{ ...entity, visitedAt: Date.now() }, ...deduped].slice(0, CAP);
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // Ignore — this is a convenience, not a correctness path.
  }
}

/** Remove all recent entries. Not wired to UI yet; useful for tests / manual
 *  resets via the devtools console. */
export function clearRecent(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // no-op
  }
}
