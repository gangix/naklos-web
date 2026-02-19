import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { tripApi, clientApi, truckApi, driverApi } from '../services/api';
import { useFleet } from '../contexts/FleetContext';

const TripCreatePage = () => {
  const navigate = useNavigate();
  const { fleetId } = useFleet();

  // Form data
  const [clientId, setClientId] = useState('');
  const [truckId, setTruckId] = useState('');
  const [driverId, setDriverId] = useState('');
  const [originCity, setOriginCity] = useState('');
  const [originAddress, setOriginAddress] = useState('');
  const [destinationCity, setDestinationCity] = useState('');
  const [destinationAddress, setDestinationAddress] = useState('');
  const [pickupDate, setPickupDate] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [revenue, setRevenue] = useState('');
  const [cargoDescription, setCargoDescription] = useState('');

  // Data for dropdowns
  const [clients, setClients] = useState<any[]>([]);
  const [trucks, setTrucks] = useState<any[]>([]);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (fleetId) {
      loadData();
    }
  }, [fleetId]);

  const loadData = async () => {
    if (!fleetId) return;
    try {
      const [clientsData, trucksData, driversData] = await Promise.all([
        clientApi.getByFleet(fleetId),
        truckApi.getByFleet(fleetId),
        driverApi.getByFleet(fleetId),
      ]);
      setClients(clientsData);
      setTrucks(trucksData);
      setDrivers(driversData);
    } catch (err) {
      console.error('Error loading data:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fleetId) return;

    setLoading(true);
    setError(null);

    try {
      const tripData = {
        clientId,
        truckId: truckId || null,
        driverId: driverId || null,
        origin: {
          city: originCity,
          address: originAddress,
        },
        destination: {
          city: destinationCity,
          address: destinationAddress,
        },
        scheduledPickupDate: pickupDate,
        scheduledDeliveryDate: deliveryDate,
        agreedPrice: revenue ? parseFloat(revenue) : null,
        cargoDescription: cargoDescription || null,
      };

      await tripApi.createPlanned(tripData, fleetId);
      alert('✓ Sefer başarıyla oluşturuldu!');
      navigate('/manager/trips');
    } catch (err: any) {
      console.error('Error creating trip:', err);
      setError(err.message || 'Sefer oluşturulurken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 pb-20">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate(-1)}
          className="text-2xl text-gray-600 hover:text-gray-900"
        >
          ←
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Yeni Sefer Oluştur</h1>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Client */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Müşteri *
          </label>
          <select
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          >
            <option value="">Müşteri seçin</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.name}
              </option>
            ))}
          </select>
        </div>

        {/* Truck (Optional) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Araç (Opsiyonel)
          </label>
          <select
            value={truckId}
            onChange={(e) => setTruckId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          >
            <option value="">Araç seçin (sonra atanabilir)</option>
            {trucks.map((truck) => (
              <option key={truck.id} value={truck.id}>
                {truck.plateNumber} - {truck.type}
              </option>
            ))}
          </select>
        </div>

        {/* Driver (Optional) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Sürücü (Opsiyonel)
          </label>
          <select
            value={driverId}
            onChange={(e) => setDriverId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          >
            <option value="">Sürücü seçin (sonra atanabilir)</option>
            {drivers.map((driver) => (
              <option key={driver.id} value={driver.id}>
                {driver.firstName} {driver.lastName}
              </option>
            ))}
          </select>
        </div>

        {/* Origin */}
        <div className="border border-gray-200 rounded-lg p-4 space-y-3">
          <h3 className="font-semibold text-gray-900">Nereden</h3>
          <div>
            <label className="block text-sm text-gray-700 mb-1">Şehir *</label>
            <input
              type="text"
              value={originCity}
              onChange={(e) => setOriginCity(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              placeholder="İstanbul"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">Adres *</label>
            <input
              type="text"
              value={originAddress}
              onChange={(e) => setOriginAddress(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              placeholder="Tam adres"
            />
          </div>
        </div>

        {/* Destination */}
        <div className="border border-gray-200 rounded-lg p-4 space-y-3">
          <h3 className="font-semibold text-gray-900">Nereye</h3>
          <div>
            <label className="block text-sm text-gray-700 mb-1">Şehir *</label>
            <input
              type="text"
              value={destinationCity}
              onChange={(e) => setDestinationCity(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              placeholder="Ankara"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">Adres *</label>
            <input
              type="text"
              value={destinationAddress}
              onChange={(e) => setDestinationAddress(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              placeholder="Tam adres"
            />
          </div>
        </div>

        {/* Dates */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Yükleme Tarihi *
          </label>
          <input
            type="date"
            value={pickupDate}
            onChange={(e) => setPickupDate(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Teslimat Tarihi *
          </label>
          <input
            type="date"
            value={deliveryDate}
            onChange={(e) => setDeliveryDate(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          />
        </div>

        {/* Revenue */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Ücret (TL)
          </label>
          <input
            type="number"
            step="0.01"
            value={revenue}
            onChange={(e) => setRevenue(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            placeholder="0.00"
          />
        </div>

        {/* Cargo Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Yük Açıklaması
          </label>
          <textarea
            value={cargoDescription}
            onChange={(e) => setCargoDescription(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            placeholder="Yükün içeriği..."
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full px-4 py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50"
        >
          {loading ? 'Oluşturuluyor...' : 'Sefer Oluştur'}
        </button>
      </form>
    </div>
  );
};

export default TripCreatePage;