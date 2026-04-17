import { useTranslation } from 'react-i18next';
import { Check, X } from 'lucide-react';
import './fuelAlertsAnimations.css';

interface Props {
  count: number;
  onConfirm: () => void;
  onDismiss: () => void;
  onClear: () => void;
  confirming?: boolean;
  dismissing?: boolean;
}

/** Gmail-style floating dark pill — slides up from bottom whenever a
 *  selection exists. Renders nothing when `count === 0` so the bar is
 *  fully unmounted on empty selection (and re-animates on first select). */
export default function FloatingActionBar({
  count,
  onConfirm,
  onDismiss,
  onClear,
  confirming = false,
  dismissing = false,
}: Props) {
  const { t } = useTranslation();
  if (count <= 0) return null;

  const busy = confirming || dismissing;

  return (
    <div className="fuel-alerts-slide-up fixed inset-x-0 bottom-4 z-40 flex justify-center pointer-events-none">
      <div
        role="toolbar"
        aria-label={t('fuelAlerts.bulkBar.selected', { count })}
        className="pointer-events-auto flex items-center gap-3 pl-4 pr-2 py-2 bg-slate-900 text-white rounded-full shadow-actionBar ring-1 ring-white/10"
      >
        <div className="flex items-center gap-2 px-2">
          <div className="w-5 h-5 rounded-full bg-white/15 text-white flex items-center justify-center text-[11px] font-bold tabular-nums">
            {count}
          </div>
          <span className="text-sm">{t('fuelAlerts.bulkBar.selectedLabel')}</span>
        </div>

        <div className="w-px h-5 bg-white/15" />

        <button
          type="button"
          onClick={onConfirm}
          disabled={busy}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-full bg-confirm-500 hover:bg-confirm-600 disabled:opacity-60 disabled:pointer-events-none transition-colors"
        >
          <Check className="w-4 h-4" />
          {confirming
            ? t('fuelAlerts.bulkBar.confirming')
            : t('fuelAlerts.bulkBar.confirm')}
        </button>

        <button
          type="button"
          onClick={onDismiss}
          disabled={busy}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-60 disabled:pointer-events-none transition-colors"
        >
          <X className="w-4 h-4" />
          {dismissing
            ? t('fuelAlerts.bulkBar.dismissing')
            : t('fuelAlerts.bulkBar.dismiss')}
        </button>

        <button
          type="button"
          onClick={onClear}
          disabled={busy}
          className="w-8 h-8 rounded-full hover:bg-white/10 disabled:opacity-60 disabled:pointer-events-none transition-colors flex items-center justify-center"
          aria-label={t('fuelAlerts.bulkBar.clear')}
          title={t('fuelAlerts.bulkBar.clear')}
        >
          <X className="w-4 h-4 text-slate-400" />
        </button>
      </div>
    </div>
  );
}
