import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ChevronDown, Filter as FilterIcon, Truck as TruckIcon } from 'lucide-react';
import { toast } from 'sonner';
import { useFleet } from '../contexts/FleetContext';
import { useFuelCounts } from '../contexts/FuelCountsContext';
import { fuelAnomalyApi } from '../services/fuelAnomalyApi';
import { categoryOf } from '../types/fuelAnomaly';
import type { AnomalyCategory, AnomalyPendingItem, Severity } from '../types/fuelAnomaly';
import FuelSectionNav from '../components/fuel/FuelSectionNav';
import SeverityToteBoard, {
  type SeverityFilter,
} from '../components/fuel-alerts/SeverityToteBoard';
import TruckAccordion from '../components/fuel-alerts/TruckAccordion';
import AlertCard from '../components/fuel-alerts/AlertCard';
import FloatingActionBar from '../components/fuel-alerts/FloatingActionBar';
import FuelAlertsEmpty from '../components/fuel-alerts/FuelAlertsEmpty';
import FuelAlertDetailModal from '../components/fuel-alerts/FuelAlertDetailModal';
import BulkDismissModal from '../components/fuel-alerts/BulkDismissModal';
import { formatDateTime } from '../utils/format';
import { computeShiftRange } from '../utils/rangeSelect';

const UNASSIGNED_KEY = '__unassigned__';

type CategoryFilter = AnomalyCategory | 'ALL';

interface SelectionBreakdown {
  dataError: string[];
  behaviour: string[];
  info: string[];
}

interface Group {
  key: string;
  plate: string | null;
  subtitle: string | null;
  items: AnomalyPendingItem[];
  counts: Record<Severity, number>;
  worst: Severity;
  excludedFromAnalysis: boolean;
}

const severityRank: Record<Severity, number> = {
  CRITICAL: 3,
  WARNING: 2,
  INFO: 1,
};

/** Mirrors backend PlateNormalizer: strip non-alphanumeric, uppercase. Keeps
 *  "34 ABC 123", "34-abc-123", and "34abc123" in the same bucket so formatting
 *  noise in the receipt text doesn't fragment the unmatched group. */
function normalizePlate(raw: string | null | undefined): string {
  if (!raw) return '';
  return raw.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
}

function buildGroups(items: AnomalyPendingItem[], unassignedLabel: string): Group[] {
  const byKey = new Map<string, AnomalyPendingItem[]>();
  for (const it of items) {
    // Matched entries group by truckId. Unmatched split per *normalized* raw
    // plate — otherwise 5 distinct unmatched plates collapse into one opaque
    // "Tanımsız araç" bucket and the manager has to open each card to see
    // which plate needs attention.
    const key = it.truckId != null
      ? it.truckId
      : `${UNASSIGNED_KEY}:${normalizePlate(it.plate)}`;
    const arr = byKey.get(key) ?? [];
    arr.push(it);
    byKey.set(key, arr);
  }

  const groups: Group[] = [];
  for (const [key, arr] of byKey.entries()) {
    arr.sort(
      (a, b) => new Date(b.detectedAt).getTime() - new Date(a.detectedAt).getTime(),
    );
    const counts: Record<Severity, number> = { CRITICAL: 0, WARNING: 0, INFO: 0 };
    for (const it of arr) counts[it.severity] += 1;
    let worst: Severity = 'INFO';
    for (const s of ['CRITICAL', 'WARNING', 'INFO'] as const) {
      if (counts[s] > 0) {
        worst = s;
        break;
      }
    }
    const isUnassigned = arr[0].truckId == null;
    const firstPlate = arr.find((a) => a.plate)?.plate ?? null;
    const driverName = arr
      .map((a) =>
        [a.driverFirstName, a.driverLastName].filter(Boolean).join(' '),
      )
      .find((s) => s.length > 0) ?? null;
    // Any pending Cat A (DATA_ERROR) anomaly means this truck's entries are
    // being held out of the baseline until the manager clears them.
    const excludedFromAnalysis = arr.some(
      (it) => categoryOf(it.ruleCode) === 'DATA_ERROR',
    );
    groups.push({
      key,
      plate: firstPlate,
      subtitle: isUnassigned ? unassignedLabel : driverName,
      items: arr,
      counts,
      worst,
      excludedFromAnalysis,
    });
  }

  groups.sort((a, b) => {
    const r = severityRank[b.worst] - severityRank[a.worst];
    if (r !== 0) return r;
    return b.items.length - a.items.length;
  });
  return groups;
}

