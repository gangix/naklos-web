import { useRef, useState } from 'react';
import { useTranslation, Trans } from 'react-i18next';
import { ChevronDown } from 'lucide-react';
import { fuelReviewApi } from '../../services/api';
import { useFleetRoster } from '../../contexts/FleetRosterContext';
import { useClickOutside } from '../../hooks/useClickOutside';
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
  const { refresh: refreshRoster } = useFleetRoster();
  const [createTruckOpen, setCreateTruckOpen] = useState(false);
  const [aliasOpen, setAliasOpen] = useState(false);
  const [subcontractorOpen, setSubcontractorOpen] = useState(false);
  const [dismissBatch, setDismissBatch] = useState<UnmatchedBatchBreakdown | null>(null);
  const [dismissMenuOpen, setDismissMenuOpen] = useState(false);
  const dismissMenuRef = useRef<HTMLDivElement>(null);
  useClickOutside(dismissMenuOpen, dismissMenuRef, () => setDismissMenuOpen(false));

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

  const multipleBatches = batches.length > 1;

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
      {/* Yoksay: single button when the plate lives in one batch, dropdown
          with per-batch rows when it spans multiple. Prior UI rendered one
          "Yoksay #1", "Yoksay #2" button per batch which was both cluttered
          and confusing ("#1" meant nothing until the user read the tooltip). */}
      {batches.length === 1 && (
        <button
          className={btnGhost}
          onClick={() => setDismissBatch(batches[0])}
          title={t('fuelReview.tooltips.dismiss', {
            count: batches[0].entryCount,
            batch: batches[0].batchFileName,
          })}>
          {t('fuelReview.actions.dismiss')}
        </button>
      )}
      {multipleBatches && (
        <div className="relative" ref={dismissMenuRef}>
          <button
            className={`${btnGhost} inline-flex items-center gap-1`}
            onClick={() => setDismissMenuOpen((v) => !v)}>
            {t('fuelReview.actions.dismiss')}
            <ChevronDown className="w-4 h-4 text-gray-500" />
          </button>
          {dismissMenuOpen && (
            <div className="absolute right-0 mt-1 w-72 bg-white border border-gray-200 rounded-lg shadow-lg z-10 overflow-hidden">
              <div className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-gray-500 border-b border-gray-100">
                {t('fuelReview.actions.dismissMenuHeading')}
              </div>
              {batches.map((b) => (
                <button
                  key={b.batchId}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center justify-between gap-2"
                  onClick={() => {
                    setDismissMenuOpen(false);
                    setDismissBatch(b);
                  }}>
                  <span className="truncate text-gray-800">{b.batchFileName}</span>
                  <span className="text-xs text-gray-500 tabular-nums flex-shrink-0">
                    {t('fuelReview.plateRow.entries', { count: b.entryCount })}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
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
            // Create-truck adds a new Truck row; refresh the shared roster so
            // the top-nav document-attention badge picks it up without forcing
            // a page reload. alias/subcontractor/dismiss don't touch trucks.
            refreshRoster();
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
