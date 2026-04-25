import { describe, it, expect } from 'vitest';
import { severityForWarning, worstSeverity, severityFromDays, MANDATORY_TRUCK_DOCS, MANDATORY_DRIVER_DOCS } from './severity';
import type { EntityWarning } from '../types/entityWarning';

describe('severityFromDays', () => {
  it('returns CRITICAL for ≤7 days or overdue', () => {
    expect(severityFromDays(7)).toBe('CRITICAL');
    expect(severityFromDays(0)).toBe('CRITICAL');
    expect(severityFromDays(-3)).toBe('CRITICAL');
  });

  it('returns WARNING for 8–30 days', () => {
    expect(severityFromDays(8)).toBe('WARNING');
    expect(severityFromDays(25)).toBe('WARNING');
    expect(severityFromDays(30)).toBe('WARNING');
  });

  it('returns INFO for >30 days', () => {
    expect(severityFromDays(31)).toBe('INFO');
    expect(severityFromDays(365)).toBe('INFO');
  });
});

describe('severityForWarning', () => {
  it('CRITICAL for doc with ≤7 days remaining', () => {
    const w: EntityWarning = { kind: 'doc', severity: 'CRITICAL', labelKey: 'doc.x', daysLeft: 5, isMandatory: true };
    expect(severityForWarning(w)).toBe('CRITICAL');
  });

  it('CRITICAL for missing-mandatory doc', () => {
    const w: EntityWarning = { kind: 'doc', severity: 'CRITICAL', labelKey: 'doc.x', daysLeft: null, isMandatory: true };
    expect(severityForWarning(w)).toBe('CRITICAL');
  });

  it('INFO for missing-optional doc', () => {
    const w: EntityWarning = { kind: 'doc', severity: 'INFO', labelKey: 'doc.x', daysLeft: null, isMandatory: false };
    expect(severityForWarning(w)).toBe('INFO');
  });

  it('passes through fuel/maintenance severities verbatim', () => {
    const fuel: EntityWarning = { kind: 'fuel', severity: 'WARNING', ruleCode: 'X', detectedAt: '2026-04-25T00:00:00Z', anomalyId: 'a' };
    expect(severityForWarning(fuel)).toBe('WARNING');
    const maint: EntityWarning = { kind: 'maintenance', severity: 'CRITICAL', label: 'Motor', daysLeft: 3, scheduleId: 's', reason: 'TIME' };
    expect(severityForWarning(maint)).toBe('CRITICAL');
  });
});

describe('worstSeverity', () => {
  it('returns CRITICAL when any warning is critical', () => {
    const warnings: EntityWarning[] = [
      { kind: 'doc', severity: 'INFO', labelKey: 'd', daysLeft: 50, isMandatory: false },
      { kind: 'doc', severity: 'CRITICAL', labelKey: 'd', daysLeft: 1, isMandatory: true },
    ];
    expect(worstSeverity(warnings)).toBe('CRITICAL');
  });

  it('returns WARNING when no critical but any warning', () => {
    const warnings: EntityWarning[] = [
      { kind: 'doc', severity: 'INFO', labelKey: 'd', daysLeft: 50, isMandatory: false },
      { kind: 'doc', severity: 'WARNING', labelKey: 'd', daysLeft: 20, isMandatory: true },
    ];
    expect(worstSeverity(warnings)).toBe('WARNING');
  });

  it('returns INFO for empty list', () => {
    expect(worstSeverity([])).toBe('INFO');
  });
});

describe('mandatory doc constants', () => {
  it('truck mandatories cover insurance + inspection', () => {
    expect(MANDATORY_TRUCK_DOCS).toContain('compulsoryInsurance');
    expect(MANDATORY_TRUCK_DOCS).toContain('comprehensiveInsurance');
    expect(MANDATORY_TRUCK_DOCS).toContain('inspection');
  });
  it('driver mandatories cover license', () => {
    expect(MANDATORY_DRIVER_DOCS).toContain('license');
  });
});
