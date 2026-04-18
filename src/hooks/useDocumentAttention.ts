import { useMemo } from 'react';
import { useFleetRoster } from '../contexts/FleetRosterContext';
import { computeTruckWarnings } from '../utils/truckWarnings';
import { computeDriverWarnings } from '../utils/driverWarnings';
import { todayMidnightMs } from '../utils/expiry';

export interface AttentionCounts {
  trucksWithWarnings: number;
  driversWithWarnings: number;
}

/**
 * Per-entity attention count for nav badges. Reads from the shared
 * {@link useFleetRoster} — no own fetch, no stale state: mutation flows call
 * `roster.refresh()` after adding a truck / uploading a doc / saving a cert
 * and the badge re-counts on the next render.
 *
 * Returns the number of trucks/drivers that have at least one
 * expiring-or-missing document. A truck with 5 issues is still one truck to
 * click on — matches the "inbox count" semantics of the Yakıt badge.
 */
export function useDocumentAttention(): AttentionCounts {
  const { trucks, drivers } = useFleetRoster();
  return useMemo(() => {
    const todayMs = todayMidnightMs();
    let trucksWithWarnings = 0;
    for (const t of trucks) {
      if (computeTruckWarnings(t, todayMs).length > 0) trucksWithWarnings++;
    }
    let driversWithWarnings = 0;
    for (const d of drivers) {
      if (computeDriverWarnings(d, todayMs).length > 0) driversWithWarnings++;
    }
    return { trucksWithWarnings, driversWithWarnings };
  }, [trucks, drivers]);
}
