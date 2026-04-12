import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Truck, Users, ChevronRight } from 'lucide-react';
import { adminApi } from '../services/api';

interface AdminStats {
  totalFleets: number;
  totalTrucks: number;
  totalDrivers: number;
  totalClients: number;
}

interface FleetSummary {
  id: string;
  name: string;
  taxId: string;
  email: string;
  truckCount: number;
  driverCount: number;
  createdAt: string;
}

const AdminDashboardPage = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [fleets, setFleets] = useState<FleetSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [statsData, fleetsData] = await Promise.all([
          adminApi.getStats(),
          adminApi.getFleets(),
        ]);
        setStats(statsData);
        setFleets(fleetsData);
      } catch (err: any) {
        console.error('Error loading admin dashboard:', err);
        setError(err.message ?? 'Veriler yuklenemedi');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="p-4 flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 max-w-4xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <p className="text-sm font-medium text-red-900">{error}</p>
        </div>
      </div>
    );
  }

  const statCards = [
    { label: 'Toplam Filo', count: stats?.totalFleets ?? 0, icon: Building2, color: 'blue' },
    { label: 'Toplam Arac', count: stats?.totalTrucks ?? 0, icon: Truck, color: 'green' },
    { label: 'Toplam Surucu', count: stats?.totalDrivers ?? 0, icon: Users, color: 'orange' },
    { label: 'Toplam Musteri', count: stats?.totalClients ?? 0, icon: Building2, color: 'purple' },
  ];

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('tr-TR');
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="p-4 pb-20 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Yonetim Paneli</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="bg-white rounded-xl shadow-sm p-6 text-left border border-gray-200"
            >
              <div className={`w-14 h-14 rounded-xl flex items-center justify-center mb-3 bg-${card.color}-100 text-${card.color}-600`}>
                <Icon className="w-7 h-7" />
              </div>
              <p className="text-3xl font-bold text-gray-900">{card.count}</p>
              <p className="text-sm text-gray-600 mt-1">{card.label}</p>
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="bg-gray-50 border-b border-gray-200 px-4 py-3 flex items-center gap-2">
          <Building2 className="w-5 h-5 text-gray-600" />
          <h2 className="font-bold text-gray-900">Tum Filolar</h2>
          <span className="ml-auto text-sm text-gray-500 font-medium">
            {fleets.length} filo
          </span>
        </div>

        {fleets.length === 0 ? (
          <div className="p-6 text-center text-gray-500 text-sm">
            Henuz kayitli filo yok.
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {/* Desktop header */}
            <div className="hidden md:grid md:grid-cols-6 gap-4 px-4 py-2 bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              <span>Filo Adi</span>
              <span>Vergi No</span>
              <span>E-posta</span>
              <span className="text-center">Arac</span>
              <span className="text-center">Surucu</span>
              <span>Olusturulma</span>
            </div>
            {fleets.map((fleet) => (
              <button
                key={fleet.id}
                onClick={() => navigate(`/admin/fleets/${fleet.id}`)}
                className="w-full px-4 py-3 text-left hover:bg-gray-50 flex md:grid md:grid-cols-6 gap-4 items-center"
              >
                <div className="flex-1 md:flex-none min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{fleet.name}</p>
                  <p className="text-xs text-gray-500 md:hidden">{fleet.taxId}</p>
                </div>
                <p className="hidden md:block text-sm text-gray-700 truncate">{fleet.taxId}</p>
                <p className="hidden md:block text-sm text-gray-700 truncate">{fleet.email}</p>
                <p className="hidden md:block text-sm text-gray-700 text-center">{fleet.truckCount}</p>
                <p className="hidden md:block text-sm text-gray-700 text-center">{fleet.driverCount}</p>
                <p className="hidden md:block text-sm text-gray-500">{formatDate(fleet.createdAt)}</p>
                <div className="md:hidden flex items-center gap-2 text-sm text-gray-500">
                  <span>{fleet.truckCount} arac</span>
                  <span>·</span>
                  <span>{fleet.driverCount} surucu</span>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0 md:hidden" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboardPage;
