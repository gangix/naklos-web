import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { fuelEntryApi, FuelEntryDuplicateError } from '../../services/fuelEntryApi';
import type { ManualFuelEntryInput, TruckFuelEntryDto } from '../../types/fuel';
import { TextInput, Select, Textarea } from '../common/FormField';

interface Props {
  /** Required for the manager flow; ignored when `saveFn` is supplied. */
  fleetId: string;
  truckId: string;
  truckPlate: string;
  truckPrimaryFuelType?: ManualFuelEntryInput['fuelType'];
  mode: 'add' | 'edit';
  initial?: TruckFuelEntryDto;
  onClose: () => void;
  onSaved: (entry: TruckFuelEntryDto) => void;
  onDuplicate?: (collidingEntryId: string) => void;
  /**
   * Optional save override. When provided, replaces the default
   * fuelEntryApi.addManual / updateManual calls — used by the driver flow
   * (UC-13-lite) to call the driver-scoped endpoint instead. Photo is
   * always non-null in `add` mode and null in `edit` mode (we don't allow
   * photo replacement on edit).
   */
  saveFn?: (input: ManualFuelEntryInput, photo: File | null) => Promise<TruckFuelEntryDto>;
}

type FuelType = ManualFuelEntryInput['fuelType'];

const FUEL_TYPES: FuelType[] = ['DIESEL', 'GASOLINE', 'LPG', 'ADBLUE', 'OTHER'];

const FUEL_TYPE_LABELS: Record<FuelType, string> = {
  DIESEL: 'Dizel',
  GASOLINE: 'Benzin',
  LPG: 'LPG',
  ADBLUE: 'AdBlue',
  OTHER: 'Diğer',
};

function nowLocalDatetimeString(): string {
  return new Date().toISOString().slice(0, 16);
}

function toDatetimeLocal(isoString: string): string {
  return isoString.slice(0, 16);
}

interface FieldErrors {
  occurredAt?: string;
  fuelType?: string;
  liters?: string;
  totalPrice?: string;
  photo?: string;
  pricePerLiter?: string;
  odometerKm?: string;
  notes?: string;
}

