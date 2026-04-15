import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { fuelEntryApi } from '../../services/fuelEntryApi';
import { formatDate } from '../../utils/format';
import type { TruckFuelEntryDto, TruckFuelSummary } from '../../types/fuel';
import FuelEntryRow from './FuelEntryRow';
import FuelEntryFormModal from './FuelEntryFormModal';
import ConfirmActionModal from './ConfirmActionModal';
import ReceiptLightbox from './ReceiptLightbox';

interface Props {
  fleetId: string;
  truckId: string;
  truckPlate: string;
  truckPrimaryFuelType?: TruckFuelEntryDto['fuelType'];
}

export default function TruckFuelTab({ fleetId, truckId, truckPlate, truckPrimaryFuelType }: Props) {
  const { t } = useTranslation();

  const [summary, setSummary] = useState<TruckFuelSummary | null>(null);
  const [entries, setEntries] = useState<TruckFuelEntryDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [formModal, setFormModal] = useState<{ mode: 'add' | 'edit'; initial?: TruckFuelEntryDto } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<TruckFuelEntryDto | null>(null);
  const [receiptTarget, setReceiptTarget] = useState<TruckFuelEntryDto | null>(null);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);

  const rowRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const fetchData = useCallback(async () => {
    setLoadError(false);
    try {
      const [s, e] = await Promise.all([
        fuelEntryApi.summaryForTruck(fleetId, truckId),
        fuelEntryApi.listForTruck(fleetId, truckId),
      ]);
      setSummary(s);
      setEntries(e);
    } catch {
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, [fleetId, truckId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSaved = async () => {
    await fetchData();
    setFormModal(null);
    toast.success(t('fuelEntry.add.submit'));
  };

  const handleDuplicate = (collidingEntryId: string) => {
    setFormModal(null);
    const el = rowRefs.current[collidingEntryId];
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    setHighlightedId(collidingEntryId);
    setTimeout(() => setHighlightedId(null), 2000);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      await fuelEntryApi.deleteManual(fleetId, deleteTarget.id);
      await fetchData();
      toast.success(t('fuelEntry.delete.confirm'));
    } catch {
      toast.error(t('fuelEntry.error.deleteFailed'));
    } finally {
      setDeleteTarget(null);
    }
  };

  // URL for "Tüm yakıt kayıtları →" — no PlateNormalizer on FE, use encodeURIComponent
  const allEntriesUrl = `/manager/fuel-imports?plate=${encodeURIComponent(truckPlate)}`;

  // --- Loading state ---
  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse bg-gray-200 h-20 rounded-xl" />
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="animate-pulse bg-gray-200 h-12 rounded" />
          ))}
        </div>
      </div>
    );
  }

  // --- Error state ---
  if (loadError) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700 flex items-center justify-between gap-4">
        <span>{t('fuelEntry.loadError')}</span>
        <button
          onClick={() => { setLoading(true); fetchData(); }}
          className="px-3 py-1.5 text-sm font-medium rounded-lg border border-red-300 text-red-700 hover:bg-red-100 transition-colors"
        >
          Tekrar dene
        </button>
      </div>
    );
  }

  const totalLiters = summary ? parseFloat(summary.totalLiters) : 0;
  const totalPrice = summary ? parseFloat(summary.totalPrice) : 0;
  const fillCount = summary?.fillCount ?? 0;

  return (
    <div className="space-y-4">
      {/* Summary card */}
      <div className="rounded-xl shadow-sm border border-gray-200 p-5 bg-white">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm text-gray-500 font-medium">
            {t('fuelEntry.summary.last30Days')}
          </span>
          <button
            onClick={() => setFormModal({ mode: 'add' })}
            className="bg-primary-600 text-white px-4 py-2 text-sm font-semibold rounded-lg hover:bg-primary-700 hover:shadow-lg hover:shadow-primary-500/20 transition-all"
          >
            {t('fuelEntry.add.button')}
          </button>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {/* Toplam litre */}
          <div>
            <div className="text-xs text-gray-500 mb-1">{t('fuelEntry.summary.totalLiters')}</div>
            <div className="text-2xl font-extrabold text-gray-900 tracking-tight tabular-nums">
              {isNaN(totalLiters) ? '—' : `${totalLiters.toFixed(2)} L`}
            </div>
          </div>

          {/* Toplam tutar */}
          <div>
            <div className="text-xs text-gray-500 mb-1">{t('fuelEntry.summary.totalPrice')}</div>
            <div className="text-2xl font-extrabold text-gray-900 tracking-tight tabular-nums">
              {isNaN(totalPrice) ? '—' : `₺${totalPrice.toFixed(2)}`}
            </div>
          </div>

          {/* Dolum sayısı */}
          <div>
            <div className="text-xs text-gray-500 mb-1">{t('fuelEntry.summary.fillCount')}</div>
            <div className="text-2xl font-extrabold text-gray-900 tracking-tight tabular-nums">
              {fillCount}
            </div>
          </div>
        </div>

        <div className="mt-3">
          <a
            href={allEntriesUrl}
            className="text-sm text-primary-600 hover:underline"
          >
            {t('fuelEntry.viewAll')}
          </a>
        </div>
      </div>

      {/* Entries list */}
      <div className="rounded-xl shadow-sm border border-gray-200 bg-white overflow-hidden">
        {/* Header row */}
        <div className="bg-gray-50 px-4 py-2 text-xs uppercase tracking-wider font-semibold text-gray-500 flex items-center gap-4">
          <div className="w-32 flex-shrink-0">Tarih</div>
          <div className="flex-1">İstasyon</div>
          <div className="w-24 text-right">Litre</div>
          <div className="w-24 text-right">Tutar</div>
          <div className="w-10 flex-shrink-0" />
          <div className="flex-shrink-0">Kaynak</div>
          <div className="flex-shrink-0 w-16" />
        </div>

        {entries.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-sm text-gray-500 mb-4">{t('fuelEntry.empty')}</p>
            <button
              onClick={() => setFormModal({ mode: 'add' })}
              className="px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-colors"
            >
              {t('fuelEntry.add.button')}
            </button>
          </div>
        ) : (
          entries.map(entry => (
            <div
              key={entry.id}
              ref={el => { rowRefs.current[entry.id] = el; }}
              className={
                highlightedId === entry.id
                  ? 'ring-2 ring-amber-400 rounded transition-all'
                  : ''
              }
            >
              <FuelEntryRow
                fleetId={fleetId}
                entry={entry}
                onEdit={entry => setFormModal({ mode: 'edit', initial: entry })}
                onDelete={entry => setDeleteTarget(entry)}
                onReceiptClick={entry => setReceiptTarget(entry)}
              />
            </div>
          ))
        )}
      </div>

      {/* Add / Edit modal */}
      {formModal && (
        <FuelEntryFormModal
          fleetId={fleetId}
          truckId={truckId}
          truckPlate={truckPlate}
          truckPrimaryFuelType={truckPrimaryFuelType}
          mode={formModal.mode}
          initial={formModal.initial}
          onClose={() => setFormModal(null)}
          onSaved={handleSaved}
          onDuplicate={handleDuplicate}
        />
      )}

      {/* Delete confirmation modal */}
      {deleteTarget && (
        <ConfirmActionModal
          title={t('fuelEntry.delete.title')}
          description={t('fuelEntry.delete.description', {
            date: formatDate(deleteTarget.occurredAt),
            liters: parseFloat(deleteTarget.liters).toFixed(2),
          })}
          tone="danger"
          confirmLabel={t('fuelEntry.delete.confirm')}
          onConfirm={handleDeleteConfirm}
          onClose={() => setDeleteTarget(null)}
        />
      )}

      {/* Receipt lightbox */}
      {receiptTarget && (
        <ReceiptLightbox
          fleetId={fleetId}
          entryId={receiptTarget.id}
          fileName={`${receiptTarget.id}.jpg`}
          onClose={() => setReceiptTarget(null)}
        />
      )}
    </div>
  );
}
