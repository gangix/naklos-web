import type { RuleCode } from '../types/fuelAnomaly';

/** How a threshold field is rendered + validated in the rule config UI. */
export type FieldKind = 'percent' | 'int' | 'time' | 'boolean';

export interface FieldDef {
  /** JSON key the backend reads (keep identical to the Java rule's `.path("x")`). */
  key: string;
  kind: FieldKind;
  /** i18n key for the field label. */
  labelKey: string;
  /** i18n key for a hint line under the label (optional). */
  hintKey?: string;
  /** Default emitted when the thresholdJson is null/missing — must match the
   *  backend rule's `defaultThresholdJson()` so the UI and the engine agree. */
  default: number | string | boolean;
  /** Bounds for `percent` / `int` fields. Clamped on save. */
  min?: number;
  max?: number;
  step?: number;
  /** Inline suffix text ("%", "saat", "L", …). Purely cosmetic. */
  unit?: string;
}

/** Declarative threshold schema per rule. Empty array → no threshold fields;
 *  the config-page row hides the "Ayarlar" expander entirely.
 *
 *  Keys + defaults mirror each rule's Java implementation
 *  ({@code application/anomaly/rules/*.java}); changing one side without the
 *  other produces silent drift between engine behaviour and the config UI. */
export const RULE_SCHEMAS: Record<RuleCode, FieldDef[]> = {
  ODOMETER_ROLLBACK: [],
  FUEL_TYPE_MISMATCH: [],
  VOLUME_EXCEEDS_TANK_CAPACITY: [
    {
      key: 'tolerancePct',
      kind: 'percent',
      labelKey: 'fuelAlerts.config.fields.tolerancePct.label',
      hintKey: 'fuelAlerts.config.fields.tolerancePct.hintTank',
      default: 5,
      min: 0,
      max: 50,
      step: 1,
      unit: '%',
    },
  ],
  CONSUMPTION_OVER_BASELINE: [
    {
      key: 'tolerancePct',
      kind: 'percent',
      labelKey: 'fuelAlerts.config.fields.tolerancePct.label',
      hintKey: 'fuelAlerts.config.fields.tolerancePct.hintOver',
      default: 30,
      min: 0,
      max: 200,
      step: 5,
      unit: '%',
    },
  ],
  CONSUMPTION_UNDER_BASELINE: [
    {
      key: 'tolerancePct',
      kind: 'percent',
      labelKey: 'fuelAlerts.config.fields.tolerancePct.label',
      hintKey: 'fuelAlerts.config.fields.tolerancePct.hintUnder',
      default: 50,
      min: 0,
      max: 200,
      step: 5,
      unit: '%',
    },
    {
      key: 'minDeltaKm',
      kind: 'int',
      labelKey: 'fuelAlerts.config.fields.minDeltaKm.label',
      hintKey: 'fuelAlerts.config.fields.minDeltaKm.hint',
      default: 500,
      min: 0,
      max: 5000,
      step: 50,
      unit: 'km',
    },
  ],
  RAPID_REFUEL: [
    {
      key: 'windowHours',
      kind: 'int',
      labelKey: 'fuelAlerts.config.fields.windowHours.label',
      hintKey: 'fuelAlerts.config.fields.windowHours.hint',
      default: 5,
      min: 1,
      max: 24,
      step: 1,
      unit: 'fuelAlerts.config.units.hours',
    },
  ],
  EXCESSIVE_DAILY_FREQUENCY: [
    {
      key: 'maxPerDay',
      kind: 'int',
      labelKey: 'fuelAlerts.config.fields.maxPerDay.label',
      hintKey: 'fuelAlerts.config.fields.maxPerDay.hint',
      default: 2,
      min: 1,
      max: 20,
      step: 1,
      unit: 'fuelAlerts.config.units.timesPerDay',
    },
  ],
  OFF_HOURS_PURCHASE: [
    {
      key: 'weekdayStart',
      kind: 'time',
      labelKey: 'fuelAlerts.config.fields.weekdayStart.label',
      default: '06:00',
    },
    {
      key: 'weekdayEnd',
      kind: 'time',
      labelKey: 'fuelAlerts.config.fields.weekdayEnd.label',
      default: '22:00',
    },
    {
      key: 'includeWeekends',
      kind: 'boolean',
      labelKey: 'fuelAlerts.config.fields.includeWeekends.label',
      hintKey: 'fuelAlerts.config.fields.includeWeekends.hint',
      default: false,
    },
  ],
  ODOMETER_NOT_ADVANCING: [
    {
      key: 'minLitersThreshold',
      kind: 'int',
      labelKey: 'fuelAlerts.config.fields.minLitersThreshold.label',
      hintKey: 'fuelAlerts.config.fields.minLitersThreshold.hint',
      default: 10,
      min: 0,
      max: 500,
      step: 5,
      unit: 'L',
    },
  ],
  IMPLAUSIBLE_VOLUME_FOR_TYPE: [
    {
      key: 'diesel',
      kind: 'int',
      labelKey: 'fuelAlerts.config.fields.implausibleDiesel.label',
      default: 800,
      min: 0,
      max: 5000,
      step: 50,
      unit: 'L',
    },
    {
      key: 'gasoline',
      kind: 'int',
      labelKey: 'fuelAlerts.config.fields.implausibleGasoline.label',
      default: 200,
      min: 0,
      max: 2000,
      step: 10,
      unit: 'L',
    },
    {
      key: 'adblue',
      kind: 'int',
      labelKey: 'fuelAlerts.config.fields.implausibleAdblue.label',
      default: 50,
      min: 0,
      max: 500,
      step: 5,
      unit: 'L',
    },
  ],
  PRICE_MATH_MISMATCH: [
    {
      key: 'tolerancePct',
      kind: 'percent',
      labelKey: 'fuelAlerts.config.fields.tolerancePct.label',
      hintKey: 'fuelAlerts.config.fields.tolerancePct.hintPrice',
      default: 5,
      min: 0,
      max: 50,
      step: 1,
      unit: '%',
    },
  ],
  MISSING_BASELINE: [
    {
      key: 'minEntries',
      kind: 'int',
      labelKey: 'fuelAlerts.config.fields.minEntries.label',
      hintKey: 'fuelAlerts.config.fields.minEntries.hint',
      default: 5,
      min: 1,
      max: 50,
      step: 1,
      unit: 'fuelAlerts.config.units.entries',
    },
  ],
};

