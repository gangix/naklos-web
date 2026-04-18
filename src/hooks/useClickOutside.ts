import { useEffect, type RefObject } from 'react';

/** Fires `onOutside` when a mousedown lands outside the ref'd element.
 *  Only attaches the listener while `enabled` is true so closed dropdowns
 *  don't pay for every page click. Ref'd element may be null (e.g. not
 *  mounted yet) — we no-op until it's bound. */
export function useClickOutside<T extends HTMLElement>(
  enabled: boolean,
  ref: RefObject<T | null>,
  onOutside: () => void,
): void {
  useEffect(() => {
    if (!enabled) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onOutside();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [enabled, ref, onOutside]);
}
