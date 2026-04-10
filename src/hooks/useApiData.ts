import { useState, useEffect, useCallback } from 'react';
import { useFleet } from '../contexts/FleetContext';
import { truckApi, driverApi, clientApi, tripApi, type PageResponse } from '../services/api';

interface UseApiDataResult<T> {
  data: T[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
  totalElements: number;
  totalPages: number;
  currentPage: number;
  setPage: (page: number) => void;
}

// Generic hook for fetching paginated data from API
function useApiData<T>(
  fetchFn: (page: number, size: number) => Promise<PageResponse<T>>,
  pageSize = 100, // default large page for backward compat
  deps: any[] = []
): UseApiDataResult<T> {
  const { fleetId } = useFleet();
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const fetchData = useCallback(async () => {
    if (!fleetId) {
      setData([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const result = await fetchFn(page, pageSize);
      setData(result.content);
      setTotalElements(result.totalElements);
      setTotalPages(result.totalPages);
    } catch (err) {
      console.error('API Error:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [fleetId, page, pageSize, ...deps]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refresh: fetchData, totalElements, totalPages, currentPage: page, setPage };
}

// Specific hooks for each resource
export function useTrucks() {
  return useApiData((page, size) => truckApi.getByFleet(page, size));
}

export function useDrivers() {
  return useApiData((page, size) => driverApi.getByFleet(page, size));
}

export function useClients() {
  return useApiData((page, size) => clientApi.getByFleet(page, size));
}

export function useTrips(status?: string) {
  return useApiData((page, size) => tripApi.getByFleet(status, page, size), 100, [status]);
}

// Hook for available trucks
export function useAvailableTrucks() {
  return useApiData((page, size) => truckApi.getAvailable(page, size));
}

// Hook for available drivers
export function useAvailableDrivers() {
  return useApiData((page, size) => driverApi.getAvailable(page, size));
}
