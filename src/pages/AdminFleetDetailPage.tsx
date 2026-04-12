import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Truck, Users } from 'lucide-react';
import { toast } from 'sonner';
import { adminApi } from '../services/api';

interface FleetDetail {
  id: string;
  name: string;
  email: string;
  phone: string;
  taxId: string;
  plan?: string;
  trucks: Array<{
    id: string;
    plateNumber: string;
    type: string;
    status: string;
    assignedDriverName: string | null;
  }>;
  drivers: Array<{
    id: string;
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
    status: string;
    assignedTruckPlate: string | null;
  }>;
}

const statusLabel = (status: string): string => {
  const map: Record<string, string> = {
    AVAILABLE: 'Müsait',
    IN_TRANSIT: 'Yolda',
    ON_LEAVE: 'İzinli',
    MAINTENANCE: 'Bakımda',
    INACTIVE: 'Pasif',
    ACTIVE: 'Aktif',
  };
  return map[status] ?? status;
};

const statusColor = (status: string): string => {
  switch (status) {
    case 'AVAILABLE':
    case 'ACTIVE':
      return 'bg-green-100 text-green-800';
    case 'IN_TRANSIT':
      return 'bg-blue-100 text-blue-800';
    case 'MAINTENANCE':
    case 'ON_LEAVE':
      return 'bg-yellow-100 text-yellow-800';
    case 'INACTIVE':
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const AdminFleetDetailPage = () => {
  const { fleetId } = useParams<{ fleetId: string }>();
  const navigate = useNavigate();
  const [fleet, setFleet] = useState<FleetDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadFleet = async () => {
    if (!fleetId) return;
    try {
      setLoading(true);
      const data = await adminApi.getFleetDetails(fleetId);
      setFleet(data);
    } catch (err: any) {
      console.error('Error loading fleet details:', err);
      setError(err.message ?? 'Filo detaylari yuklenemedi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFleet();
  }, [fleetId]);

  if (loading) {
    return (
      <div className="p-4 flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    );
  }

  if (error || !fleet) {
    return (
      <div className="p-4 max-w-4xl mx-auto">
        <button
          onClick={() => navigate('/admin')}
          className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Geri Dön
        </button>
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <p className="text-sm font-medium text-red-900">{error ?? 'Filo bulunamadi'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 pb-20 max-w-6xl mx-auto">
      <button
        onClick={() => navigate('/admin')}
        className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 mb-4"
      >
        <ArrowLeft className="w-4 h-4" />
        Geri Dön
      </button>

      {/* Fleet Info Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">{fleet.name}</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-500">E-posta:</span>{' '}
            <span className="text-gray-900">{fleet.email || '-'}</span>
          </div>
          <div>
            <span className="text-gray-500">Telefon:</span>{' '}
            <span className="text-gray-900">{fleet.phone || '-'}</span>
          </div>
          <div>
            <span className="text-gray-500">Vergi No:</span>{' '}
            <span className="text-gray-900">{fleet.taxId || '-'}</span>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Plan</p>
            <select
              value={fleet.plan || 'FREE'}
              onChange={async (e) => {
                try {
                  await adminApi.changePlan(fleetId!, e.target.value);
                  toast.success('Plan güncellendi');
                  loadFleet();
                } catch (err) {
                  toast.error('Plan güncellenirken hata oluştu');
                }
              }}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm font-medium"
            >
              <option value="FREE">Başlangıç (Ücretsiz)</option>
              <option value="PROFESSIONAL">Profesyonel (499 TL/ay)</option>
              <option value="BUSINESS">İşletme (999 TL/ay)</option>
              <option value="ENTERPRISE">Kurumsal</option>
            </select>
          </div>
        </div>
      </div>

      {/* Trucks Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
        <div className="bg-gray-50 border-b border-gray-200 px-4 py-3 flex items-center gap-2">
          <Truck className="w-5 h-5 text-gray-600" />
          <h2 className="font-bold text-gray-900">Araçlar</h2>
          <span className="ml-auto text-sm text-gray-500 font-medium">
            {fleet.trucks.length} arac
          </span>
        </div>
        {fleet.trucks.length === 0 ? (
          <div className="p-6 text-center text-gray-500 text-sm">
            Bu filoda kayitli arac yok.
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            <div className="hidden md:grid md:grid-cols-4 gap-4 px-4 py-2 bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              <span>Plaka</span>
              <span>Tip</span>
              <span>Durum</span>
              <span>Atanmış Sürücü</span>
            </div>
            {fleet.trucks.map((truck) => (
              <div key={truck.id} className="px-4 py-3 md:grid md:grid-cols-4 gap-4 items-center">
                <p className="text-sm font-semibold text-gray-900">{truck.plateNumber}</p>
                <p className="text-sm text-gray-700">{truck.type || '-'}</p>
                <div>
                  <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${statusColor(truck.status)}`}>
                    {statusLabel(truck.status)}
                  </span>
                </div>
                <p className="text-sm text-gray-700">{truck.assignedDriverName || '-'}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Drivers Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="bg-gray-50 border-b border-gray-200 px-4 py-3 flex items-center gap-2">
          <Users className="w-5 h-5 text-gray-600" />
          <h2 className="font-bold text-gray-900">Sürücüler</h2>
          <span className="ml-auto text-sm text-gray-500 font-medium">
            {fleet.drivers.length} surucu
          </span>
        </div>
        {fleet.drivers.length === 0 ? (
          <div className="p-6 text-center text-gray-500 text-sm">
            Bu filoda kayitli surucu yok.
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            <div className="hidden md:grid md:grid-cols-5 gap-4 px-4 py-2 bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              <span>Ad Soyad</span>
              <span>Telefon</span>
              <span>E-posta</span>
              <span>Durum</span>
              <span>Atanmış Araç</span>
            </div>
            {fleet.drivers.map((driver) => (
              <div key={driver.id} className="px-4 py-3 md:grid md:grid-cols-5 gap-4 items-center">
                <p className="text-sm font-semibold text-gray-900">
                  {driver.firstName} {driver.lastName}
                </p>
                <p className="text-sm text-gray-700">{driver.phone || '-'}</p>
                <p className="text-sm text-gray-700 truncate">{driver.email || '-'}</p>
                <div>
                  <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${statusColor(driver.status)}`}>
                    {statusLabel(driver.status)}
                  </span>
                </div>
                <p className="text-sm text-gray-700">{driver.assignedTruckPlate || '-'}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminFleetDetailPage;
