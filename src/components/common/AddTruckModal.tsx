import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useFleet } from '../../contexts/FleetContext';
import { truckApi } from '../../services/api';
import { FileInput, Select, TextInput } from './FormField';

interface AddTruckModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (result?: { relinkedFuelEntryCount: number }) => void;
  /** Pre-fill the plate field, locked as read-only. Used by the fuel review
   *  flow to create a truck for an unmatched plate without re-typing it. */
  prefillPlate?: string;
  /** Custom submit handler. When provided, replaces the default
   *  `truckApi.register` call. The resolved value is passed to onSuccess. */
  onSubmit?: (data: { plateNumber: string; type: string; capacityKg: number; cargoVolumeM3: number }) => Promise<{ relinkedFuelEntryCount?: number } | void>;
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

const AddTruckModal = ({ isOpen, onClose, onSuccess, prefillPlate, onSubmit }: AddTruckModalProps) => {
  const { t } = useTranslation();
  const { fleetId } = useFleet();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  type TruckDocFormEntry = { file: File | null; expiryDate: string };
  type TruckDocKey = 'compulsory-insurance' | 'comprehensive-insurance' | 'inspection';
  const emptyDoc: TruckDocFormEntry = { file: null, expiryDate: '' };

  const [formData, setFormData] = useState({
    plateNumber: prefillPlate ?? '',
    type: 'SMALL_TRUCK',
    capacityKg: 3500,
    cargoVolumeM3: 20,
  });

  const [docs, setDocs] = useState<Record<TruckDocKey, TruckDocFormEntry>>({
    'compulsory-insurance': { ...emptyDoc },
    'comprehensive-insurance': { ...emptyDoc },
    'inspection': { ...emptyDoc },
  });

  const updateDoc = (key: TruckDocKey, patch: Partial<TruckDocFormEntry>) => {
    setDocs((prev) => ({ ...prev, [key]: { ...prev[key], ...patch } }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (onSubmit) {
        const result = await onSubmit(formData);
        onSuccess(result ? { relinkedFuelEntryCount: result.relinkedFuelEntryCount ?? 0 } : undefined);
      } else {
        await truckApi.register({
          ...formData,
          fleetId,
        });
        onSuccess();
      }

      // Reset form and close
      setFormData({
        plateNumber: prefillPlate ?? '',
        type: 'SMALL_TRUCK',
        capacityKg: 3500,
        cargoVolumeM3: 20,
      });
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
            <TextInput
              label="Plaka"
              required
              type="text"
              value={formData.plateNumber}
              onChange={(e) => setFormData({ ...formData, plateNumber: e.target.value.toUpperCase() })}
              placeholder="34 ABC 123"
              disabled={!!prefillPlate}
            />

            <Select
              label={t('addTruck.truckType')}
              value={formData.type}
              onChange={(e) => handleTypeChange(e.target.value)}
            >
              {truckTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {t(`truckType.${type.value}`)}
                </option>
              ))}
            </Select>

            <TextInput
              label="Kapasite (kg)"
              required
              type="number"
              min="1"
              value={formData.capacityKg}
              onChange={(e) => setFormData({ ...formData, capacityKg: Number(e.target.value) })}
            />

            <TextInput
              label="Hacim (m³)"
              type="number"
              min="1"
              step="0.1"
              value={formData.cargoVolumeM3}
              onChange={(e) => setFormData({ ...formData, cargoVolumeM3: Number(e.target.value) })}
            />

            <div className="pt-4 border-t border-gray-200">
              <details className="group">
                <summary className="cursor-pointer text-sm font-medium text-gray-700 hover:text-primary-600 list-none flex items-center justify-between">
                  <span>{t('addTruck.docsSectionTitle')}</span>
                  <span className="text-xs text-gray-500 group-open:hidden">{t('addTruck.docsSectionExpand')}</span>
                  <span className="text-xs text-gray-500 hidden group-open:inline">{t('addTruck.docsSectionCollapse')}</span>
                </summary>
                <p className="mt-2 text-xs text-gray-600">{t('addTruck.docsSectionHint')}</p>

                <div className="mt-3 space-y-4">
                  {(['compulsory-insurance', 'comprehensive-insurance', 'inspection'] as const).map((key) => (
                    <div key={key} className="rounded-lg border border-gray-200 p-3 space-y-2">
                      <p className="text-sm font-medium text-gray-900">{t(`categoryLabel.${
                        key === 'compulsory-insurance' ? 'compulsoryInsurance'
                        : key === 'comprehensive-insurance' ? 'comprehensiveInsurance'
                        : 'inspection'
                      }`)}</p>
                      <FileInput
                        label={t('addTruck.docFileLabel')}
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(file) => updateDoc(key, { file })}
                        selectedFileName={docs[key].file?.name ?? null}
                      />
                      <TextInput
                        label={t('addTruck.docExpiryLabel')}
                        type="date"
                        value={docs[key].expiryDate}
                        onChange={(e) => updateDoc(key, { expiryDate: e.target.value })}
                      />
                    </div>
                  ))}
                </div>
              </details>
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