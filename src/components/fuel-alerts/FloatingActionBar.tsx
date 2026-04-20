import { useTranslation } from 'react-i18next';
import { Check, X, RotateCcw } from 'lucide-react';
import FloatingSelectionBar from '../common/FloatingSelectionBar';

interface Breakdown {
  dataError: number;
  behaviour: number;
}

interface BaseProps {
  count: number;
  onClear: () => void;
  confirming?: boolean;
  dismissing?: boolean;
}

type Props =
  | (BaseProps & {
      variant: 'catA';
      onConfirm: () => void;
      /** Omit to hide the "Analize geri al" button — e.g. when every
       *  selected row hits a physically-impossible rule (rollback,
       *  volume-over-tank) where restore is not a legitimate action. */
      onDismiss?: () => void;
    })
  | (BaseProps & {
      variant: 'catB';
      onConfirm: () => void;
      onDismiss: () => void;
    })
  | (BaseProps & {
      variant: 'mixed';
      breakdown: Breakdown;
      onMixedBehaviourConfirm: () => void;
      onMixedBehaviourDismiss: () => void;
      onMixedDataErrorConfirm: () => void;
    });

/** Category-aware bulk bar. Three variants emit different button sets
 *  backed by explicit data-movement labels:
 *   - catA: "Bozuk olarak kapat" (urgent) + "Analize geri al" (ghost)
 *   - catB: "Sorunlu kaydet" (confirm-green) + "Kapat + neden" (ghost)
 *   - mixed: breakdown strip + per-button (N) counts; parent handler
 *     applies each action only to the compatible subset (smart-skip).
 *  Uses the shared `FloatingSelectionBar` chrome — this file only owns
 *  the variant-specific button rendering + i18n. */
export default function FloatingActionBar(props: Props) {
  const { t } = useTranslation();
  const { count, onClear, confirming = false, dismissing = false } = props;
  const busy = confirming || dismissing;
  if (count === 0) return null;

  if (props.variant === 'catA') {
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
          onClick={props.onConfirm}
          disabled={busy}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-full bg-confirm-500 hover:bg-confirm-600 disabled:opacity-60 disabled:pointer-events-none transition-colors"
        >
          <Check className="w-4 h-4" />
          {confirming
            ? t('fuelAlerts.bulkBar.catA.confirming')
            : t('fuelAlerts.bulkBar.catA.confirm')}
        </button>
        {props.onDismiss && (
          <button
            type="button"
            onClick={props.onDismiss}
            disabled={busy}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-60 disabled:pointer-events-none transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            {dismissing
              ? t('fuelAlerts.bulkBar.catA.dismissing')
              : t('fuelAlerts.bulkBar.catA.dismiss')}
          </button>
        )}
      </FloatingSelectionBar>
    );
  }

  if (props.variant === 'catB') {
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
          onClick={props.onConfirm}
          disabled={busy}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-full bg-confirm-500 hover:bg-confirm-600 disabled:opacity-60 disabled:pointer-events-none transition-colors"
        >
          <Check className="w-4 h-4" />
          {confirming
            ? t('fuelAlerts.bulkBar.catB.confirming')
            : t('fuelAlerts.bulkBar.catB.confirm')}
        </button>
        <button
          type="button"
          onClick={props.onDismiss}
          disabled={busy}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-60 disabled:pointer-events-none transition-colors"
        >
          <X className="w-4 h-4" />
          {dismissing
            ? t('fuelAlerts.bulkBar.catB.dismissing')
            : t('fuelAlerts.bulkBar.catB.dismiss')}
        </button>
      </FloatingSelectionBar>
    );
  }

  const bd = props.breakdown;
  return (
    <FloatingSelectionBar
      count={count}
      ariaLabel={t('fuelAlerts.bulkBar.selected', { count })}
      countLabel={t('fuelAlerts.bulkBar.selectedLabel')}
      onClear={onClear}
      clearLabel={t('fuelAlerts.bulkBar.clear')}
      disabled={busy}
      headerExtra={
        <span className="flex items-center gap-3 text-[11px]">
          {bd.dataError > 0 && (
            <span className="inline-flex items-center gap-1 text-attention-300">
              <span className="w-1.5 h-1.5 rounded-full bg-attention-500" />
              {t('fuelAlerts.bulkBar.mixed.dataErrorCount', { count: bd.dataError })}
            </span>
          )}
          {bd.behaviour > 0 && (
            <span className="inline-flex items-center gap-1 text-info-300">
              <span className="w-1.5 h-1.5 rounded-full bg-info-500" />
              {t('fuelAlerts.bulkBar.mixed.behaviourCount', { count: bd.behaviour })}
            </span>
          )}
        </span>
      }
    >
      {bd.behaviour > 0 && (
        <>
          <button
            type="button"
            onClick={props.onMixedBehaviourConfirm}
            disabled={busy}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-full bg-confirm-500/90 hover:bg-confirm-500 disabled:opacity-60 disabled:pointer-events-none transition-colors"
          >
            <Check className="w-4 h-4" />
            {t('fuelAlerts.bulkBar.catB.confirm')}
            <span className="text-white/70 text-[10px] tabular-nums">({bd.behaviour})</span>
          </button>
          <button
            type="button"
            onClick={props.onMixedBehaviourDismiss}
            disabled={busy}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-60 disabled:pointer-events-none transition-colors"
          >
            <X className="w-4 h-4" />
            {t('fuelAlerts.bulkBar.catB.dismiss')}
            <span className="text-white/70 text-[10px] tabular-nums">({bd.behaviour})</span>
          </button>
        </>
      )}
      {bd.dataError > 0 && (
        <button
          type="button"
          onClick={props.onMixedDataErrorConfirm}
          disabled={busy}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-full bg-confirm-500/90 hover:bg-confirm-500 disabled:opacity-60 disabled:pointer-events-none transition-colors"
        >
          <Check className="w-4 h-4" />
          {t('fuelAlerts.bulkBar.catA.confirm')}
          <span className="text-white/70 text-[10px] tabular-nums">({bd.dataError})</span>
        </button>
      )}
    </FloatingSelectionBar>
  );
}
