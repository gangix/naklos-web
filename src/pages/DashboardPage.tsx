import { useMemo } from 'react';
import { DASHBOARD, COMMON } from '../constants/text';
import { mockFleet, mockTrucks, mockDrivers, mockTrips, mockInvoices, mockClients } from '../data/mock';
import { calculateWarnings } from '../utils/warnings';

const DashboardPage = () => {
  // Calculate statistics from mock data
  const stats = useMemo(() => {
    // Truck statistics
    const totalTrucks = mockTrucks.length;
    const trucksInTransit = mockTrucks.filter((t) => t.status === 'in-transit').length;
    const trucksAvailable = mockTrucks.filter((t) => t.status === 'available').length;
    const trucksMaintenance = mockTrucks.filter((t) => t.status === 'maintenance').length;

    // Driver statistics
    const totalDrivers = mockDrivers.length;
    const driversOnTrip = mockDrivers.filter((d) => d.status === 'on-trip').length;
    const driversAvailable = mockDrivers.filter((d) => d.status === 'available').length;
    const driversOffDuty = mockDrivers.filter((d) => d.status === 'off-duty').length;

    // Trip statistics
    const activeTrips = mockTrips.filter((t) => t.status !== 'delivered').length;
    const allTimeTrips = mockTrips.length;
    const completedTrips = mockTrips.filter((t) => t.status === 'delivered').length;

    // This month's trips
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const thisMonthTrips = mockTrips.filter((t) => {
      const tripDate = new Date(t.createdAt);
      return tripDate >= firstDayOfMonth;
    });
    const thisMonthCompleted = thisMonthTrips.filter((t) => t.status === 'delivered').length;

    // Financial calculations (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentTrips = mockTrips.filter((t) => {
      const tripDate = new Date(t.createdAt);
      return tripDate >= thirtyDaysAgo;
    });

    const monthlyRevenue = recentTrips.reduce((sum, trip) => sum + trip.revenue, 0);

    const monthlyExpenses = recentTrips.reduce((sum, trip) => {
      return sum + trip.expenses.fuel + trip.expenses.tolls + trip.expenses.driverFee + trip.expenses.other;
    }, 0);

    const monthlyProfit = monthlyRevenue - monthlyExpenses;

    // Outstanding and overdue
    const outstanding = mockClients.reduce((sum, client) => sum + client.outstanding, 0);
    const overdue = mockClients.reduce((sum, client) => sum + client.overdue, 0);
    const overdueInvoiceCount = mockInvoices.filter((inv) => inv.status === 'overdue').length;

    // Warnings
    const overdueWarning = overdueInvoiceCount > 0;

    return {
      // Truck stats
      totalTrucks,
      trucksInTransit,
      trucksAvailable,
      trucksMaintenance,
      // Driver stats
      totalDrivers,
      driversOnTrip,
      driversAvailable,
      driversOffDuty,
      // Trip stats
      activeTrips,
      allTimeTrips,
      completedTrips,
      thisMonthTrips: thisMonthTrips.length,
      thisMonthCompleted,
      // Financial
      monthlyRevenue,
      monthlyProfit,
      outstanding,
      overdue,
      overdueInvoiceCount,
      overdueWarning,
    };
  }, []);

  // Calculate all warnings using centralized utility
  const warnings = useMemo(() => calculateWarnings(mockTrucks, mockDrivers), []);

  // Trip-related alerts
  const tripAlerts = useMemo(() => {
    const delivered = mockTrips.filter((t) => t.status === 'delivered');
    const waitingForDocs = delivered.filter((t) => t.deliveryDocuments.length === 0);
    const readyToConfirm = delivered.filter(
      (t) => t.deliveryDocuments.length > 0 && !t.documentsConfirmed
    );
    const readyToInvoice = delivered.filter((t) => t.documentsConfirmed && !t.invoiced);

    return {
      waitingForDocs: waitingForDocs.length,
      readyToConfirm: readyToConfirm.length,
      readyToInvoice: readyToInvoice.length,
    };
  }, []);

  // Format currency
  const formatCurrency = (amount: number) => {
    return `${COMMON.currency}${amount.toLocaleString('tr-TR')}`;
  };

  return (
    <div className="p-4">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Naklos</h1>
        <p className="text-sm text-gray-600 mt-1">{mockFleet.name}</p>
      </div>

      {/* ALERTS SECTION - Prominent at top */}
      {(stats.overdueWarning || warnings.length > 0 || tripAlerts.waitingForDocs > 0 || tripAlerts.readyToConfirm > 0) && (
        <div className="mb-6 space-y-2">
          <h2 className="text-lg font-bold text-gray-900 mb-3">⚠️ Dikkat Gereken Konular</h2>

          {/* Critical alerts (errors) */}
          {warnings
            .filter((w) => w.severity === 'error')
            .map((warning) => (
              <div key={warning.id} className="bg-red-50 border-2 border-red-300 rounded-lg p-3">
                <p className="text-sm font-medium text-red-900">🚨 {warning.message}</p>
              </div>
            ))}

          {/* Overdue invoices */}
          {stats.overdueWarning && (
            <div className="bg-red-50 border-2 border-red-300 rounded-lg p-3">
              <p className="text-sm font-medium text-red-900">
                💰 {stats.overdueInvoiceCount} fatura vadesi geçmiş - toplam {formatCurrency(stats.overdue)}
              </p>
            </div>
          )}

          {/* Warning alerts */}
          {warnings
            .filter((w) => w.severity === 'warning')
            .map((warning) => (
              <div key={warning.id} className="bg-yellow-50 border border-yellow-300 rounded-lg p-3">
                <p className="text-sm text-yellow-900">⚠️ {warning.message}</p>
              </div>
            ))}

          {/* Trip alerts - waiting for documents */}
          {tripAlerts.waitingForDocs > 0 && (
            <div className="bg-blue-50 border border-blue-300 rounded-lg p-3">
              <p className="text-sm text-blue-900">
                📦 {tripAlerts.waitingForDocs} sefer tamamlandı, belge yüklemesi bekleniyor
              </p>
            </div>
          )}

          {/* Trip alerts - ready to confirm */}
          {tripAlerts.readyToConfirm > 0 && (
            <div className="bg-purple-50 border border-purple-300 rounded-lg p-3">
              <p className="text-sm text-purple-900">
                ✅ {tripAlerts.readyToConfirm} seferin belgeleri yüklendi, onay bekleniyor
              </p>
            </div>
          )}

          {/* Trip alerts - ready to invoice */}
          {tripAlerts.readyToInvoice > 0 && (
            <div className="bg-green-50 border border-green-300 rounded-lg p-3">
              <p className="text-sm text-green-900">
                💵 {tripAlerts.readyToInvoice} sefer fatura oluşturmaya hazır
              </p>
            </div>
          )}
        </div>
      )}

      {/* Financial summary cards */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <p className="text-sm text-gray-600 mb-1">{DASHBOARD.revenue}</p>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.monthlyRevenue)}</p>
        </div>
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <p className="text-sm text-gray-600 mb-1">{DASHBOARD.profit}</p>
          <p className="text-2xl font-bold text-green-600">{formatCurrency(stats.monthlyProfit)}</p>
        </div>
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <p className="text-sm text-gray-600 mb-1">{DASHBOARD.outstanding}</p>
          <p className="text-2xl font-bold text-orange-600">{formatCurrency(stats.outstanding)}</p>
        </div>
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <p className="text-sm text-gray-600 mb-1">{DASHBOARD.overdue}</p>
          <p className="text-2xl font-bold text-red-600">{formatCurrency(stats.overdue)}</p>
          {stats.overdueInvoiceCount > 0 && (
            <p className="text-xs text-red-600 mt-1">{stats.overdueInvoiceCount} fatura</p>
          )}
        </div>
      </div>

      {/* Fleet Overview Section */}
      <div className="mb-6">
        <h2 className="text-lg font-bold text-gray-900 mb-3">Filo Durumu</h2>

        {/* Trucks Overview */}
        <div className="bg-white rounded-lg p-4 shadow-sm mb-3">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🚛</span>
              <div>
                <p className="text-sm text-gray-600">Toplam Araç</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalTrucks}</p>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 pt-3 border-t border-gray-100">
            <div className="text-center">
              <p className="text-lg font-bold text-blue-600">{stats.trucksInTransit}</p>
              <p className="text-xs text-gray-600">Yolda</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-green-600">{stats.trucksAvailable}</p>
              <p className="text-xs text-gray-600">Müsait</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-orange-600">{stats.trucksMaintenance}</p>
              <p className="text-xs text-gray-600">Bakımda</p>
            </div>
          </div>
        </div>

        {/* Drivers Overview */}
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-2xl">👤</span>
              <div>
                <p className="text-sm text-gray-600">Toplam Şoför</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalDrivers}</p>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 pt-3 border-t border-gray-100">
            <div className="text-center">
              <p className="text-lg font-bold text-blue-600">{stats.driversOnTrip}</p>
              <p className="text-xs text-gray-600">Seferde</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-green-600">{stats.driversAvailable}</p>
              <p className="text-xs text-gray-600">Müsait</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-gray-600">{stats.driversOffDuty}</p>
              <p className="text-xs text-gray-600">İzinli</p>
            </div>
          </div>
        </div>
      </div>

      {/* Trip Statistics Section */}
      <div className="mb-6">
        <h2 className="text-lg font-bold text-gray-900 mb-3">Sefer İstatistikleri</h2>
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600 mb-1">Bu Ay</p>
              <p className="text-2xl font-bold text-primary-600">{stats.thisMonthTrips}</p>
              <p className="text-xs text-gray-500 mt-1">{stats.thisMonthCompleted} tamamlandı</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Aktif Seferler</p>
              <p className="text-2xl font-bold text-blue-600">{stats.activeTrips}</p>
              <p className="text-xs text-gray-500 mt-1">devam ediyor</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Toplam Sefer</p>
              <p className="text-2xl font-bold text-gray-900">{stats.allTimeTrips}</p>
              <p className="text-xs text-gray-500 mt-1">tüm zamanlar</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Tamamlanma</p>
              <p className="text-2xl font-bold text-green-600">
                {Math.round((stats.completedTrips / stats.allTimeTrips) * 100)}%
              </p>
              <p className="text-xs text-gray-500 mt-1">{stats.completedTrips}/{stats.allTimeTrips}</p>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default DashboardPage;
