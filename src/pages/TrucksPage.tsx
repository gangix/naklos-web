import { useState, useMemo, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AlertCircle, AlertTriangle, Download, FileText, Fuel, MapPin, Truck as TruckIcon, Wrench } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useFleet } from '../contexts/FleetContext';
import { useFleetRoster } from '../contexts/FleetRosterContext';
import { useFuelCounts } from '../contexts/FuelCountsContext';
import { useMaintenanceWarnings } from '../contexts/MaintenanceWarningsContext';
import { formatDecimal, formatRelativeTime } from '../utils/format';
import { deriveTruckStatus, STATUS_BADGE } from '../utils/derivedStatus';
import type { DerivedStatus } from '../utils/derivedStatus';
import { computeTruckWarnings } from '../utils/truckWarnings';
import { severityFromDays } from '../utils/severity';
import { todayMidnightMs } from '../utils/expiry';
import AddTruckModal from '../components/common/AddTruckModal';
import BulkImportModal from '../components/common/BulkImportModal';
import UpgradeModal from '../components/common/UpgradeModal';
import ViewToggle, { type TruckView } from '../components/trucks/ViewToggle';
import TruckTable from '../components/trucks/TruckTable';
import { limitOf, planOf } from '../utils/planLimits';

// localStorage can throw (Safari private mode, strict CSP, quota full).
// Wrap reads/writes so the page still renders when storage is unavailable.
function readStoredView(): TruckView {
  try {
    return localStorage.getItem('trucks.view') === 'table' ? 'table' : 'list';
  } catch {
    return 'list';
  }
}

function writeStoredView(v: TruckView): void {
  try {
    localStorage.setItem('trucks.view', v);
  } catch {
    // noop — Safari private / storage disabled / quota full
  }
}

