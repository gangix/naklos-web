import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { DRIVERS } from '../constants/text';
import { mockDrivers } from '../data/mock';
import { calculateWarnings } from '../utils/warnings';
import { mockTrucks } from '../data/mock';
import type { DriverStatus } from '../types';

const DriversPage = () => {
  const [filter, setFilter] = useState<DriverStatus | 'all'>('all');

  const filteredDrivers = useMemo(() => {
    if (filter === 'all') return mockDrivers;
    return mockDrivers.filter((driver) => driver.status === filter);
  }, [filter]);

  // Calculate warnings to show indicators on driver cards
  const warnings = useMemo(() => calculateWarnings(mockTrucks, mockDrivers), []);

  // Check if a driver has any expiring documents within 7 days
  const hasUrgentWarning = (driverId: string): boolean => {
    return warnings.some(
      (w) =>
        w.relatedId === driverId &&
        w.relatedType === 'driver' &&
        w.severity === 'error'
    );
  };

  // Get all warnings for a specific driver
  const getDriverWarnings = (driverId: string) => {
    return warnings.filter(
      (w) => w.relatedId === driverId && w.relatedType === 'driver'
    );
  };

  const getStatusColor = (status: DriverStatus) => {
    switch (status) {
      case 'available':
        return 'bg-green-100 text-green-700';
      case 'on-trip':
        return 'bg-blue-100 text-blue-700';
      case 'off-duty':
        return 'bg-gray-100 text-gray-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusLabel = (status: DriverStatus) => {
    switch (status) {
      case 'available':
        return DRIVERS.available;
      case 'on-trip':
        return DRIVERS.onTrip;
      case 'off-duty':
        return DRIVERS.offDuty;
      default:
        return status;
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold text-gray-900 mb-4">{DRIVERS.title}</h1>

      {/* Filter chips */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${
            filter === 'all'
              ? 'bg-primary-600 text-white'
              : 'bg-gray-100 text-gray-700'
          }`}
        >
          {DRIVERS.all} ({mockDrivers.length})
        </button>
        <button
          onClick={() => setFilter('available')}
          className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${
            filter === 'available'
              ? 'bg-primary-600 text-white'
              : 'bg-gray-100 text-gray-700'
          }`}
        >
          {DRIVERS.available} ({mockDrivers.filter((d) => d.status === 'available').length})
        </button>
        <button
          onClick={() => setFilter('on-trip')}
          className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${
            filter === 'on-trip'
              ? 'bg-primary-600 text-white'
              : 'bg-gray-100 text-gray-700'
          }`}
        >
          {DRIVERS.onTrip} ({mockDrivers.filter((d) => d.status === 'on-trip').length})
        </button>
        <button
          onClick={() => setFilter('off-duty')}
          className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${
            filter === 'off-duty'
              ? 'bg-primary-600 text-white'
              : 'bg-gray-100 text-gray-700'
          }`}
        >
          {DRIVERS.offDuty} ({mockDrivers.filter((d) => d.status === 'off-duty').length})
        </button>
      </div>

      {/* Driver list */}
      <div className="space-y-3">
        {filteredDrivers.map((driver) => (
          <Link
            key={driver.id}
            to={`/drivers/${driver.id}`}
            className="block bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 flex-1">
                <div className="flex-1">
                  <p className="font-bold text-gray-900">
                    {driver.firstName} {driver.lastName}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">{driver.phone}</p>
                </div>
                {hasUrgentWarning(driver.id) && (
                  <div className="flex items-center gap-1 px-2 py-1 bg-red-50 border border-red-200 rounded-md">
                    <span className="text-base">🚨</span>
                    <span className="text-xs font-medium text-red-700">Uyarı</span>
                  </div>
                )}
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(driver.status)}`}>
                {getStatusLabel(driver.status)}
              </span>
            </div>
            {driver.assignedTruckPlate && (
              <div className="text-sm text-gray-600">
                <p>
                  {DRIVERS.assignedTruck}: {driver.assignedTruckPlate}
                </p>
              </div>
            )}

            {/* License & Certificate warnings */}
            {getDriverWarnings(driver.id).length > 0 && (
              <div className="mt-3 pt-3 border-t border-gray-100 space-y-1">
                {getDriverWarnings(driver.id).map((warning) => (
                  <div
                    key={warning.id}
                    className={`text-xs px-2 py-1 rounded ${
                      warning.severity === 'error'
                        ? 'bg-red-50 text-red-700'
                        : 'bg-yellow-50 text-yellow-700'
                    }`}
                  >
                    {warning.severity === 'error' ? '🚨' : '⚠️'} {warning.message.split(' - ')[1]}
                  </div>
                ))}
              </div>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
};

export default DriversPage;
