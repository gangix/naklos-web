import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronRight, Clock, Image as ImageIcon } from 'lucide-react';
import type { AnomalyPendingItem, RuleCode } from '../../types/fuelAnomaly';
import SeverityBadge from './SeverityBadge';
import SeverityStripe from './SeverityStripe';
import { shortExplanation } from './ruleExplanation';
import { formatCurrency, formatDateTime, formatTime } from '../../utils/format';

interface Props {
  alert: AnomalyPendingItem;
  selected: boolean;
  onToggleSelect: (anomalyId: string, shiftKey: boolean) => void;
  onOpen: (alert: AnomalyPendingItem) => void;
}

/** One alert row inside a truck group. Clicking the row (anywhere except the
 *  checkbox) opens the detail modal. The left edge carries the severity
 *  stripe — the most load-bearing glyph at triage speed. */
export default function AlertCard({ alert, selected, onToggleSelect, onOpen }: Props) {
  const { t } = useTranslation();
  const title = t(`fuelAlerts.rules.${alert.ruleCode}.title`, {
    defaultValue: alert.ruleCode,
  });
  const body = useMemo(() => shortExplanation(alert), [alert]);
  const ts = alert.occurredAt ?? alert.detectedAt;
  const liters = alert.liters;
  const km = alert.reportedOdometerKm;

  const selectedCls = selected ? 'border-primary-500 bg-primary-50/50' : 'border-transparent';

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onOpen(alert)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onOpen(alert);
        }
      }}
      className={`alert-card relative pl-4 pr-5 py-4 border-b last:border-b-0 border-slate-100 flex items-start gap-4 cursor-pointer transition-colors hover:bg-slate-50/60 border-l-0 border-r-0 ${selectedCls}`}
    >
      <SeverityStripe severity={alert.severity} />

      <label
        className="flex items-center mt-1 flex-shrink-0 cursor-pointer"
        onClick={(e) => {
          // Always stop propagation so clicking the checkbox never opens the
          // row's detail modal. Only intercept shift-clicks — shiftKey lives
          // on MouseEvent, not the input's change event, so we must read it
          // here before letting the browser fire the normal click. Plain
          // clicks fall through to the input's onChange (which also gets
          // Space-key toggles from keyboard users, preserving a11y).
          e.stopPropagation();
          if (e.shiftKey) {
            e.preventDefault();
            onToggleSelect(alert.anomalyId, true);
          }
        }}
      >
        <input
          type="checkbox"
          checked={selected}
          onChange={() => onToggleSelect(alert.anomalyId, false)}
          className="w-[18px] h-[18px] rounded border-[1.5px] border-slate-300 text-primary-600 focus:ring-2 focus:ring-primary-500/40 focus:ring-offset-0"
          aria-label={`${title} — seç`}
        />
      </label>

      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2 mb-1">
          <SeverityBadge severity={alert.severity} size="xs" />
          <span className="text-xs font-semibold text-slate-900">{title}</span>
          {ts && (
            <span className="text-xs text-slate-400 tabular-nums">· {formatDateTime(ts)}</span>
          )}
        </div>

        <p className="text-sm text-slate-700 leading-relaxed">{body}</p>

        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 tabular-nums">
          {ts && (
            <span className="inline-flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {formatTime(ts)}
            </span>
          )}
          {alert.totalPrice && (
            <>
              <span>·</span>
              <span>{formatCurrency(Number(alert.totalPrice))}</span>
            </>
          )}
          {liters && (
            <>
              <span>·</span>
              <span>
                {Number(liters).toLocaleString('tr-TR', {
                  minimumFractionDigits: 1,
                  maximumFractionDigits: 1,
                })}{' '}
                L
              </span>
            </>
          )}
          {km != null && (
            <>
              <span>·</span>
              <span>{km.toLocaleString('tr-TR')} km</span>
            </>
          )}
          {alert.hasReceipt && (
            <>
              <span>·</span>
              <span className="inline-flex items-center gap-1 text-primary-600">
                <ImageIcon className="w-3.5 h-3.5" />
                {t('fuelAlerts.card.receiptIndicator')}
              </span>
            </>
          )}
        </div>
      </div>

      <ChevronRight
        aria-hidden="true"
        className="w-4 h-4 text-slate-300 flex-shrink-0 mt-1"
      />
    </div>
  );
}

// Type-only re-export so callers can keep imports tight.
export type { RuleCode };