const TrucksPage = () => {
  const { t } = useTranslation();
  const { plan } = useFleet();
  const { trucks, loading: trucksLoading, refresh: refreshRoster } = useFleetRoster();
  const maxTrucks = limitOf(planOf(plan), 'truck');
  const [searchParams, setSearchParams] = useSearchParams();
  const [filter, setFilter] = useState<DerivedStatus | 'all'>('all');
  const [addTruckModalOpen, setAddTruckModalOpen] = useState(false);
  const [bulkImportOpen, setBulkImportOpen] = useState(false);
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [upgradeMessage, setUpgradeMessage] = useState<string | undefined>();
  // Presentation toggle — persisted so repeat visitors land in the mode
  // they last picked. Default 'list' preserves the pre-toggle experience.
  const [view, setView] = useState<TruckView>(readStoredView);
  useEffect(() => { writeStoredView(view); }, [view]);

  const { pendingItems: allFuelAnomalies } = useFuelCounts();
  const { groups: maintenanceGroups } = useMaintenanceWarnings();

  // Expiry warnings keyed by truckId. Shares the computation with
  // TruckDetailPage's Genel tab so both surfaces word warnings identically.
  // Fuel anomalies and maintenance warnings are layered in afterwards so the
  // list card, table docStatus cell, and urgency sort all reflect them.
  const warningsByTruck = useMemo(() => {
    const todayMs = todayMidnightMs();
    const map = new Map<string, ReturnType<typeof computeTruckWarnings>>();
    for (const t of trucks) map.set(t.id, computeTruckWarnings(t, todayMs));
    // Layer in fuel anomalies
    for (const anomaly of allFuelAnomalies) {
      if (!anomaly.truckId) continue;
      const existing = map.get(anomaly.truckId) ?? [];
      existing.push({
        key: 'truckTable.fuelAnomaly',
        params: { rule: anomaly.ruleCode },
        severity: anomaly.severity,
        type: 'compulsory-insurance' as const,
        daysLeft: 0,
      });
      map.set(anomaly.truckId, existing);
    }
    // Layer in maintenance warnings
    for (const group of maintenanceGroups) {
      for (const item of group.items) {
        const existing = map.get(group.truckId) ?? [];
        existing.push({
          key: 'truckTable.maintenanceDue',
          params: { label: item.label },
          severity: severityFromDays(item.daysLeft),
          type: 'inspection' as const,
          daysLeft: item.daysLeft,
        });
        map.set(group.truckId, existing);
      }
    }
    return map;
  }, [trucks, allFuelAnomalies, maintenanceGroups]);

  // Dashboard quick-action support: `?add=1` auto-opens the add-truck modal
  // on mount. Consumed once — the param is stripped so reloads don't re-open
  // the modal. Falls through to the plan-limit upgrade nudge when needed.
  // setSearchParams + the setState setters are all stable references; only
  // value-carrying deps belong here.
  useEffect(() => {
    if (searchParams.get('add') !== '1') return;
    if (maxTrucks !== -1 && trucks.length >= maxTrucks) {
      setUpgradeMessage(undefined);
      setUpgradeModalOpen(true);
    } else {
      setAddTruckModalOpen(true);
    }
    const next = new URLSearchParams(searchParams);
    next.delete('add');
    setSearchParams(next, { replace: true });
  }, [searchParams, maxTrucks, trucks.length, setSearchParams]);

  const hasUrgentWarning = (truckId: string): boolean =>
    (warningsByTruck.get(truckId) ?? []).some((w) => w.severity === 'CRITICAL');

  const getTruckWarnings = (truckId: string) => warningsByTruck.get(truckId) ?? [];

  // Memoize derived status per truck to avoid repeated deriveTruckStatus calls
  const statusByTruckId = useMemo(() => {
    const map = new Map<string, DerivedStatus>();
    for (const t of trucks) map.set(t.id, deriveTruckStatus(t));
    return map;
  }, [trucks]);

  const statusCounts = useMemo<Record<DerivedStatus, number>>(() => {
    const acc: Record<DerivedStatus, number> = { ACTIVE: 0, READY: 0, MISSING_DOCS: 0 };
    for (const s of statusByTruckId.values()) acc[s]++;
    return acc;
  }, [statusByTruckId]);

  // Filter and sort trucks by urgency: expired/missing first, then soonest
  // positive daysLeft, then no-warning trucks. Mirrors the dashboard priority
  // briefing sort so the table and the dashboard agree on what's most urgent.
  const filteredTrucks = useMemo(() => {
    const filtered = filter === 'all' ? trucks : trucks.filter((truck) => statusByTruckId.get(truck.id) === filter);

    // Derive the "worst" daysLeft per truck for sort purposes.
    // Tier: 0 = urgent (≤7 or negative), 1 = attention (8–30), 2 = info/missing, 3 = no warnings.
    function urgencyTier(truckId: string): { tier: number; daysLeft: number } {
      const ws = warningsByTruck.get(truckId) ?? [];
      if (ws.length === 0) return { tier: 3, daysLeft: Infinity };
      // Find worst (smallest daysLeft, null goes to end of tier 2)
      let worst: number | null = null;
      for (const w of ws) {
        if (w.daysLeft === null) continue;
        if (worst === null || w.daysLeft < worst) worst = w.daysLeft;
      }
      if (worst === null) return { tier: 2, daysLeft: Infinity }; // all missing dates
      if (worst <= 7) return { tier: 0, daysLeft: worst };
      if (worst <= 30) return { tier: 1, daysLeft: worst };
      return { tier: 2, daysLeft: worst };
    }

    return [...filtered].sort((a, b) => {
      const ua = urgencyTier(a.id);
      const ub = urgencyTier(b.id);
      if (ua.tier !== ub.tier) return ua.tier - ub.tier;
      return ua.daysLeft - ub.daysLeft;
    });
  }, [filter, warningsByTruck, trucks, statusByTruckId]);

  if (trucksLoading) {
    return (
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-gray-900 mb-4">{t('truck.title')}</h1>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-gray-600">{t('common.loading')}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">
          {t('truck.title')}
          <span className="text-sm font-medium text-gray-400 ml-2">
            ({trucks.length}{maxTrucks !== -1 ? `/${maxTrucks}` : ''})
          </span>
        </h1>
        <div className="flex gap-2">
          <button
            onClick={() => {
              if (plan === 'FREE') { setUpgradeMessage(t('bulkImport.bulkImportUpgrade')); setUpgradeModalOpen(true); }
              else setBulkImportOpen(true);
            }}
            className="px-4 py-2 border border-primary-600 text-primary-600 rounded-lg text-sm font-medium hover:bg-primary-50 transition-colors"
          >
            <Download className="w-4 h-4 inline -mt-0.5" /> {t('trucksPage.import')}
          </button>
          <button
            onClick={() => {
              if (maxTrucks !== -1 && trucks.length >= maxTrucks) { setUpgradeMessage(undefined); setUpgradeModalOpen(true); }
              else setAddTruckModalOpen(true);
            }}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-semibold hover:bg-primary-700 hover:shadow-lg hover:shadow-primary-500/20 transition-all"
          >
            {t('trucksPage.addTruck')}
          </button>
        </div>
      </div>

      {/* Filter chips + view toggle */}
      <div className="flex items-center gap-2 mb-4 pb-2">
        <div className="flex gap-2 overflow-x-auto flex-1 min-w-0">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2.5 rounded-full text-sm font-medium whitespace-nowrap ${
              filter === 'all' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700'
            }`}
          >
            {t('truck.all')} ({trucks.length})
          </button>
          <button
            onClick={() => setFilter('ACTIVE')}
            className={`px-4 py-2.5 rounded-full text-sm font-medium whitespace-nowrap ${
              filter === 'ACTIVE' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700'
            }`}
          >
            {t('derivedStatus.ACTIVE')} ({statusCounts.ACTIVE})
          </button>
          <button
            onClick={() => setFilter('READY')}
            className={`px-4 py-2.5 rounded-full text-sm font-medium whitespace-nowrap ${
              filter === 'READY' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700'
            }`}
          >
            {t('derivedStatus.READY')} ({statusCounts.READY})
          </button>
          <button
            onClick={() => setFilter('MISSING_DOCS')}
            className={`px-4 py-2.5 rounded-full text-sm font-medium whitespace-nowrap ${
              filter === 'MISSING_DOCS' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700'
            }`}
          >
            {t('derivedStatus.MISSING_DOCS')} ({statusCounts.MISSING_DOCS})
          </button>
        </div>
        <ViewToggle value={view} onChange={setView} />
      </div>

      {/* Truck list */}
      <div className="space-y-3">
        {filteredTrucks.length === 0 && trucks.length === 0 && (
          <div className="bg-white rounded-xl border-2 border-dashed border-gray-300 p-10 text-center">
            <TruckIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-gray-900 mb-2">{t('trucksPage.emptyTitle')}</h3>
            <p className="text-sm text-gray-600 mb-4 max-w-md mx-auto">
              {t('trucksPage.emptyHint')}
            </p>
            <div className="flex gap-2 justify-center flex-wrap">
              <button
                onClick={() => {
                  if (plan === 'FREE') { setUpgradeMessage(t('bulkImport.bulkImportUpgrade')); setUpgradeModalOpen(true); }
                  else setBulkImportOpen(true);
                }}
                className="px-4 py-2 border border-primary-600 text-primary-600 rounded-lg text-sm font-medium hover:bg-primary-50"
              >
                <Download className="w-4 h-4 inline -mt-0.5" /> {t('trucksPage.excelImport')}
              </button>
              <button
                onClick={() => {
                  if (maxTrucks !== -1 && trucks.length >= maxTrucks) { setUpgradeMessage(undefined); setUpgradeModalOpen(true); }
                  else setAddTruckModalOpen(true);
                }}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700"
              >
                {t('trucksPage.addFirst')}
              </button>
            </div>
          </div>
        )}
        {filteredTrucks.length === 0 && trucks.length > 0 && (
          <div className="bg-white rounded-xl p-6 text-center text-gray-500">
            {t('trucksPage.noFilterResult')}
          </div>
        )}
        {view === 'table' && filteredTrucks.length > 0 && (
          <TruckTable
            trucks={filteredTrucks}
            warningsByTruck={warningsByTruck}
            hasUrgentWarning={hasUrgentWarning}
            statusByTruckId={statusByTruckId}
          />
        )}
        {view === 'list' && filteredTrucks.map((truck) => {
          const hasWarning = hasUrgentWarning(truck.id);
          return (
            <Link
              key={truck.id}
              to={`/manager/trucks/${truck.id}`}
              className={`block bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow ${
                hasWarning ? 'border-2 border-red-500' : 'border border-gray-100'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 flex-1">
                  <div className="flex-1">
                    <p className="font-mono font-bold tabular-nums text-gray-900">{truck.plateNumber}</p>
                    <p className="text-sm text-gray-600 mt-1">{t(`truckType.${truck.type}`, { defaultValue: truck.type })}</p>
                  </div>
                  {hasWarning && (
                    <div className="flex items-center gap-1 px-2 py-1 bg-red-50 border border-red-200 rounded-md">
                      <AlertCircle className="w-4 h-4 text-red-500" />
                      <span className="text-xs font-medium text-red-700">{t('trucksPage.warningLabel')}</span>
                    </div>
                  )}
                </div>
                {(() => {
                  const ds = statusByTruckId.get(truck.id)!;
                  const badge = STATUS_BADGE[ds];
                  return (
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold ${badge.bg} ${badge.text}`}>
                      {t(`derivedStatus.${ds}`)}
                    </span>
                  );
                })()}
              </div>
              <div className="text-sm text-gray-600">
                <p>
                  {t('truck.driver')}: {truck.assignedDriverName || t('trucksPage.notAssigned')}
                </p>
                {/* Tertiary signal: warnings below keep priority when
                    present; on healthy trucks this is the "all good" cue. */}
                {truck.expectedLPer100KmDerived !== null && (
                  <p className="mt-1 text-xs text-gray-400 tabular-nums">
                    {formatDecimal(truck.expectedLPer100KmDerived)}{' '}
                    {t('fuelEntry.summary.avgConsumptionUnit')}{' '}
                    {t('trucksPage.consumptionSuffix')}
                  </p>
                )}
                {truck.lastPosition && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      window.open(
                        `https://www.google.com/maps?q=${truck.lastPosition!.lat},${truck.lastPosition!.lng}`,
                        '_blank',
                        'noopener,noreferrer'
                      );
                    }}
                    className="mt-1 inline-flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700 hover:underline"
                  >
                    <MapPin className="w-3.5 h-3.5 inline -mt-0.5" /> {truck.lastPosition.city}
                    {truck.lastPosition.updatedAt && (
                      <span className="text-gray-400">
                        · {formatRelativeTime(truck.lastPosition.updatedAt)}
                      </span>
                    )}
                  </button>
                )}
              </div>

              {/* Domain summary — instead of one row per warning (which can
                  produce 8+ rows for a single truck), show one chip per
                  domain (docs / fuel / maintenance) with worst severity +
                  count. Manager clicks into TruckDetail for per-warning
                  detail (the EntityWarningsRollup there shows it all). */}
              {(() => {
                const all = getTruckWarnings(truck.id);
                if (all.length === 0) return null;
                const docs = all.filter((w) => w.key.startsWith('warning.'));
                const fuels = all.filter((w) => w.key === 'truckTable.fuelAnomaly');
                const maintenance = all.filter((w) => w.key === 'truckTable.maintenanceDue');
                const worstOf = (group: typeof all) => {
                  if (group.some((w) => w.severity === 'CRITICAL')) return 'CRITICAL';
                  if (group.some((w) => w.severity === 'WARNING')) return 'WARNING';
                  return 'INFO';
                };
                const toneClass = (sev: 'CRITICAL' | 'WARNING' | 'INFO') =>
                  sev === 'CRITICAL'
                    ? 'bg-urgent-50 text-urgent-700'
                    : sev === 'WARNING'
                    ? 'bg-attention-50 text-attention-700'
                    : 'bg-info-50 text-info-700';
                const summary: Array<{ key: string; sev: 'CRITICAL' | 'WARNING' | 'INFO'; icon: React.ReactNode; label: string }> = [];
                if (docs.length > 0) {
                  summary.push({
                    key: 'docs',
                    sev: worstOf(docs),
                    icon: <FileText className="w-3.5 h-3.5 inline flex-shrink-0" />,
                    label: t('trucks.summary.docs', { count: docs.length }),
                  });
                }
                if (fuels.length > 0) {
                  summary.push({
                    key: 'fuel',
                    sev: worstOf(fuels),
                    icon: <Fuel className="w-3.5 h-3.5 inline flex-shrink-0" />,
                    label: t('trucks.summary.fuel', { count: fuels.length }),
                  });
                }
                if (maintenance.length > 0) {
                  summary.push({
                    key: 'maintenance',
                    sev: worstOf(maintenance),
                    icon: <Wrench className="w-3.5 h-3.5 inline flex-shrink-0" />,
                    label: t('trucks.summary.maintenance', { count: maintenance.length }),
                  });
                }
                return (
                  <div className="mt-3 pt-3 border-t border-gray-100 flex flex-wrap gap-1.5">
                    {summary.map((s) => (
                      <span key={s.key} className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded ${toneClass(s.sev)}`}>
                        {s.icon}
                        {s.label}
                      </span>
                    ))}
                  </div>
                );
              })()}
            </Link>
          );
        })}
      </div>

      <AddTruckModal
        isOpen={addTruckModalOpen}
        onClose={() => setAddTruckModalOpen(false)}
        onSuccess={refreshRoster}
      />

      <BulkImportModal
        isOpen={bulkImportOpen}
        onClose={() => setBulkImportOpen(false)}
        onSuccess={refreshRoster}
        entityType="truck"
      />

      <UpgradeModal
        isOpen={upgradeModalOpen}
        onClose={() => { setUpgradeModalOpen(false); setUpgradeMessage(undefined); }}
        resource="truck"
        currentPlan={plan}
        message={upgradeMessage}
      />
    </div>
  );
};

export default TrucksPage;
