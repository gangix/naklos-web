import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Truck, Users, Building2, AlertTriangle, CheckCircle, ChevronRight } from 'lucide-react';
import { truckApi, driverApi, clientApi } from '../services/api';
import type { Truck as TruckType, Driver, Client } from '../types';

interface ExpiringItem {
  label: string;
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
      for (const [date, label] of checks) {
        if (!date) {
          items.push({ label, daysLeft: null });
          continue;
        }
        const days = daysUntil(date);
        if (days !== null && days <= WARN_THRESHOLD_DAYS) {
          items.push({ label, daysLeft: days });
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
        [truck.compulsoryInsuranceExpiry, 'Zorunlu Trafik Sigortası'],
        [truck.comprehensiveInsuranceExpiry, 'Kasko'],
        [truck.inspectionExpiry, 'Muayene'],
      ]);
    }

    for (const driver of drivers) {
      const checks: Array<[string | null | undefined, string]> = [
        [driver.licenseExpiryDate, 'Ehliyet'],
      ];
      // SRC and CPC certificates — flag if missing entirely or if expiring soon
      const srcCert = driver.certificates?.find((c) => c.type === 'SRC');
      const cpcCert = driver.certificates?.find((c) => c.type === 'CPC');
      checks.push([srcCert?.expiryDate, 'SRC Belgesi']);
      checks.push([cpcCert?.expiryDate, 'CPC Belgesi']);

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
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Filom</h1>
        <div className="bg-white rounded-xl shadow-sm border border-red-200 p-8 text-center">
          <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-1">Veriler yüklenemedi</h3>
          <p className="text-sm text-gray-500 mb-6">Bir hata oluştu. Lütfen tekrar deneyin.</p>
          <button
            onClick={loadAll}
            className="px-6 py-2.5 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors"
          >
            Tekrar Dene
          </button>
        </div>
      </div>
    );
  }

  const cards = [
    { label: 'Araçlar', count: trucks.length, icon: Truck, color: 'blue', path: '/manager/trucks' },
    { label: 'Sürücüler', count: drivers.length, icon: Users, color: 'green', path: '/manager/drivers' },
    { label: 'Müşteriler', count: clients.length, icon: Building2, color: 'purple', path: '/manager/clients' },
  ];

  return (
    <div className="p-4 pb-20 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Filom</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <button
              key={card.path}
              onClick={() => navigate(card.path)}
              className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow p-6 text-left border border-gray-200 group"
            >
              <div className={`w-14 h-14 rounded-xl flex items-center justify-center mb-3 bg-${card.color}-100 text-${card.color}-600`}>
                <Icon className="w-7 h-7" />
              </div>
              <p className="text-3xl font-bold text-gray-900">{card.count}</p>
              <p className="text-sm text-gray-600 mt-1">{card.label}</p>
            </button>
          );
        })}
      </div>

      {warningGroups.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-red-50 border-b border-red-100 px-4 py-3 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <h2 className="font-bold text-red-900">Dikkat Gereken Belgeler</h2>
            <span className="ml-auto text-sm text-red-700 font-medium">
              {warningGroups.length} kayıt · {totalWarningCount} belge
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
                <div className="w-9 h-9 rounded-lg bg-gray-100 text-gray-600 flex items-center justify-center flex-shrink-0">
                  {group.entity === 'truck' ? (
                    <Truck className="w-4 h-4" />
                  ) : (
                    <Users className="w-4 h-4" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {group.name}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {group.items.length} belge · {group.items.map((i) => i.label).join(', ')}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  {group.worstDaysLeft === null ? (
                    <span className="text-xs font-bold text-gray-600 whitespace-nowrap">Tarih eksik</span>
                  ) : group.worstDaysLeft < 0 ? (
                    <span className="text-xs font-bold text-red-700 whitespace-nowrap">
                      {Math.abs(group.worstDaysLeft)} gün geçti
                    </span>
                  ) : group.worstDaysLeft === 0 ? (
                    <span className="text-xs font-bold text-red-700 whitespace-nowrap">Bugün</span>
                  ) : (
                    <span className="text-xs font-bold text-orange-600 whitespace-nowrap">
                      {group.worstDaysLeft} gün kaldı
                    </span>
                  )}
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
              </button>
            ))}
          </div>
        </div>
      )}

      {warningGroups.length === 0 && !loading && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
          <CheckCircle className="w-10 h-10 text-green-500 mx-auto mb-2" />
          <p className="text-sm font-medium text-green-900">
            Tüm belgeler güncel
          </p>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
