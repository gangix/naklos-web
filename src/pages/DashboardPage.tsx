import { useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Truck, Users, CheckCircle, Plus, UserPlus, Fuel } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useFleet } from '../contexts/FleetContext';
import { useFleetRoster } from '../contexts/FleetRosterContext';
import { useFuelCounts } from '../contexts/FuelCountsContext';
import { useMaintenanceWarnings } from '../contexts/MaintenanceWarningsContext';
import { severityFromDays, worstSeverity } from '../utils/severity';
import { computeDriverWarnings, type DriverWarning } from '../utils/driverWarnings';
import { computeTruckWarnings, type TruckWarning } from '../utils/truckWarnings';
import PriorityBriefing, {
  type PriorityDocGroup,
  type PriorityDocItem,
} from '../components/dashboard/PriorityBriefing';

/** Map a canonical truck warning's `type` field onto the dashboard's existing
 *  `doc.*` i18n key. Keeps the rollup card's wording identical to before the
 *  refactor — the canonical util uses `warning.*Expired/Expiring/Missing`
 *  keys (sentence-form, used in toasts/lists), but the dashboard renders
 *  short doc-name labels. */
const TRUCK_DOC_LABEL_KEYS: Record<TruckWarning['type'], string> = {
  'compulsory-insurance': 'doc.compulsoryInsurance',
  'comprehensive-insurance': 'doc.comprehensiveInsurance',
  inspection: 'doc.inspection',
};

const DRIVER_DOC_LABEL_KEYS: Record<DriverWarning['type'], string> = {
  license: 'doc.license',
  src: 'doc.src',
  cpc: 'doc.cpc',
};

const truckWarningToItem = (w: TruckWarning): PriorityDocItem => ({
  labelKey: TRUCK_DOC_LABEL_KEYS[w.type],
  daysLeft: w.daysLeft,
  severity: w.severity,
});

const driverWarningToItem = (w: DriverWarning): PriorityDocItem => ({
  labelKey: DRIVER_DOC_LABEL_KEYS[w.type],
  daysLeft: w.daysLeft,
  severity: w.severity,
});

const groupFromItems = (
  entity: 'truck' | 'driver',
  entityId: string,
  name: string,
  items: PriorityDocItem[],
): PriorityDocGroup => {
  let worstDaysLeft: number | null = null;
  for (const item of items) {
    if (item.daysLeft === null) continue;
    if (worstDaysLeft === null || item.daysLeft < worstDaysLeft) {
      worstDaysLeft = item.daysLeft;
    }
  }
  const worstSev = worstSeverity(
    items.map((i) => ({
      kind: 'doc' as const,
      severity: i.severity,
      labelKey: i.labelKey,
      daysLeft: i.daysLeft,
      isMandatory: false,
    })),
  );
  return { entity, entityId, name, items, worstDaysLeft, worstSeverity: worstSev };
};

