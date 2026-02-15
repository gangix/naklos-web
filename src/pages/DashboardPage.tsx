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

    // Truck warnings (critical only)
    const truckWarnings = warnings.filter(
      (w) => w.relatedType === 'truck' && w.severity === 'error'
    );

    // Driver warnings (critical only)
    const driverWarnings = warnings.filter(
      (w) => w.relatedType === 'driver' && w.severity === 'error'
    );

    return {
      totalTrucks: mockTrucks.length,
      trucksInTransit: mockTrucks.filter((t) => t.status === 'in-transit').length,
      totalDrivers: mockDrivers.length,
      driversOnTrip: mockDrivers.filter((d) => d.status === 'on-trip').length,
      monthlyRevenue,
      monthlyProfit,
      overdue,
      truckWarnings,
      driverWarnings,
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

      {/* Main Cards - Only 3 */}
      <div className="space-y-3">
        {/* Vehicles Card */}
        <button
          onClick={() => navigate('/trucks')}
          className="w-full bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow text-left"
        >
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-2xl flex-shrink-0">
              🚛
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <p className="font-bold text-gray-900">Araçlar</p>
                <span className="text-gray-400 text-xl">›</span>
              </div>
              <p className="text-sm text-gray-600 mb-2">
                {stats.trucksInTransit} yolda · {stats.totalTrucks} toplam
              </p>
              {stats.truckWarnings.length > 0 && (
                <div className="space-y-1">
                  {stats.truckWarnings.slice(0, 2).map((warning) => (
                    <p
                      key={warning.id}
                      className="text-xs text-red-700 bg-red-50 px-2 py-1 rounded"
                    >
                      🚨 {warning.message.split(' - ')[1]}
                    </p>
                  ))}
                  {stats.truckWarnings.length > 2 && (
                    <p className="text-xs text-red-600">
                      +{stats.truckWarnings.length - 2} diğer uyarı
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </button>

        {/* Drivers Card */}
        <button
          onClick={() => navigate('/drivers')}
          className="w-full bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow text-left"
        >
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center text-2xl flex-shrink-0">
              👤
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <p className="font-bold text-gray-900">Sürücüler</p>
                <span className="text-gray-400 text-xl">›</span>
              </div>
              <p className="text-sm text-gray-600 mb-2">
                {stats.driversOnTrip} seferde · {stats.totalDrivers} toplam
              </p>
              {stats.driverWarnings.length > 0 && (
                <div className="space-y-1">
                  {stats.driverWarnings.slice(0, 2).map((warning) => (
                    <p
                      key={warning.id}
                      className="text-xs text-red-700 bg-red-50 px-2 py-1 rounded"
                    >
                      🚨 {warning.message.split(' - ')[1]}
                    </p>
                  ))}
                  {stats.driverWarnings.length > 2 && (
                    <p className="text-xs text-red-600">
                      +{stats.driverWarnings.length - 2} diğer uyarı
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </button>

        {/* Revenue Card */}
        <button
          onClick={() => navigate('/invoices')}
          className="w-full bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow text-left"
        >
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center text-2xl flex-shrink-0">
              💰
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <p className="font-bold text-gray-900">Bu Ay Gelir</p>
                <span className="text-gray-400 text-xl">›</span>
              </div>
              <p className="text-lg font-bold text-green-600 mb-1">
                {formatCurrency(stats.monthlyRevenue)}
              </p>
              <p className="text-xs text-gray-600 mb-2">
                Kar: {formatCurrency(stats.monthlyProfit)}
              </p>
              {stats.overdue > 0 && (
                <p className="text-xs text-red-700 bg-red-50 px-2 py-1 rounded">
                  ⚠️ {formatCurrency(stats.overdue)} vadesi geçmiş
                </p>
              )}
            </div>
          </div>
        </button>
      </div>
    </div>
  );
};

export default DashboardPage;
