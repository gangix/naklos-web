import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';
import { toast } from 'sonner';
import { fuelAnomalyApi } from '../../services/fuelAnomalyApi';
import type { BulkDismissResult, DismissalReason } from '../../types/fuelAnomaly';
import DismissalReasonSheet from './DismissalReasonSheet';

interface Props {
  fleetId: string;
  anomalyIds: string[];
  onClose: () => void;
  onDone: (result: BulkDismissResult) => void;
}

/** Small dialog wrapping the DismissalReasonSheet for bulk-dismiss.
 *  The sheet itself stays pristine; this shell only adds backdrop +
 *  title row announcing the selection count. */
export default function BulkDismissModal({ fleetId, anomalyIds, onClose, onDone }: Props) {
  const { t } = useTranslation();
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !submitting) onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose, submitting]);

  async function handleSubmit(payload: { reason: DismissalReason; note: string | null }) {
    setSubmitting(true);
    try {
      const result = await fuelAnomalyApi.bulkDismiss(fleetId, {
        anomalyIds,
        reason: payload.reason,
        note: payload.note,
      });
      onDone(result);
    } catch (err) {
      console.error('Bulk dismiss failed', err);
      toast.error(err instanceof Error ? err.message : t('fuelAlerts.toast.loadError'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/45 backdrop-blur-[2px] flex items-start justify-center overflow-y-auto py-10 px-4"
      onClick={(e) => {
        if (e.target === e.currentTarget && !submitting) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        className="w-full max-w-xl bg-white rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 pt-5 pb-3 flex items-start justify-between gap-4 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">
              {t('fuelAlerts.bulkBar.dismiss')}
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              {t('fuelAlerts.bulkBar.selected', { count: anomalyIds.length })}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="flex-shrink-0 w-9 h-9 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-700 disabled:opacity-50 transition-colors"
            aria-label="Kapat"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <DismissalReasonSheet
          submitting={submitting}
          onSubmit={handleSubmit}
          onCancel={onClose}
          noOtherAutoFocus
        />
      </div>
    </div>
  );
}
