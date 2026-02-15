import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { COMMON } from '../constants/text';
import { mockFleet, mockTrucks, mockDrivers, mockClients } from '../data/mock';
import { useData } from '../contexts/DataContext';
import { calculateWarnings } from '../utils/warnings';

const DashboardPage = () => {
  const navigate = useNavigate();
  const { trips } = useData();
  const warnings = useMemo(() => calculateWarnings(mockTrucks, mockDrivers), []);

  // Calculate statistics
  const stats = useMemo(() => {
    // Financial calculations (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentTrips = trips.filter((t) => {
      const tripDate = new Date(t.createdAt);
      return tripDate >= thirtyDaysAgo;
    });

    const monthlyRevenue = recentTrips.reduce((sum, trip) => sum + trip.revenue, 0);
    const monthlyExpenses = recentTrips.reduce((sum, trip) => {
      return sum + trip.expenses.fuel + trip.expenses.tolls + trip.expenses.driverFee + trip.expenses.other;
    }, 0);
    const monthlyProfit = monthlyRevenue - monthlyExpenses;

    // Overdue
    const overdue = mockClients.reduce((sum, client) => sum + client.overdue, 0);

    // Truck warnings
    const truckWarnings = warnings.filter((w) => w.relatedType === 'truck');
    const criticalTruckWarnings = truckWarnings.filter((w) => w.severity === 'error').length;

    // Driver warnings
    const driverWarnings = warnings.filter((w) => w.relatedType === 'driver');
    const criticalDriverWarnings = driverWarnings.filter((w) => w.severity === 'error').length;

    return {
      totalTrucks: mockTrucks.length,
      trucksInTransit: mockTrucks.filter((t) => t.status === 'in-transit').length,
      totalDrivers: mockDrivers.length,
      driversOnTrip: mockDrivers.filter((d) => d.status === 'on-trip').length,
      monthlyRevenue,
      monthlyProfit,
      overdue,
      truckWarnings: criticalTruckWarnings,
      driverWarnings: criticalDriverWarnings,
    };
  }, [trips, warnings]);

  // Format currency
  const formatCurrency = (amount: number) => {
    return `${COMMON.currency}${amount.toLocaleString('tr-TR')}`;
  };

  return (
    <div className="p-4 pb-20">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Naklos</h1>
        <p className="text-sm text-gray-600 mt-1">{mockFleet.name}</p>
      </div>

      {/* Main Action Cards */}
      <div className="space-y-3 mb-6">
        {/* Vehicles Card */}
        <button
          onClick={() => navigate('/trucks')}
          className="w-full bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow text-left"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-2xl">
                🚛
              </div>
              <div>
                <p className="font-bold text-gray-900">Araçlar</p>
                <p className="text-sm text-gray-600">
                  {stats.trucksInTransit} yolda · {stats.totalTrucks} toplam
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {stats.truckWarnings > 0 && (
                <div className="px-3 py-1 bg-red-50 border border-red-200 rounded-full">
                  <span className="text-xs font-medium text-red-700">
                    🚨 {stats.truckWarnings} uyarı
                  </span>
                </div>
              )}
              <span className="text-gray-400 text-xl">›</span>
            </div>
          </div>
        </button>

        {/* Drivers Card */}
        <button
          onClick={() => navigate('/drivers')}
          className="w-full bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow text-left"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center text-2xl">
                👤
              </div>
              <div>
                <p className="font-bold text-gray-900">Sürücüler</p>
                <p className="text-sm text-gray-600">
                  {stats.driversOnTrip} seferde · {stats.totalDrivers} toplam
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {stats.driverWarnings > 0 && (
                <div className="px-3 py-1 bg-red-50 border border-red-200 rounded-full">
                  <span className="text-xs font-medium text-red-700">
                    🚨 {stats.driverWarnings} uyarı
                  </span>
                </div>
              )}
              <span className="text-gray-400 text-xl">›</span>
            </div>
          </div>
        </button>

        {/* Revenue Card */}
        <button
          onClick={() => navigate('/invoices')}
          className="w-full bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow text-left"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center text-2xl">
                💰
              </div>
              <div>
                <p className="font-bold text-gray-900">Bu Ay Gelir</p>
                <p className="text-lg font-bold text-green-600">
                  {formatCurrency(stats.monthlyRevenue)}
                </p>
                <p className="text-xs text-gray-500">
                  Kar: {formatCurrency(stats.monthlyProfit)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {stats.overdue > 0 && (
                <div className="px-3 py-1 bg-red-50 border border-red-200 rounded-full">
                  <span className="text-xs font-medium text-red-700">
                    ⚠️ Gecikmiş
                  </span>
                </div>
              )}
              <span className="text-gray-400 text-xl">›</span>
            </div>
          </div>
        </button>
      </div>

      {/* Critical Warnings Only */}
      {(stats.truckWarnings > 0 || stats.driverWarnings > 0 || stats.overdue > 0) && (
        <div className="bg-red-50 border-2 border-red-300 rounded-lg p-4 mb-6">
          <h3 className="font-bold text-red-900 mb-2 flex items-center gap-2">
            <span className="text-xl">⚠️</span>
            Acil Dikkat Gereken Konular
          </h3>
          <div className="space-y-2">
            {stats.truckWarnings > 0 && (
              <button
                onClick={() => navigate('/trucks')}
                className="w-full text-left text-sm text-red-800 hover:text-red-900 flex items-center justify-between"
              >
                <span>🚛 {stats.truckWarnings} araç belgesi 7 gün içinde sona eriyor</span>
                <span className="text-red-400">›</span>
              </button>
            )}
            {stats.driverWarnings > 0 && (
              <button
                onClick={() => navigate('/drivers')}
                className="w-full text-left text-sm text-red-800 hover:text-red-900 flex items-center justify-between"
              >
                <span>👤 {stats.driverWarnings} sürücü belgesi 7 gün içinde sona eriyor</span>
                <span className="text-red-400">›</span>
              </button>
            )}
            {stats.overdue > 0 && (
              <button
                onClick={() => navigate('/invoices')}
                className="w-full text-left text-sm text-red-800 hover:text-red-900 flex items-center justify-between"
              >
                <span>💰 {formatCurrency(stats.overdue)} vadesi geçmiş ödeme</span>
                <span className="text-red-400">›</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => navigate('/trips')}
          className="bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow text-left"
        >
          <div className="text-2xl mb-2">📦</div>
          <p className="text-sm font-medium text-gray-900">Seferler</p>
        </button>
        <button
          onClick={() => navigate('/clients')}
          className="bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow text-left"
        >
          <div className="text-2xl mb-2">👥</div>
          <p className="text-sm font-medium text-gray-900">Müşteriler</p>
        </button>
      </div>
    </div>
  );
};

export default DashboardPage;
