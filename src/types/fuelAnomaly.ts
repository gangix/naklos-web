export type Severity = 'CRITICAL' | 'WARNING' | 'INFO';

/** Tailwind bg-* class for the small severity dot used in chips, rule rows,
 *  and accordion summaries. Single source of truth — don't re-inline. */
export const SEVERITY_DOT_CLASS: Record<Severity, string> = {
  CRITICAL: 'bg-urgent-500',
  WARNING: 'bg-attention-500',
  INFO: 'bg-info-500',
};

/** i18n key per severity — mirrors SeverityBadge's label. */
export const SEVERITY_I18N_KEY: Record<Severity, string> = {
  CRITICAL: 'fuelAlerts.severity.urgent',
  WARNING: 'fuelAlerts.severity.attention',
  INFO: 'fuelAlerts.severity.info',
};

export type AnomalyStatus = 'PENDING' | 'CONFIRMED' | 'DISMISSED';
export type DismissalReason = 'FALSE_POSITIVE' | 'DATA_ENTRY_ERROR' | 'EXPLAINED_BY_DRIVER' | 'OTHER';
export type FuelType = 'DIESEL' | 'GASOLINE' | 'LPG' | 'ELECTRIC';

/** The 12 rule codes emitted by the backend engine, in UI display order
 *  (CRITICAL first, then WARNING, then INFO). Keep this ordering stable —
 *  the config page renders rules in this order. */
export const RULE_CODES = [
  'ODOMETER_ROLLBACK',              // CRITICAL
  'VOLUME_EXCEEDS_TANK_CAPACITY',   // CRITICAL
  'FUEL_TYPE_MISMATCH',             // CRITICAL
  'CONSUMPTION_OVER_BASELINE',      // WARNING
  'CONSUMPTION_UNDER_BASELINE',     // WARNING
  'RAPID_REFUEL',                   // WARNING
  'EXCESSIVE_DAILY_FREQUENCY',      // WARNING
  'OFF_HOURS_PURCHASE',             // WARNING
  'ODOMETER_NOT_ADVANCING',         // WARNING
  'IMPLAUSIBLE_VOLUME_FOR_TYPE',    // WARNING
  'PRICE_MATH_MISMATCH',            // WARNING
  'MISSING_BASELINE',               // INFO
] as const;
export type RuleCode = typeof RULE_CODES[number];

/** Default severity per rule — mirrors the Severity enum each rule returns
 *  on the backend. Used when you need the severity tone before a specific
 *  anomaly has been detected (e.g. the config page rule list). */
export const RULE_SEVERITY: Record<RuleCode, Severity> = {
  ODOMETER_ROLLBACK: 'CRITICAL',
  VOLUME_EXCEEDS_TANK_CAPACITY: 'CRITICAL',
  FUEL_TYPE_MISMATCH: 'CRITICAL',
  CONSUMPTION_OVER_BASELINE: 'WARNING',
  CONSUMPTION_UNDER_BASELINE: 'WARNING',
  RAPID_REFUEL: 'WARNING',
  EXCESSIVE_DAILY_FREQUENCY: 'WARNING',
  OFF_HOURS_PURCHASE: 'WARNING',
  ODOMETER_NOT_ADVANCING: 'WARNING',
  IMPLAUSIBLE_VOLUME_FOR_TYPE: 'WARNING',
  PRICE_MATH_MISMATCH: 'WARNING',
  MISSING_BASELINE: 'INFO',
};

/** Enriched PENDING row returned by GET /pending. Fields from the backend
 *  record FuelEntryAnomalyRepository.PendingItem. */
export interface AnomalyPendingItem {
  anomalyId: string;
  entryId: string;
  ruleCode: RuleCode | string;   // string fallback if backend adds rules later
  severity: Severity;
  detectedAt: string;
  contextJson: string | null;     // rule-specific JSON string (e.g. {"liters":"95.4","tankCapacityLiters":80})
  occurredAt: string | null;
  liters: string | null;          // BigDecimal as string
  totalPrice: string | null;
  reportedOdometerKm: number | null;
  hasReceipt: boolean;
  truckId: string | null;
  plate: string | null;           // canonical Truck.plateNumber or entry.plateTextRaw
  driverId: string | null;
  driverFirstName: string | null;
  driverLastName: string | null;
  driverPhone: string | null;
}

/** Fleet-level settings, matches FleetAnomalySettings entity. */
export interface FleetAnomalySettings {
  fleetId: string;
  enabled: boolean;
  digestHour: number;
  digestRecipients: string[];
  workingHoursJson: string;
  instantCriticalEmail: boolean;
  lastDigestSentAt: string | null;
  updatedAt: string;
}

export interface FleetAnomalySettingsRequest {
  enabled: boolean;
  digestHour?: number | null;
  digestRecipients?: string[] | null;
  workingHoursJson?: string | null;
  instantCriticalEmail: boolean;
}

/** Per-(fleet, rule) config. Backend returns composite key as nested object. */
export interface FleetAnomalyRuleConfig {
  id: { fleetId: string; ruleCode: string };
  enabled: boolean;
  notify: boolean;
  thresholdJson: string | null;
  updatedAt: string;
}

export interface FleetAnomalyRuleConfigRequest {
  enabled: boolean;
  notifyEnabled: boolean;
  thresholdJson?: string | null;
}

/** GET /config response shape. */
export interface AnomalyConfigResponse {
  settings: FleetAnomalySettings;
  rules: FleetAnomalyRuleConfig[];
}

/** Per-truck rule override. Composite key (truckId, ruleCode). */
export interface TruckAnomalyRuleOverride {
  id: { truckId: string; ruleCode: string };
  enabled: boolean;
  thresholdJson: string | null;
  updatedAt: string;
}

export interface TruckAnomalyOverrideRequest {
  enabled: boolean;
  thresholdJson?: string | null;
}

/** GET /trucks/{truckId}/baseline response. */
export interface TruckBaseline {
  manual: string | null;        // BigDecimal
  derived: string | null;       // BigDecimal
  recomputedAt: string | null;
  fuelType: FuelType | null;
  tankCapacityLiters: number | null;
}

export interface TruckBaselineRequest {
  expectedLPer100KmManual?: string | null;
  fuelType?: FuelType | null;
  tankCapacityLiters?: number | null;
}

export interface DismissRequest {
  reason: DismissalReason;
  note?: string | null;
}

export interface BulkDismissRequest {
  anomalyIds: string[];   // max 200
  reason: DismissalReason;
  note?: string | null;
}

export interface BulkDismissResult {
  dismissed: number;
  skipped: number;   // not PENDING
  notFound: number;  // id missing
}

export interface BulkRecheckRequest {
  anomalyIds: string[];   // max 200
}
