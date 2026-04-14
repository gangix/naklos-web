import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Truck, Users, Building2, AlertTriangle, CheckCircle, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { truckApi, driverApi, clientApi } from '../services/api';
import type { Truck as TruckType, Driver, Client } from '../types';

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
  const [trucks, setTrucks] = useState<TruckType[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const loadAll = useCallback(async () => {
    try {
      setLoading(true);
      setError(false);
      const [trucksPage, driversPage, clientsPage] = await Promise.all([
        truckApi.getByFleet(0, 1000),
        driverApi.getByFleet(0, 1000),
        clientApi.getByFleet(0, 1000),
      ]);
      setTrucks(trucksPage.content as TruckType[]);
      setDrivers(driversPage.content as Driver[]);
      setClients(clientsPage.content as Client[]);
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

  if (loading) {
    return (
      <div className="p-4 flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 pb-20 max-w-4xl mx-auto">
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

  const cards = [
    { label: t('nav.trucks'),  count: trucks.length,  icon: Truck,     accent: 'bg-blue-500',    bg: 'bg-blue-50',    text: 'text-blue-600',    path: '/manager/trucks' },
    { label: t('nav.drivers'), count: drivers.length, icon: Users,     accent: 'bg-emerald-500', bg: 'bg-emerald-50', text: 'text-emerald-600', path: '/manager/drivers' },
    { label: t('nav.clients'), count: clients.length, icon: Building2, accent: 'bg-violet-500',  bg: 'bg-violet-50',  text: 'text-violet-600',  path: '/manager/clients' },
  ];

  // Locale tag for date formatting — falls back to en-US if the language file
  // doesn't define one.
  const localeTag = t('common.localeTag', { defaultValue: 'en-US' });
  const today = new Date();
  const weekday = today.toLocaleDateString(localeTag, { weekday: 'long' });
  const fullDate = today.toLocaleDateString(localeTag, { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="pb-20 max-w-4xl mx-auto px-4 md:px-6 pt-5 md:pt-6">
      {/* Header — date micro-line above the title, no border above. Tight
          margin to the KPI cards (less empty space than before). */}
      <div className="mb-5">
        <p className="text-xs text-gray-500 mb-1">
          <span className="font-medium text-gray-600">{weekday}</span>
          <span className="mx-1.5 text-gray-300">·</span>
          <span>{fullDate}</span>
        </p>
        <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">{t('dashboard.myFleet')}</h1>
      </div>

      {/* KPI cards — soft shadow, rounded-xl, colour-coded accent strip,
          tinted icon chip. Tighter mb than the original. */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <button
              key={card.path}
              onClick={() => navigate(card.path)}
              className="bg-white rounded-xl hover:shadow-lg hover:shadow-gray-200/50 transition-all duration-200 p-5 text-left border border-gray-100 group hover:-translate-y-0.5 overflow-hidden relative"
            >
              <div className={`absolute left-0 top-0 bottom-0 w-1 ${card.accent} rounded-l-xl`} />
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-extrabold text-gray-900 tracking-tight">{card.count}</p>
                  <p className="text-sm text-gray-500 mt-0.5 font-medium">{card.label}</p>
                </div>
                <div className={`w-10 h-10 rounded-lg ${card.bg} ${card.text} flex items-center justify-center`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
            </button>
          );
        })}
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

export default DashboardPage;
