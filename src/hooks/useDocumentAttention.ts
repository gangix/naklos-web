import { useState, useEffect } from 'react';
import { truckApi, driverApi } from '../services/api';
import { useFleet } from '../contexts/FleetContext';
import { needsAttention } from '../utils/expiry';
import type { Truck, Driver } from '../types';

export interface AttentionCounts {
  trucksWithWarnings: number;
  driversWithWarnings: number;
}

/**
 * Per-entity attention count for nav badges. Returns the number of trucks /
 * drivers that have at least one expiring-or-missing document — NOT the total
 * document count. A truck with 5 issues is still one truck to click on.
 *
 * Matches the "inbox count" semantics used elsewhere in the nav (Yakıt badge
 * = fuel items). Dashboard page shows the per-entity detail list separately.
 */
export function useDocumentAttention(): AttentionCounts {
  const { fleetId } = useFleet();
  const [counts, setCounts] = useState<AttentionCounts>({
    trucksWithWarnings: 0,
    driversWithWarnings: 0,
  });

  useEffect(() => {
    if (!fleetId) {
      setCounts({ trucksWithWarnings: 0, driversWithWarnings: 0 });
      return;
    }

    let cancelled = false;

    const run = async () => {
      try {
        const [trucksPage, driversPage] = await Promise.all([
          truckApi.getByFleet(0, 1000),
          driverApi.getByFleet(0, 1000),
        ]);
        if (cancelled) return;

        const trucks = trucksPage.content as Truck[];
        const drivers = driversPage.content as Driver[];

        let trucksWithWarnings = 0;
        for (const t of trucks) {
          if (
            needsAttention(t.compulsoryInsuranceExpiry) ||
            needsAttention(t.comprehensiveInsuranceExpiry) ||
            needsAttention(t.inspectionExpiry)
          ) {
            trucksWithWarnings++;
          }
        }

        let driversWithWarnings = 0;
        for (const d of drivers) {
          const src = d.certificates?.find((c) => c.type === 'SRC');
          const cpc = d.certificates?.find((c) => c.type === 'CPC');
          if (
            needsAttention(d.licenseExpiryDate) ||
            needsAttention(src?.expiryDate) ||
            needsAttention(cpc?.expiryDate)
          ) {
            driversWithWarnings++;
          }
        }

        setCounts({ trucksWithWarnings, driversWithWarnings });
      } catch {
        // Best-effort badge; keep current counts on error
      }
    };

    void run();
    return () => { cancelled = true; };
  }, [fleetId]);

  return counts;
}
