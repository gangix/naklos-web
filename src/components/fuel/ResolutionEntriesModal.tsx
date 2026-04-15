import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { fuelReviewApi } from '../../services/api';
import type { PlateResolutionDto, ResolutionEntryView } from '../../types/fuel';

interface Props {
  fleetId: string;
  resolution: PlateResolutionDto;
  onClose: () => void;
}

const PAGE_SIZE = 20;

const STATUS_BADGE: Record<ResolutionEntryView['matchStatus'], string> = {
  MATCHED:        'bg-green-100 text-green-700',
  SUBCONTRACTOR:  'bg-amber-100 text-amber-700',
  UNMATCHED:      'bg-gray-100 text-gray-700',
  DISMISSED:      'bg-gray-100 text-gray-500',
  AMBIGUOUS:      'bg-blue-100 text-blue-700',
};

const KIND_BADGE: Record<PlateResolutionDto['kind'], string> = {
  ALIAS:         'bg-blue-100 text-blue-700',
  SUBCONTRACTOR: 'bg-amber-100 text-amber-700',
};

export default function ResolutionEntriesModal({ fleetId, resolution, onClose }: Props) {
  const { t } = useTranslation();
  const [entries, setEntries] = useState<ResolutionEntryView[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onEsc);
    return () => window.removeEventListener('keydown', onEsc);
  }, [onClose]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fuelReviewApi.listResolutionEntries(fleetId, resolution.normalizedPlate, page, PAGE_SIZE)
      .then(res => {
        if (cancelled) return;
        setEntries(res.content);
        setTotalPages(res.totalPages);
        setTotalElements(res.totalElements);
      })
      .catch(e => {
        if (cancelled) return;
        toast.error(e?.message ?? t('fuelReview.resolutionEntries.loadError'));
        onClose();
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fleetId, resolution.normalizedPlate, page]);

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="resolution-entries-modal-title"
        className="bg-white rounded-xl shadow-xl border border-gray-200 p-6 w-full max-w-2xl max-h-[85vh] flex flex-col">
        <div className="mb-4">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 id="resolution-entries-modal-title" className="text-xl font-extrabold text-gray-900 tracking-tight">
              {t('fuelReview.resolutionEntries.title', { plate: resolution.normalizedPlate })}
            </h2>
            <span className={`text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${KIND_BADGE[resolution.kind]}`}>
              {t(`fuelReview.resolutions.kind.${resolution.kind}`)}
            </span>
          </div>
          {!loading && (
            <p className="text-[11px] text-gray-500 font-medium uppercase tracking-wider mt-1.5">
              {t('fuelReview.resolutionEntries.count', { count: totalElements })}
            </p>
          )}
        </div>

        <div className="flex-1 overflow-y-auto -mx-6 px-6 border-t border-gray-100">
          {loading ? (
            <p className="text-sm text-gray-500 py-6">{t('fuelReview.loading')}</p>
          ) : entries.length === 0 ? (
            <p className="text-sm text-gray-500 py-6">{t('fuelReview.resolutionEntries.empty')}</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {entries.map(e => (
                <li key={e.id} className="py-3 hover:bg-gray-50 -mx-3 px-3 rounded transition-colors">
                  <div className="flex items-baseline justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline gap-2 flex-wrap">
                        <span className="font-mono font-semibold text-sm text-gray-900">{e.plateTextRaw}</span>
                        <span className="text-xs text-gray-500">{new Date(e.occurredAt).toLocaleString('tr-TR', { dateStyle: 'short', timeStyle: 'short' })}</span>
                      </div>
                      <div className="text-xs text-gray-600 mt-0.5">
                        {Number(e.liters).toFixed(2)} L
                        <span className="mx-1.5 text-gray-300">·</span>
                        ₺{Number(e.totalPrice).toFixed(2)}
                        {e.stationName && <>
                          <span className="mx-1.5 text-gray-300">·</span>
                          <span className="text-gray-500">{e.stationName}</span>
                        </>}
                        {e.transactionId && <>
                          <span className="mx-1.5 text-gray-300">·</span>
                          <span className="font-mono text-[11px] text-gray-400">{e.transactionId}</span>
                        </>}
                      </div>
                    </div>
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded whitespace-nowrap ${STATUS_BADGE[e.matchStatus]}`}>
                      {t(`fuelReview.resolutionEntries.matchStatus.${e.matchStatus}`)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex items-center justify-between gap-2 mt-4 pt-3 border-t border-gray-100">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 text-sm font-medium rounded-lg text-gray-600 hover:bg-gray-100 transition-colors">
            {t('fuelReview.aliasModal.cancel')}
          </button>
          {totalPages > 1 && (
            <div className="flex items-center gap-2 text-sm">
              <button
                type="button"
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0 || loading}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 disabled:opacity-40 disabled:pointer-events-none transition-colors">
                <ChevronLeft className="w-3.5 h-3.5" />
                {t('fuelReview.resolutionEntries.prev')}
              </button>
              <span className="text-xs text-gray-500 tabular-nums">
                {t('fuelReview.resolutionEntries.pageOf', { current: page + 1, total: totalPages })}
              </span>
              <button
                type="button"
                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1 || loading}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 disabled:opacity-40 disabled:pointer-events-none transition-colors">
                {t('fuelReview.resolutionEntries.next')}
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
