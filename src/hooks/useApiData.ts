import { useState, useEffect, useCallback } from 'react';
import { useFleet } from '../contexts/FleetContext';
import { truckApi, driverApi, clientApi, tripApi } from '../services/api';

interface UseApiDataResult<T> {
  data: T[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

// Generic hook for fetching data from API
// Fleet is derived from JWT on the backend — we just check fleetId exists locally
function useApiData<T>(
  fetchFn: () => Promise<T[]>,
  deps: any[] = []
): UseApiDataResult<T> {
  const { fleetId } = useFleet();
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!fleetId) {
      setData([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const result = await fetchFn();
      setData(result);
    } catch (err) {
      console.error('API Error:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [fleetId, ...deps]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refresh: fetchData };
}

// Specific hooks for each resource
export function useTrucks() {
  return useApiData(truckApi.getByFleet);
}

export function useDrivers() {
  return useApiData(driverApi.getByFleet);
}

export function useClients() {
  return useApiData(clientApi.getByFleet);
}

export function useTrips() {
  return useApiData(tripApi.getByFleet);
}

// Hook for available trucks
export function useAvailableTrucks() {
  return useApiData(truckApi.getAvailable);
}

// Hook for available drivers
export function useAvailableDrivers() {
  return useApiData(driverApi.getAvailable);
}