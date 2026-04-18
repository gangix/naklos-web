import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Truck, Users, AlertTriangle, CheckCircle, ChevronRight, Plus, UserPlus, Fuel, FileText } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useFleet } from '../contexts/FleetContext';
import { useFleetRoster } from '../contexts/FleetRosterContext';
import { useFuelCounts } from '../contexts/FuelCountsContext';
import { deriveTruckStatus, deriveDriverStatus, type DerivedStatus } from '../utils/derivedStatus';
import { daysUntil, WARN_THRESHOLD_DAYS } from '../utils/expiry';

interface ExpiringItem {
  /** i18n key for the document type label (e.g. 'doc.compulsoryInsurance') */
  labelKey: string;
  daysLeft: number | null;
}

interface EntityWarningGroup {
  entity: 'truck' | 'driver';
  entityId: string;
  name: string;
  items: ExpiringItem[];
  worstDaysLeft: number | null; // null only when ALL items are missing dates
}

const DashboardPage = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { plan } = useFleet();
  const { total: fuelAttentionCount } = useFuelCounts();
  // Same gate ManagerTopNav uses — fuel surface is paid-only in prod.
  const forceOn = import.meta.env.VITE_FEATURE_FUEL_TRACKING === 'true';
  const fuelTrackingEnabled = forceOn || (plan && plan !== 'FREE');
  const { trucks, drivers, loading } = useFleetRoster();

  const warningGroups = useMemo<EntityWarningGroup[]>(() => {
    const groups: EntityWarningGroup[] = [];

    const collectItems = (
      entity: 'truck' | 'driver',
      entityId: string,
      name: string,
      checks: Array<[string | null | undefined, string]>
    ) => {
      const items: ExpiringItem[] = [];
      for (const [date, labelKey] of checks) {
        if (!date) {
          items.push({ labelKey, daysLeft: null });
          continue;
        }
        const days = daysUntil(date);
        if (days !== null && days <= WARN_THRESHOLD_DAYS) {
          items.push({ labelKey, daysLeft: days });
        }
      }
      if (items.length === 0) return;

      // "Worst" = smallest daysLeft (most urgent). Missing dates go last.
      let worstDaysLeft: number | null = null;
      for (const item of items) {
        if (item.daysLeft === null) continue;
        if (worstDaysLeft === null || item.daysLeft < worstDaysLeft) {
          worstDaysLeft = item.daysLeft;
        }
      }

      groups.push({ entity, entityId, name, items, worstDaysLeft });
    };

    for (const truck of trucks) {
      collectItems('truck', truck.id, truck.plateNumber, [
        [truck.compulsoryInsuranceExpiry, 'doc.compulsoryInsurance'],
        [truck.comprehensiveInsuranceExpiry, 'doc.comprehensiveInsurance'],
        [truck.inspectionExpiry, 'doc.inspection'],
      ]);
    }

    for (const driver of drivers) {
      // Required vs optional rules live in computeDriverWarnings; this loop
      // just mirrors the shape (license + SRC always checked; CPC only if
      // the cert is on record).
      const checks: Array<[string | null | undefined, string]> = [
        [driver.licenseExpiryDate, 'doc.license'],
      ];
      const srcCert = driver.certificates?.find((c) => c.type === 'SRC');
      checks.push([srcCert?.expiryDate, 'doc.src']);
      const cpcCert = driver.certificates?.find((c) => c.type === 'CPC');
      if (cpcCert) {
        checks.push([cpcCert.expiryDate, 'doc.cpc']);
      }

      collectItems('driver', driver.id, `${driver.firstName} ${driver.lastName}`, checks);
    }

    // Sort: expired first, then expiring soon, then groups with only missing dates last
    groups.sort((a, b) => {
      if (a.worstDaysLeft === null && b.worstDaysLeft === null) return 0;
      if (a.worstDaysLeft === null) return 1;
      if (b.worstDaysLeft === null) return -1;
      return a.worstDaysLeft - b.worstDaysLeft;
    });

    return groups;
  }, [trucks, drivers]);

  const truckWarningGroups = warningGroups.filter((g) => g.entity === 'truck');
  const driverWarningGroups = warningGroups.filter((g) => g.entity === 'driver');
  const truckDocsCount = truckWarningGroups.reduce((sum, g) => sum + g.items.length, 0);
  const driverDocsCount = driverWarningGroups.reduce((sum, g) => sum + g.items.length, 0);
  const totalDocsCount = truckDocsCount + driverDocsCount;

  const truckCounts = useMemo(
    () => trucks.reduce<Record<DerivedStatus, number>>(
      (acc, t) => { acc[deriveTruckStatus(t)]++; return acc; },
      { ACTIVE: 0, READY: 0, MISSING_DOCS: 0 }),
    [trucks]);

  const driverCounts = useMemo(
    () => drivers.reduce<Record<DerivedStatus, number>>(
      (acc, d) => { acc[deriveDriverStatus(d)]++; return acc; },
      { ACTIVE: 0, READY: 0, MISSING_DOCS: 0 }),
    [drivers]);

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

  return (
    <div>
      {/* Header — date micro-line above the title, no border above. Tight
          margin to the KPI cards (less empty space than before). */}
      <div className="mb-5 flex items-end justify-between gap-4 flex-wrap">
        <div>
          <p className="text-xs text-gray-500 mb-1">
            <span className="font-medium text-gray-600">{weekday}</span>
            <span className="mx-1.5 text-gray-300">·</span>
            <span>{fullDate}</span>
          </p>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">{t('dashboard.myFleet')}</h1>
        </div>
        {/* Quick actions — one click to the most common tasks. The KPI cards
            below are about state; these buttons are about action. */}
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => navigate('/manager/trucks')}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-semibold rounded-lg bg-primary-600 text-white hover:bg-primary-700 hover:shadow-lg hover:shadow-primary-500/20 transition-all">
            <Plus className="w-4 h-4" />
            {t('dashboard.quickActions.addTruck', { defaultValue: 'Araç ekle' })}
          </button>
          <button
            onClick={() => navigate('/manager/drivers')}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg border border-primary-600 text-primary-600 hover:bg-primary-50 transition-colors">
            <UserPlus className="w-4 h-4" />
            {t('dashboard.quickActions.addDriver', { defaultValue: 'Sürücü ekle' })}
          </button>
          {fuelTrackingEnabled && (
            <button
              onClick={() => navigate('/manager/fuel-imports')}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg border border-primary-600 text-primary-600 hover:bg-primary-50 transition-colors">
              <Fuel className="w-4 h-4" />
              {t('dashboard.quickActions.importFuel', { defaultValue: 'Yakıt içe aktar' })}
            </button>
          )}
        </div>
      </div>

      {/* Section A — FLEET STATE: entity counts, no urgency. Small status
          dots inside each card for a quick secondary signal. */}
      <section className="mb-6">
        <h2 className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 mb-3">
          {t('dashboard.fleetState')}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <FleetStatCard
            label={t('nav.trucks')}
            icon={Truck}
            iconTone="bg-blue-50 text-blue-600"
            total={trucks.length}
            missingCount={truckCounts.MISSING_DOCS}
            missingLabel={t('derivedStatus.MISSING_DOCS')}
            onClick={() => navigate('/manager/trucks')}
          />
          <FleetStatCard
            label={t('nav.drivers')}
            icon={Users}
            iconTone="bg-emerald-50 text-emerald-600"
            total={drivers.length}
            missingCount={driverCounts.MISSING_DOCS}
            missingLabel={t('derivedStatus.MISSING_DOCS')}
            onClick={() => navigate('/manager/drivers')}
          />
        </div>
      </section>

      {/* Section B was aggregate rows for fuel + trucks + drivers. Trucks/
          drivers rows dropped: they pointed at list pages, while Section C
          below lists the same entities with direct drill-in to the specific
          truck/driver. Keeping both meant two rows for the same info with no
          way to tell which to click. Fuel row stays — it's the only one
          without a per-entity Section C counterpart. */}
      {fuelTrackingEnabled && fuelAttentionCount > 0 && (
        <section className="mb-6">
          <div className="flex items-baseline justify-between mb-3">
            <h2 className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
              {t('dashboard.attention.heading')}
            </h2>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <AttentionRow
              tone="danger"
              icon={AlertTriangle}
              title={t('dashboard.attention.fuelTitle')}
              subtitle={t('dashboard.attention.fuelSubtitle')}
              count={fuelAttentionCount}
              unit={t('dashboard.attention.fuelUnit')}
              onClick={() => navigate('/manager/fuel-alerts')}
            />
          </div>
        </section>
      )}

      {/* Section C — PER-ENTITY DETAIL: expiring-document rows so the manager
          can jump straight to the affected truck / driver. Header carries
          the split-by-kind summary that used to live in Section B. */}
      {warningGroups.length > 0 && (
        <section>
          <div className="flex items-baseline justify-between gap-3 mb-3 flex-wrap">
            <h2 className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
              {t('dashboard.detailSection')}
            </h2>
            <div className="flex items-center gap-3 text-xs text-gray-500 tabular-nums">
              {truckWarningGroups.length > 0 && (
                <span className="inline-flex items-center gap-1">
                  <Truck className="w-3.5 h-3.5 text-blue-500" />
                  {t('dashboard.attention.trucksSummary', {
                    records: truckWarningGroups.length,
                    docs: truckDocsCount,
                  })}
                </span>
              )}
              {driverWarningGroups.length > 0 && (
                <span className="inline-flex items-center gap-1">
                  <Users className="w-3.5 h-3.5 text-emerald-500" />
                  {t('dashboard.attention.driversSummary', {
                    records: driverWarningGroups.length,
                    docs: driverDocsCount,
                  })}
                </span>
              )}
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden divide-y divide-gray-100">
            {warningGroups.map((group) => (
              <button
                key={`${group.entity}-${group.entityId}`}
                onClick={() =>
                  navigate(
                    group.entity === 'truck'
                      ? `/manager/trucks/${group.entityId}`
                      : `/manager/drivers/${group.entityId}`
                  )
                }
                className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center gap-3"
              >
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${group.entity === 'truck' ? 'bg-blue-50 text-blue-500' : 'bg-emerald-50 text-emerald-500'}`}>
                  {group.entity === 'truck' ? <Truck className="w-4 h-4" /> : <Users className="w-4 h-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{group.name}</p>
                  <p className="text-xs text-gray-500 truncate">
                    {t('dashboard.docsAndList', {
                      count: group.items.length,
                      labels: group.items.map((i) => t(i.labelKey)).join(', '),
                    })}
                  </p>
                </div>
                <DayCount value={group.worstDaysLeft} t={t} />
                <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Empty states: a fresh fleet (no trucks, no drivers) shouldn't read
          as "everything is current" — it has no content to be current about.
          Show the onboarding nudge there; reserve the green banner for the
          genuinely-healthy case where the roster exists AND has no warnings. */}
      {!loading && trucks.length === 0 && drivers.length === 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
          <div className="w-12 h-12 rounded-xl bg-primary-50 text-primary-600 mx-auto mb-3 flex items-center justify-center">
            <Truck className="w-6 h-6" />
          </div>
          <p className="text-base font-extrabold text-gray-900 tracking-tight">
            {t('dashboard.onboarding.title')}
          </p>
          <p className="text-sm text-gray-600 mt-1 max-w-md mx-auto">
            {t('dashboard.onboarding.subtitle')}
          </p>
          <div className="mt-5 flex gap-2 flex-wrap justify-center">
            <button
              onClick={() => navigate('/manager/trucks')}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-lg bg-primary-600 text-white hover:bg-primary-700 hover:shadow-lg hover:shadow-primary-500/20 transition-all">
              <Plus className="w-4 h-4" />
              {t('dashboard.quickActions.addTruck', { defaultValue: 'Araç ekle' })}
            </button>
            <button
              onClick={() => navigate('/manager/drivers')}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg border border-primary-600 text-primary-600 hover:bg-primary-50 transition-colors">
              <UserPlus className="w-4 h-4" />
              {t('dashboard.quickActions.addDriver', { defaultValue: 'Sürücü ekle' })}
            </button>
          </div>
        </div>
      )}

      {!loading
        && (trucks.length > 0 || drivers.length > 0)
        && warningGroups.length === 0
        && fuelAttentionCount === 0 && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
          <CheckCircle className="w-10 h-10 text-green-500 mx-auto mb-2" />
          <p className="text-sm font-medium text-green-900">{t('dashboard.allCurrent')}</p>
          <p className="text-xs text-green-700 mt-1">{t('dashboard.allCurrentSubtitle')}</p>
        </div>
      )}
    </div>
  );
};

interface DayCountProps {
  value: number | null;
  t: ReturnType<typeof useTranslation>['t'];
}

/** Day-counter pill with urgency colour ladder. Plain text (no mono) so
 *  it matches the rest of the utilitarian-corporate page voice. */
const DayCount = ({ value, t }: DayCountProps) => {
  const tone =
    value === null ? 'text-gray-600'
    : value < 0   ? 'text-red-700'
    : value === 0 ? 'text-red-700'
    : value <= 7  ? 'text-red-700'
    :               'text-orange-600';

  const label =
    value === null ? t('common.dateMissing')
    : value < 0   ? t('common.daysExpired', { count: Math.abs(value) })
    : value === 0 ? t('common.today')
    :               t('common.daysRemaining', { count: value });

  return (
    <span className={`text-xs font-bold whitespace-nowrap ${tone}`}>
      {label}
    </span>
  );
};

interface FleetStatCardProps {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  iconTone: string;
  total: number;
  missingCount: number;
  missingLabel: string;
  onClick: () => void;
}

/** Calm entity-count card. Big number = total; a single red dot-chip appears
 *  below when some entities have missing documents. No "ready"/"active" chip
 *  — healthy count is just (total − missing), inferable from the big number. */
const FleetStatCard = ({
  label, icon: Icon, iconTone, total, missingCount, missingLabel, onClick,
}: FleetStatCardProps) => (
  <button
    onClick={onClick}
    className="group bg-white rounded-xl border border-gray-200 p-5 hover:border-gray-300 hover:shadow-sm transition-all text-left"
  >
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-2">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${iconTone}`}>
          <Icon className="w-4 h-4" />
        </div>
        <span className="text-sm font-semibold text-gray-700">{label}</span>
      </div>
      <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-colors" />
    </div>
    <div className="flex items-baseline gap-2">
      <span className="text-3xl font-extrabold text-gray-900 tracking-tight tabular-nums">{total}</span>
    </div>
    {missingCount > 0 && (
      <div className="mt-3 text-xs">
        <span className="inline-flex items-center gap-1 text-red-700">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
          {missingCount} {missingLabel}
        </span>
      </div>
    )}
  </button>
);

type AttentionTone = 'danger' | 'warning';

const ATTENTION_TONE: Record<AttentionTone, string> = {
  danger: 'bg-red-50 text-red-600',
  warning: 'bg-amber-50 text-amber-600',
};

interface AttentionRowProps {
  icon: React.ComponentType<{ className?: string }>;
  tone: AttentionTone;
  title: string;
  subtitle: string;
  /** Small pill next to the title (e.g. "8 belge" as sub-detail). Optional. */
  sidePill?: string;
  /** Big right-aligned number — must match the nav badge for this destination. */
  count: number;
  unit: string;
  onClick: () => void;
}

/** Single row inside the "Dikkatinize sunulan" card. Count = same metric the
 *  nav badge shows, so the math reconciles at a glance. Rows sit inside a
 *  `divide-y` parent; no per-row border prop needed. */
const AttentionRow = ({
  icon: Icon, tone, title, subtitle, sidePill, count, unit, onClick,
}: AttentionRowProps) => (
  <button
    onClick={onClick}
    className="w-full flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors text-left"
  >
    <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${ATTENTION_TONE[tone]}`}>
      <Icon className="w-5 h-5" />
    </div>
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold text-gray-900">{title}</span>
        {sidePill && (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-amber-50 text-amber-700 text-[10px] font-bold tabular-nums">
            {sidePill}
          </span>
        )}
      </div>
      <p className="text-xs text-gray-500 mt-0.5 truncate">{subtitle}</p>
    </div>
    <div className="text-right flex-shrink-0">
      <div className="text-2xl font-extrabold text-gray-900 tabular-nums leading-none">{count}</div>
      <div className="text-[10px] text-gray-400 mt-0.5">{unit}</div>
    </div>
    <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
  </button>
);

export default DashboardPage;
