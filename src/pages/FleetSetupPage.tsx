import { useState } from 'react';
import { Link } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useFleet } from '../contexts/FleetContext';
import { useAuth } from '../contexts/AuthContext';
import { fleetApi } from '../services/api';
import keycloak from '../auth/keycloak';
import { Checkbox, Select, TextInput } from '../components/common/FormField';

const TERMS_VERSION = '2026-04-11';

const FleetSetupPage = () => {
  const { t } = useTranslation();
  const { setFleetId } = useFleet();
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    taxId: '',
    email: '',
    phone: '',
    defaultCurrency: 'TRY',
    address: {
      street: '',
      city: '',
      postalCode: '',
      country: 'TR',
      region: ''
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!termsAccepted) {
      setError(t('fleetSetup.mustAcceptTerms'));
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const payload = { ...formData, termsAcceptedVersion: TERMS_VERSION };
      const result: any = await fleetApi.create(payload);
      if (result.id) {
        setFleetId(result.id);
        // Force-refresh the Keycloak token so the fleet_manager role that
        // the backend just assigned is reflected in the new access token.
        await keycloak.updateToken(-1).catch(() => keycloak.logout());
        window.location.reload();
      }
    } catch (err) {
      console.error('Error creating fleet:', err);
      setError(err instanceof Error ? err.message : 'Failed to create fleet');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-xl shadow-lg p-8">
        <div className="flex items-start justify-between mb-6">
          <div className="flex-1 text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('fleetSetup.welcome')}</h1>
            <p className="text-gray-600">{t('fleetSetup.subtitle')}</p>
            {user?.name && (
              <p className="text-xs text-gray-500 mt-2">{t('fleetSetup.loggedInAs', { name: user.name })}</p>
            )}
          </div>
          <button
            type="button"
            onClick={logout}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            title={t('fleetSetup.logoutAriaLabel')}
          >
            <LogOut className="w-4 h-4" />
            <span>{t('common.logout')}</span>
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Company Info */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('fleetSetup.companyInfo')}</h2>
            <div className="space-y-4">
              <TextInput
                label={t('fleetSetup.companyName')}
                required
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder={t('fleetSetup.companyNamePlaceholder')}
              />
              <TextInput
                label={t('fleetSetup.taxId')}
                required
                type="text"
                value={formData.taxId}
                onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
                placeholder={t('fleetSetup.taxIdPlaceholder')}
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <TextInput
                  label={t('fleetSetup.email')}
                  required
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder={t('fleetSetup.emailPlaceholder')}
                />
                <TextInput
                  label={t('fleetSetup.phone')}
                  required
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder={t('fleetSetup.phonePlaceholder')}
                />
              </div>
              <Select
                label={t('fleetSetup.currency')}
                required
                value={formData.defaultCurrency}
                onChange={(e) => setFormData({ ...formData, defaultCurrency: e.target.value })}
              >
                <option value="TRY">TRY (₺)</option>
                <option value="EUR">EUR (€)</option>
                <option value="USD">USD ($)</option>
                <option value="GBP">GBP (£)</option>
              </Select>
            </div>
          </div>

          {/* Address */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('fleetSetup.addressInfo')}</h2>
            <div className="space-y-4">
              <TextInput
                label={t('fleetSetup.street')}
                type="text"
                value={formData.address.street}
                onChange={(e) => setFormData({
                  ...formData,
                  address: { ...formData.address, street: e.target.value }
                })}
                placeholder={t('fleetSetup.streetPlaceholder')}
              />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <TextInput
                  label={t('fleetSetup.city')}
                  type="text"
                  value={formData.address.city}
                  onChange={(e) => setFormData({
                    ...formData,
                    address: { ...formData.address, city: e.target.value }
                  })}
                  placeholder={t('fleetSetup.cityPlaceholder')}
                />
                <TextInput
                  label={t('fleetSetup.postalCode')}
                  type="text"
                  value={formData.address.postalCode}
                  onChange={(e) => setFormData({
                    ...formData,
                    address: { ...formData.address, postalCode: e.target.value }
                  })}
                  placeholder={t('fleetSetup.postalCodePlaceholder')}
                />
                <TextInput
                  label={t('fleetSetup.region')}
                  type="text"
                  value={formData.address.region}
                  onChange={(e) => setFormData({
                    ...formData,
                    address: { ...formData.address, region: e.target.value }
                  })}
                  placeholder={t('fleetSetup.regionPlaceholder')}
                />
              </div>
            </div>
          </div>

          {/* Terms acceptance */}
          <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
            <Checkbox
              checked={termsAccepted}
              onChange={setTermsAccepted}
              align="start"
              label={
                <>
                  <Link to="/terms" target="_blank" className="text-primary-600 font-medium underline">
                    {t('fleetSetup.termsOfService')}
                  </Link>
                  {' '}&{' '}
                  <Link to="/privacy" target="_blank" className="text-primary-600 font-medium underline">
                    {t('fleetSetup.privacyPolicy')}
                  </Link>
                  {t('fleetSetup.agreementSuffix')}
                </>
              }
            />
          </div>

          <button
            type="submit"
            disabled={loading || !termsAccepted}
            className="w-full bg-primary-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? t('fleetSetup.creating') : t('fleetSetup.createButton')}
          </button>
        </form>

        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            {t('fleetSetup.tip')}
          </p>
        </div>
      </div>
    </div>
  );
};

export default FleetSetupPage;
