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

/**
 * Shared pending-item counts for the fuel section so the top-nav badge and
 * the sub-nav badges derive from a single fetch. Consumers pick the slice
 * they need:
 *   - top-level Yakıt badge    → `total` (pending anomalies + unmatched plates)
 *   - sub-nav Uyarılar tab     → `pending` (anomalies only)
 *   - sub-nav Bekleyenler tab  → `unmatched` (plate groups only)
 *
 * After a mutation (confirm/dismiss), call `refresh()` so badges don't go
 * stale. Best-effort: fetch failures leave the current counts alone.
 */
interface FuelCountsValue {
  pending: number;
  unmatched: number;
  total: number;
  refresh: () => void;
}

const DEFAULT_VALUE: FuelCountsValue = {
  pending: 0,
  unmatched: 0,
  total: 0,
  refresh: () => {},
};

const FuelCountsContext = createContext<FuelCountsValue>(DEFAULT_VALUE);

export function FuelCountsProvider({ children }: { children: ReactNode }) {
  const { fleetId, plan } = useFleet();
  const [pending, setPending] = useState(0);
  const [unmatched, setUnmatched] = useState(0);

  const fetchCounts = useCallback(async () => {
    if (!fleetId || plan === 'FREE') {
      setPending(0);
      setUnmatched(0);
      return;
    }
    const [anomalies, counts] = await Promise.all([
      fuelAnomalyApi.listPending(fleetId).catch(() => []),
      fuelReviewApi.counts(fleetId).catch(() => null),
    ]);
    setPending(Array.isArray(anomalies) ? anomalies.length : 0);
    setUnmatched(counts?.unmatchedPlateGroups ?? 0);
  }, [fleetId, plan]);

  useEffect(() => {
    void fetchCounts();
  }, [fetchCounts]);

  const value = useMemo<FuelCountsValue>(
    () => ({
      pending,
      unmatched,
      total: pending + unmatched,
      refresh: () => void fetchCounts(),
    }),
    [pending, unmatched, fetchCounts],
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
