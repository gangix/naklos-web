import { useState, useMemo } from 'react';
import { TRIPS } from '../constants/text';
import { mockTrips } from '../data/mock';
import { formatCurrency } from '../utils/format';
import { TripStatus } from '../types';

const TripsPage = () => {
  const [tab, setTab] = useState<'active' | 'completed'>('active');

  const filteredTrips = useMemo(() => {
    if (tab === 'active') {
      return mockTrips.filter((trip) => trip.status !== 'delivered');
    }
    return mockTrips.filter((trip) => trip.status === 'delivered');
  }, [tab]);

  const getStatusColor = (status: TripStatus) => {
    switch (status) {
      case 'assigned':
        return 'bg-yellow-100 text-yellow-700';
      case 'in-transit':
        return 'bg-blue-100 text-blue-700';
      case 'delivered':
        return 'bg-green-100 text-green-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusLabel = (status: TripStatus) => {
    switch (status) {
      case 'assigned':
        return TRIPS.assigned;
      case 'in-transit':
        return TRIPS.inTransit;
      case 'delivered':
        return TRIPS.delivered;
      default:
        return status;
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold text-gray-900 mb-4">{TRIPS.title}</h1>

      {/* Tabs */}
      <div className="flex gap-2 mb-4 border-b border-gray-200">
        <button
          onClick={() => setTab('active')}
          className={`px-4 py-2 font-medium ${
            tab === 'active'
              ? 'text-primary-600 border-b-2 border-primary-600'
              : 'text-gray-600'
          }`}
        >
          {TRIPS.active} ({mockTrips.filter((t) => t.status !== 'delivered').length})
        </button>
        <button
          onClick={() => setTab('completed')}
          className={`px-4 py-2 font-medium ${
            tab === 'completed'
              ? 'text-primary-600 border-b-2 border-primary-600'
              : 'text-gray-600'
          }`}
        >
          {TRIPS.completed} ({mockTrips.filter((t) => t.status === 'delivered').length})
        </button>
      </div>

      {/* Trip list */}
      <div className="space-y-3">
        {filteredTrips.map((trip) => (
          <div key={trip.id} className="bg-white rounded-lg p-4 shadow-sm">
            <div className="flex items-start justify-between mb-2">
              <div>
                <p className="font-bold text-gray-900">
                  {trip.originCity} → {trip.destinationCity}
                </p>
                <p className="text-sm text-gray-600 mt-1">{trip.clientName}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(trip.status)}`}>
                {getStatusLabel(trip.status)}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm text-gray-600 pt-2 border-t border-gray-100">
              <span>{trip.truckPlate}</span>
              <span className="font-bold text-green-600">{formatCurrency(trip.revenue)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TripsPage;
