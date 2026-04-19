// Severity and its tailwind class map live in ../severity so document
// warnings can reuse them without importing anything fuel-specific. Re-
// exported here for back-compat with existing fuel-alert consumers.
export type { Severity } from './severity';
export { SEVERITY_DOT_CLASS } from './severity';
import type { Severity } from './severity';

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

/** Rules where confirming "Gerçek sorun" flips
 *  {@code FuelEntry.excludedFromBaseline=true} on the backend — the reading
 *  itself is known-wrong and should stop contributing to the rolling
 *  consumption average. Mirrors RuleConfirmPolicy.EXCLUDE_ON_CONFIRM on the
 *  backend; keep the two lists in sync.
 *
 *  Used by the detail modal to pick the right "what happens when you confirm"
 *  hint: data-broken rules promise "excluded from consumption average",
 *  behaviour rules say "doesn't affect the average; just recorded". */
export const RULES_EXCLUDE_ENTRY_ON_CONFIRM: ReadonlySet<string> = new Set<RuleCode>([
  'ODOMETER_ROLLBACK',
  'ODOMETER_NOT_ADVANCING',
  'VOLUME_EXCEEDS_TANK_CAPACITY',
  'IMPLAUSIBLE_VOLUME_FOR_TYPE',
  'PRICE_MATH_MISMATCH',
  'FUEL_TYPE_MISMATCH',
  'CONSUMPTION_UNDER_BASELINE',
]);

export function excludesEntryOnConfirm(ruleCode: string): boolean {
  return RULES_EXCLUDE_ENTRY_ON_CONFIRM.has(ruleCode);
}

export type AnomalyCategory = 'DATA_ERROR' | 'BEHAVIOUR' | 'INFO';

/** Classify a rule for the triage UI. DATA_ERROR mirrors the backend's
 *  EXCLUDE_ON_CONFIRM set — entries are auto-excluded from baseline on
 *  detection. BEHAVIOUR rules are real events that stay in analytics.
 *  INFO is a single-member set: MISSING_BASELINE (info-only). */
export function categoryOf(ruleCode: string): AnomalyCategory {
  if (excludesEntryOnConfirm(ruleCode)) return 'DATA_ERROR';
  if (ruleCode === 'MISSING_BASELINE') return 'INFO';
  return 'BEHAVIOUR';
}

export type FixTarget = 'ENTRY' | 'TRUCK';

/** Where the manager should go to fix the underlying data for a Cat A rule.
 *  ENTRY rules point at the fuel entry itself (reading was typed wrong).
 *  TRUCK rules point at truck settings (tank capacity / fuel type wrong).
 *  Returns null for Cat B / INFO rules (no "fix" primary action). */
export function fixTargetFor(ruleCode: string): FixTarget | null {
  switch (ruleCode) {
    case 'ODOMETER_ROLLBACK':
    case 'ODOMETER_NOT_ADVANCING':
    case 'PRICE_MATH_MISMATCH':
    case 'CONSUMPTION_UNDER_BASELINE':
      return 'ENTRY';
    case 'VOLUME_EXCEEDS_TANK_CAPACITY':
    case 'IMPLAUSIBLE_VOLUME_FOR_TYPE':
    case 'FUEL_TYPE_MISMATCH':
      return 'TRUCK';
    default:
      return null;
  }
}

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

/** GET /trucks/{truckId}/baseline response.
 *  Jackson serialises BigDecimal as a JSON *number* by default, so `manual`
 *  and `derived` arrive as numbers over the wire — not strings. Callers
 *  must coerce to string explicitly before passing to anything that expects
 *  a string (text inputs, `.trim()`, concatenation). Use {@link formatDecimal}
 *  for display. */
export interface TruckBaseline {
  manual: number | null;        // BigDecimal
  derived: number | null;       // BigDecimal
  /** How `derived` was computed. AGGREGATE = rough estimate from sparse
   *  odometer data; PAIR = confident multi-interval rolling average; null
   *  when derived is null. */
  derivedMethod: 'PAIR' | 'AGGREGATE' | null;
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
