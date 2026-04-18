import { useTranslation } from 'react-i18next';
import { Check, X } from 'lucide-react';
import FloatingSelectionBar from '../common/FloatingSelectionBar';

interface Props {
  count: number;
  onConfirm: () => void;
  onDismiss: () => void;
  onClear: () => void;
  confirming?: boolean;
  dismissing?: boolean;
}

/** Fuel-alerts bulk bar: confirm (green) + dismiss (ghost). Layout and
 *  chrome live in the shared {@link FloatingSelectionBar}; this file only
 *  owns the two alert-specific actions and their i18n. */
export default function FloatingActionBar({
  count,
  onConfirm,
  onDismiss,
  onClear,
  confirming = false,
  dismissing = false,
}: Props) {
  const { t } = useTranslation();
  const busy = confirming || dismissing;

  return (
    <FloatingSelectionBar
      count={count}
      ariaLabel={t('fuelAlerts.bulkBar.selected', { count })}
      countLabel={t('fuelAlerts.bulkBar.selectedLabel')}
      onClear={onClear}
      clearLabel={t('fuelAlerts.bulkBar.clear')}
      disabled={busy}
    >
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
    </FloatingSelectionBar>
  );
}