const DashboardPage = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { plan } = useFleet();
  const {
    total: fuelAttentionCount,
    worstPendingSeverity: fuelWorstSeverity,
    pendingBreakdown: fuelBreakdown,
  } = useFuelCounts();
  const { groups: maintenanceGroups } = useMaintenanceWarnings();
  // Same gate ManagerTopNav uses — fuel surface is paid-only in prod.
  const forceOn = import.meta.env.VITE_FEATURE_FUEL_TRACKING === 'true';
  const fuelTrackingEnabled = Boolean(forceOn || (plan && plan !== 'FREE'));
  const { trucks, drivers, loading } = useFleetRoster();

  const docWarningGroups = useMemo<PriorityDocGroup[]>(() => {
    const groups: PriorityDocGroup[] = [];

    // Source of truth = computeTruckWarnings / computeDriverWarnings (same
    // utils used by the sidebar badge + per-entity detail pages). Dashboard
    // used to maintain its own list of mandatory-doc fields here, which
    // drifted (e.g. SRC mandatory-missing was silently dropped). Now we
    // just consume the canonical warnings and adapt them to PriorityDocItem.
    for (const truck of trucks) {
      const warnings = computeTruckWarnings(truck);
      if (warnings.length === 0) continue;
      const items = warnings.map(truckWarningToItem);
      groups.push(groupFromItems('truck', truck.id, truck.plateNumber, items));
    }

    for (const driver of drivers) {
      const warnings = computeDriverWarnings(driver);
      if (warnings.length === 0) continue;
      const items = warnings.map(driverWarningToItem);
      groups.push(
        groupFromItems('driver', driver.id, `${driver.firstName} ${driver.lastName}`, items),
      );
    }

    // Expired first, then soonest; entries with only missing dates go last.
    groups.sort((a, b) => {
      if (a.worstDaysLeft === null && b.worstDaysLeft === null) return 0;
      if (a.worstDaysLeft === null) return 1;
      if (b.worstDaysLeft === null) return -1;
      return a.worstDaysLeft - b.worstDaysLeft;
    });

    return groups;
  }, [trucks, drivers]);

  const maintenanceWarningGroups = useMemo<PriorityDocGroup[]>(() => {
    return maintenanceGroups.map((g) => {
      const items: PriorityDocItem[] = g.items.map((i) => ({
        labelKey: '',
        rawLabel: i.label,
        daysLeft: i.daysLeft,
        severity: severityFromDays(i.daysLeft),
      }));
      return {
        entity: 'truck-maintenance' as const,
        entityId: g.truckId,
        name: g.plate,
        items,
        worstDaysLeft: g.worstDaysLeft,
        worstSeverity: worstSeverity(items.map((i) => ({
          kind: 'doc' as const,
          severity: i.severity,
          labelKey: i.labelKey,
          daysLeft: i.daysLeft,
          isMandatory: false,
        }))),
      };
    });
  }, [maintenanceGroups]);

  const warningGroups = useMemo<PriorityDocGroup[]>(() => {
    const merged = [...docWarningGroups, ...maintenanceWarningGroups];
    merged.sort((a, b) => {
      if (a.worstDaysLeft === null && b.worstDaysLeft === null) return 0;
      if (a.worstDaysLeft === null) return 1;
      if (b.worstDaysLeft === null) return -1;
      return a.worstDaysLeft - b.worstDaysLeft;
    });
    return merged;
  }, [docWarningGroups, maintenanceWarningGroups]);

  if (loading) {
    return (
      <div className="p-4 flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    );
  }

  // Locale tag for date formatting — falls back to en-US if the language file
  // doesn't define one.
  const localeTag = t('common.localeTag', { defaultValue: 'en-US' });
  const today = new Date();
  const weekday = today.toLocaleDateString(localeTag, { weekday: 'long' });
  const fullDate = today.toLocaleDateString(localeTag, { day: 'numeric', month: 'long', year: 'numeric' });

  const hasRoster = trucks.length > 0 || drivers.length > 0;
  const hasPriorities =
    warningGroups.length > 0 || (fuelTrackingEnabled && fuelAttentionCount > 0);

  return (
    <div>
      {/* Header: date + inline fleet tally + title + quick actions. Fleet
          state lives here as clickable tally links (A2 framing) rather than
          as a standalone "Filo Durumu" section — the tally is context, the
          page's focus is the priority briefing below. */}
      <div className="mb-6 flex items-end justify-between gap-4 flex-wrap">
        <div>
          <p className="text-xs text-slate-500 mb-1 flex items-center gap-1.5 flex-wrap">
            <span className="font-medium text-slate-600">{weekday}</span>
            <span className="text-slate-300">·</span>
            <span>{fullDate}</span>
            {hasRoster && (
              <>
                <span className="text-slate-300">·</span>
                <Link
                  to="/manager/trucks"
                  className="inline-flex items-center gap-1 text-slate-600 hover:text-slate-900 transition-colors"
                >
                  <Truck className="w-3 h-3 text-blue-500" />
                  <span className="font-semibold tabular-nums">{trucks.length}</span>
                  <span>{t('dashboard.header.trucks')}</span>
                </Link>
                <span className="text-slate-300">·</span>
                <Link
                  to="/manager/drivers"
                  className="inline-flex items-center gap-1 text-slate-600 hover:text-slate-900 transition-colors"
                >
                  <Users className="w-3 h-3 text-emerald-500" />
                  <span className="font-semibold tabular-nums">{drivers.length}</span>
                  <span>{t('dashboard.header.drivers')}</span>
                </Link>
              </>
            )}
          </p>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            {t('dashboard.myFleet')}
          </h1>
        </div>
        {/* Quick actions. `?add=1` auto-opens the add-modal so the user
            doesn't land on a list and hunt for a second button. */}
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => navigate('/manager/trucks?add=1')}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-semibold rounded-lg bg-primary-600 text-white hover:bg-primary-700 hover:shadow-lg hover:shadow-primary-500/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            {t('dashboard.quickActions.addTruck', { defaultValue: 'Araç ekle' })}
          </button>
          <button
            onClick={() => navigate('/manager/drivers?add=1')}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg border border-primary-600 text-primary-600 hover:bg-primary-50 transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            {t('dashboard.quickActions.addDriver', { defaultValue: 'Sürücü ekle' })}
          </button>
          {fuelTrackingEnabled && (
            <button
              onClick={() => navigate('/manager/fuel-imports')}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg border border-primary-600 text-primary-600 hover:bg-primary-50 transition-colors"
            >
              <Fuel className="w-4 h-4" />
              {t('dashboard.quickActions.importFuel', { defaultValue: 'Yakıt içe aktar' })}
            </button>
          )}
        </div>
      </div>

      {/* Primary content: the priority briefing. */}
      {hasPriorities && (
        <PriorityBriefing
          warningGroups={warningGroups}
          fuelAttentionCount={fuelAttentionCount}
          fuelEnabled={fuelTrackingEnabled}
          fuelWorstSeverity={fuelWorstSeverity}
          fuelBreakdown={fuelBreakdown}
        />
      )}

      {/* Onboarding — empty roster gets a nudge, not an "all clear" signal. */}
      {!hasRoster && (
        <div className="bg-white border border-slate-200 rounded-xl p-8 text-center">
          <div className="w-12 h-12 rounded-xl bg-primary-50 text-primary-600 mx-auto mb-3 flex items-center justify-center">
            <Truck className="w-6 h-6" />
          </div>
          <p className="text-base font-extrabold text-slate-900 tracking-tight">
            {t('dashboard.onboarding.title')}
          </p>
          <p className="text-sm text-slate-600 mt-1 max-w-md mx-auto">
            {t('dashboard.onboarding.subtitle')}
          </p>
          <div className="mt-5 flex gap-2 flex-wrap justify-center">
            <button
              onClick={() => navigate('/manager/trucks?add=1')}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-lg bg-primary-600 text-white hover:bg-primary-700 hover:shadow-lg hover:shadow-primary-500/20 transition-all"
            >
              <Plus className="w-4 h-4" />
              {t('dashboard.quickActions.addTruck', { defaultValue: 'Araç ekle' })}
            </button>
            <button
              onClick={() => navigate('/manager/drivers?add=1')}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg border border-primary-600 text-primary-600 hover:bg-primary-50 transition-colors"
            >
              <UserPlus className="w-4 h-4" />
              {t('dashboard.quickActions.addDriver', { defaultValue: 'Sürücü ekle' })}
            </button>
          </div>
        </div>
      )}

      {/* All-clear: roster exists AND no priorities. */}
      {hasRoster && !hasPriorities && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
          <CheckCircle className="w-10 h-10 text-green-500 mx-auto mb-2" />
          <p className="text-sm font-medium text-green-900">{t('dashboard.allCurrent')}</p>
          <p className="text-xs text-green-700 mt-1">{t('dashboard.allCurrentSubtitle')}</p>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
