import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { User, Users, Wrench } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useFleet } from '../contexts/FleetContext';
import { driverApi, fleetApi } from '../services/api';

const MorePage = () => {
  const navigate = useNavigate();
  const { user, loginAsDriver, loginAsManager } = useAuth();
  const { fleetId } = useFleet();
  const [drivers, setDrivers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDriverList, setShowDriverList] = useState(false);

  // Fleet settings state
  const [fleetData, setFleetData] = useState<any>(null);
  const [fleetName, setFleetName] = useState('');
  const [fleetEmail, setFleetEmail] = useState('');
  const [fleetPhone, setFleetPhone] = useState('');
  const [fleetCurrency, setFleetCurrency] = useState('TRY');
  const [fleetSaving, setFleetSaving] = useState(false);

  useEffect(() => {
    if (fleetId) {
      loadDrivers();
      loadFleet();
    }
  }, [fleetId]);

  const loadDrivers = async () => {
    if (!fleetId) return;
    try {
      setLoading(true);
      const page = await driverApi.getByFleet(0, 1000);
      setDrivers(page.content);
    } catch (error) {
      console.error('Error loading drivers:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadFleet = async () => {
    try {
      const data = await fleetApi.getMy();
      setFleetData(data);
      setFleetName(data.name || '');
      setFleetEmail(data.email || '');
      setFleetPhone(data.phone || '');
      setFleetCurrency(data.currency || 'TRY');
    } catch (error) {
      console.error('Error loading fleet:', error);
    }
  };

  const handleFleetSave = async () => {
    if (!fleetData?.id) return;
    try {
      setFleetSaving(true);
      await fleetApi.update(fleetData.id, {
        name: fleetName,
        address: fleetData.address,
        email: fleetEmail,
        phone: fleetPhone,
      });
      if (fleetCurrency !== fleetData.currency) {
        await fleetApi.changeCurrency(fleetData.id, fleetCurrency);
      }
      await loadFleet();
      toast.success('Filo ayarları kaydedildi');
    } catch (error) {
      console.error('Error saving fleet:', error);
      toast.error('Kayıt sırasında hata oluştu');
    } finally {
      setFleetSaving(false);
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
      icon: <User className="w-6 h-6 text-green-600" />,
      title: 'Sürücüler',
      description: 'Sürücü listesi ve belgeler',
      path: '/manager/drivers',
      color: 'bg-green-100',
    },
    {
      icon: <Users className="w-6 h-6 text-blue-600" />,
      title: 'Müşteriler',
      description: 'Müşteri listesi',
      path: '/manager/clients',
      color: 'bg-blue-100',
    },
  ];

  return (
    <div className="p-4 pb-20">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Diğer</h1>
        <div className="flex items-center justify-between mt-2">
          <div>
            <p className="text-sm text-gray-600">Giriş: <span className="font-medium">{user?.name}</span></p>
            <p className="text-xs text-gray-500">Rol: {user?.role === 'driver' ? 'Sürücü' : 'Yönetici'}</p>
          </div>
          {import.meta.env.DEV && (
            <button
              onClick={() => setShowDriverList(!showDriverList)}
              className="px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
            >
              {showDriverList ? 'Kapat' : 'Kullanıcı Değiştir'}
            </button>
          )}
        </div>
      </div>

      {/* Fleet Settings */}
      {fleetData && (
        <div className="mb-6 bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
            <h2 className="font-bold text-gray-900">Filo Ayarları</h2>
          </div>
          <div className="p-4 space-y-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Filo Adı</label>
              <input
                type="text"
                value={fleetName}
                onChange={(e) => setFleetName(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Filo İletişim E-postası</label>
              <input
                type="email"
                value={fleetEmail}
                onChange={(e) => setFleetEmail(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <p className="text-xs text-gray-400 mt-1">
                Belge uyarıları ve bildirimler bu adrese gönderilir. Giriş e-postanızı etkilemez.
              </p>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Telefon</label>
              <input
                type="tel"
                value={fleetPhone}
                onChange={(e) => setFleetPhone(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Para Birimi</label>
              <select
                value={fleetCurrency}
                onChange={(e) => setFleetCurrency(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="TRY">TRY</option>
                <option value="EUR">EUR</option>
                <option value="USD">USD</option>
                <option value="GBP">GBP</option>
              </select>
            </div>
            <button
              onClick={handleFleetSave}
              disabled={fleetSaving}
              className="w-full py-2 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 text-sm"
            >
              {fleetSaving ? 'Kaydediliyor...' : 'Kaydet'}
            </button>
          </div>
        </div>
      )}

      {/* Developer Login Panel — only in development */}
      {showDriverList && import.meta.env.DEV && (
        <div className="mb-6 bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
            <h2 className="font-bold text-gray-900 flex items-center gap-1.5"><Wrench className="w-4 h-4" /> Geliştirici Girişi</h2>
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
                <div className={`w-12 h-12 ${item.color} rounded-lg flex items-center justify-center`}>
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
