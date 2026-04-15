import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { fuelReviewApi } from '../../services/api';
import type { FuelEntryDto, PossibleDuplicatePair } from '../../types/fuel';
import ConfirmActionModal from './ConfirmActionModal';
import { toast } from 'sonner';

interface Props {
  fleetId: string;
  pair: PossibleDuplicatePair;
  onResolved: () => void;
}

function EntryCell({ entry }: { entry: FuelEntryDto | null }) {
  const { t } = useTranslation();
  if (!entry) return <div className="text-sm text-gray-500">{t('fuelReview.duplicate.noMatch')}</div>;
  return (
    <div className="text-sm">
      <div className="font-semibold">{entry.plateTextRaw}</div>
      <div>{new Date(entry.occurredAt).toLocaleString('tr-TR')}</div>
      <div>{Number(entry.liters).toFixed(2)} L · ₺{Number(entry.totalPrice).toFixed(2)}</div>
      {entry.stationName && <div className="text-gray-600">{entry.stationName}</div>}
      {entry.transactionId && <div className="text-xs text-gray-500">Txn {entry.transactionId}</div>}
    </div>
  );
}

export default function DuplicateComparisonCard({ fleetId, pair, onResolved }: Props) {
  const { t } = useTranslation();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const runConfirm = async () => {
    try {
      await fuelReviewApi.confirmDuplicate(fleetId, pair.flaggedEntry.id);
      toast.success(t('fuelReview.duplicate.confirmSuccessToast'));
      setConfirmOpen(false);
      onResolved();
    } catch (e: any) {
      toast.error(e?.message ?? t('fuelReview.duplicate.confirmErrorDefault'));
    }
  };
  const dismissDupe = async () => {
    try {
      await fuelReviewApi.dismissDuplicate(fleetId, pair.flaggedEntry.id);
      toast.success(t('fuelReview.duplicate.dismissSuccessToast'));
      onResolved();
    } catch (e: any) {
      toast.error(e?.message ?? t('fuelReview.duplicate.dismissErrorDefault'));
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
      <div className="text-[11px] text-gray-500 font-medium uppercase tracking-wider mb-3">
        {t('fuelReview.duplicate.batchLabel')}: {pair.batchFileName ?? '—'}
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="border-r border-gray-200 pr-4">
          <div className="text-[11px] text-amber-700 font-bold uppercase tracking-wider mb-2">
            {t('fuelReview.duplicate.flagged')}
          </div>
          <EntryCell entry={pair.flaggedEntry} />
        </div>
        <div>
          <div className="text-[11px] text-gray-500 font-bold uppercase tracking-wider mb-2">
            {t('fuelReview.duplicate.original')}
          </div>
          <EntryCell entry={pair.suspectedOriginal} />
        </div>
      </div>
      <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-gray-100">
        <button
          className="px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-colors"
          onClick={dismissDupe}>
          {t('fuelReview.duplicate.dismissBtn')}
        </button>
        <button
          className="px-4 py-2 text-sm font-semibold rounded-lg bg-red-600 text-white hover:bg-red-700 hover:shadow-lg hover:shadow-red-500/20 transition-all"
          onClick={() => setConfirmOpen(true)}>
          {t('fuelReview.duplicate.confirmBtn')}
        </button>
      </div>
      {confirmOpen && (
        <ConfirmActionModal
          title={t('fuelReview.duplicate.confirmModal.title')}
          description={t('fuelReview.duplicate.confirmModal.description')}
          bullets={[
            t('fuelReview.duplicate.confirmModal.bullet1'),
            t('fuelReview.duplicate.confirmModal.bullet2'),
          ]}
          confirmLabel={t('fuelReview.duplicate.confirmModal.confirm')}
          tone="danger"
          onConfirm={runConfirm}
          onClose={() => setConfirmOpen(false)}
        />
      )}
    </div>
  );
}
