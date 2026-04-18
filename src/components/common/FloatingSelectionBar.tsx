import { X } from 'lucide-react';
import type { ReactNode } from 'react';
import '../fuel-alerts/fuelAlertsAnimations.css';

interface Props {
  /** Number of items currently selected. Renders nothing when ≤ 0 so the bar
   *  fully unmounts on empty selection and re-animates on first select. */
  count: number;
  /** Accessible name for the floating toolbar. */
  ariaLabel: string;
  /** Label next to the count bubble (e.g. "seçildi"). */
  countLabel: string;
  onClear: () => void;
  clearLabel: string;
  /** Disables the clear button while an async action is in-flight so the
   *  user can't strip the selection mid-request. */
  disabled?: boolean;
  /** Action buttons for this selection bar. Each caller provides its own
   *  primary/ghost pill buttons — the shared shell handles layout, count
   *  bubble, divider, and clear. */
  children: ReactNode;
}

/** Gmail-style floating dark pill, slides up from bottom when `count > 0`.
 *  Shared by the fuel-alerts bulk bar (confirm+dismiss) and the unmatched-
 *  plates bulk bar (subcontractor). Callers slot action buttons via
 *  `children`; the shell owns the pill chrome. */
export default function FloatingSelectionBar({
  count,
  ariaLabel,
  countLabel,
  onClear,
  clearLabel,
  disabled = false,
  children,
}: Props) {
  if (count <= 0) return null;

  return (
    <div className="fuel-alerts-slide-up fixed inset-x-0 bottom-4 z-40 flex justify-center pointer-events-none">
      <div
        role="toolbar"
        aria-label={ariaLabel}
        className="pointer-events-auto flex items-center gap-3 pl-4 pr-2 py-2 bg-slate-900 text-white rounded-full shadow-actionBar ring-1 ring-white/10"
      >
        <div className="flex items-center gap-2 px-2">
          <div className="w-5 h-5 rounded-full bg-white/15 text-white flex items-center justify-center text-[11px] font-bold tabular-nums">
            {count}
          </div>
          <span className="text-sm">{countLabel}</span>
        </div>

        <div className="w-px h-5 bg-white/15" />

        {children}

        <button
          type="button"
          onClick={onClear}
          disabled={disabled}
          className="w-8 h-8 rounded-full hover:bg-white/10 disabled:opacity-60 disabled:pointer-events-none transition-colors flex items-center justify-center"
          aria-label={clearLabel}
          title={clearLabel}
        >
          <X className="w-4 h-4 text-slate-400" />
        </button>
      </div>
    </div>
  );
}
