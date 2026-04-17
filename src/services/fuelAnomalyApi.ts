import { apiCall } from './api';
import type {
  AnomalyConfigResponse,
  AnomalyPendingItem,
  BulkDismissRequest,
  BulkDismissResult,
  BulkRecheckRequest,
  DismissRequest,
  FleetAnomalyRuleConfig,
  FleetAnomalyRuleConfigRequest,
  FleetAnomalySettings,
  FleetAnomalySettingsRequest,
  TruckAnomalyOverrideRequest,
  TruckAnomalyRuleOverride,
  TruckBaseline,
  TruckBaselineRequest,
} from '../types/fuelAnomaly';

export const fuelAnomalyApi = {
  // ─── Config ──────────────────────────────────────────────────────────────
  getConfig: (fleetId: string) =>
    apiCall<AnomalyConfigResponse>(`/fleets/${fleetId}/anomalies/config`),

  updateSettings: (fleetId: string, body: FleetAnomalySettingsRequest) =>
    apiCall<FleetAnomalySettings>(
      `/fleets/${fleetId}/anomalies/config/settings`,
      { method: 'PUT', body: JSON.stringify(body) }),

  updateRule: (fleetId: string, ruleCode: string, body: FleetAnomalyRuleConfigRequest) =>
    apiCall<FleetAnomalyRuleConfig>(
      `/fleets/${fleetId}/anomalies/config/rules/${ruleCode}`,
      { method: 'PUT', body: JSON.stringify(body) }),

  // ─── Per-truck overrides ─────────────────────────────────────────────────
  getOverrides: (fleetId: string, truckId: string) =>
    apiCall<TruckAnomalyRuleOverride[]>(
      `/fleets/${fleetId}/anomalies/trucks/${truckId}/overrides`),

  upsertOverride: (fleetId: string, truckId: string, ruleCode: string, body: TruckAnomalyOverrideRequest) =>
    apiCall<TruckAnomalyRuleOverride>(
      `/fleets/${fleetId}/anomalies/trucks/${truckId}/overrides/${ruleCode}`,
      { method: 'PUT', body: JSON.stringify(body) }),

  deleteOverride: (fleetId: string, truckId: string, ruleCode: string) =>
    apiCall<void>(
      `/fleets/${fleetId}/anomalies/trucks/${truckId}/overrides/${ruleCode}`,
      { method: 'DELETE' }),

  // ─── Recheck ─────────────────────────────────────────────────────────────
  recheckEntry: (fleetId: string, entryId: string) =>
    apiCall<void>(`/fleets/${fleetId}/anomalies/recheck-entry/${entryId}`, { method: 'POST' }),

  recheckTruck: (fleetId: string, truckId: string) =>
    apiCall<void>(`/fleets/${fleetId}/anomalies/recheck-truck/${truckId}`, { method: 'POST' }),

  // ─── Review ──────────────────────────────────────────────────────────────
  listPending: (fleetId: string) =>
    apiCall<AnomalyPendingItem[]>(`/fleets/${fleetId}/anomalies/pending`),

  confirm: (fleetId: string, anomalyId: string) =>
    apiCall<void>(`/fleets/${fleetId}/anomalies/${anomalyId}/confirm`, { method: 'POST' }),

  dismiss: (fleetId: string, anomalyId: string, body: DismissRequest) =>
    apiCall<void>(
      `/fleets/${fleetId}/anomalies/${anomalyId}/dismiss`,
      { method: 'POST', body: JSON.stringify(body) }),

  // ─── Bulk ops ────────────────────────────────────────────────────────────
  bulkDismiss: (fleetId: string, body: BulkDismissRequest) =>
    apiCall<BulkDismissResult>(
      `/fleets/${fleetId}/anomalies/bulk-dismiss`,
      { method: 'POST', body: JSON.stringify(body) }),

  bulkRecheck: (fleetId: string, body: BulkRecheckRequest) =>
    apiCall<{ rechecked: number }>(
      `/fleets/${fleetId}/anomalies/bulk-recheck`,
      { method: 'POST', body: JSON.stringify(body) }),

  // ─── Truck baseline ──────────────────────────────────────────────────────
  getBaseline: (fleetId: string, truckId: string) =>
    apiCall<TruckBaseline>(`/fleets/${fleetId}/anomalies/trucks/${truckId}/baseline`),

  updateBaseline: (fleetId: string, truckId: string, body: TruckBaselineRequest) =>
    apiCall<TruckBaseline>(
      `/fleets/${fleetId}/anomalies/trucks/${truckId}/baseline`,
      { method: 'PUT', body: JSON.stringify(body) }),
};
