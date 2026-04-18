import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type { ReactNode } from 'react';
import { driverApi, truckApi } from '../services/api';
import { useFleet } from './FleetContext';
import type { Driver, Truck } from '../types';

/**
 * Shared in-memory roster for the manager surface. One fetch per fleet feeds
 * every consumer that needs the full trucks/drivers list: dashboard warning
 * groups, top-nav attention badges, etc. Mutation sites call `refresh()` to
 * invalidate after adding a truck, uploading a doc, saving a certificate —
 * badges then update live without a page reload.
 */
interface FleetRosterValue {
  trucks: Truck[];
  drivers: Driver[];
  loading: boolean;
  refresh: () => void;
}

const DEFAULT_VALUE: FleetRosterValue = {
  trucks: [],
  drivers: [],
  loading: false,
  refresh: () => {},
};

const FleetRosterContext = createContext<FleetRosterValue>(DEFAULT_VALUE);

export function FleetRosterProvider({ children }: { children: ReactNode }) {
  const { fleetId } = useFleet();
  const [trucks, setTrucks] = useState<Truck[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchRoster = useCallback(async () => {
    if (!fleetId) {
      setTrucks([]);
      setDrivers([]);
      return;
    }
    setLoading(true);
    try {
      const [trucksPage, driversPage] = await Promise.all([
        truckApi.getByFleet(0, 1000),
        driverApi.getByFleet(0, 1000),
      ]);
      setTrucks(trucksPage.content as Truck[]);
      setDrivers(driversPage.content as Driver[]);
    } catch {
      // Best-effort: keep prior state on failure
    } finally {
      setLoading(false);
    }
  }, [fleetId]);

  useEffect(() => {
    void fetchRoster();
  }, [fetchRoster]);

  const value = useMemo<FleetRosterValue>(
    () => ({
      trucks,
      drivers,
      loading,
      refresh: () => void fetchRoster(),
    }),
    [trucks, drivers, loading, fetchRoster],
  );

  return (
    <FleetRosterContext.Provider value={value}>{children}</FleetRosterContext.Provider>
  );
}

export function useFleetRoster(): FleetRosterValue {
  return useContext(FleetRosterContext);
}
