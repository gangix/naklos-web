import { describe, it, expect } from 'vitest';
import { computeShiftRange } from './rangeSelect';

describe('computeShiftRange', () => {
  const ids = ['a', 'b', 'c', 'd', 'e'];

  it('returns [anchor,target] when anchor precedes target', () => {
    expect(computeShiftRange(ids, 'b', 'd')).toEqual(['b', 'c', 'd']);
  });

  it('returns [target,anchor] when target precedes anchor', () => {
    expect(computeShiftRange(ids, 'd', 'b')).toEqual(['b', 'c', 'd']);
  });

  it('returns [target] when anchor missing from list', () => {
    expect(computeShiftRange(ids, 'zzz', 'c')).toEqual(['c']);
  });

  it('returns [] when target missing from list', () => {
    expect(computeShiftRange(ids, 'a', 'zzz')).toEqual([]);
  });

  it('returns [target] when anchor is null (no prior selection)', () => {
    expect(computeShiftRange(ids, null, 'c')).toEqual(['c']);
  });

  it('handles anchor === target (single item)', () => {
    expect(computeShiftRange(ids, 'c', 'c')).toEqual(['c']);
  });
});
