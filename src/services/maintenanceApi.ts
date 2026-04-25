import { apiCall } from './api';
import type {
  MaintenanceDueResponse,
  MaintenanceRecordDto,
  MaintenanceRecordRequest,
  MaintenanceScheduleDto,
  MaintenanceScheduleRequest,
} from '../types/maintenance';

/**
 * Step 1: dashboard aggregator (due).
 * Step 2: schedule CRUD + record logging methods added below.
 */
export const maintenanceApi = {
  due: (fleetId: string, withinDays = 30) =>
    apiCall<MaintenanceDueResponse>(
      `/fleets/${fleetId}/maintenance/due?withinDays=${withinDays}`,
    ),

  listSchedules: (fleetId: string, truckId: string) =>
    apiCall<MaintenanceScheduleDto[]>(
      `/fleets/${fleetId}/maintenance/trucks/${truckId}/schedules`,
    ),

  createSchedule: (fleetId: string, truckId: string, body: MaintenanceScheduleRequest) =>
    apiCall<MaintenanceScheduleDto>(
      `/fleets/${fleetId}/maintenance/trucks/${truckId}/schedules`,
      { method: 'POST', body: JSON.stringify(body) },
    ),

  updateSchedule: (
    fleetId: string,
    truckId: string,
    scheduleId: string,
    body: MaintenanceScheduleRequest,
  ) =>
    apiCall<MaintenanceScheduleDto>(
      `/fleets/${fleetId}/maintenance/trucks/${truckId}/schedules/${scheduleId}`,
      { method: 'PUT', body: JSON.stringify(body) },
    ),

  deleteSchedule: (fleetId: string, truckId: string, scheduleId: string) =>
    apiCall<void>(
      `/fleets/${fleetId}/maintenance/trucks/${truckId}/schedules/${scheduleId}`,
      { method: 'DELETE' },
    ),

  listRecords: (fleetId: string, truckId: string) =>
    apiCall<MaintenanceRecordDto[]>(
      `/fleets/${fleetId}/maintenance/trucks/${truckId}/records`,
    ),

  logRecord: (
    fleetId: string,
    truckId: string,
    scheduleId: string,
    body: MaintenanceRecordRequest,
  ) =>
    apiCall<MaintenanceRecordDto>(
      `/fleets/${fleetId}/maintenance/trucks/${truckId}/schedules/${scheduleId}/records`,
      { method: 'POST', body: JSON.stringify(body) },
    ),
};
