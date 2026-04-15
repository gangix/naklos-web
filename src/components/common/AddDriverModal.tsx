import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useFleet } from '../../contexts/FleetContext';
import { driverApi } from '../../services/api';
import { Select, TextInput } from './FormField';

interface AddDriverModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const AddDriverModal = ({ isOpen, onClose, onSuccess }: AddDriverModalProps) => {
  const { t } = useTranslation();
  useFleet();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    licenseNumber: '',
    licenseClass: 'C',
    temporaryPassword: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await driverApi.register({
        ...formData,
        temporaryPassword: formData.temporaryPassword || undefined,
      });

      // Reset form and close
      setFormData({
        firstName: '',
        lastName: '',
        phone: '',
        email: '',
        licenseNumber: '',
        licenseClass: 'C',
        temporaryPassword: '',
      });
      onSuccess();
      onClose();
    } catch (err) {
      console.error('Error creating driver:', err);
      setError(err instanceof Error ? err.message : t('addDriver.errorAddingDriver'));
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
            <h2 className="text-xl font-bold text-gray-900">{t('addDriver.title')}</h2>
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
            <div className="grid grid-cols-2 gap-4">
              <TextInput
                label="Ad"
                required
                type="text"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                placeholder="Ahmet"
              />
              <TextInput
                label="Soyad"
                required
                type="text"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                placeholder={t('addDriver.lastNamePlaceholder')}
              />
            </div>

            <TextInput
              label="Telefon"
              required
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="+90 555 123 4567"
            />

            <TextInput
              label="E-posta"
              required
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="ahmet@example.com"
            />

            <TextInput
              label="Ehliyet No"
              required
              type="text"
              value={formData.licenseNumber}
              onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
              placeholder="12345678901"
            />

            <Select
              label={t('addDriver.licenseClass')}
              value={formData.licenseClass}
              onChange={(e) => setFormData({ ...formData, licenseClass: e.target.value })}
            >
              <option value="B">B (Otomobil)</option>
              <option value="C">C (Kamyon)</option>
              <option value="C1">{t('addDriver.classC1')}</option>
              <option value="CE">{t('addDriver.classCE')}</option>
              <option value="C1E">{t('addDriver.classC1E')}</option>
              <option value="D">{t('addDriver.classD')}</option>
              <option value="DE">{t('addDriver.classDE')}</option>
            </Select>

            <TextInput
              label={t('addDriver.tempPassword')}
              type="password"
              minLength={8}
              value={formData.temporaryPassword}
              onChange={(e) => setFormData({ ...formData, temporaryPassword: e.target.value })}
              placeholder="En az 8 karakter"
              hint={t('addDriver.tempPasswordHint')}
            />

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
                {loading ? t('addDriver.addingDriver') : t('addDriver.addDriverButton')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddDriverModal;
