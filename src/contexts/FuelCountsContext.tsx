import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type { ReactNode } from 'react';
import { useFleet } from './FleetContext';
import { fuelAnomalyApi } from '../services/fuelAnomalyApi';
import { fuelReviewApi } from '../services/api';
import type { Severity } from '../types/severity';
import { worstSeverity } from '../types/severity';
import type { AnomalyPendingItem } from '../types/fuelAnomaly';

/**
 * Shared pending-item counts for the fuel section so the top-nav badge and
 * the sub-nav badges derive from a single fetch. Consumers pick the slice
 * they need:
 *   - top-level Yakıt badge    → `total` (pending anomalies + unmatched plates)
 *   - sub-nav Uyarılar tab     → `pending` (anomalies only)
 *   - sub-nav Bekleyenler tab  → `unmatched` (plate groups only)
 *   - dashboard priority card  → `worstPendingSeverity` + `pendingBreakdown`
 *     so the fuel row's tone (red / amber / blue) matches the anomalies
 *     behind it instead of rendering a flat info-blue pointer.
 *
 * After a mutation (confirm/dismiss), call `refresh()` so badges don't go
 * stale. Best-effort: fetch failures leave the current counts alone.
 */
export interface FuelPendingBreakdown {
  critical: number;
  warning: number;
  info: number;
}

interface FuelCountsValue {
  pending: number;
  unmatched: number;
  total: number;
  /** Worst severity across the pending anomaly list. `null` when the pending
   *  list is empty — callers should fall back to `info` tone (the remaining
   *  `total` in that case comes from unmatched plates, which carry no
   *  severity of their own). */
  worstPendingSeverity: Severity | null;
  pendingBreakdown: FuelPendingBreakdown;
  /** Raw list of pending anomaly items, exposed so per-truck surfaces can
   *  filter without an extra round-trip. */
  pendingItems: AnomalyPendingItem[];
  refresh: () => void;
}

const EMPTY_BREAKDOWN: FuelPendingBreakdown = { critical: 0, warning: 0, info: 0 };

const DEFAULT_VALUE: FuelCountsValue = {
  pending: 0,
  unmatched: 0,
  total: 0,
  worstPendingSeverity: null,
  pendingBreakdown: EMPTY_BREAKDOWN,
  pendingItems: [],
  refresh: () => {},
};

const FuelCountsContext = createContext<FuelCountsValue>(DEFAULT_VALUE);

export function FuelCountsProvider({ children }: { children: ReactNode }) {
  const { fleetId, plan } = useFleet();
  const [pending, setPending] = useState(0);
  const [unmatched, setUnmatched] = useState(0);
  const [worstPendingSeverity, setWorstPendingSeverity] = useState<Severity | null>(null);
  const [pendingBreakdown, setPendingBreakdown] = useState<FuelPendingBreakdown>(EMPTY_BREAKDOWN);
  const [pendingItems, setPendingItems] = useState<AnomalyPendingItem[]>([]);

  const fetchCounts = useCallback(async () => {
    if (!fleetId || plan === 'FREE') {
      setPending(0);
      setUnmatched(0);
      setWorstPendingSeverity(null);
      setPendingBreakdown(EMPTY_BREAKDOWN);
      setPendingItems([]);
      return;
    }
    const [anomalies, counts] = await Promise.all([
      fuelAnomalyApi.listPending(fleetId).catch(() => []),
      fuelReviewApi.counts(fleetId).catch(() => null),
    ]);
    const list = Array.isArray(anomalies) ? anomalies : [];
    setPending(list.length);
    setUnmatched(counts?.unmatchedPlateGroups ?? 0);

    // Single-pass breakdown + worst — the list can be a few hundred items
    // after a fresh import, so avoid repeated filters.
    const breakdown: FuelPendingBreakdown = { critical: 0, warning: 0, info: 0 };
    const severities: Severity[] = [];
    for (const a of list) {
      const s = a?.severity;
      if (s === 'CRITICAL') breakdown.critical += 1;
      else if (s === 'WARNING') breakdown.warning += 1;
      else if (s === 'INFO') breakdown.info += 1;
      if (s) severities.push(s);
    }
    setPendingBreakdown(breakdown);
    setWorstPendingSeverity(worstSeverity(severities) ?? null);
    setPendingItems(list);
  }, [fleetId, plan]);

  useEffect(() => {
    void fetchCounts();
  }, [fetchCounts]);

  // Stabilize the refresh function identity so consumer components that put
  // `refresh` in their useCallback/useEffect deps don't fire twice on mount.
  // Previously `refresh: () => void fetchCounts()` was inlined into the
  // value useMemo — when pending/unmatched updated after the first fetch,
  // the memo re-ran and emitted a new refresh identity, which propagated
  // to FuelAlertsPage and triggered a redundant listPending round-trip.
  const refresh = useCallback(() => void fetchCounts(), [fetchCounts]);

  const value = useMemo<FuelCountsValue>(
    () => ({
      pending,
      unmatched,
      total: pending + unmatched,
      worstPendingSeverity,
      pendingBreakdown,
      pendingItems,
      refresh,
    }),
    [pending, unmatched, worstPendingSeverity, pendingBreakdown, pendingItems, refresh],
  );

  return (
    <FuelCountsContext.Provider value={value}>
      {children}
    </FuelCountsContext.Provider>
  );
}

export function useFuelCounts(): FuelCountsValue {
  return useContext(FuelCountsContext);
}
