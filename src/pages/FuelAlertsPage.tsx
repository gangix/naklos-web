import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ChevronDown, Filter as FilterIcon, Settings, Truck as TruckIcon } from 'lucide-react';
import { toast } from 'sonner';
import { useFleet } from '../contexts/FleetContext';
import { useFuelCounts } from '../contexts/FuelCountsContext';
import { fuelAnomalyApi } from '../services/fuelAnomalyApi';
import type { AnomalyPendingItem, Severity } from '../types/fuelAnomaly';
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

const UNASSIGNED_KEY = '__unassigned__';

interface Group {
  key: string;
  plate: string | null;
  subtitle: string | null;
  items: AnomalyPendingItem[];
  counts: Record<Severity, number>;
  worst: Severity;
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
    groups.push({
      key,
      plate: firstPlate,
      subtitle: isUnassigned ? unassignedLabel : driverName,
      items: arr,
      counts,
      worst,
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

  const [items, setItems] = useState<AnomalyPendingItem[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastLoadedAt, setLastLoadedAt] = useState<string | null>(null);

  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>('ALL');
  const [truckFilter, setTruckFilter] = useState<string>('ALL');
  const [ruleFilter, setRuleFilter] = useState<string>('ALL');

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [openAlert, setOpenAlert] = useState<AnomalyPendingItem | null>(null);
  const [bulkConfirming, setBulkConfirming] = useState(false);
  const [bulkDismissOpen, setBulkDismissOpen] = useState(false);

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
      if (truckFilter !== 'ALL') {
        const id = it.truckId ?? UNASSIGNED_KEY;
        if (id !== truckFilter) return false;
      }
      if (ruleFilter !== 'ALL' && it.ruleCode !== ruleFilter) return false;
      return true;
    });
  }, [items, severityFilter, truckFilter, ruleFilter]);

  const unassignedLabel = t('fuelAlerts.card.unassignedTruck');
  const groups = useMemo(
    () => buildGroups(filtered, unassignedLabel),
    [filtered, unassignedLabel],
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

  const toggleSelect = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const clearSelection = useCallback(() => setSelected(new Set()), []);

  const handleBulkConfirm = useCallback(async () => {
    if (!fleetId || selected.size === 0) return;
    setBulkConfirming(true);
    const ids = Array.from(selected);
    try {
      const results = await Promise.allSettled(
        ids.map((id) => fuelAnomalyApi.confirm(fleetId, id)),
      );
      const ok = results.filter((r) => r.status === 'fulfilled').length;
      toast.success(t('fuelAlerts.toast.bulkConfirmed', { count: ok }));
    } catch (err) {
      console.error('Bulk confirm failed', err);
      toast.error(err instanceof Error ? err.message : t('fuelAlerts.toast.loadError'));
    } finally {
      setBulkConfirming(false);
      clearSelection();
      await refresh();
    }
  }, [fleetId, selected, t, clearSelection, refresh]);

  const count = items?.length ?? 0;
  const hasAnyData = count > 0;
  const hasVisible = filtered.length > 0;
  const anyFilterActive =
    severityFilter !== 'ALL' || truckFilter !== 'ALL' || ruleFilter !== 'ALL';

  if (!fleetId) return null;

  return (
    <div className="min-h-screen bg-warm">
      <div className="p-6 max-w-6xl mx-auto space-y-6 pb-32">
        <div className="flex items-center justify-between gap-3">
          <FuelSectionNav />
          <Link
            to="/manager/fuel-alerts/config"
            className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-600 border border-slate-200 bg-white hover:bg-slate-50 rounded-lg transition-colors flex-shrink-0"
            title={t('fuelAlerts.settingsLink')}
          >
            <Settings className="w-4 h-4" />
            <span className="hidden sm:inline">{t('fuelAlerts.settingsLink')}</span>
          </Link>
        </div>

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

      {/* Detail modal */}
      {openAlert && fleetId && (
        <FuelAlertDetailModal
          fleetId={fleetId}
          alert={openAlert}
          onClose={() => setOpenAlert(null)}
          onAfterMutation={() => void refresh()}
        />
      )}

      {/* Bulk dismiss modal */}
      {bulkDismissOpen && fleetId && selected.size > 0 && (
        <BulkDismissModal
          fleetId={fleetId}
          anomalyIds={Array.from(selected)}
          onClose={() => setBulkDismissOpen(false)}
          onDone={(result) => {
            toast.success(
              t('fuelAlerts.toast.bulkDismissed', {
                dismissed: result.dismissed,
                skipped: result.skipped + result.notFound,
              }),
            );
            setBulkDismissOpen(false);
            clearSelection();
            void refresh();
          }}
        />
      )}

      {/* Floating action bar */}
      <FloatingActionBar
        count={selected.size}
        onConfirm={() => void handleBulkConfirm()}
        onDismiss={() => setBulkDismissOpen(true)}
        onClear={clearSelection}
        confirming={bulkConfirming}
      />
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
