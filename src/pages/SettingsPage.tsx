import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Wrench } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useFleet } from '../contexts/FleetContext';
import { driverApi, fleetApi } from '../services/api';
import { Select, TextInput } from '../components/common/FormField';

const SettingsPage = () => {
  const { t, i18n } = useTranslation();
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
      setFleetCurrency((data as { defaultCurrency?: string }).defaultCurrency || 'TRY');
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
      toast.success(t('toast.success.fleetSettings'));
    } catch (error) {
      console.error('Error saving fleet:', error);
      toast.error(t('toast.error.saveError'));
    } finally {
      setFleetSaving(false);
    }
  };

  const handleLanguageChange = async (locale: string) => {
    try {
      await driverApi.updateLocale(locale);
      i18n.changeLanguage(locale);
      toast.success(t('toast.success.languageUpdated'));
    } catch {
      toast.error(t('toast.error.generic'));
    }
  };

  const handleDriverSelect = (driver: any) => {
    loginAsDriver(driver.id, `${driver.firstName} ${driver.lastName}`);
    setShowDriverList(false);
    alert(`${driver.firstName} ${driver.lastName}`);
  };

  const handleManagerLogin = () => {
    loginAsManager();
    setShowDriverList(false);
    alert('Fleet Manager');
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">{t('morePage.title')}</h1>
        <div className="flex items-center justify-between mt-2">
          <div>
            <p className="text-sm text-gray-600">{t('morePage.loggedIn')}: <span className="font-medium">{user?.name}</span></p>
            <p className="text-xs text-gray-500">{t('morePage.role')}: {user?.role === 'driver' ? t('morePage.roleDriver') : t('morePage.roleManager')}</p>
          </div>
          {import.meta.env.DEV && (
            <button
              onClick={() => setShowDriverList(!showDriverList)}
              className="px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
            >
              {showDriverList ? t('morePage.close') : t('morePage.switchUser')}
            </button>
          )}
        </div>
      </div>

      {/* Fleet Settings */}
      {fleetData && (
        <div className="mb-6 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
            <h2 className="font-bold text-gray-900">{t('morePage.fleetSettings')}</h2>
          </div>
          <div className="p-5 space-y-4">
            <TextInput
              label={t('morePage.fleetName')}
              type="text"
              value={fleetName}
              onChange={(e) => setFleetName(e.target.value)}
            />
            <TextInput
              label={t('morePage.fleetEmail')}
              type="email"
              value={fleetEmail}
              onChange={(e) => setFleetEmail(e.target.value)}
              hint={t('morePage.fleetEmailHint')}
            />
            <TextInput
              label={t('morePage.phone')}
              type="tel"
              value={fleetPhone}
              onChange={(e) => setFleetPhone(e.target.value)}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select
                label={t('morePage.currency')}
                value={fleetCurrency}
                onChange={(e) => setFleetCurrency(e.target.value)}
              >
                <option value="TRY">TRY (₺)</option>
                <option value="EUR">EUR (€)</option>
                <option value="USD">USD ($)</option>
                <option value="GBP">GBP (£)</option>
              </Select>
              <Select
                label={t('morePage.language')}
                value={i18n.language}
                onChange={(e) => handleLanguageChange(e.target.value)}
              >
                <option value="tr">Türkçe</option>
                <option value="en">English</option>
                <option value="de">Deutsch</option>
              </Select>
            </div>
            <div className="pt-2">
              <button
                onClick={handleFleetSave}
                disabled={fleetSaving}
                className="w-full py-2.5 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 text-sm"
              >
                {fleetSaving ? t('morePage.saving') : t('morePage.save')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Developer Login Panel — only in development */}
      {showDriverList && import.meta.env.DEV && (
        <div className="mb-6 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
            <h2 className="font-bold text-gray-900 flex items-center gap-1.5"><Wrench className="w-4 h-4" /> {t('morePage.developerLogin')}</h2>
            <p className="text-xs text-gray-600 mt-1">{t('driverProfile.devTestHint')}</p>
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
                  <p className="text-xs text-gray-600">{t('driverProfile.managerAccount')}</p>
                </div>
                {user?.role === 'fleet-manager' && (
                  <span className="text-blue-600 font-bold">✓</span>
                )}
              </div>
            </button>

            {/* Drivers List */}
            {loading ? (
              <div className="text-center py-4 text-gray-600">{t('common.loading')}</div>
            ) : drivers.length === 0 ? (
              <div className="text-center py-4 text-gray-600">
                {t('driverProfile.noDriversFound')}
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

      {/* App Info */}
      <div className="mt-8 p-4 bg-gray-50 rounded-xl">
        <p className="text-xs text-gray-600 text-center">
          {t('morePage.appInfo')}
        </p>
        <p className="text-xs text-gray-500 text-center mt-1">
          {t('morePage.version')}
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

export default SettingsPage;
