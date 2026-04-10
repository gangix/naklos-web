import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useFleet } from '../contexts/FleetContext';
import { driverApi } from '../services/api';

const MorePage = () => {
  const navigate = useNavigate();
  const { user, loginAsDriver, loginAsManager } = useAuth();
  const { fleetId } = useFleet();
  const [drivers, setDrivers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDriverList, setShowDriverList] = useState(false);

  useEffect(() => {
    if (fleetId) {
      loadDrivers();
    }
  }, [fleetId]);

  const loadDrivers = async () => {
    if (!fleetId) return;
    try {
      setLoading(true);
      const data = await driverApi.getByFleet();
      setDrivers(data);
    } catch (error) {
      console.error('Error loading drivers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDriverSelect = (driver: any) => {
    loginAsDriver(driver.id, `${driver.firstName} ${driver.lastName}`);
    setShowDriverList(false);
    alert(`✓ ${driver.firstName} ${driver.lastName} olarak giriş yaptınız`);
  };

  const handleManagerLogin = () => {
    loginAsManager();
    setShowDriverList(false);
    alert('✓ Fleet Manager olarak giriş yaptınız');
  };

  const menuItems = [
    {
      icon: '👤',
      title: 'Sürücüler',
      description: 'Sürücü listesi ve belgeler',
      path: '/manager/drivers',
      color: 'bg-green-100',
    },
    {
      icon: '💰',
      title: 'Ödemeler',
      description: 'Faturalar ve tahsilatlar',
      path: '/manager/invoices',
      color: 'bg-purple-100',
    },
    {
      icon: '👥',
      title: 'Müşteriler',
      description: 'Müşteri listesi ve ödeme durumu',
      path: '/manager/clients',
      color: 'bg-blue-100',
    },
  ];

  return (
    <div className="p-4 pb-20">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Diğer</h1>
        <div className="flex items-center justify-between mt-2">
          <div>
            <p className="text-sm text-gray-600">Giriş: <span className="font-medium">{user?.name}</span></p>
            <p className="text-xs text-gray-500">Rol: {user?.role === 'driver' ? 'Sürücü' : 'Yönetici'}</p>
          </div>
          <button
            onClick={() => setShowDriverList(!showDriverList)}
            className="px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
          >
            {showDriverList ? 'Kapat' : 'Kullanıcı Değiştir'}
          </button>
        </div>
      </div>

      {/* Developer Login Panel */}
      {showDriverList && (
        <div className="mb-6 bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
            <h2 className="font-bold text-gray-900">🔧 Geliştirici Girişi</h2>
            <p className="text-xs text-gray-600 mt-1">Test için herhangi bir kullanıcı olarak giriş yapın</p>
          </div>

          <div className="p-4 space-y-2 max-h-96 overflow-y-auto">
            {/* Manager Option */}
            <button
              onClick={handleManagerLogin}
              className={`w-full p-3 rounded-lg text-left transition-colors ${
                user?.role === 'fleet-manager'
                  ? 'bg-blue-100 border-2 border-blue-600'
                  : 'bg-gray-50 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">Fleet Manager</p>
                  <p className="text-xs text-gray-600">Yönetici Hesabı</p>
                </div>
                {user?.role === 'fleet-manager' && (
                  <span className="text-blue-600 font-bold">✓</span>
                )}
              </div>
            </button>

            {/* Drivers List */}
            {loading ? (
              <div className="text-center py-4 text-gray-600">Yükleniyor...</div>
            ) : drivers.length === 0 ? (
              <div className="text-center py-4 text-gray-600">
                Sürücü bulunamadı. Önce sürücü ekleyin.
              </div>
            ) : (
              drivers.map((driver) => (
                <button
                  key={driver.id}
                  onClick={() => handleDriverSelect(driver)}
                  className={`w-full p-3 rounded-lg text-left transition-colors ${
                    user?.driverId === driver.id
                      ? 'bg-green-100 border-2 border-green-600'
                      : 'bg-gray-50 hover:bg-gray-100 border border-gray-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">
                        {driver.firstName} {driver.lastName}
                      </p>
                      <p className="text-xs text-gray-600">{driver.phone}</p>
                      <p className="text-xs text-gray-500 font-mono mt-1">ID: {driver.id.substring(0, 8)}...</p>
                    </div>
                    {user?.driverId === driver.id && (
                      <span className="text-green-600 font-bold">✓</span>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {/* Menu Items */}
      <div className="space-y-3">
        {menuItems.map((item) => (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className="w-full bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow text-left"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 ${item.color} rounded-lg flex items-center justify-center text-2xl`}>
                  {item.icon}
                </div>
                <div>
                  <p className="font-bold text-gray-900">{item.title}</p>
                  <p className="text-sm text-gray-600">{item.description}</p>
                </div>
              </div>
              <span className="text-gray-400 text-xl">›</span>
            </div>
          </button>
        ))}
      </div>

      {/* App Info */}
      <div className="mt-8 p-4 bg-gray-50 rounded-lg">
        <p className="text-xs text-gray-600 text-center">
          Naklos Filo Yönetimi
        </p>
        <p className="text-xs text-gray-500 text-center mt-1">
          Versiyon 1.0.0 (Development Mode)
        </p>
        {user?.driverId && (
          <p className="text-xs text-gray-400 text-center mt-2 font-mono">
            Driver UUID: {user.driverId}
          </p>
        )}
      </div>
    </div>
  );
};

export default MorePage;
