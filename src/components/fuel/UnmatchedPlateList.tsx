import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Users, X } from 'lucide-react';
import { fuelReviewApi } from '../../services/api';
import { useFuelCounts } from '../../contexts/FuelCountsContext';
import type { UnmatchedPlateGroup } from '../../types/fuel';
import UnmatchedPlateRow from './UnmatchedPlateRow';
import '../fuel-alerts/fuelAlertsAnimations.css';

interface Props { fleetId: string; batchId: string | null; }

export default function UnmatchedPlateList({ fleetId, batchId }: Props) {
  const { t } = useTranslation();
  const { refresh: refreshFuelCounts } = useFuelCounts();
  const [groups, setGroups] = useState<UnmatchedPlateGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulking, setBulking] = useState(false);

  const refresh = async () => {
    setLoading(true);
    try {
      const data = await fuelReviewApi.listUnmatched(fleetId, batchId ?? undefined);
      setGroups(data);
      // Every resolution (createTruck / alias / subcontractor / dismiss) also
      // shrinks the top-nav unmatched-count badge. Refresh here so the badge
      // and the list move together instead of the user having to reload.
      refreshFuelCounts();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fleetId, batchId]);

  // Prune selection when the visible set changes so we never submit a plate
  // that has since been resolved and disappeared from the list.
  useEffect(() => {
    const visible = new Set(groups.map((g) => g.normalizedPlate));
    setSelected((prev) => {
      const next = new Set<string>();
      for (const p of prev) if (visible.has(p)) next.add(p);
      return next.size === prev.size ? prev : next;
    });
  }, [groups]);

  const toggleSelect = (plate: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(plate)) next.delete(plate);
      else next.add(plate);
      return next;
    });

  const bulkSubcontractor = async () => {
    if (selected.size === 0) return;
    setBulking(true);
    const plates = Array.from(selected);
    try {
      const results = await Promise.allSettled(
        plates.map((p) => fuelReviewApi.subcontractor(fleetId, p)),
      );
      const ok = results.filter((r) => r.status === 'fulfilled').length;
      toast.success(t('fuelReview.bulk.subcontractorToast', { count: ok }));
    } catch (err: any) {
      toast.error(err?.message ?? t('fuelReview.subcontractorModal.errorDefault'));
    } finally {
      setBulking(false);
      setSelected(new Set());
      await refresh();
    }
  };

  // Hide bulk scaffolding when batchId filter is active — that view already
  // has clutter and the batch-scoped use case is typically "finish this one",
  // not "mass-classify". Keep bulk for the unfiltered triage queue.
  const bulkEligible = useMemo(() => !batchId && groups.length > 1, [batchId, groups.length]);

  if (loading) return <p className="text-gray-500">{t('fuelReview.loading')}</p>;
  if (groups.length === 0) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
        <p className="text-sm font-medium text-green-900">{t('fuelReview.empty.unmatched.title')}</p>
        <p className="text-xs text-green-700 mt-1">{t('fuelReview.empty.unmatched.subtitle')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 pb-24">
      <div className="bg-blue-50/60 border border-blue-200 rounded-xl p-4 text-sm text-gray-700">
        <p className="mb-2">{t('fuelReview.banner.lead')}</p>
        <ul className="space-y-1 text-xs text-gray-600 pl-1">
          {(['createTruck', 'alias', 'subcontractor', 'dismiss'] as const).map(key => (
            <li key={key}>
              <span className="inline-block w-28 font-semibold text-gray-800">{t(`fuelReview.banner.${key}.label`)}</span>
              <span>— {t(`fuelReview.banner.${key}.desc`)}</span>
            </li>
          ))}
        </ul>
      </div>
      {groups.map(g => (
        <UnmatchedPlateRow
          key={g.normalizedPlate}
          fleetId={fleetId}
          group={g}
          selectable={bulkEligible}
          selected={selected.has(g.normalizedPlate)}
          onToggleSelect={() => toggleSelect(g.normalizedPlate)}
          onResolved={refresh}
        />
      ))}

      {bulkEligible && selected.size > 0 && (
        <UnmatchedFloatingBar
          count={selected.size}
          onSubcontractor={() => void bulkSubcontractor()}
          onClear={() => setSelected(new Set())}
          processing={bulking}
        />
      )}
    </div>
  );
}

interface BarProps {
  count: number;
  onSubcontractor: () => void;
  onClear: () => void;
  processing: boolean;
}

/** Floating pill for bulk-subcontractor. Dismiss isn't offered because it's
 *  scoped per batch — the multi-batch selection model would force the user
 *  to pick batches inside the floating bar, which defeats the "pill that
 *  stays out of the way" pattern. Keep bulk flow to what's semantically
 *  simple (taşeron = plate-wide). Dismiss stays per-row via the menu. */
function UnmatchedFloatingBar({ count, onSubcontractor, onClear, processing }: BarProps) {
  const { t } = useTranslation();
  return (
    <div className="fuel-alerts-slide-up fixed inset-x-0 bottom-4 z-40 flex justify-center pointer-events-none">
      <div
        role="toolbar"
        aria-label={t('fuelReview.bulk.selectedLabel', { count })}
        className="pointer-events-auto flex items-center gap-3 pl-4 pr-2 py-2 bg-slate-900 text-white rounded-full shadow-actionBar ring-1 ring-white/10"
      >
        <div className="flex items-center gap-2 px-2">
          <div className="w-5 h-5 rounded-full bg-white/15 text-white flex items-center justify-center text-[11px] font-bold tabular-nums">
            {count}
          </div>
          <span className="text-sm">{t('fuelReview.bulk.selectedLabel', { count })}</span>
        </div>

        <div className="w-px h-5 bg-white/15" />

        <button
          type="button"
          onClick={onSubcontractor}
          disabled={processing}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-60 disabled:pointer-events-none transition-colors"
        >
          <Users className="w-4 h-4" />
          {processing
            ? t('fuelReview.bulk.subcontractoring')
            : t('fuelReview.bulk.markSubcontractor')}
        </button>

        <button
          type="button"
          onClick={onClear}
          disabled={processing}
          className="w-8 h-8 rounded-full hover:bg-white/10 disabled:opacity-60 disabled:pointer-events-none transition-colors flex items-center justify-center"
          aria-label={t('fuelReview.bulk.clear')}
          title={t('fuelReview.bulk.clear')}
        >
          <X className="w-4 h-4 text-slate-400" />
        </button>
      </div>
    </div>
  );
}
