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
    licenseExpiryDate: '',
    temporaryPassword: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { licenseExpiryDate, ...registerPayload } = formData;
      const created = await driverApi.register({
        ...registerPayload,
        temporaryPassword: formData.temporaryPassword || undefined,
      }) as { id: string };

      // Backend Driver.register() doesn't take expiryDate — it's set via a
      // separate mutator. Send it immediately after register so the fresh
      // driver doesn't flash MISSING_DOCS on the dashboard between registration
      // and the manager navigating to the detail page to fill it in. Failure
      // here is non-fatal: the driver exists, manager can set expiry later.
      if (licenseExpiryDate && created?.id) {
        try {
          await driverApi.updateLicense(created.id, licenseExpiryDate);
        } catch (err) {
          console.error('License expiry post-register update failed', err);
        }
      }

      // Reset form and close
      setFormData({
        firstName: '',
        lastName: '',
        phone: '',
        email: '',
        licenseNumber: '',
        licenseClass: 'C',
        licenseExpiryDate: '',
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
              <p className="text-red-700 text-sm whitespace-pre-line">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <TextInput
                label={t('addDriver.firstName')}
                required
                type="text"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                placeholder={t('addDriver.firstNamePlaceholder')}
              />
              <TextInput
                label={t('addDriver.lastName')}
                required
                type="text"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                placeholder={t('addDriver.lastNamePlaceholder')}
              />
            </div>

            <TextInput
              label={t('addDriver.phone')}
              required
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder={t('addDriver.phonePlaceholder')}
              hint={t('addDriver.phoneHint')}
            />

            <TextInput
              label={t('addDriver.email')}
              required
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder={t('addDriver.emailPlaceholder')}
            />

            <TextInput
              label={t('addDriver.licenseNumber')}
              required
              type="text"
              value={formData.licenseNumber}
              onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
              placeholder={t('addDriver.licenseNumberPlaceholder')}
            />

            <Select
              label={t('addDriver.licenseClass')}
              value={formData.licenseClass}
              onChange={(e) => setFormData({ ...formData, licenseClass: e.target.value })}
            >
              <option value="B">{t('addDriver.classB')}</option>
              <option value="C">{t('addDriver.classC')}</option>
              <option value="C1">{t('addDriver.classC1')}</option>
              <option value="CE">{t('addDriver.classCE')}</option>
              <option value="C1E">{t('addDriver.classC1E')}</option>
              <option value="D">{t('addDriver.classD')}</option>
              <option value="DE">{t('addDriver.classDE')}</option>
            </Select>

            <TextInput
              label={t('addDriver.licenseExpiryDate')}
              type="date"
              value={formData.licenseExpiryDate}
              onChange={(e) => setFormData({ ...formData, licenseExpiryDate: e.target.value })}
              min={new Date().toISOString().split('T')[0]}
              hint={t('addDriver.licenseExpiryHint')}
            />

            <TextInput
              label={t('addDriver.tempPassword')}
              type="password"
              minLength={8}
              value={formData.temporaryPassword}
              onChange={(e) => setFormData({ ...formData, temporaryPassword: e.target.value })}
              placeholder={t('addDriver.tempPasswordPlaceholder')}
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
