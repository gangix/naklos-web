import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { fleetApi } from '../services/api';

interface Fleet {
  id: string;
  name: string;
  taxId: string;
  email: string;
  phone: string;
  defaultCurrency: string;
  plan: string;
}

interface FleetContextType {
  fleetId: string | null;
  fleet: Fleet | null;
  plan: string;
  setFleetId: (id: string) => void;
  isLoading: boolean;
}

const FleetContext = createContext<FleetContextType | undefined>(undefined);

export const FleetProvider = ({ children }: { children: ReactNode }) => {
  const { isFleetManager } = useAuth();
  const storedFleetId = localStorage.getItem('naklos_fleet_id') || null;
  const [fleetId, setFleetIdState] = useState<string | null>(storedFleetId);
  const [fleet, setFleet] = useState<Fleet | null>(null);
  // If we booted with a stored fleetId we'll refetch its details on mount.
  // Start in loading state so consumers (e.g. App.tsx's fuel-route gate)
  // see the pending fetch on the very first render — otherwise plan
  // evaluates as 'FREE' (because fleet is still null), fuel routes don't
  // register and a direct-refresh of /manager/fuel-* flashes a 404 for a
  // beat before the post-commit useEffect flips this to true.
  const [isLoading, setIsLoading] = useState(Boolean(storedFleetId));

  const setFleetId = (id: string) => {
    setFleetIdState(id);
    localStorage.setItem('naklos_fleet_id', id);
  };

  // A user who is not a fleet manager cannot own a fleet.
  // Wipe any stale localStorage value from a previous session to prevent
  // the app from redirect-looping between /manager and /driver. Also
  // releases the loading flag — no fleet fetch is going to fire for
  // drivers or admins, so consumers shouldn't sit in a pending state.
  useEffect(() => {
    if (!isFleetManager) {
      if (fleetId) {
        localStorage.removeItem('naklos_fleet_id');
        setFleetIdState(null);
        setFleet(null);
      }
      setIsLoading(false);
    }
  }, [isFleetManager]);

  // Auto-discover fleet from backend when manager has no fleetId
  useEffect(() => {
    if (fleetId || !isFleetManager) return;

    setIsLoading(true);
    fleetApi.getMy()
      .then((data) => {
        const fleet = data as unknown as Fleet;
        setFleetId(fleet.id);
        setFleet(fleet);
        setIsLoading(false);
      })
      .catch(() => {
        // No fleet found — user will see the fleet setup page
        setIsLoading(false);
      });
  }, [isFleetManager]);

  // Fetch fleet details when fleetId is set
  useEffect(() => {
    if (!fleetId || !isFleetManager) return;
    if (fleet?.id === fleetId) return; // already loaded

    setIsLoading(true);
    fleetApi.getById(fleetId)
      .then((data) => {
        setFleet(data as unknown as Fleet);
        setIsLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch fleet:', err);
        // Clear stale localStorage if fleet no longer exists
        localStorage.removeItem('naklos_fleet_id');
        setFleetIdState(null);
        setFleet(null);
        setIsLoading(false);
      });
  }, [fleetId, isFleetManager]);

  return (
    <FleetContext.Provider value={{ fleetId, fleet, plan: fleet?.plan ?? 'FREE', setFleetId, isLoading }}>
      {children}
    </FleetContext.Provider>
  );
};

export const useFleet = () => {
  const context = useContext(FleetContext);
  if (!context) {
    throw new Error('useFleet must be used within FleetProvider');
  }
  return context;
};