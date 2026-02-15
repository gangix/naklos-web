import { DASHBOARD } from '../constants/text';

const DashboardPage = () => {
  return (
    <div className="p-4">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Naklos</h1>
        <p className="text-sm text-gray-600 mt-1">Yıldız Nakliyat</p>
      </div>

      {/* Financial summary cards */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <p className="text-sm text-gray-600 mb-1">{DASHBOARD.revenue}</p>
          <p className="text-2xl font-bold text-gray-900">₺245,000</p>
        </div>
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <p className="text-sm text-gray-600 mb-1">{DASHBOARD.profit}</p>
          <p className="text-2xl font-bold text-green-600">₺68,500</p>
        </div>
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <p className="text-sm text-gray-600 mb-1">{DASHBOARD.outstanding}</p>
          <p className="text-2xl font-bold text-orange-600">₺82,000</p>
        </div>
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <p className="text-sm text-gray-600 mb-1">{DASHBOARD.overdue}</p>
          <p className="text-2xl font-bold text-red-600">₺15,500</p>
          <p className="text-xs text-red-600 mt-1">2 fatura</p>
        </div>
      </div>

      {/* Warnings */}
      <div className="mb-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-2">
          <p className="text-sm text-red-800">
            ⚠️ 2 fatura vadesi geçmiş
          </p>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <p className="text-sm text-yellow-800">
            ⚠️ 1 ehliyet 5 gün içinde sona eriyor
          </p>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-lg p-4 shadow-sm text-center">
          <p className="text-3xl font-bold text-primary-600">8</p>
          <p className="text-xs text-gray-600 mt-1">{DASHBOARD.activeTrips}</p>
        </div>
        <div className="bg-white rounded-lg p-4 shadow-sm text-center">
          <p className="text-3xl font-bold text-primary-600">4</p>
          <p className="text-xs text-gray-600 mt-1">{DASHBOARD.availableTrucks}</p>
        </div>
        <div className="bg-white rounded-lg p-4 shadow-sm text-center">
          <p className="text-3xl font-bold text-primary-600">3</p>
          <p className="text-xs text-gray-600 mt-1">{DASHBOARD.availableDrivers}</p>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
