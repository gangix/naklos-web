import { useTranslation } from 'react-i18next';
import { AlertTriangle, AlertCircle, Info } from 'lucide-react';
import SeverityStripe from './SeverityStripe';
import type { Severity } from '../../types/fuelAnomaly';

export type SeverityFilter = Severity | 'ALL';

interface Props {
  counts: Record<Severity, number>;
  active: SeverityFilter;
  onSelect: (value: SeverityFilter) => void;
}

const borderHover: Record<Severity, string> = {
  CRITICAL: 'hover:border-urgent-500',
  WARNING: 'hover:border-attention-500',
  INFO: 'hover:border-info-500',
};

const activeBorder: Record<Severity, string> = {
  CRITICAL: 'border-urgent-500 shadow-cardHover',
  WARNING: 'border-attention-500 shadow-cardHover',
  INFO: 'border-info-500 shadow-cardHover',
};

const headText: Record<Severity, string> = {
  CRITICAL: 'text-urgent-700',
  WARNING: 'text-attention-700',
  INFO: 'text-info-700',
};

const iconColor: Record<Severity, string> = {
  CRITICAL: 'text-urgent-600',
  WARNING: 'text-attention-600',
  INFO: 'text-info-600',
};

const labelKey: Record<Severity, 'urgent' | 'attention' | 'info'> = {
  CRITICAL: 'urgent',
  WARNING: 'attention',
  INFO: 'info',
};

function IconFor({ severity }: { severity: Severity }) {
  const cls = `w-4 h-4 ${iconColor[severity]}`;
  if (severity === 'CRITICAL') return <AlertTriangle className={cls} />;
  if (severity === 'WARNING') return <AlertCircle className={cls} />;
  return <Info className={cls} />;
}

/** Three-column tote board. Each card is a filter button — clicking toggles
 *  between `ALL` and that severity. Active state = colored border + lift. */
export default function SeverityToteBoard({ counts, active, onSelect }: Props) {
  const { t } = useTranslation();
  const cards: Severity[] = ['CRITICAL', 'WARNING', 'INFO'];

  return (
    <div className="grid grid-cols-3 gap-3 mb-6">
      {cards.map((s) => {
        const isActive = active === s;
        return (
          <button
            key={s}
            type="button"
            onClick={() => onSelect(isActive ? 'ALL' : s)}
            aria-pressed={isActive}
            className={`group text-left bg-white rounded-xl border p-4 transition-all relative overflow-hidden ${
              isActive ? activeBorder[s] : `border-slate-200 ${borderHover[s]}`
            }`}
          >
            <SeverityStripe severity={s} />
            <div className="pl-3">
              <div className="flex items-center justify-between">
                <span className={`text-xs font-semibold tracking-wider uppercase ${headText[s]}`}>
                  {t(`fuelAlerts.severity.${labelKey[s]}`)}
                </span>
                <IconFor severity={s} />
              </div>
              <div className="mt-2 text-3xl font-extrabold text-slate-900 tabular-nums">
                {counts[s]}
              </div>
              <div className="text-xs text-slate-500 mt-0.5">
                {t(`fuelAlerts.toteBoard.${labelKey[s]}`)}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
