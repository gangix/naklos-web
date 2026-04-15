import { useState } from 'react';
import { useTranslation, Trans } from 'react-i18next';
import { fuelReviewApi } from '../../services/api';
import type { UnmatchedBatchBreakdown } from '../../types/fuel';
import AliasModal from './AliasModal';
import ConfirmActionModal from './ConfirmActionModal';
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

  const createTruck = async () => {
    // v1 shortcut: simple prompts. Replaced with AddTruckModal integration later.
    const capacityKgStr = window.prompt(t('fuelReview.createTruckPrompts.capacity'));
    if (!capacityKgStr) return;
    const capacityKg = Number(capacityKgStr);
    const type = (window.prompt(t('fuelReview.createTruckPrompts.type')) ?? 'TIR').toUpperCase();
    const cargoVolumeM3Str = window.prompt(t('fuelReview.createTruckPrompts.volume'));
    if (!cargoVolumeM3Str) return;
    const cargoVolumeM3 = Number(cargoVolumeM3Str);
    if (!Number.isFinite(capacityKg) || !Number.isFinite(cargoVolumeM3)) {
      toast.error(t('fuelReview.createTruckPrompts.invalidNumeric'));
      return;
    }
    try {
      const r = await fuelReviewApi.createTruck(fleetId, normalizedPlate, {
        plateNumber: displayPlate,
        type,
        capacityKg,
        cargoVolumeM3,
      });
      toast.success(t('fuelReview.createTruckPrompts.successToast', { count: r.relinkedFuelEntryCount }));
      onResolved();
    } catch (e: any) {
      toast.error(e?.message ?? t('fuelReview.createTruckPrompts.errorDefault'));
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
        onClick={createTruck}
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
      {batches.map(b => {
        const shortBatch = (b.batchFileName ?? '').replace(/\.[^.]+$/, '').slice(0, 14);
        return (
          <button
            key={b.batchId}
            className={btnGhost}
            onClick={() => setDismissBatch(b)}
            title={t('fuelReview.tooltips.dismiss', { count: b.entryCount, batch: b.batchFileName })}>
            {showBatch
              ? t('fuelReview.actions.dismissInBatch', { batch: shortBatch })
              : t('fuelReview.actions.dismiss')}
          </button>
        );
      })}
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
              values={{ plate: displayPlate, batch: dismissBatch.batchFileName, count: dismissBatch.entryCount }}
              components={{ strong: <strong className="font-mono text-gray-900" /> }}
            />
          }
          bullets={[
            t('fuelReview.dismissModal.bullet1'),
            t('fuelReview.dismissModal.bullet2'),
          ]}
          confirmLabel={t('fuelReview.dismissModal.confirm')}
          onConfirm={() => confirmDismiss(dismissBatch.batchId)}
          onClose={() => setDismissBatch(null)}
        />
      )}
    </div>
  );
}
