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
import { maintenanceApi } from '../services/maintenanceApi';
import type { MaintenanceDueGroup } from '../types/maintenance';

/**
 * Per-fleet "maintenance due soon" rollup for the dashboard priority briefing.
 * Mirrors FuelCountsContext: one fetch on fleet change, surfaced via a
 * stable refresh() that mutation sites (Step 2 schedule editor) call to
 * invalidate without a page reload.
 *
 * FREE plans skip the round-trip — BE also returns [] for FREE, but the
 * client gate spares an extra request on every dashboard mount.
 */
interface MaintenanceWarningsValue {
  groups: MaintenanceDueGroup[];
  loading: boolean;
  refresh: () => void;
}

const DEFAULT_VALUE: MaintenanceWarningsValue = {
  groups: [],
  loading: false,
  refresh: () => {},
};

const MaintenanceWarningsContext =
  createContext<MaintenanceWarningsValue>(DEFAULT_VALUE);

export function MaintenanceWarningsProvider({
  children,
}: {
  children: ReactNode;
}) {
  const { fleetId, plan } = useFleet();
  const [groups, setGroups] = useState<MaintenanceDueGroup[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchDue = useCallback(async () => {
    if (!fleetId || plan === 'FREE') {
      setGroups([]);
      return;
    }
    setLoading(true);
    try {
      const res = await maintenanceApi.due(fleetId).catch(() => null);
      setGroups(res?.groups ?? []);
    } finally {
      setLoading(false);
    }
  }, [fleetId, plan]);

  useEffect(() => {
    void fetchDue();
  }, [fetchDue]);

  const refresh = useCallback(() => void fetchDue(), [fetchDue]);

  const value = useMemo<MaintenanceWarningsValue>(
    () => ({ groups, loading, refresh }),
    [groups, loading, refresh],
  );

  return (
    <MaintenanceWarningsContext.Provider value={value}>
      {children}
    </MaintenanceWarningsContext.Provider>
  );
}

export function useMaintenanceWarnings(): MaintenanceWarningsValue {
  return useContext(MaintenanceWarningsContext);
}
