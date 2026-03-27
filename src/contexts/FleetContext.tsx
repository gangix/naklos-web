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
}

interface FleetContextType {
  fleetId: string | null;
  fleet: Fleet | null;
  setFleetId: (id: string) => void;
  isLoading: boolean;
}

const FleetContext = createContext<FleetContextType | undefined>(undefined);

export const FleetProvider = ({ children }: { children: ReactNode }) => {
  const { isFleetManager } = useAuth();
  const [fleetId, setFleetIdState] = useState<string | null>(
    localStorage.getItem('naklos_fleet_id') || null
  );
  const [fleet, setFleet] = useState<Fleet | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const setFleetId = (id: string) => {
    setFleetIdState(id);
    localStorage.setItem('naklos_fleet_id', id);
  };

  // Auto-discover fleet from backend when manager has no fleetId
  useEffect(() => {
    if (fleetId || !isFleetManager) return;

    setIsLoading(true);
    fleetApi.getMy()
      .then((data: Fleet) => {
        setFleetId(data.id);
        setFleet(data);
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
      .then((data: Fleet) => {
        setFleet(data);
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
    <FleetContext.Provider value={{ fleetId, fleet, setFleetId, isLoading }}>
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