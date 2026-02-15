import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { TRUCKS } from '../constants/text';
import { mockTrucks, mockDrivers } from '../data/mock';
import { calculateWarnings } from '../utils/warnings';
import type { TruckStatus } from '../types';

const TrucksPage = () => {
  const [filter, setFilter] = useState<TruckStatus | 'all'>('all');

  const filteredTrucks = useMemo(() => {
    if (filter === 'all') return mockTrucks;
    return mockTrucks.filter((truck) => truck.status === filter);
  }, [filter]);

  // Calculate warnings to show indicators on truck cards
  const warnings = useMemo(() => calculateWarnings(mockTrucks, mockDrivers), []);

  // Check if a truck has any expiring documents within 7 days
  const hasUrgentWarning = (truckId: string): boolean => {
    return warnings.some(
      (w) =>
        w.relatedId === truckId &&
        w.relatedType === 'truck' &&
        w.severity === 'error'
    );
  };

  // Get all warnings for a specific truck
  const getTruckWarnings = (truckId: string) => {
    return warnings.filter(
      (w) => w.relatedId === truckId && w.relatedType === 'truck'
    );
  };

  const getStatusColor = (status: TruckStatus) => {
    switch (status) {
      case 'available':
        return 'bg-green-100 text-green-700';
      case 'in-transit':
        return 'bg-blue-100 text-blue-700';
      case 'maintenance':
        return 'bg-orange-100 text-orange-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusLabel = (status: TruckStatus) => {
    switch (status) {
      case 'available':
        return TRUCKS.available;
      case 'in-transit':
        return TRUCKS.inTransit;
      case 'maintenance':
        return TRUCKS.maintenance;
      default:
        return status;
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold text-gray-900 mb-4">{TRUCKS.title}</h1>

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
          {TRUCKS.all} ({mockTrucks.length})
        </button>
        <button
          onClick={() => setFilter('available')}
          className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${
            filter === 'available'
              ? 'bg-primary-600 text-white'
              : 'bg-gray-100 text-gray-700'
          }`}
        >
          {TRUCKS.available} ({mockTrucks.filter((t) => t.status === 'available').length})
        </button>
        <button
          onClick={() => setFilter('in-transit')}
          className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${
            filter === 'in-transit'
              ? 'bg-primary-600 text-white'
              : 'bg-gray-100 text-gray-700'
          }`}
        >
          {TRUCKS.inTransit} ({mockTrucks.filter((t) => t.status === 'in-transit').length})
        </button>
        <button
          onClick={() => setFilter('maintenance')}
          className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${
            filter === 'maintenance'
              ? 'bg-primary-600 text-white'
              : 'bg-gray-100 text-gray-700'
          }`}
        >
          {TRUCKS.maintenance} ({mockTrucks.filter((t) => t.status === 'maintenance').length})
        </button>
      </div>

      {/* Truck list */}
      <div className="space-y-3">
        {filteredTrucks.map((truck) => (
          <Link
            key={truck.id}
            to={`/trucks/${truck.id}`}
            className="block bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 flex-1">
                <div className="flex-1">
                  <p className="font-bold text-gray-900">{truck.plateNumber}</p>
                  <p className="text-sm text-gray-600 mt-1">{truck.type}</p>
                </div>
                {hasUrgentWarning(truck.id) && (
                  <div className="flex items-center gap-1 px-2 py-1 bg-red-50 border border-red-200 rounded-md">
                    <span className="text-base">🚨</span>
                    <span className="text-xs font-medium text-red-700">Uyarı</span>
                  </div>
                )}
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(truck.status)}`}>
                {getStatusLabel(truck.status)}
              </span>
            </div>
            <div className="text-sm text-gray-600">
              <p>
                {TRUCKS.driver}: {truck.assignedDriverName || 'Atanmadı'}
              </p>
              {truck.lastPosition && (
                <p className="text-xs text-gray-500 mt-1">
                  📍 {truck.lastPosition.city}
                </p>
              )}
            </div>

            {/* Document warnings */}
            {getTruckWarnings(truck.id).length > 0 && (
              <div className="mt-3 pt-3 border-t border-gray-100 space-y-1">
                {getTruckWarnings(truck.id).map((warning) => (
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

export default TrucksPage;
