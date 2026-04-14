import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useFleet } from '../../contexts/FleetContext';
import { truckApi } from '../../services/api';

interface AddTruckModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

// Labels resolved via t(`truckType.${value}`) at render so they follow the
// active language. Capacity ton values come from shared/enums/TruckType.java.
const truckTypes = [
  { value: 'VAN',           capacity: 1500 },
  { value: 'PICKUP',        capacity: 1000 },
  { value: 'SMALL_TRUCK',   capacity: 3500 },
  { value: 'MEDIUM_TRUCK',  capacity: 7500 },
  { value: 'LARGE_TRUCK',   capacity: 24000 },
  { value: 'TIR',           capacity: 40000 },
  { value: 'FLATBED',       capacity: 20000 },
  { value: 'TIPPER',        capacity: 25000 },
  { value: 'REFRIGERATED',  capacity: 20000 },
  { value: 'TANKER',        capacity: 30000 },
];

const AddTruckModal = ({ isOpen, onClose, onSuccess }: AddTruckModalProps) => {
  const { t } = useTranslation();
  const { fleetId } = useFleet();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    plateNumber: '',
    type: 'SMALL_TRUCK',
    capacityKg: 3500,
    cargoVolumeM3: 20,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await truckApi.register({
        ...formData,
        fleetId,
      });

      // Reset form and close
      setFormData({
        plateNumber: '',
        type: 'SMALL_TRUCK',
        capacityKg: 3500,
        cargoVolumeM3: 20,
      });
      onSuccess();
      onClose();
    } catch (err) {
      console.error('Error creating truck:', err);
      setError(err instanceof Error ? err.message : t('addTruck.errorAddingTruck'));
    } finally {
      setLoading(false);
    }
  };

  const handleTypeChange = (type: string) => {
    const truckType = truckTypes.find(t => t.value === type);
    setFormData({
      ...formData,
      type,
      capacityKg: truckType?.capacity || 3500,
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">{t('addTruck.title')}</h2>
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
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Plaka *
              </label>
              <input
                type="text"
                required
                value={formData.plateNumber}
                onChange={(e) => setFormData({ ...formData, plateNumber: e.target.value.toUpperCase() })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="34 ABC 123"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('addTruck.truckType')}
              </label>
              <select
                value={formData.type}
                onChange={(e) => handleTypeChange(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                {truckTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {t(`truckType.${type.value}`)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Kapasite (kg) *
              </label>
              <input
                type="number"
                required
                min="1"
                value={formData.capacityKg}
                onChange={(e) => setFormData({ ...formData, capacityKg: Number(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Hacim (m³)
              </label>
              <input
                type="number"
                min="1"
                step="0.1"
                value={formData.cargoVolumeM3}
                onChange={(e) => setFormData({ ...formData, cargoVolumeM3: Number(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

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
                {loading ? t('addTruck.addingTruck') : t('addTruck.addTruckButton')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddTruckModal;