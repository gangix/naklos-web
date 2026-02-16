import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../../contexts/DataContext';
import { useAuth } from '../../contexts/AuthContext';

const DriverDashboardPage = () => {
  const navigate = useNavigate();
  const { trips } = useData();
  const { user } = useAuth();

  // Driver's assigned trips
  const myTrips = useMemo(() => {
    return trips.filter((trip) => trip.driverId === user?.driverId);
  }, [trips, user]);

  // Unassigned trips (available to take)
  const availableTrips = useMemo(() => {
    return trips.filter((trip) => !trip.driverId && trip.status === 'created');
  }, [trips]);

  // My active trips (in-progress, not yet delivered)
  const activeTrips = myTrips.filter((trip) => trip.status === 'in-progress');

  // Waiting approval (delivered, pending manager approval)
  const pendingTrips = myTrips.filter((trip) => trip.status === 'delivered');

  // Completed (approved)
  const completedTrips = myTrips.filter((trip) => trip.status === 'approved' || trip.status === 'invoiced');

  return (
    <div className="p-4 pb-20">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Hoş Geldiniz</h1>
        <p className="text-sm text-gray-600 mt-1">{user?.name}</p>
      </div>

      {/* Quick Actions */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/driver/trips/create')}
          className="w-full bg-blue-600 text-white rounded-lg p-4 font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
        >
          <span className="text-xl">📸</span>
          <span>Teslimat Belgesi Yükle</span>
        </button>
      </div>

      {/* Stats Overview */}
      <div className="mb-6">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
          Seferlerim
        </h2>

        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white rounded-lg p-3 shadow-sm text-center">
            <p className="text-2xl font-bold text-blue-600">{activeTrips.length}</p>
            <p className="text-xs text-gray-600 mt-1">Aktif</p>
          </div>
          <div className="bg-white rounded-lg p-3 shadow-sm text-center">
            <p className="text-2xl font-bold text-orange-600">{pendingTrips.length}</p>
            <p className="text-xs text-gray-600 mt-1">Onay Bekliyor</p>
          </div>
          <div className="bg-white rounded-lg p-3 shadow-sm text-center">
            <p className="text-2xl font-bold text-green-600">{completedTrips.length}</p>
            <p className="text-xs text-gray-600 mt-1">Tamamlandı</p>
          </div>
        </div>
      </div>

      {/* Available Trips */}
      {availableTrips.length > 0 && (
        <div className="mb-6">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Müsait Seferler ({availableTrips.length})
          </h2>
          <div className="space-y-2">
            {availableTrips.slice(0, 3).map((trip) => (
              <button
                key={trip.id}
                onClick={() => navigate(`/driver/trips/${trip.id}`)}
                className="w-full bg-white rounded-lg p-3 shadow-sm text-left hover:shadow-md transition-shadow"
              >
                <p className="font-bold text-gray-900 text-sm">
                  {trip.originCity} → {trip.destinationCity}
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  {trip.clientName || 'Müşteri belirtilmemiş'}
                </p>
              </button>
            ))}
            {availableTrips.length > 3 && (
              <button
                onClick={() => navigate('/driver/trips')}
                className="w-full text-center text-sm text-blue-600 py-2"
              >
                Tümünü Gör ({availableTrips.length})
              </button>
            )}
          </div>
        </div>
      )}

      {/* My Recent Trips */}
      {myTrips.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
              Son Seferlerim
            </h2>
            <button
              onClick={() => navigate('/driver/trips')}
              className="text-sm text-blue-600"
            >
              Tümü →
            </button>
          </div>
          <div className="space-y-2">
            {myTrips.slice(0, 5).map((trip) => (
              <button
                key={trip.id}
                onClick={() => navigate(`/driver/trips/${trip.id}`)}
                className="w-full bg-white rounded-lg p-3 shadow-sm text-left hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between mb-1">
                  <p className="font-bold text-gray-900 text-sm">
                    {trip.originCity} → {trip.destinationCity}
                  </p>
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs ${
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
                <p className="text-xs text-gray-600">{trip.clientName || 'Müşteri belirtilmemiş'}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {myTrips.length === 0 && availableTrips.length === 0 && (
        <div className="bg-white rounded-lg p-8 text-center text-gray-600">
          <p className="text-lg mb-2">Henüz sefer yok</p>
          <p className="text-sm">
            Teslimat yaptığınızda belge yüklemek için yukarıdaki butonu kullanın
          </p>
        </div>
      )}
    </div>
  );
};

export default DriverDashboardPage;
