import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { tripApi, tripTemplateApi, clientApi, truckApi, driverApi } from '../services/api';
import { useFleet } from '../contexts/FleetContext';

const TripCreatePage = () => {
  const navigate = useNavigate();
  const { fleetId } = useFleet();

  // Form fields
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
  const [saveAsTemplate, setSaveAsTemplate] = useState(false);
  const [templateName, setTemplateName] = useState('');

  // Dropdown data
  const [clients, setClients] = useState<any[]>([]);
  const [trucks, setTrucks] = useState<any[]>([]);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showTemplates, setShowTemplates] = useState(false);

  useEffect(() => {
    if (fleetId) loadData();
  }, [fleetId]);

  const loadData = async () => {
    if (!fleetId) return;
    const [clientsPage, trucksPage, driversPage, templatesData] = await Promise.all([
      clientApi.getByFleet(0, 1000),
      truckApi.getByFleet(0, 1000),
      driverApi.getByFleet(0, 1000),
      tripTemplateApi.getByFleet().catch(() => []),
    ]);
    setClients(clientsPage.content as any[]);
    setTrucks(trucksPage.content as any[]);
    setDrivers(driversPage.content as any[]);
    setTemplates(templatesData as any[]);
  };

  const applyTemplate = (template: any) => {
    setOriginCity(template.originCity || '');
    setDestinationCity(template.destinationCity || '');
    setCargoDescription(template.cargoDescription || '');
    setRevenue(template.typicalRevenueAmount?.toString() || '');
    if (template.clientId) setClientId(template.clientId);
    if (template.preferredTruckId) setTruckId(template.preferredTruckId);
    if (template.preferredDriverId) setDriverId(template.preferredDriverId);
    setShowTemplates(false);
  };

  const handleDeleteTemplate = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Bu şablonu silmek istediğinizden emin misiniz?')) return;
    await tripTemplateApi.delete(id);
    setTemplates((prev) => prev.filter((t) => t.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fleetId) return;

    setLoading(true);
    setError(null);

    try {
      const selectedClient = clients.find((c) => c.id === clientId);
      const selectedTruck = trucks.find((t) => t.id === truckId);
      const selectedDriver = drivers.find((d) => d.id === driverId);

      await tripApi.createPlanned({
        clientId,
        truckId: truckId || null,
        driverId: driverId || null,
        origin: { city: originCity, address: originAddress },
        destination: { city: destinationCity, address: destinationAddress },
        scheduledPickupDate: pickupDate,
        scheduledDeliveryDate: deliveryDate,
        agreedPrice: revenue ? parseFloat(revenue) : null,
        cargoDescription: cargoDescription || null,
      });

      if (saveAsTemplate && templateName.trim()) {
        await tripTemplateApi.create({
          name: templateName.trim(),
          originCity,
          destinationCity,
          clientId: clientId || undefined,
          clientName: selectedClient?.companyName || undefined,
          cargoDescription: cargoDescription || undefined,
          typicalRevenueAmount: revenue ? parseFloat(revenue) : undefined,
          typicalRevenueCurrency: 'TRY',
          preferredTruckId: truckId || undefined,
          preferredTruckPlate: selectedTruck?.plateNumber || undefined,
          preferredDriverId: driverId || undefined,
          preferredDriverName: selectedDriver ? `${selectedDriver.firstName} ${selectedDriver.lastName}` : undefined,
        });
      }

      navigate('/manager/trips');
    } catch (err: any) {
      setError(err.message || 'Sefer oluşturulurken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 pb-24">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="text-2xl text-gray-600 hover:text-gray-900">←</button>
        <h1 className="text-2xl font-bold text-gray-900">Yeni Sefer</h1>
      </div>

      {/* Template picker */}
      {templates.length > 0 && (
        <div className="mb-4">
          <button
            type="button"
            onClick={() => setShowTemplates(!showTemplates)}
            className="w-full flex items-center justify-between px-4 py-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-700 font-medium hover:bg-blue-100 transition-colors"
          >
            <span>📋 Şablondan Oluştur ({templates.length} şablon)</span>
            <span>{showTemplates ? '▲' : '▼'}</span>
          </button>

          {showTemplates && (
            <div className="mt-2 border border-gray-200 rounded-lg overflow-hidden divide-y divide-gray-100">
              {templates.map((template) => (
                <div
                  key={template.id}
                  onClick={() => applyTemplate(template)}
                  className="flex items-center justify-between p-3 hover:bg-gray-50 cursor-pointer"
                >
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{template.name}</p>
                    <p className="text-xs text-gray-500">
                      {template.originCity} → {template.destinationCity}
                      {template.clientName && ` · ${template.clientName}`}
                      {template.typicalRevenueAmount && ` · ₺${template.typicalRevenueAmount.toLocaleString('tr-TR')}`}
                    </p>
                  </div>
                  <button
                    onClick={(e) => handleDeleteTemplate(template.id, e)}
                    className="text-red-400 hover:text-red-600 text-lg px-2"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Client */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Müşteri *</label>
          <select
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          >
            <option value="">Müşteri seçin</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>{c.companyName}</option>
            ))}
          </select>
        </div>

        {/* Truck */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Araç (Opsiyonel)</label>
          <select
            value={truckId}
            onChange={(e) => setTruckId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          >
            <option value="">Araç seçin (sonra atanabilir)</option>
            {trucks.map((t) => (
              <option key={t.id} value={t.id}>{t.plateNumber} - {t.type}</option>
            ))}
          </select>
        </div>

        {/* Driver */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Sürücü (Opsiyonel)</label>
          <select
            value={driverId}
            onChange={(e) => setDriverId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          >
            <option value="">Sürücü seçin (sonra atanabilir)</option>
            {drivers.map((d) => (
              <option key={d.id} value={d.id}>{d.firstName} {d.lastName}</option>
            ))}
          </select>
        </div>

        {/* Origin */}
        <div className="border border-gray-200 rounded-lg p-4 space-y-3">
          <h3 className="font-semibold text-gray-900">Nereden</h3>
          <div>
            <label className="block text-sm text-gray-700 mb-1">Şehir *</label>
            <input
              type="text" value={originCity} onChange={(e) => setOriginCity(e.target.value)}
              required placeholder="İstanbul"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">Adres *</label>
            <input
              type="text" value={originAddress} onChange={(e) => setOriginAddress(e.target.value)}
              required placeholder="Tam adres"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>

        {/* Destination */}
        <div className="border border-gray-200 rounded-lg p-4 space-y-3">
          <h3 className="font-semibold text-gray-900">Nereye</h3>
          <div>
            <label className="block text-sm text-gray-700 mb-1">Şehir *</label>
            <input
              type="text" value={destinationCity} onChange={(e) => setDestinationCity(e.target.value)}
              required placeholder="Ankara"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">Adres *</label>
            <input
              type="text" value={destinationAddress} onChange={(e) => setDestinationAddress(e.target.value)}
              required placeholder="Tam adres"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>

        {/* Dates */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Yükleme Tarihi *</label>
          <input
            type="date" value={pickupDate} onChange={(e) => setPickupDate(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Teslimat Tarihi *</label>
          <input
            type="date" value={deliveryDate} onChange={(e) => setDeliveryDate(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          />
        </div>

        {/* Revenue */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Ücret (TL)</label>
          <input
            type="number" step="0.01" value={revenue} onChange={(e) => setRevenue(e.target.value)}
            placeholder="0.00"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          />
        </div>

        {/* Cargo */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Yük Açıklaması</label>
          <textarea
            value={cargoDescription} onChange={(e) => setCargoDescription(e.target.value)}
            rows={3} placeholder="Yükün içeriği..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          />
        </div>

        {/* Save as template */}
        <div className="border border-dashed border-gray-300 rounded-lg p-4">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={saveAsTemplate}
              onChange={(e) => setSaveAsTemplate(e.target.checked)}
              className="w-4 h-4 text-primary-600 rounded"
            />
            <span className="text-sm font-medium text-gray-700">Bu seferi şablon olarak kaydet</span>
          </label>
          {saveAsTemplate && (
            <input
              type="text"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              placeholder="Şablon adı (örn: Haftalık İstanbul-Ankara)"
              className="mt-3 w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
            />
          )}
        </div>

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