import { useEffect, useState } from 'react';
import { useFleet } from '../contexts/FleetContext';
import { fuelAnomalyApi } from '../services/fuelAnomalyApi';
import { fuelReviewApi } from '../services/api';

/**
 * Best-effort aggregate count for the `Yakıt` top-nav badge.
 * Returns pending anomalies + unmatched plate groups.
 * Silently returns 0 when no fleetId, non-paid plan, or any fetch fails —
 * the badge is advisory, so an error should never break the nav.
 */
export function useFuelAlertsPendingCount(): number {
  const { fleetId, plan } = useFleet();
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!fleetId) return;
    // Mirrors the gate in ManagerTopNav — FREE plans don't see fuel routes,
    // so we skip the fetch entirely to avoid a 403 in the console.
    if (plan === 'FREE') return;

    let cancelled = false;

    const run = async () => {
      try {
        const [pending, counts] = await Promise.all([
          fuelAnomalyApi.listPending(fleetId).catch(() => []),
          fuelReviewApi.counts(fleetId).catch(() => null),
        ]);
        if (cancelled) return;
        const anomalies = Array.isArray(pending) ? pending.length : 0;
        const unmatched = counts?.unmatchedPlateGroups ?? 0;
        setCount(anomalies + unmatched);
      } catch {
        // Best-effort: keep current count (0) on unexpected error
      }
    };

    void run();
    return () => { cancelled = true; };
  }, [fleetId, plan]);

  return count;
}
