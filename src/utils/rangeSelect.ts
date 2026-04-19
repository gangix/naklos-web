/** Compute the contiguous range of ids between an anchor (last-clicked id)
 *  and the current target, in visual order. Returns only the target when
 *  anchor is null, missing, or identical to target. Used by fuel-alerts
 *  shift-click range-select — Gmail/Finder semantics. */
export function computeShiftRange<T>(
  orderedIds: readonly T[],
  anchor: T | null,
  target: T,
): T[] {
  const targetIdx = orderedIds.indexOf(target);
  if (targetIdx < 0) return [];
  if (anchor === null) return [target];
  const anchorIdx = orderedIds.indexOf(anchor);
  if (anchorIdx < 0) return [target];
  const [from, to] = anchorIdx <= targetIdx
    ? [anchorIdx, targetIdx]
    : [targetIdx, anchorIdx];
  return orderedIds.slice(from, to + 1);
}