export default function FuelAlertsPage() {
  const { t } = useTranslation();
  const { fleetId } = useFleet();
  const navigate = useNavigate();

  const [items, setItems] = useState<AnomalyPendingItem[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastLoadedAt, setLastLoadedAt] = useState<string | null>(null);

  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('ALL');
  const [truckFilter, setTruckFilter] = useState<string>('ALL');
  const [ruleFilter, setRuleFilter] = useState<string>('ALL');

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [anchorId, setAnchorId] = useState<string | null>(null);
  const [openAlert, setOpenAlert] = useState<AnomalyPendingItem | null>(null);
  const [bulkConfirming, setBulkConfirming] = useState(false);
  const [bulkDismissScope, setBulkDismissScope] = useState<
    'dataError' | 'behaviour' | null
  >(null);

  const { refresh: refreshFuelCounts } = useFuelCounts();

  const refresh = useCallback(async () => {
    if (!fleetId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fuelAnomalyApi.listPending(fleetId);
      setItems(data);
      setLastLoadedAt(new Date().toISOString());
      // Reuse our own fetch to refresh the nav badges — keeps the top-nav
      // aggregate in sync without a second HTTP round trip.
      refreshFuelCounts();
    } catch (err) {
      console.error('Failed to load fuel alerts', err);
      setError(err instanceof Error ? err.message : t('fuelAlerts.toast.loadError'));
    } finally {
      setLoading(false);
    }
  }, [fleetId, t, refreshFuelCounts]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  // Global severity counts (across the whole dataset — NOT the filtered view)
  const globalCounts = useMemo<Record<Severity, number>>(() => {
    const out: Record<Severity, number> = { CRITICAL: 0, WARNING: 0, INFO: 0 };
    for (const it of items ?? []) out[it.severity] += 1;
    return out;
  }, [items]);

  const globalCategoryCounts = useMemo<Record<AnomalyCategory, number>>(() => {
    const out: Record<AnomalyCategory, number> = { DATA_ERROR: 0, BEHAVIOUR: 0, INFO: 0 };
    for (const it of items ?? []) out[categoryOf(it.ruleCode)] += 1;
    return out;
  }, [items]);

  // Unique trucks for the dropdown
  const truckOptions = useMemo(() => {
    const m = new Map<string, { id: string; plate: string | null }>();
    for (const it of items ?? []) {
      const id = it.truckId ?? UNASSIGNED_KEY;
      if (!m.has(id)) m.set(id, { id, plate: it.plate });
    }
    return Array.from(m.values());
  }, [items]);

  const ruleOptions = useMemo(() => {
    const s = new Set<string>();
    for (const it of items ?? []) s.add(it.ruleCode);
    return Array.from(s.values());
  }, [items]);

  const filtered = useMemo<AnomalyPendingItem[]>(() => {
    const base = items ?? [];
    return base.filter((it) => {
      if (severityFilter !== 'ALL' && it.severity !== severityFilter) return false;
      if (categoryFilter !== 'ALL' && categoryOf(it.ruleCode) !== categoryFilter) return false;
      if (truckFilter !== 'ALL') {
        const id = it.truckId ?? UNASSIGNED_KEY;
        if (id !== truckFilter) return false;
      }
      if (ruleFilter !== 'ALL' && it.ruleCode !== ruleFilter) return false;
      return true;
    });
  }, [items, severityFilter, categoryFilter, truckFilter, ruleFilter]);

  // Classifies the current selection so the bulk bar can pick between
  // confirm-all, fix-and-confirm, and dismiss-only CTAs.
  const selectionBreakdown = useMemo<SelectionBreakdown>(() => {
    const out: SelectionBreakdown = { dataError: [], behaviour: [], info: [] };
    const byId = new Map((items ?? []).map((it) => [it.anomalyId, it] as const));
    for (const id of selected) {
      const it = byId.get(id);
      if (!it) continue;
      const c = categoryOf(it.ruleCode);
      if (c === 'DATA_ERROR') out.dataError.push(id);
      else if (c === 'BEHAVIOUR') out.behaviour.push(id);
      else out.info.push(id);
    }
    return out;
  }, [selected, items]);

  const unassignedLabel = t('fuelAlerts.card.unassignedTruck');
  const groups = useMemo(
    () => buildGroups(filtered, unassignedLabel),
    [filtered, unassignedLabel],
  );

  const orderedIds = useMemo(
    () => groups.flatMap((g) => g.items.map((it) => it.anomalyId)),
    [groups],
  );

  // Prune selection whenever the visible set changes so we don't submit
  // ids that are no longer in the backend.
  useEffect(() => {
    const visibleIds = new Set((items ?? []).map((i) => i.anomalyId));
    setSelected((prev) => {
      const next = new Set<string>();
      for (const id of prev) if (visibleIds.has(id)) next.add(id);
      return next.size === prev.size ? prev : next;
    });
  }, [items]);

  const toggleSelect = useCallback(
    (id: string, shiftKey: boolean) => {
      setSelected((prev) => {
        if (shiftKey && anchorId !== null) {
          // Gmail semantics: range-extend only ADDS to selection. To deselect,
          // user plain-clicks — range-unselect is rarely wanted and it confuses
          // people when it happens accidentally.
          const range = computeShiftRange(orderedIds, anchorId, id);
          const next = new Set(prev);
          for (const rid of range) next.add(rid);
          return next;
        }
        const next = new Set(prev);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return next;
      });
      // Anchor advances on every click (Gmail), not stays pinned (Finder).
      // Long triage sessions rarely want the anchor far behind.
      setAnchorId(id);
    },
    [anchorId, orderedIds],
  );

  const clearSelection = useCallback(() => {
    setSelected(new Set());
    setAnchorId(null);
  }, []);

  const handleCatAConfirm = useCallback(async () => {
    const ids = selectionBreakdown.dataError;
    if (!fleetId || ids.length === 0) return;
    setBulkConfirming(true);
    try {
      await Promise.allSettled(ids.map((id) => fuelAnomalyApi.confirm(fleetId, id)));
      toast.success(t('fuelAlerts.toast.catAClosed', { count: ids.length }));
    } catch (err) {
      console.error('Cat A bulk confirm failed', err);
      toast.error(err instanceof Error ? err.message : t('fuelAlerts.toast.loadError'));
    } finally {
      setBulkConfirming(false);
      clearSelection();
      await refresh();
    }
  }, [fleetId, selectionBreakdown.dataError, t, clearSelection, refresh]);

  const handleCatBConfirm = useCallback(async () => {
    const ids = selectionBreakdown.behaviour;
    if (!fleetId || ids.length === 0) return;
    setBulkConfirming(true);
    try {
      await Promise.allSettled(ids.map((id) => fuelAnomalyApi.confirm(fleetId, id)));
      toast.success(t('fuelAlerts.toast.catBRecorded', { count: ids.length }));
    } catch (err) {
      console.error('Cat B bulk confirm failed', err);
      toast.error(err instanceof Error ? err.message : t('fuelAlerts.toast.loadError'));
    } finally {
      setBulkConfirming(false);
      clearSelection();
      await refresh();
    }
  }, [fleetId, selectionBreakdown.behaviour, t, clearSelection, refresh]);

  const count = items?.length ?? 0;
  const hasAnyData = count > 0;
  const hasVisible = filtered.length > 0;
  const anyFilterActive =
    severityFilter !== 'ALL' ||
    categoryFilter !== 'ALL' ||
    truckFilter !== 'ALL' ||
    ruleFilter !== 'ALL';

  if (!fleetId) return null;

  // Nav index within the filtered list so the detail modal can step through
  // siblings via ← / →. -1 when the open alert has since dropped out of the
  // filtered view (e.g. mutation changed severity / rule filter).
  const openIdx = openAlert
    ? filtered.findIndex((a) => a.anomalyId === openAlert.anomalyId)
    : -1;
  const hasPrev = openIdx > 0;
  const hasNext = openIdx >= 0 && openIdx < filtered.length - 1;

  return (
    <div className="min-h-screen bg-warm">
      <div className="p-6 max-w-6xl mx-auto space-y-6 pb-32">
        <FuelSectionNav />

        {/* Page header */}
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
            {t('fuelAlerts.pageTitle')}
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            <span className="font-semibold text-slate-800">
              {t('fuelAlerts.pageSubtitle', { count })}
            </span>
            {lastLoadedAt && (
              <>
                {' · '}
                <span className="text-slate-500">
                  {formatDateTime(lastLoadedAt)}
                </span>
              </>
            )}
          </p>
        </div>

        {/* Loading skeleton */}
        {loading && items === null && (
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-3">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="h-24 bg-white rounded-xl border border-slate-200 animate-pulse"
                />
              ))}
            </div>
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="h-28 bg-white rounded-xl border border-slate-200 animate-pulse"
              />
            ))}
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div className="bg-urgent-50 border border-urgent-200 rounded-xl p-5 flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-urgent-700">
                {t('fuelAlerts.toast.loadError')}
              </p>
              <p className="mt-1 text-xs text-urgent-600">{error}</p>
            </div>
            <button
              type="button"
              onClick={() => void refresh()}
              className="px-3 py-1.5 text-xs font-semibold bg-white border border-urgent-300 rounded-lg text-urgent-700 hover:bg-urgent-100 transition-colors"
            >
              Tekrar dene
            </button>
          </div>
        )}

        {/* Content */}
        {!loading && !error && items !== null && (
          <>
            {/* Severity tote board (also filter) */}
            <SeverityToteBoard
              counts={globalCounts}
              active={severityFilter}
              onSelect={setSeverityFilter}
            />

            {/* Filter bar */}
            {hasAnyData && (
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="inline-flex items-center gap-1 bg-white rounded-lg border border-slate-200 p-1">
                    <FilterChip
                      active={severityFilter === 'ALL'}
                      onClick={() => setSeverityFilter('ALL')}
                      label={t('fuelAlerts.filters.all')}
                      count={count}
                      countClass="text-slate-400"
                    />
                    <FilterChip
                      active={severityFilter === 'CRITICAL'}
                      onClick={() => setSeverityFilter('CRITICAL')}
                      label={t('fuelAlerts.severity.urgent')}
                      count={globalCounts.CRITICAL}
                      countClass="text-urgent-600"
                    />
                    <FilterChip
                      active={severityFilter === 'WARNING'}
                      onClick={() => setSeverityFilter('WARNING')}
                      label={t('fuelAlerts.severity.attention')}
                      count={globalCounts.WARNING}
                      countClass="text-attention-600"
                    />
                    <FilterChip
                      active={severityFilter === 'INFO'}
                      onClick={() => setSeverityFilter('INFO')}
                      label={t('fuelAlerts.severity.info')}
                      count={globalCounts.INFO}
                      countClass="text-info-600"
                    />
                  </div>

                  {/* Truck dropdown */}
                  <div className="relative">
                    <TruckIcon className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <ChevronDown className="w-3 h-3 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <select
                      value={truckFilter}
                      onChange={(e) => setTruckFilter(e.target.value)}
                      className="pl-9 pr-8 py-1.5 bg-white rounded-lg border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 appearance-none focus:outline-none focus:border-primary-500 cursor-pointer"
                    >
                      <option value="ALL">{t('fuelAlerts.filters.anyTruck')}</option>
                      {truckOptions.map((o) => (
                        <option key={o.id} value={o.id}>
                          {o.id === UNASSIGNED_KEY
                            ? unassignedLabel
                            : (o.plate ?? unassignedLabel)}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Rule dropdown */}
                  <div className="relative">
                    <FilterIcon className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <ChevronDown className="w-3 h-3 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <select
                      value={ruleFilter}
                      onChange={(e) => setRuleFilter(e.target.value)}
                      className="pl-9 pr-8 py-1.5 bg-white rounded-lg border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 appearance-none focus:outline-none focus:border-primary-500 cursor-pointer"
                    >
                      <option value="ALL">{t('fuelAlerts.filters.anyRule')}</option>
                      {ruleOptions.map((r) => (
                        <option key={r} value={r}>
                          {t(`fuelAlerts.rules.${r}.title`, { defaultValue: r })}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="ml-auto text-xs text-slate-500">
                    {t('fuelAlerts.filters.lastDays')}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <div className="inline-flex items-center gap-1 bg-white rounded-lg border border-slate-200 p-1">
                    <FilterChip
                      active={categoryFilter === 'ALL'}
                      onClick={() => setCategoryFilter('ALL')}
                      label={t('fuelAlerts.category.all')}
                      count={count}
                      countClass="text-slate-400"
                    />
                    <FilterChip
                      active={categoryFilter === 'DATA_ERROR'}
                      onClick={() => setCategoryFilter('DATA_ERROR')}
                      label={t('fuelAlerts.category.dataError')}
                      count={globalCategoryCounts.DATA_ERROR}
                      countClass="text-attention-600"
                    />
                    <FilterChip
                      active={categoryFilter === 'BEHAVIOUR'}
                      onClick={() => setCategoryFilter('BEHAVIOUR')}
                      label={t('fuelAlerts.category.behaviour')}
                      count={globalCategoryCounts.BEHAVIOUR}
                      countClass="text-info-600"
                    />
                    {globalCategoryCounts.INFO > 0 && (
                      <FilterChip
                        active={categoryFilter === 'INFO'}
                        onClick={() => setCategoryFilter('INFO')}
                        label={t('fuelAlerts.category.info')}
                        count={globalCategoryCounts.INFO}
                        countClass="text-slate-400"
                      />
                    )}
                  </div>
                  {categoryFilter === 'DATA_ERROR' && (
                    <span className="text-xs text-slate-500">
                      {t('fuelAlerts.category.excludedHint')}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Groups */}
            {hasVisible && (
              <div>
                {groups.map((g, idx) => (
                  <TruckAccordion
                    key={g.key}
                    plate={g.plate}
                    subtitle={g.subtitle ?? undefined}
                    severityCounts={g.counts}
                    excludedFromAnalysis={g.excludedFromAnalysis}
                    defaultOpen={idx === 0}
                  >
                    {g.items.map((alert) => (
                      <AlertCard
                        key={alert.anomalyId}
                        alert={alert}
                        selected={selected.has(alert.anomalyId)}
                        onToggleSelect={toggleSelect}
                        onOpen={setOpenAlert}
                      />
                    ))}
                  </TruckAccordion>
                ))}
              </div>
            )}

            {/* Empty state */}
            {!hasVisible && <FuelAlertsEmpty filtered={anyFilterActive && hasAnyData} />}
          </>
        )}
      </div>

      {/* Detail modal — keyboard ← / → step through the filtered list so
          triaging 30 alerts doesn't require close-open-close-open. Nav is
          scoped to `filtered` so severity/truck/rule filters don't jump you
          out of context. */}
      {openAlert && fleetId && (
        <FuelAlertDetailModal
          fleetId={fleetId}
          alert={openAlert}
          onClose={() => setOpenAlert(null)}
          onAfterMutation={() => void refresh()}
          onPrev={hasPrev ? () => setOpenAlert(filtered[openIdx - 1]) : undefined}
          onNext={hasNext ? () => setOpenAlert(filtered[openIdx + 1]) : undefined}
          position={openIdx >= 0 ? { current: openIdx + 1, total: filtered.length } : undefined}
          onFixEntry={(entryId, truckId) => {
            // Deep-link to the truck's Yakıt tab with the target entry id —
            // TruckDetailPage consumes both params on mount and opens the
            // FuelEntryFormModal in edit mode. Unmatched-plate alerts (no
            // truckId) render the primary action disabled in the modal, so
            // we never reach this branch without a truckId.
            if (!truckId) return;
            navigate(`/manager/trucks/${truckId}?tab=yakit&entry=${entryId}`);
          }}
        />
      )}

      {/* Bulk dismiss modal — scope controls which subset + which toast */}
      {bulkDismissScope && fleetId && (
        <BulkDismissModal
          fleetId={fleetId}
          anomalyIds={
            bulkDismissScope === 'dataError'
              ? selectionBreakdown.dataError
              : selectionBreakdown.behaviour
          }
          title={
            bulkDismissScope === 'dataError'
              ? t('fuelAlerts.bulkBar.catA.dismiss')
              : t('fuelAlerts.bulkBar.catB.dismiss')
          }
          onClose={() => setBulkDismissScope(null)}
          onDone={(result) => {
            toast.success(
              bulkDismissScope === 'dataError'
                ? t('fuelAlerts.toast.catARestored', { count: result.dismissed })
                : t('fuelAlerts.toast.catBClosed', { count: result.dismissed }),
            );
            setBulkDismissScope(null);
            clearSelection();
            void refresh();
          }}
        />
      )}

      {/* Floating action bar — variant mirrors the user's active category
          filter; when "ALL" and the selection spans both, we surface the
          mixed bar with a breakdown strip + smart-skip per-button counts. */}
      {(() => {
        const selectedCat: 'catA' | 'catB' | 'mixed' =
          categoryFilter === 'DATA_ERROR'
            ? 'catA'
            : categoryFilter === 'BEHAVIOUR'
              ? 'catB'
              : selectionBreakdown.dataError.length > 0 &&
                  selectionBreakdown.behaviour.length > 0
                ? 'mixed'
                : selectionBreakdown.dataError.length > 0
                  ? 'catA'
                  : 'catB';

        if (selectedCat === 'catA') {
          return (
            <FloatingActionBar
              variant="catA"
              count={selected.size}
              onConfirm={() => void handleCatAConfirm()}
              onDismiss={() => setBulkDismissScope('dataError')}
              onClear={clearSelection}
              confirming={bulkConfirming}
            />
          );
        }
        if (selectedCat === 'catB') {
          return (
            <FloatingActionBar
              variant="catB"
              count={selected.size}
              onConfirm={() => void handleCatBConfirm()}
              onDismiss={() => setBulkDismissScope('behaviour')}
              onClear={clearSelection}
              confirming={bulkConfirming}
            />
          );
        }
        return (
          <FloatingActionBar
            variant="mixed"
            count={selected.size}
            breakdown={{
              dataError: selectionBreakdown.dataError.length,
              behaviour: selectionBreakdown.behaviour.length,
            }}
            onMixedBehaviourConfirm={() => void handleCatBConfirm()}
            onMixedBehaviourDismiss={() => setBulkDismissScope('behaviour')}
            onMixedDataErrorConfirm={() => void handleCatAConfirm()}
            onClear={clearSelection}
            confirming={bulkConfirming}
          />
        );
      })()}
    </div>
  );
}

interface FilterChipProps {
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
  countClass?: string;
}

function FilterChip({ active, onClick, label, count, countClass = '' }: FilterChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
        active
          ? 'bg-slate-900 text-white'
          : 'text-slate-600 hover:bg-slate-100'
      }`}
    >
      {label}{' '}
      <span className={`ml-1 tabular-nums ${active ? 'text-slate-300' : countClass}`}>
        {count}
      </span>
    </button>
  );
}
