import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import keycloak from '../auth/keycloak';

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
  // For testing: Use a default fleet ID or get from localStorage
  const [fleetId, setFleetIdState] = useState<string | null>(
    localStorage.getItem('naklos_fleet_id') || null
  );
  const [fleet, setFleet] = useState<Fleet | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const setFleetId = (id: string) => {
    setFleetIdState(id);
    localStorage.setItem('naklos_fleet_id', id);
  };

  // Fetch fleet details when fleetId changes
  useEffect(() => {
    if (!fleetId) return;

    setIsLoading(true);
    fetch(`${import.meta.env.VITE_API_URL ?? 'http://localhost:8080/api'}/fleets/${fleetId}`, {
        headers: keycloak.token ? { Authorization: `Bearer ${keycloak.token}` } : {},
      })
      .then(res => res.json())
      .then(data => {
        setFleet(data);
        setIsLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch fleet:', err);
        setIsLoading(false);
      });
  }, [fleetId]);

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
