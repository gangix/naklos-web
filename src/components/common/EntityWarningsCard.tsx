import { AlertTriangle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { Severity } from '../../types/severity';
import { SEVERITY_DOT_CLASS } from '../../types/severity';

export interface RenderableWarning {
  key: string;
  params: Record<string, string | number>;
  severity: Severity;
  /** Used as the list item key — must be unique within a card. */
  type: string;
}

interface Props {
  warnings: RenderableWarning[];
  heading: string;
  /** Optional deep-link (e.g. "Belgelere git →") shown next to the heading. */
  action?: { label: string; onClick: () => void };
}

// Text tone per tier — reads on white card background. Urgent-/attention-/info-
// 700 values land in the palette as saturated-but-readable.
const SEVERITY_TEXT: Record<Severity, string> = {
  CRITICAL: 'text-urgent-700',
  WARNING: 'text-attention-700',
  INFO: 'text-info-700',
};

/** Renders missing/expiring-document warnings as a titled card. Shared by
 *  the truck- and driver-detail pages so both surfaces look and animate the
 *  same when a `computeTruckWarnings` / `computeDriverWarnings` list comes
 *  back non-empty.
 *
 *  Severity tiers mirror the fuel-alerts system:
 *  - CRITICAL (urgent-500 / red)   — expired / missing / ≤1 day left
 *  - WARNING  (attention-500 / amber) — 2–14 days left
 *  - INFO     (info-500 / sky)     — 15–30 days left */
export default function EntityWarningsCard({ warnings, heading, action }: Props) {
  const { t } = useTranslation();
  // Sort worst-first so the manager sees urgent items on top of the list.
  const rank: Record<Severity, number> = { CRITICAL: 3, WARNING: 2, INFO: 1 };
  const sorted = [...warnings].sort((a, b) => rank[b.severity] - rank[a.severity]);
  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 mb-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-extrabold tracking-tight text-gray-900 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-urgent-500" />
          {heading}
        </h2>
        {action && (
          <button
            onClick={action.onClick}
            className="text-xs text-primary-600 font-medium hover:underline"
          >
            {action.label}
          </button>
        )}
      </div>
      <ul className="space-y-2">
        {sorted.map((w) => (
          <li
            key={w.type}
            className={`flex items-start gap-2 text-sm ${SEVERITY_TEXT[w.severity]}`}
          >
            <span
              className={`mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0 ${SEVERITY_DOT_CLASS[w.severity]}`}
            />
            <span>{t(w.key, w.params)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
