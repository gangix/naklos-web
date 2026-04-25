import { apiCall } from './api';
import type { MaintenanceDueResponse } from '../types/maintenance';

/**
 * Step 1 surface: dashboard aggregator only. Schedule CRUD + record logging
 * lives behind the same /maintenance prefix on the BE — those are added here
 * when the Step 2 schedule editor lands.
 */
export const maintenanceApi = {
  due: (fleetId: string, withinDays = 30) =>
    apiCall<MaintenanceDueResponse>(
      `/fleets/${fleetId}/maintenance/due?withinDays=${withinDays}`,
    ),
};
