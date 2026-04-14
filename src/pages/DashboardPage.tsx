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
    { label: t('nav.trucks'),  count: trucks.length,  icon: Truck,      path: '/manager/trucks',  hint: t('truck.title') },
    { label: t('nav.drivers'), count: drivers.length, icon: Users,      path: '/manager/drivers', hint: t('driver.title') },
    { label: t('nav.clients'), count: clients.length, icon: Building2,  path: '/manager/clients', hint: t('client.title') },
  ];

  // Locale tag for date formatting — falls back to en-US if the language file
  // doesn't define one.
  const localeTag = t('common.localeTag', { defaultValue: 'en-US' });
  const today = new Date();

  return (
    <div className="pb-20 max-w-5xl mx-auto px-4 md:px-6 pt-6 md:pt-10">
      {/* Editorial header — display serif italic for the page title, tracked
          microlabel above, big breathing date below. */}
      <header className="mb-10 md:mb-14">
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400 mb-3">
          {today.toLocaleDateString(localeTag, { weekday: 'long' })}
          <span className="mx-2 text-slate-300">·</span>
          <span className="font-mono text-slate-500 normal-case tracking-normal">
            {today.toLocaleDateString(localeTag, { day: '2-digit', month: '2-digit', year: 'numeric' })}
          </span>
        </p>
        <h1
          className="font-display text-5xl md:text-6xl text-slate-900 leading-[1.04] tracking-[-0.02em] italic"
          style={{ fontVariationSettings: '"opsz" 144, "SOFT" 30' }}
        >
          {t('dashboard.myFleet')}
        </h1>
      </header>

      {/* KPI strip — three slabs with hairline divider, big mono numbers,
          uppercase microlabels. Architectural rather than card-y. */}
      <div className="grid grid-cols-3 border-y border-slate-200 mb-12 md:mb-16">
        {cards.map((card, i) => {
          const Icon = card.icon;
          return (
            <button
              key={card.path}
              onClick={() => navigate(card.path)}
              className={`group flex flex-col items-start gap-2 py-6 md:py-8 px-4 md:px-6 text-left transition-colors hover:bg-slate-50 ${
                i > 0 ? 'border-l border-slate-200' : ''
              }`}
            >
              <div className="flex items-center gap-2 text-slate-400 group-hover:text-slate-600 transition-colors">
                <Icon className="w-3.5 h-3.5" strokeWidth={1.75} />
                <span className="text-[10px] font-semibold uppercase tracking-[0.18em]">{card.label}</span>
              </div>
              <p className="font-mono text-4xl md:text-5xl font-medium text-slate-900 tabular-nums tracking-tight leading-none">
                {card.count}
              </p>
            </button>
          );
        })}
      </div>

      {/* Warnings — newspaper-style section header with a hairline rule,
          flush-left rows that align the day-count in monospace tabular nums. */}
      {warningGroups.length > 0 && (
        <section>
          <div className="flex items-baseline justify-between border-b border-slate-900/90 pb-3 mb-1">
            <h2 className="font-display text-xl md:text-2xl text-slate-900 italic"
                style={{ fontVariationSettings: '"opsz" 36, "SOFT" 20' }}>
              {t('dashboard.warningSection')}
            </h2>
            <p className="font-mono text-xs text-slate-500 tabular-nums">
              {t('dashboard.recordsAndDocs', {
                count: warningGroups.length,
                records: warningGroups.length,
                docs: totalWarningCount,
              })}
            </p>
          </div>
          <ul className="divide-y divide-slate-100">
            {warningGroups.map((group) => (
              <li key={`${group.entity}-${group.entityId}`}>
                <button
                  onClick={() =>
                    navigate(
                      group.entity === 'truck'
                        ? `/manager/trucks/${group.entityId}`
                        : `/manager/drivers/${group.entityId}`,
                    )
                  }
                  className="w-full grid grid-cols-[auto_1fr_auto_auto] items-center gap-4 py-3.5 text-left hover:bg-slate-50/70 transition-colors"
                >
                  <span className="text-slate-400">
                    {group.entity === 'truck' ? (
                      <Truck className="w-4 h-4" strokeWidth={1.75} />
                    ) : (
                      <Users className="w-4 h-4" strokeWidth={1.75} />
                    )}
                  </span>
                  <div className="min-w-0">
                    <p className={`text-sm text-slate-900 truncate ${group.entity === 'truck' ? 'font-mono uppercase tracking-wide' : 'font-medium'}`}>
                      {group.name}
                    </p>
                    <p className="text-[11px] text-slate-500 truncate mt-0.5">
                      {group.items.map((i) => t(i.labelKey)).join(' · ')}
                    </p>
                  </div>
                  <DayCount value={group.worstDaysLeft} t={t} />
                  <ChevronRight className="w-4 h-4 text-slate-300" strokeWidth={1.75} />
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Empty state — generous, single illustration, editorial italic */}
      {warningGroups.length === 0 && !loading && (
        <section className="border-t border-b border-slate-200 py-16 text-center">
          <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto mb-4" strokeWidth={1.5} />
          <p
            className="font-display text-2xl md:text-3xl text-slate-900 italic"
            style={{ fontVariationSettings: '"opsz" 72, "SOFT" 50' }}
          >
            {t('dashboard.allCurrent')}
          </p>
          <p className="text-xs text-slate-500 mt-3 max-w-sm mx-auto leading-relaxed">
            {t('dashboard.allCurrentSubtitle')}
          </p>
        </section>
      )}
    </div>
  );
};

interface DayCountProps {
  value: number | null;
  t: ReturnType<typeof useTranslation>['t'];
}

/** Tabular monospaced day counter — colour shifts by urgency.
 *  Negative = expired (red), 0 = today (red), 1–7 = critical (red),
 *  8–30 = warning (amber), null = missing date (slate). */
const DayCount = ({ value, t }: DayCountProps) => {
  const tone =
    value === null ? 'text-slate-500'
    : value < 0   ? 'text-red-700'
    : value === 0 ? 'text-red-700'
    : value <= 7  ? 'text-red-700'
    :               'text-amber-600';

  const label =
    value === null ? t('common.dateMissing')
    : value < 0   ? t('common.daysExpired', { count: Math.abs(value) })
    : value === 0 ? t('common.today')
    :               t('common.daysRemaining', { count: value });

  return (
    <span className={`font-mono text-xs tabular-nums whitespace-nowrap ${tone}`}>
      {label}
    </span>
  );
};

export default DashboardPage;
