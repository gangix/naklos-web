import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../../contexts/DataContext';
import { useAuth } from '../../contexts/AuthContext';

const DriverTripsPage = () => {
  const navigate = useNavigate();
  const { trips } = useData();
  const { user } = useAuth();
  const [tab, setTab] = useState<'my-trips' | 'available'>('my-trips');

  // Driver's assigned trips
  const myTrips = useMemo(() => {
    return trips.filter((trip) => trip.driverId === user?.driverId);
  }, [trips, user]);

  // Unassigned trips
  const availableTrips = useMemo(() => {
    return trips.filter((trip) => !trip.driverId && trip.status === 'created');
  }, [trips]);

  const displayedTrips = tab === 'my-trips' ? myTrips : availableTrips;

  return (
    <div className="p-4 pb-20">
      {/* Header */}
      <h1 className="text-2xl font-bold text-gray-900 mb-4">Seferler</h1>

      {/* Tabs */}
      <div className="flex gap-2 mb-4 border-b border-gray-200">
        <button
          onClick={() => setTab('my-trips')}
          className={`px-4 py-2 font-medium whitespace-nowrap ${
            tab === 'my-trips'
              ? 'text-primary-600 border-b-2 border-primary-600'
              : 'text-gray-600'
          }`}
        >
          Seferlerim ({myTrips.length})
        </button>
        <button
          onClick={() => setTab('available')}
          className={`px-4 py-2 font-medium whitespace-nowrap ${
            tab === 'available'
              ? 'text-primary-600 border-b-2 border-primary-600'
              : 'text-gray-600'
          }`}
        >
          Müsait Seferler ({availableTrips.length})
        </button>
      </div>

      {/* Trip List */}
      <div className="space-y-3">
        {displayedTrips.length === 0 ? (
          <div className="bg-white rounded-lg p-6 text-center text-gray-600">
            <p className="mb-2">
              {tab === 'my-trips' ? 'Henüz sefer yok' : 'Müsait sefer bulunmuyor'}
            </p>
            <p className="text-sm text-gray-500">
              {tab === 'my-trips'
                ? 'Teslimat yaptığınızda belge yükleyin'
                : 'Şu an atanabilecek sefer yok'}
            </p>
          </div>
        ) : (
          displayedTrips.map((trip) => (
            <button
              key={trip.id}
              onClick={() => navigate(`/driver/trips/${trip.id}`)}
              className="w-full bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow text-left"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <p className="font-bold text-gray-900">
                    {trip.originCity} → {trip.destinationCity}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    {trip.clientName || 'Müşteri belirtilmemiş'}
                  </p>
                  {trip.cargoDescription && (
                    <p className="text-xs text-gray-500 mt-1">{trip.cargoDescription}</p>
                  )}
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    trip.status === 'in-progress'
                      ? 'bg-blue-100 text-blue-700'
                      : trip.status === 'delivered'
                      ? 'bg-orange-100 text-orange-700'
                      : trip.status === 'approved'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-purple-100 text-purple-700'
                  }`}
                >
                  {trip.status === 'in-progress'
                    ? 'Devam Ediyor'
                    : trip.status === 'delivered'
                    ? 'Onay Bekliyor'
                    : trip.status === 'approved'
                    ? 'Onaylandı'
                    : 'Tamamlandı'}
                </span>
              </div>

              {tab === 'my-trips' && trip.truckPlate && (
                <div className="flex items-center text-sm text-gray-600 pt-2 border-t border-gray-100">
                  <span>🚛 {trip.truckPlate}</span>
                </div>
              )}
            </button>
          ))
        )}
      </div>

      {/* Floating Action Button */}
      <button
        onClick={() => navigate('/driver/trips/create')}
        className="fixed bottom-20 right-4 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg flex items-center justify-center text-2xl hover:bg-blue-700 transition-colors"
      >
        +
      </button>
    </div>
  );
};

export default DriverTripsPage;
