import { useState } from 'react';
import { useTranslation, Trans } from 'react-i18next';
import { fuelReviewApi } from '../../services/api';
import type { UnmatchedBatchBreakdown } from '../../types/fuel';
import AliasModal from './AliasModal';
import ConfirmActionModal from './ConfirmActionModal';
import AddTruckModal from '../common/AddTruckModal';
import { toast } from 'sonner';

interface Props {
  fleetId: string;
  normalizedPlate: string;
  displayPlate: string;
  batches: UnmatchedBatchBreakdown[];
  onResolved: () => void;
}

export default function ResolutionActionMenu(
  { fleetId, normalizedPlate, displayPlate, batches, onResolved }: Props) {

  const { t } = useTranslation();
  const [createTruckOpen, setCreateTruckOpen] = useState(false);
  const [aliasOpen, setAliasOpen] = useState(false);
  const [subcontractorOpen, setSubcontractorOpen] = useState(false);
  const [dismissBatch, setDismissBatch] = useState<UnmatchedBatchBreakdown | null>(null);

  const confirmSubcontractor = async () => {
    try {
      const { affectedCount } = await fuelReviewApi.subcontractor(fleetId, normalizedPlate);
      toast.success(t('fuelReview.subcontractorModal.successToast', { count: affectedCount }));
      setSubcontractorOpen(false);
      onResolved();
    } catch (e: any) {
      toast.error(e?.message ?? t('fuelReview.subcontractorModal.errorDefault'));
    }
  };

  const confirmDismiss = async (batchId: string) => {
    try {
      const { affectedCount } = await fuelReviewApi.dismiss(fleetId, normalizedPlate, batchId);
      toast.success(t('fuelReview.dismissModal.successToast', { count: affectedCount }));
      setDismissBatch(null);
      onResolved();
    } catch (e: any) {
      toast.error(e?.message ?? t('fuelReview.dismissModal.errorDefault'));
    }
  };

  const showBatch = batches.length > 1;

  // Canonical button classes lifted from TrucksPage so the fuel surface reads
  // the same as the rest of the manager area.
  const btnPrimary =
    "px-4 py-2 text-sm font-semibold rounded-lg bg-primary-600 text-white hover:bg-primary-700 hover:shadow-lg hover:shadow-primary-500/20 transition-all";
  const btnSecondary =
    "px-4 py-2 text-sm font-medium rounded-lg border border-primary-600 text-primary-600 hover:bg-primary-50 transition-colors";
  const btnGhost =
    "px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-colors";

  return (
    <div className="flex gap-2 flex-wrap items-center">
      <button
        className={btnPrimary}
        onClick={() => setCreateTruckOpen(true)}
        title={t('fuelReview.tooltips.createTruck')}>
        {t('fuelReview.actions.createTruck')}
      </button>
      <button
        className={btnSecondary}
        onClick={() => setAliasOpen(true)}
        title={t('fuelReview.tooltips.alias')}>
        {t('fuelReview.actions.alias')}
      </button>
      <button
        className={btnSecondary}
        onClick={() => setSubcontractorOpen(true)}
        title={t('fuelReview.tooltips.subcontractor')}>
        {t('fuelReview.actions.subcontractor')}
      </button>
      {batches.map((b, i) => {
        // When the same plate appears in multiple batches, label each Yoksay
        // with an ordinal so users can disambiguate even when filenames share
        // a long prefix (e.g. "naklos-fuel-sample-jan.xlsx" / "...feb.xlsx").
        // Full filename lives in the title tooltip + the batch links above.
        const label = showBatch
          ? `${t('fuelReview.actions.dismiss')} #${i + 1}`
          : t('fuelReview.actions.dismiss');
        return (
          <button
            key={b.batchId}
            className={btnGhost}
            onClick={() => setDismissBatch(b)}
            title={t('fuelReview.tooltips.dismiss', { count: b.entryCount, batch: b.batchFileName })}>
            {label}
          </button>
        );
      })}
      {createTruckOpen && (
        <AddTruckModal
          isOpen
          onClose={() => setCreateTruckOpen(false)}
          prefillPlate={displayPlate}
          onSubmit={async (data) => {
            const r = await fuelReviewApi.createTruck(fleetId, normalizedPlate, data);
            return { relinkedFuelEntryCount: r.relinkedFuelEntryCount };
          }}
          onSuccess={(result) => {
            const count = result?.relinkedFuelEntryCount ?? 0;
            toast.success(t('fuelReview.createTruckPrompts.successToast', { count }));
            onResolved();
          }}
        />
      )}
      {aliasOpen && (
        <AliasModal
          fleetId={fleetId}
          normalizedPlate={normalizedPlate}
          onClose={() => setAliasOpen(false)}
          onSuccess={(count) => {
            toast.success(t('fuelReview.aliasModal.successToast', { count }));
            setAliasOpen(false);
            onResolved();
          }}
        />
      )}
      {subcontractorOpen && (
        <ConfirmActionModal
          title={t('fuelReview.subcontractorModal.title')}
          description={
            <Trans
              i18nKey="fuelReview.subcontractorModal.description"
              values={{ plate: displayPlate }}
              components={{ strong: <strong className="font-mono text-gray-900" /> }}
            />
          }
          bullets={[
            t('fuelReview.subcontractorModal.bullet1'),
            t('fuelReview.subcontractorModal.bullet2'),
            t('fuelReview.subcontractorModal.bullet3'),
          ]}
          confirmLabel={t('fuelReview.subcontractorModal.confirm')}
          onConfirm={confirmSubcontractor}
          onClose={() => setSubcontractorOpen(false)}
        />
      )}
      {dismissBatch && (
        <ConfirmActionModal
          title={t('fuelReview.dismissModal.title')}
          description={
            <Trans
              i18nKey="fuelReview.dismissModal.description"
              values={{ plate: displayPlate, count: dismissBatch.entryCount }}
              components={{ strong: <strong className="font-mono text-gray-900" /> }}
            />
          }
          confirmLabel={t('fuelReview.dismissModal.confirm')}
          onConfirm={() => confirmDismiss(dismissBatch.batchId)}
          onClose={() => setDismissBatch(null)}
        />
      )}
    </div>
  );
}
