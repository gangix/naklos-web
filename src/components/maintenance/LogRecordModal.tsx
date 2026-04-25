import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Wrench } from 'lucide-react';
import { maintenanceApi } from '../../services/maintenanceApi';
import type { MaintenanceRecordDto, MaintenanceScheduleDto } from '../../types/maintenance';

interface Props {
  fleetId: string;
  truckId: string;
  schedules: MaintenanceScheduleDto[];
  defaultScheduleId?: string;
  onClose: () => void;
  onLogged: (record: MaintenanceRecordDto) => void;
}

function scheduleLabel(s: MaintenanceScheduleDto, t: (k: string) => string): string {
  if (s.kind === 'CUSTOM' && s.customLabel) return s.customLabel;
  return t(`maintenance.kind.${s.kind}`);
}

export default function LogRecordModal({
  fleetId,
  truckId,
  schedules,
  defaultScheduleId,
  onClose,
  onLogged,
}: Props) {
  const { t } = useTranslation();
  const firstInputRef = useRef<HTMLSelectElement>(null);

  const initialScheduleId =
    defaultScheduleId ?? (schedules.length > 0 ? schedules[0].id : '');

  const [scheduleId, setScheduleId] = useState<string>(initialScheduleId);
  const [performedAt, setPerformedAt] = useState<string>(
    new Date().toISOString().slice(0, 10),
  );
  const [performedKm, setPerformedKm] = useState<string>('');
  const [costAmount, setCostAmount] = useState<string>('');
  const [costCurrency, setCostCurrency] = useState<string>('');
  const [shopName, setShopName] = useState<string>('');
  const [shopCity, setShopCity] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  const [fieldError, setFieldError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    firstInputRef.current?.focus();
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  function validate(): string | null {
    if (!performedAt) return t('maintenance.errors.performedAtRequired');
    const hasAmount = costAmount.trim() !== '';
    const hasCurrency = costCurrency.trim() !== '';
    if (hasAmount !== hasCurrency) return t('maintenance.errors.costPaired');
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError(null);

    const err = validate();
    if (err) {
      setFieldError(err);
      return;
    }
    setFieldError(null);

    const kmNum = performedKm.trim() !== '' ? parseInt(performedKm, 10) : null;
    const amountNum =
      costAmount.trim() !== '' ? Math.round(parseFloat(costAmount) * 100) : null;
    const currency =
      costCurrency.trim() !== '' ? costCurrency.trim().toUpperCase() : null;

    const body = {
      performedAt,
      performedKm: kmNum,
      costMinor: amountNum,
      costCurrency: currency,
      notes: notes.trim() !== '' ? notes.trim() : null,
      shopName: shopName.trim() !== '' ? shopName.trim() : null,
      shopCity: shopCity.trim() !== '' ? shopCity.trim() : null,
    };

    setSubmitting(true);
    try {
      const record = await maintenanceApi.logRecord(fleetId, truckId, scheduleId, body);
      onLogged(record);
      onClose();
    } catch {
      setSubmitError(t('common.error'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="log-record-modal-title"
        className="bg-white rounded-xl shadow-xl border border-gray-200 p-6 w-full max-w-md max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Wrench className="w-5 h-5 text-primary-600" />
            <h2 id="log-record-modal-title" className="text-xl font-extrabold text-gray-900 tracking-tight">
              {t('maintenance.logModal.title')}
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label={t('common.close')}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          {/* Schedule select */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              {t('maintenance.logModal.schedule')}
            </label>
            <select
              ref={firstInputRef}
              value={scheduleId}
              onChange={(e) => setScheduleId(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
              required
            >
              {schedules.map((s) => (
                <option key={s.id} value={s.id}>
                  {scheduleLabel(s, t)}
                </option>
              ))}
            </select>
          </div>

          {/* Performed at */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              {t('maintenance.logModal.performedAt')}
            </label>
            <input
              type="date"
              value={performedAt}
              onChange={(e) => setPerformedAt(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
              required
            />
          </div>

          {/* Performed km */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              {t('maintenance.logModal.performedKm')}
              <span className="text-gray-400 font-normal ml-1">(opsiyonel)</span>
            </label>
            <input
              type="number"
              min="0"
              value={performedKm}
              onChange={(e) => setPerformedKm(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {/* Cost: amount + currency */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              {t('maintenance.logModal.cost')}
              <span className="text-gray-400 font-normal ml-1">(opsiyonel)</span>
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={costAmount}
                onChange={(e) => setCostAmount(e.target.value)}
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <input
                type="text"
                maxLength={3}
                placeholder={t('maintenance.logModal.currency')}
                value={costCurrency}
                onChange={(e) => setCostCurrency(e.target.value.toUpperCase())}
                className="w-24 border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 uppercase focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          {/* Shop name */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              {t('maintenance.logModal.shopName')}
              <span className="text-gray-400 font-normal ml-1">(opsiyonel)</span>
            </label>
            <input
              type="text"
              maxLength={120}
              value={shopName}
              onChange={(e) => setShopName(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {/* Shop city */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              {t('maintenance.logModal.shopCity')}
              <span className="text-gray-400 font-normal ml-1">(opsiyonel)</span>
            </label>
            <input
              type="text"
              maxLength={60}
              value={shopCity}
              onChange={(e) => setShopCity(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              {t('maintenance.logModal.notes')}
            </label>
            <textarea
              rows={3}
              maxLength={2000}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
            />
          </div>

          {/* Inline errors */}
          {(fieldError ?? submitError) && (
            <p className="text-sm text-red-600 font-medium">
              {fieldError ?? submitError}
            </p>
          )}

          {/* Action buttons */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-lg border border-gray-300 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
            >
              {t('maintenance.logModal.cancel')}
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-2.5 rounded-lg bg-primary-600 text-white text-sm font-semibold hover:bg-primary-700 disabled:opacity-50 transition-colors"
            >
              {submitting ? '…' : t('maintenance.logModal.submit')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
