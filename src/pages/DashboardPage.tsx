import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Truck, Users, Building2, AlertTriangle } from 'lucide-react';
import { truckApi, driverApi, clientApi } from '../services/api';
import type { Truck as TruckType, Driver, Client } from '../types';

interface ExpiringItem {
  id: string;
  entity: 'truck' | 'driver';
  name: string;
  label: string;
  expiryDate: string;
  daysLeft: number;
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

  useEffect(() => {
    const loadAll = async () => {
      try {
        setLoading(true);
        const [trucksPage, driversPage, clientsPage] = await Promise.all([
          truckApi.getByFleet(0, 1000),
          driverApi.getByFleet(0, 1000),
          clientApi.getByFleet(0, 1000),
        ]);
        setTrucks(trucksPage.content as TruckType[]);
        setDrivers(driversPage.content as Driver[]);
        setClients(clientsPage.content as Client[]);
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    loadAll();
  }, []);

  const expiringItems: ExpiringItem[] = [];
  const WARN_THRESHOLD_DAYS = 30;

  for (const truck of trucks) {
    const checks: Array<[string | null | undefined, string]> = [
      [truck.compulsoryInsuranceExpiry, 'Zorunlu Trafik Sigortası'],
      [truck.comprehensiveInsuranceExpiry, 'Kasko'],
      [truck.inspectionExpiry, 'Muayene'],
    ];
    for (const [date, label] of checks) {
      const days = daysUntil(date);
      if (days !== null && days <= WARN_THRESHOLD_DAYS) {
        expiringItems.push({
          id: `truck-${truck.id}-${label}`,
          entity: 'truck',
          name: truck.plateNumber,
          label,
          expiryDate: date!,
          daysLeft: days,
        });
      }
    }
  }

  for (const driver of drivers) {
    const days = daysUntil(driver.licenseExpiryDate);
    if (days !== null && days <= WARN_THRESHOLD_DAYS) {
      expiringItems.push({
        id: `driver-${driver.id}-license`,
        entity: 'driver',
        name: `${driver.firstName} ${driver.lastName}`,
        label: 'Ehliyet',
        expiryDate: driver.licenseExpiryDate,
        daysLeft: days,
      });
    }
  }

  expiringItems.sort((a, b) => a.daysLeft - b.daysLeft);

  if (loading) {
    return (
      <div className="p-4 flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
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

      {expiringItems.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-red-50 border-b border-red-100 px-4 py-3 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <h2 className="font-bold text-red-900">Yenilenmesi Gereken Belgeler</h2>
            <span className="ml-auto text-sm text-red-700 font-medium">{expiringItems.length}</span>
          </div>
          <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
            {expiringItems.map((item) => (
              <button
                key={item.id}
                onClick={() =>
                  navigate(item.entity === 'truck' ? '/manager/trucks' : '/manager/drivers')
                }
                className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center justify-between"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {item.name}
                  </p>
                  <p className="text-xs text-gray-500 truncate">{item.label}</p>
                </div>
                <div className="text-right ml-3">
                  {item.daysLeft < 0 ? (
                    <span className="text-xs font-bold text-red-700">
                      {Math.abs(item.daysLeft)} gün geçti
                    </span>
                  ) : item.daysLeft === 0 ? (
                    <span className="text-xs font-bold text-red-700">Bugün</span>
                  ) : (
                    <span className="text-xs font-bold text-orange-600">
                      {item.daysLeft} gün kaldı
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {expiringItems.length === 0 && !loading && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
          <div className="text-4xl mb-2">✓</div>
          <p className="text-sm font-medium text-green-900">
            Tüm belgeler güncel
          </p>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
