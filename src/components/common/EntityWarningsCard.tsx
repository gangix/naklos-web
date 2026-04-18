import { AlertTriangle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export interface RenderableWarning {
  key: string;
  params: Record<string, string | number>;
  severity: 'error' | 'warning';
  /** Used as the list item key — must be unique within a card. */
  type: string;
}

interface Props {
  warnings: RenderableWarning[];
  heading: string;
  /** Optional deep-link (e.g. "Belgelere git →") shown next to the heading. */
  action?: { label: string; onClick: () => void };
}

/** Renders missing/expiring-document warnings as a titled card. Shared by
 *  the truck- and driver-detail pages so both surfaces look and animate the
 *  same when a `computeTruckWarnings` / `computeDriverWarnings` list comes
 *  back non-empty. */
export default function EntityWarningsCard({ warnings, heading, action }: Props) {
  const { t } = useTranslation();
  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 mb-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-extrabold tracking-tight text-gray-900 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-red-500" />
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
        {warnings.map((w) => (
          <li
            key={w.type}
            className={`flex items-start gap-2 text-sm ${
              w.severity === 'error' ? 'text-red-800' : 'text-amber-800'
            }`}
          >
            <span
              className={`mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                w.severity === 'error' ? 'bg-red-500' : 'bg-amber-500'
              }`}
            />
            <span>{t(w.key, w.params)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
