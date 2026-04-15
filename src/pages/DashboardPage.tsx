import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Truck, Users, AlertTriangle, CheckCircle, ChevronRight, Plus, UserPlus, Fuel } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { truckApi, driverApi } from '../services/api';
import { useFleet } from '../contexts/FleetContext';
import type { Truck as TruckType, Driver } from '../types';
import { deriveTruckStatus, deriveDriverStatus, STATUS_BADGE, type DerivedStatus } from '../utils/derivedStatus';

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

const daysUntil = (dateStr: string | null | undefined): number | null => {
  if (!dateStr) return null;
  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.floor((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
};

const DashboardPage = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { plan } = useFleet();
  // Same gate ManagerTopNav uses — fuel surface is paid-only in prod.
  const forceOn = import.meta.env.VITE_FEATURE_FUEL_TRACKING === 'true';
  const fuelTrackingEnabled = forceOn || (plan && plan !== 'FREE');
  const [trucks, setTrucks] = useState<TruckType[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const loadAll = useCallback(async () => {
    try {
      setLoading(true);
      setError(false);
      const [trucksPage, driversPage] = await Promise.all([
        truckApi.getByFleet(0, 1000),
        driverApi.getByFleet(0, 1000),
      ]);
      setTrucks(trucksPage.content as TruckType[]);
      setDrivers(driversPage.content as Driver[]);
    } catch (err) {
      console.error('Error loading dashboard data:', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, []);

  const WARN_THRESHOLD_DAYS = 30;

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
      const checks: Array<[string | null | undefined, string]> = [
        [driver.licenseExpiryDate, 'doc.license'],
      ];
      // SRC and CPC certificates — flag if missing entirely or if expiring soon
      const srcCert = driver.certificates?.find((c) => c.type === 'SRC');
      const cpcCert = driver.certificates?.find((c) => c.type === 'CPC');
      checks.push([srcCert?.expiryDate, 'doc.src']);
      checks.push([cpcCert?.expiryDate, 'doc.cpc']);

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

  const totalWarningCount = warningGroups.reduce((sum, g) => sum + g.items.length, 0);

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

  if (error) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-6">{t('dashboard.myFleet')}</h1>
        <div className="bg-white rounded-xl shadow-sm border border-red-200 p-8 text-center">
          <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-1">{t('dashboard.loadErrorTitle')}</h3>
          <p className="text-sm text-gray-500 mb-6">{t('dashboard.loadErrorDescription')}</p>
          <button
            onClick={loadAll}
            className="px-6 py-2.5 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors"
          >
            {t('common.retry')}
          </button>
        </div>
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <KpiCard
          label={t('nav.trucks')}
          icon={Truck}
          accentBar="bg-blue-500"
          iconBg="bg-blue-50 text-blue-600"
          counts={truckCounts}
          activeLabel={t('derivedStatus.ACTIVE')}
          readyLabel={t('derivedStatus.READY')}
          missingLabel={t('derivedStatus.MISSING_DOCS')}
          onClick={() => navigate('/manager/trucks')}
        />
        <KpiCard
          label={t('nav.drivers')}
          icon={Users}
          accentBar="bg-emerald-500"
          iconBg="bg-emerald-50 text-emerald-600"
          counts={driverCounts}
          activeLabel={t('derivedStatus.ACTIVE')}
          readyLabel={t('derivedStatus.READY')}
          missingLabel={t('derivedStatus.MISSING_DOCS')}
          onClick={() => navigate('/manager/drivers')}
        />
      </div>

      {/* Warnings — soft white card with a red-tinted header strip. */}
      {warningGroups.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-red-50 border-b border-red-100 px-4 py-3 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <h2 className="font-bold text-red-900">{t('dashboard.warningSection')}</h2>
            <span className="ml-auto text-sm text-red-700 font-medium">
              {t('dashboard.recordsAndDocs', {
                count: warningGroups.length,
                records: warningGroups.length,
                docs: totalWarningCount,
              })}
            </span>
          </div>
          <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
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
        </div>
      )}

      {/* Empty state — soft green tile, like the original. */}
      {warningGroups.length === 0 && !loading && (
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

interface KpiCardProps {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  accentBar: string;
  iconBg: string;
  counts: Record<DerivedStatus, number>;
  activeLabel: string;
  readyLabel: string;
  missingLabel: string;
  onClick: () => void;
}

const KpiCard = ({
  label, icon: Icon, accentBar, iconBg, counts,
  activeLabel, readyLabel, missingLabel, onClick,
}: KpiCardProps) => (
  <button
    onClick={onClick}
    className="bg-white rounded-xl hover:shadow-lg hover:shadow-gray-200/50 transition-all duration-200 p-5 text-left border border-gray-100 group hover:-translate-y-0.5 overflow-hidden relative"
  >
    <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-xl ${accentBar}`} />
    <div className="flex items-center justify-between mb-3">
      <p className="text-sm text-gray-500 font-medium">{label}</p>
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${iconBg}`}>
        <Icon className="w-5 h-5" />
      </div>
    </div>
    <div className="flex items-baseline gap-3 flex-wrap">
      <span>
        <span className={`text-2xl font-extrabold tracking-tight tabular-nums ${STATUS_BADGE.ACTIVE.text}`}>{counts.ACTIVE}</span>
        {' '}<span className="text-xs text-gray-500 font-medium">{activeLabel}</span>
      </span>
      <span>
        <span className={`text-2xl font-extrabold tracking-tight tabular-nums ${STATUS_BADGE.READY.text}`}>{counts.READY}</span>
        {' '}<span className="text-xs text-gray-500 font-medium">{readyLabel}</span>
      </span>
      {counts.MISSING_DOCS > 0 && (
        <span>
          <span className={`text-2xl font-extrabold tracking-tight tabular-nums ${STATUS_BADGE.MISSING_DOCS.text}`}>{counts.MISSING_DOCS}</span>
          {' '}<span className="text-xs text-red-600 font-medium">{missingLabel}</span>
        </span>
      )}
    </div>
  </button>
);

export default DashboardPage;
