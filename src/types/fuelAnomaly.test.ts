import { describe, it, expect } from 'vitest';
import { categoryOf, fixTargetFor } from './fuelAnomaly';

describe('categoryOf', () => {
  it('returns DATA_ERROR for rules that exclude entries from baseline', () => {
    expect(categoryOf('ODOMETER_ROLLBACK')).toBe('DATA_ERROR');
    expect(categoryOf('ODOMETER_NOT_ADVANCING')).toBe('DATA_ERROR');
    expect(categoryOf('VOLUME_EXCEEDS_TANK_CAPACITY')).toBe('DATA_ERROR');
    expect(categoryOf('IMPLAUSIBLE_VOLUME_FOR_TYPE')).toBe('DATA_ERROR');
    expect(categoryOf('PRICE_MATH_MISMATCH')).toBe('DATA_ERROR');
    expect(categoryOf('FUEL_TYPE_MISMATCH')).toBe('DATA_ERROR');
    expect(categoryOf('CONSUMPTION_UNDER_BASELINE')).toBe('DATA_ERROR');
  });

  it('returns BEHAVIOUR for behaviour rules', () => {
    expect(categoryOf('CONSUMPTION_OVER_BASELINE')).toBe('BEHAVIOUR');
    expect(categoryOf('RAPID_REFUEL')).toBe('BEHAVIOUR');
    expect(categoryOf('EXCESSIVE_DAILY_FREQUENCY')).toBe('BEHAVIOUR');
    expect(categoryOf('OFF_HOURS_PURCHASE')).toBe('BEHAVIOUR');
  });

  it('returns INFO for MISSING_BASELINE', () => {
    expect(categoryOf('MISSING_BASELINE')).toBe('INFO');
  });

  it('returns BEHAVIOUR for unknown rule codes (safer default)', () => {
    expect(categoryOf('FUTURE_RULE_NOT_YET_SHIPPED')).toBe('BEHAVIOUR');
  });
});

describe('fixTargetFor', () => {
  it('returns ENTRY for rules where the reading itself is wrong', () => {
    expect(fixTargetFor('ODOMETER_ROLLBACK')).toBe('ENTRY');
    expect(fixTargetFor('ODOMETER_NOT_ADVANCING')).toBe('ENTRY');
    expect(fixTargetFor('PRICE_MATH_MISMATCH')).toBe('ENTRY');
    expect(fixTargetFor('CONSUMPTION_UNDER_BASELINE')).toBe('ENTRY');
  });

  it('returns TRUCK for rules where truck config is the culprit', () => {
    expect(fixTargetFor('VOLUME_EXCEEDS_TANK_CAPACITY')).toBe('TRUCK');
    expect(fixTargetFor('IMPLAUSIBLE_VOLUME_FOR_TYPE')).toBe('TRUCK');
    expect(fixTargetFor('FUEL_TYPE_MISMATCH')).toBe('TRUCK');
  });

  it('returns null for Cat B / INFO rules', () => {
    expect(fixTargetFor('CONSUMPTION_OVER_BASELINE')).toBeNull();
    expect(fixTargetFor('RAPID_REFUEL')).toBeNull();
    expect(fixTargetFor('MISSING_BASELINE')).toBeNull();
  });
});
