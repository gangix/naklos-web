import { useMemo } from 'react';
import { DASHBOARD, COMMON } from '../constants/text';
import { mockFleet, mockTrucks, mockDrivers, mockTrips, mockInvoices, mockClients } from '../data/mock';
import { calculateWarnings } from '../utils/warnings';

const DashboardPage = () => {
  // Calculate statistics from mock data
  const stats = useMemo(() => {
    // Active trips
    const activeTrips = mockTrips.filter((t) => t.status !== 'delivered').length;

    // Available trucks and drivers
    const availableTrucks = mockTrucks.filter((t) => t.status === 'available').length;
    const availableDrivers = mockDrivers.filter((d) => d.status === 'available').length;

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
      monthlyRevenue,
      monthlyProfit,
      outstanding,
      overdue,
      overdueInvoiceCount,
      activeTrips,
      availableTrucks,
      availableDrivers,
      overdueWarning,
    };
  }, []);

  // Calculate all warnings using centralized utility
  const warnings = useMemo(() => calculateWarnings(mockTrucks, mockDrivers), []);

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

      {/* Warnings */}
      {(stats.overdueWarning || warnings.length > 0) && (
        <div className="mb-6 space-y-2">
          {stats.overdueWarning && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-800">
                ⚠️ {stats.overdueInvoiceCount} fatura vadesi geçmiş
              </p>
            </div>
          )}
          {warnings
            .filter((w) => w.severity === 'error')
            .map((warning) => (
              <div key={warning.id} className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-800">🚨 {warning.message}</p>
              </div>
            ))}
          {warnings
            .filter((w) => w.severity === 'warning')
            .map((warning) => (
              <div key={warning.id} className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-sm text-yellow-800">⚠️ {warning.message}</p>
              </div>
            ))}
        </div>
      )}

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-lg p-4 shadow-sm text-center">
          <p className="text-3xl font-bold text-primary-600">{stats.activeTrips}</p>
          <p className="text-xs text-gray-600 mt-1">{DASHBOARD.activeTrips}</p>
        </div>
        <div className="bg-white rounded-lg p-4 shadow-sm text-center">
          <p className="text-3xl font-bold text-primary-600">{stats.availableTrucks}</p>
          <p className="text-xs text-gray-600 mt-1">{DASHBOARD.availableTrucks}</p>
        </div>
        <div className="bg-white rounded-lg p-4 shadow-sm text-center">
          <p className="text-3xl font-bold text-primary-600">{stats.availableDrivers}</p>
          <p className="text-xs text-gray-600 mt-1">{DASHBOARD.availableDrivers}</p>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
