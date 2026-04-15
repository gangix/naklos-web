import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useFleet } from '../../contexts/FleetContext';
import { clientApi } from '../../services/api';
import { Select, TextInput } from './FormField';

interface AddClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const AddClientModal = ({ isOpen, onClose, onSuccess }: AddClientModalProps) => {
  const { t } = useTranslation();
  const { fleetId, fleet } = useFleet();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    companyName: '',
    taxId: '',
    email: '',
    phone: '',
    paymentTerms: 'NET_30',
    preferredCurrency: fleet?.defaultCurrency || 'TRY',
    address: {
      street: '',
      city: '',
      postalCode: '',
      country: 'TR',
      region: '',
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await clientApi.add({
        ...formData,
        fleetId,
      });

      // Reset form and close
      setFormData({
        companyName: '',
        taxId: '',
        email: '',
        phone: '',
        paymentTerms: 'NET_30',
        preferredCurrency: fleet?.defaultCurrency || 'TRY',
        address: {
          street: '',
          city: '',
          postalCode: '',
          country: 'TR',
          region: '',
        },
      });
      onSuccess();
      onClose();
    } catch (err) {
      console.error('Error creating client:', err);
      setError(err instanceof Error ? err.message : t('addClient.errorAddingClient'));
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">{t('addClient.title')}</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <TextInput
              label={t('addClient.companyName')}
              required
              type="text"
              value={formData.companyName}
              onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
              placeholder={t('addClient.companyNamePlaceholder')}
            />

            <TextInput
              label={t('addClient.taxId')}
              required
              type="text"
              value={formData.taxId}
              onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
              placeholder="1234567890"
            />

            <div className="grid grid-cols-2 gap-4">
              <TextInput
                label="E-posta"
                required
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="info@firma.com"
              />
              <TextInput
                label="Telefon"
                required
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+90 555 123 4567"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Adres *
              </label>
              <TextInput
                required
                type="text"
                value={formData.address.street}
                onChange={(e) => setFormData({
                  ...formData,
                  address: { ...formData.address, street: e.target.value }
                })}
                placeholder="Sokak/Cadde"
                wrapperClassName="mb-2"
              />
              <div className="grid grid-cols-2 gap-2">
                <TextInput
                  required
                  type="text"
                  value={formData.address.city}
                  onChange={(e) => setFormData({
                    ...formData,
                    address: { ...formData.address, city: e.target.value }
                  })}
                  placeholder={t('addClient.cityPlaceholder')}
                />
                <TextInput
                  type="text"
                  value={formData.address.postalCode}
                  onChange={(e) => setFormData({
                    ...formData,
                    address: { ...formData.address, postalCode: e.target.value }
                  })}
                  placeholder="Posta Kodu"
                />
              </div>
            </div>

            <Select
              label={t('addClient.paymentTerms')}
              value={formData.paymentTerms}
              onChange={(e) => setFormData({ ...formData, paymentTerms: e.target.value })}
            >
              <option value="NET_0">{t('addClient.termCash')}</option>
              <option value="NET_30">{t('addClient.term30')}</option>
              <option value="NET_60">{t('addClient.term60')}</option>
              <option value="NET_90">{t('addClient.term90')}</option>
            </Select>

            <Select
              label="Para Birimi"
              required
              value={formData.preferredCurrency}
              onChange={(e) => setFormData({ ...formData, preferredCurrency: e.target.value })}
            >
              <option value="TRY">TRY (₺)</option>
              <option value="EUR">EUR (€)</option>
              <option value="USD">USD ($)</option>
              <option value="GBP">GBP (£)</option>
            </Select>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                {t('common.cancel')}
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? t('addClient.addingClient') : t('addClient.addClientButton')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddClientModal;
