import { apiCall } from './api';
import type {
  MaintenanceRecordDto,
  MaintenanceRecordRequest,
  MaintenanceScheduleDto,
} from '../types/maintenance';

/**
 * Driver-scoped maintenance endpoints. Mirrors driverFuelEntryApi pattern —
 * no fleetId / truckId in the URL because both are derived from the JWT.
 * Used only inside the driver portal (src/pages/driver/*).
 */
export const driverMaintenanceApi = {
  listSchedules: () =>
    apiCall<MaintenanceScheduleDto[]>('/driver/maintenance/schedules'),

  logRecord: (scheduleId: string, body: MaintenanceRecordRequest) =>
    apiCall<MaintenanceRecordDto>(
      `/driver/maintenance/schedules/${scheduleId}/records`,
      { method: 'POST', body: JSON.stringify(body) },
    ),
};