export default function FuelEntryFormModal({
  fleetId,
  truckId,
  truckPlate,
  truckPrimaryFuelType,
  mode,
  initial,
  onClose,
  onSaved,
  onDuplicate,
  saveFn,
}: Props) {
  const { t } = useTranslation();
  const dialogRef = useRef<HTMLDivElement>(null);
  const firstFocusableRef = useRef<HTMLInputElement>(null);

  const [occurredAt, setOccurredAt] = useState<string>(
    mode === 'edit' && initial ? toDatetimeLocal(initial.occurredAt) : nowLocalDatetimeString(),
  );
  const [fuelType, setFuelType] = useState<FuelType>(
    mode === 'edit' && initial ? initial.fuelType : (truckPrimaryFuelType ?? 'DIESEL'),
  );
  const [liters, setLiters] = useState<string>(
    mode === 'edit' && initial ? initial.liters : '',
  );
  const [totalPrice, setTotalPrice] = useState<string>(
    mode === 'edit' && initial ? initial.totalPrice : '',
  );
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  // Optional section
  const [optionalOpen, setOptionalOpen] = useState(false);
  const [pricePerLiter, setPricePerLiter] = useState<string>(
    mode === 'edit' && initial?.pricePerLiter ? initial.pricePerLiter : '',
  );
  const [stationName, setStationName] = useState<string>(
    mode === 'edit' && initial?.stationName ? initial.stationName : '',
  );
  const [odometerKm, setOdometerKm] = useState<string>(
    mode === 'edit' && initial?.odometerKm != null ? String(initial.odometerKm) : '',
  );
  const [notes, setNotes] = useState<string>(
    mode === 'edit' && initial?.notes ? initial.notes : '',
  );

  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [duplicateBanner, setDuplicateBanner] = useState<string | null>(null);

  // Focus first input on mount
  useEffect(() => {
    firstFocusableRef.current?.focus();
  }, []);

  // Escape key close
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  // Cleanup photo preview URL
  useEffect(() => {
    return () => {
      if (photoPreviewUrl) URL.revokeObjectURL(photoPreviewUrl);
    };
  }, [photoPreviewUrl]);

  function handlePhotoFile(file: File) {
    // Validate mime
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setErrors(prev => ({ ...prev, photo: t('fuelEntry.error.photoBadType') }));
      return;
    }
    // Validate size (10 MB)
    if (file.size > 10 * 1024 * 1024) {
      setErrors(prev => ({ ...prev, photo: t('fuelEntry.error.photoTooLarge') }));
      return;
    }
    setErrors(prev => ({ ...prev, photo: undefined }));
    if (photoPreviewUrl) URL.revokeObjectURL(photoPreviewUrl);
    setPhoto(file);
    setPhotoPreviewUrl(URL.createObjectURL(file));
  }

  function validate(): FieldErrors {
    const errs: FieldErrors = {};

    // occurredAt
    const dtValue = new Date(occurredAt);
    const minDate = new Date('2020-01-01');
    const maxDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
    if (!occurredAt || isNaN(dtValue.getTime()) || dtValue < minDate || dtValue > maxDate) {
      errs.occurredAt = t('fuelEntry.error.saveFailed');
    }

    // liters
    const litersNum = parseFloat(liters);
    if (!liters || isNaN(litersNum) || litersNum <= 0 || litersNum > 10000) {
      errs.liters = t('fuelEntry.error.saveFailed');
    }

    // totalPrice
    const totalPriceNum = parseFloat(totalPrice);
    if (!totalPrice || isNaN(totalPriceNum) || totalPriceNum <= 0 || totalPriceNum > 1_000_000) {
      errs.totalPrice = t('fuelEntry.error.saveFailed');
    }

    // photo (add mode only)
    if (mode === 'add') {
      if (!photo) {
        errs.photo = t('fuelEntry.error.photoRequired');
      }
    }

    // optional: pricePerLiter
    if (pricePerLiter.trim() !== '') {
      const ppl = parseFloat(pricePerLiter);
      if (isNaN(ppl) || ppl <= 0 || ppl > 1000) {
        errs.pricePerLiter = t('fuelEntry.error.saveFailed');
      }
    }

    // odometerKm — required (analytics depend on it for L/100km)
    const km = parseInt(odometerKm, 10);
    if (
      odometerKm.trim() === '' ||
      isNaN(km) || km < 0 || km > 10_000_000 ||
      String(km) !== odometerKm.trim()
    ) {
      errs.odometerKm = t('fuelEntry.error.saveFailed');
    }

    // notes
    if (notes.length > 1000) {
      errs.notes = t('fuelEntry.error.saveFailed');
    }

    return errs;
  }

  function isFormValid(): boolean {
    const errs = validate();
    if (Object.keys(errs).length > 0) return false;
    if (mode === 'add' && !photo) return false;
    return true;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    const input: ManualFuelEntryInput = {
      occurredAt: new Date(occurredAt).toISOString(),
      fuelType,
      liters: parseFloat(liters),
      totalPrice: parseFloat(totalPrice),
      pricePerLiter: pricePerLiter.trim() !== '' ? parseFloat(pricePerLiter) : null,
      stationName: stationName.trim() !== '' ? stationName.trim() : null,
      odometerKm: parseInt(odometerKm, 10),
      notes: notes.trim() !== '' ? notes.trim() : null,
    };

    setSubmitting(true);
    setDuplicateBanner(null);

    try {
      let savedEntry: TruckFuelEntryDto;
      if (saveFn) {
        savedEntry = await saveFn(input, mode === 'add' ? photo : null);
      } else if (mode === 'add') {
        savedEntry = await fuelEntryApi.addManual(fleetId, truckId, input, photo!);
      } else {
        savedEntry = await fuelEntryApi.updateManual(fleetId, initial!.id, input);
      }
      onSaved(savedEntry);
      onClose();
    } catch (err) {
      if (err instanceof FuelEntryDuplicateError) {
        setDuplicateBanner(err.collidingEntryId);
      } else {
        toast.error(t('fuelEntry.error.saveFailed'));
      }
    } finally {
      setSubmitting(false);
    }
  }

  const title = mode === 'add' ? t('fuelEntry.add.title') : t('fuelEntry.edit.title');
  const submitLabel = mode === 'add' ? t('fuelEntry.add.submit') : t('fuelEntry.edit.submit');

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="fuel-entry-modal-title"
        className="bg-white rounded-xl shadow-xl border border-gray-200 p-6 w-full max-w-md max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-1">
          <h2 id="fuel-entry-modal-title" className="text-xl font-extrabold text-gray-900 tracking-tight">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors text-lg leading-none"
            aria-label={t('common.cancel')}
          >
            ✕
          </button>
        </div>
        <p className="text-sm text-gray-700 mb-5 font-mono">{truckPlate}</p>

        {/* Duplicate banner */}
        {duplicateBanner && (
          <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center justify-between gap-2">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <span className="text-amber-800 text-sm">{t('fuelEntry.error.duplicate')}</span>
            </div>
            <button
              type="button"
              className="text-amber-700 underline text-sm shrink-0 hover:text-amber-900"
              onClick={() => {
                onClose();
                onDuplicate?.(duplicateBanner);
              }}
            >
              {t('fuelEntry.error.duplicateViewCta')}
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          {/* occurredAt */}
          <TextInput
            ref={firstFocusableRef}
            type="datetime-local"
            label={t('fuelEntry.field.occurredAt')}
            required
            error={errors.occurredAt}
            value={occurredAt}
            onChange={e => {
              setOccurredAt(e.target.value);
              setErrors(prev => ({ ...prev, occurredAt: undefined }));
            }}
          />

          {/* fuelType */}
          <Select
            label={t('fuelEntry.field.fuelType')}
            required
            error={errors.fuelType}
            value={fuelType}
            onChange={e => setFuelType(e.target.value as FuelType)}
          >
            {FUEL_TYPES.map(ft => (
              <option key={ft} value={ft}>{FUEL_TYPE_LABELS[ft]}</option>
            ))}
          </Select>

          {/* liters */}
          <TextInput
            type="number"
            step="0.01"
            min="0.01"
            max="10000"
            label={t('fuelEntry.field.liters')}
            required
            error={errors.liters}
            value={liters}
            onChange={e => {
              setLiters(e.target.value);
              setErrors(prev => ({ ...prev, liters: undefined }));
            }}
          />

          {/* totalPrice */}
          <TextInput
            type="number"
            step="0.01"
            min="0.01"
            max="1000000"
            label={t('fuelEntry.field.totalPrice')}
            required
            error={errors.totalPrice}
            value={totalPrice}
            onChange={e => {
              setTotalPrice(e.target.value);
              setErrors(prev => ({ ...prev, totalPrice: undefined }));
            }}
          />

          {/* odometerKm — required because L/100km analytics depend on it */}
          <TextInput
            type="number"
            step="1"
            min="0"
            max="10000000"
            required
            label={t('fuelEntry.field.odometerKm')}
            error={errors.odometerKm}
            value={odometerKm}
            onChange={e => {
              setOdometerKm(e.target.value);
              setErrors(prev => ({ ...prev, odometerKm: undefined }));
            }}
          />

          {/* Photo */}
          {mode === 'add' ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                {t('fuelEntry.field.photo')}
                <span className="text-red-500 ml-0.5">*</span>
              </label>
              {photoPreviewUrl ? (
                <div className="relative">
                  <img
                    src={photoPreviewUrl}
                    alt="Seçilen fotoğraf"
                    className="w-full max-h-48 object-contain rounded-lg border border-gray-200"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setPhoto(null);
                      if (photoPreviewUrl) URL.revokeObjectURL(photoPreviewUrl);
                      setPhotoPreviewUrl(null);
                    }}
                    className="absolute top-2 right-2 bg-white rounded-full p-1 shadow text-gray-500 hover:text-gray-800 text-xs"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <div
                  className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                    dragOver
                      ? 'border-primary-400 bg-primary-50'
                      : 'border-gray-300 hover:border-gray-400'
                  } ${errors.photo ? 'border-red-300' : ''}`}
                  onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={e => {
                    e.preventDefault();
                    setDragOver(false);
                    const file = e.dataTransfer.files[0];
                    if (file) handlePhotoFile(file);
                  }}
                  onClick={() => document.getElementById('fuel-photo-input')?.click()}
                >
                  <p className="text-sm text-gray-500">{t('fuelEntry.field.photoRequired')}</p>
                  <p className="text-xs text-gray-400 mt-1">{t('fuelEntry.field.photoHint')}</p>
                </div>
              )}
              <input
                id="fuel-photo-input"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={e => {
                  const file = e.target.files?.[0];
                  if (file) handlePhotoFile(file);
                  e.target.value = '';
                }}
              />
              {errors.photo && (
                <p className="mt-1 text-xs text-red-600">{errors.photo}</p>
              )}
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                {t('fuelEntry.field.photo')}
              </label>
              {initial?.receiptDocumentId ? (
                <div className="space-y-2">
                  <img
                    src={fuelEntryApi.receiptUrl(fleetId, initial.id)}
                    alt="Mevcut fiş fotoğrafı"
                    className="w-full max-h-48 object-contain rounded-lg border border-gray-200"
                  />
                  <p className="text-xs text-gray-500">{t('fuelEntry.editPhotoHint')}</p>
                </div>
              ) : (
                <p className="text-xs text-gray-500">{t('fuelEntry.editPhotoHint')}</p>
              )}
            </div>
          )}

          {/* Optional section */}
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <button
              type="button"
              className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
              onClick={() => setOptionalOpen(prev => !prev)}
              aria-expanded={optionalOpen}
            >
              <span>{t('fuelEntry.field.optional')}</span>
              <span className="text-gray-400">{optionalOpen ? '▲' : '▼'}</span>
            </button>

            {optionalOpen && (
              <div className="px-4 pb-4 space-y-4 border-t border-gray-100 pt-3">
                {/* pricePerLiter */}
                <TextInput
                  type="number"
                  step="0.01"
                  min="0.01"
                  max="1000"
                  label={t('fuelEntry.field.pricePerLiter')}
                  error={errors.pricePerLiter}
                  value={pricePerLiter}
                  onChange={e => {
                    setPricePerLiter(e.target.value);
                    setErrors(prev => ({ ...prev, pricePerLiter: undefined }));
                  }}
                />

                {/* stationName */}
                <TextInput
                  type="text"
                  label={t('fuelEntry.field.stationName')}
                  value={stationName}
                  onChange={e => setStationName(e.target.value)}
                />

                {/* notes */}
                <Textarea
                  rows={3}
                  maxLength={1000}
                  label={t('fuelEntry.field.notes')}
                  error={errors.notes}
                  value={notes}
                  onChange={e => {
                    setNotes(e.target.value);
                    setErrors(prev => ({ ...prev, notes: undefined }));
                  }}
                  hint={`${notes.length}/1000`}
                />
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-colors disabled:opacity-50 disabled:pointer-events-none"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={submitting || !isFormValid()}
              className="px-4 py-2 text-sm font-semibold rounded-lg bg-primary-600 text-white hover:bg-primary-700 hover:shadow-lg hover:shadow-primary-500/20 transition-all disabled:opacity-50 disabled:pointer-events-none"
            >
              {submitting ? '...' : submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
