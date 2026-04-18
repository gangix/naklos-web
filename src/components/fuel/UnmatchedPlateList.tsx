import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Users, X } from 'lucide-react';
import { fuelReviewApi } from '../../services/api';
import { useFuelCounts } from '../../contexts/FuelCountsContext';
import type { UnmatchedPlateGroup } from '../../types/fuel';
import UnmatchedPlateRow from './UnmatchedPlateRow';
import FloatingSelectionBar from '../common/FloatingSelectionBar';

const BANNER_HIDDEN_KEY = 'naklos.fuelReview.unmatchedBannerHidden';

interface Props { fleetId: string; batchId: string | null; }

export default function UnmatchedPlateList({ fleetId, batchId }: Props) {
  const { t } = useTranslation();
  const { refresh: refreshFuelCounts } = useFuelCounts();
  const [groups, setGroups] = useState<UnmatchedPlateGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulking, setBulking] = useState(false);
  // Explanation banner: shown by default, hidden after the user dismisses it.
  // localStorage per browser — no user-account sync, but matches the "I know
  // how this works now" signal scope (per-device is fine for KOBİ).
  const [bannerHidden, setBannerHidden] = useState(() => {
    try { return localStorage.getItem(BANNER_HIDDEN_KEY) === '1'; } catch { return false; }
  });
  const hideBanner = () => {
    setBannerHidden(true);
    try { localStorage.setItem(BANNER_HIDDEN_KEY, '1'); } catch { /* no-op */ }
  };

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
    // Promise.allSettled never throws — catch branches here would be dead
    // code. Instead, split the results so silent failures in a 50-plate op
    // don't get swallowed into just a success toast.
    const results = await Promise.allSettled(
      plates.map((p) => fuelReviewApi.subcontractor(fleetId, p)),
    );
    const ok = results.filter((r) => r.status === 'fulfilled').length;
    const failed = results.length - ok;
    if (ok > 0) toast.success(t('fuelReview.bulk.subcontractorToast', { count: ok }));
    if (failed > 0) toast.error(t('fuelReview.bulk.subcontractorPartialError', { count: failed }));
    setBulking(false);
    setSelected(new Set());
    await refresh();
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
      {!bannerHidden && (
        <div className="bg-blue-50/60 border border-blue-200 rounded-xl p-4 text-sm text-gray-700 relative">
          <button
            type="button"
            onClick={hideBanner}
            className="absolute top-2 right-2 w-7 h-7 rounded-md text-blue-600 hover:bg-blue-100 flex items-center justify-center transition-colors"
            aria-label={t('fuelReview.banner.hide')}
            title={t('fuelReview.banner.hide')}
          >
            <X className="w-4 h-4" />
          </button>
          <p className="mb-2 pr-6">{t('fuelReview.banner.lead')}</p>
          <ul className="space-y-1 text-xs text-gray-600 pl-1">
            {(['createTruck', 'alias', 'subcontractor', 'dismiss'] as const).map(key => (
              <li key={key}>
                <span className="inline-block w-28 font-semibold text-gray-800">{t(`fuelReview.banner.${key}.label`)}</span>
                <span>— {t(`fuelReview.banner.${key}.desc`)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
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

      {/* Dismiss isn't offered in the floating bar because it's scoped per
          batch — multi-batch selection would force a batch picker inside the
          pill, defeating the "stays out of the way" pattern. Dismiss stays
          per-row via the menu; bulk is for the semantically plate-wide
          action (taşeron). */}
      {bulkEligible && (
        <FloatingSelectionBar
          count={selected.size}
          ariaLabel={t('fuelReview.bulk.selectedLabel', { count: selected.size })}
          countLabel={t('fuelReview.bulk.selectedLabel', { count: selected.size })}
          onClear={() => setSelected(new Set())}
          clearLabel={t('fuelReview.bulk.clear')}
          disabled={bulking}
        >
          <button
            type="button"
            onClick={() => void bulkSubcontractor()}
            disabled={bulking}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-60 disabled:pointer-events-none transition-colors"
          >
            <Users className="w-4 h-4" />
            {bulking
              ? t('fuelReview.bulk.subcontractoring')
              : t('fuelReview.bulk.markSubcontractor')}
          </button>
        </FloatingSelectionBar>
      )}
    </div>
  );
}