/** Map of field key → current value, as displayed/edited in the form. */
export type FieldValues = Record<string, number | string | boolean>;

/** Parse a stored `thresholdJson` into field values. Missing keys fall back to
 *  the schema default so the form is always fully populated. */
export function parseThresholdJson(
  ruleCode: RuleCode,
  json: string | null | undefined,
): FieldValues {
  const schema = RULE_SCHEMAS[ruleCode];
  const parsed = safeParse(json);
  const out: FieldValues = {};
  for (const field of schema) {
    const v = parsed[field.key];
    // Stored JSON is untyped; a non-scalar (object/array) would silently
    // corrupt boolean/time fields downstream — fall back to default instead.
    out[field.key] =
      typeof v === 'number' || typeof v === 'string' || typeof v === 'boolean'
        ? v
        : field.default;
  }
  return out;
}

/** Clamp + round values to their schema bounds. Used on save and when
 *  syncing local form state back to the server's canonical view. */
export function normalizeThresholdValues(
  ruleCode: RuleCode,
  values: FieldValues,
): FieldValues {
  const schema = RULE_SCHEMAS[ruleCode];
  const out: FieldValues = {};
  for (const field of schema) {
    out[field.key] = normalizeFieldValue(field, values[field.key]);
  }
  return out;
}

/** Serialize field values back to a JSON string (or null when the rule has no
 *  threshold fields). */
export function serializeThresholdJson(
  ruleCode: RuleCode,
  values: FieldValues,
): string | null {
  const schema = RULE_SCHEMAS[ruleCode];
  if (schema.length === 0) return null;
  return JSON.stringify(normalizeThresholdValues(ruleCode, values));
}

function normalizeFieldValue(
  field: FieldDef,
  raw: number | string | boolean | undefined,
): number | string | boolean {
  if (raw === undefined || raw === null) return field.default;
  if (field.kind === 'percent' || field.kind === 'int') {
    const n = typeof raw === 'number' ? raw : Number(raw);
    if (!Number.isFinite(n)) return field.default;
    let clamped = n;
    if (field.min !== undefined) clamped = Math.max(field.min, clamped);
    if (field.max !== undefined) clamped = Math.min(field.max, clamped);
    return Math.round(clamped);
  }
  if (field.kind === 'boolean') return Boolean(raw);
  return String(raw);
}

function safeParse(json: string | null | undefined): Record<string, unknown> {
  if (!json) return {};
  try {
    const v = JSON.parse(json);
    return v && typeof v === 'object' ? (v as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}
