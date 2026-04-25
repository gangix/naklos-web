import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pencil, X, Check } from 'lucide-react';
import { maintenanceApi } from '../../services/maintenanceApi';
import { MAINTENANCE_KINDS } from '../../types/maintenance';
import type { MaintenanceKind, MaintenanceScheduleDto, MaintenanceScheduleRequest } from '../../types/maintenance';

interface Props {
  fleetId: string;
  truckId: string;
  schedule: MaintenanceScheduleDto;
  onUpdated: (updated: MaintenanceScheduleDto) => void;
}

function formatLocalDate(isoDate: string | null): string {
  if (!isoDate) return '—';
  try {
    return new Date(isoDate + 'T00:00:00').toLocaleDateString(undefined, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return isoDate;
  }
}

export default function ScheduleRow({ fleetId, truckId, schedule, onUpdated }: Props) {
  const { t } = useTranslation();
  const [isEditing, setIsEditing] = useState(false);

  // Edit-form state
  const [kind, setKind] = useState<MaintenanceKind>(schedule.kind);
  const [customLabel, setCustomLabel] = useState<string>(schedule.customLabel ?? '');
  const [intervalKm, setIntervalKm] = useState<string>(
    schedule.intervalKm != null ? String(schedule.intervalKm) : '',
  );
  const [intervalMonths, setIntervalMonths] = useState<string>(
    schedule.intervalMonths != null ? String(schedule.intervalMonths) : '',
  );
  const [lastServicedAt, setLastServicedAt] = useState<string>(schedule.lastServicedAt);
  const [lastServicedKm, setLastServicedKm] = useState<string>(
    schedule.lastServicedKm != null ? String(schedule.lastServicedKm) : '',
  );

  const [fieldError, setFieldError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function kindLabel(s: MaintenanceScheduleDto): string {
    if (s.kind === 'CUSTOM' && s.customLabel) return s.customLabel;
    return t(`maintenance.kind.${s.kind}`);
  }

  function intervalSummary(s: MaintenanceScheduleDto): string {
    if (s.intervalKm && s.intervalMonths) {
      return t('maintenance.intervalBoth', { months: s.intervalMonths, km: s.intervalKm.toLocaleString() });
    }
    if (s.intervalKm) {
      return t('maintenance.intervalKm', { km: s.intervalKm.toLocaleString() });
    }
    if (s.intervalMonths) {
      return t('maintenance.intervalMonths', { months: s.intervalMonths });
    }
    return t('maintenance.noInterval');
  }

  function startEdit() {
    // Reset form to current schedule values
    setKind(schedule.kind);
    setCustomLabel(schedule.customLabel ?? '');
    setIntervalKm(schedule.intervalKm != null ? String(schedule.intervalKm) : '');
    setIntervalMonths(schedule.intervalMonths != null ? String(schedule.intervalMonths) : '');
    setLastServicedAt(schedule.lastServicedAt);
    setLastServicedKm(schedule.lastServicedKm != null ? String(schedule.lastServicedKm) : '');
    setFieldError(null);
    setIsEditing(true);
  }

  function cancelEdit() {
    setIsEditing(false);
    setFieldError(null);
  }

  function validate(): string | null {
    const kmVal = intervalKm.trim() !== '' ? parseInt(intervalKm, 10) : null;
    const monthsVal = intervalMonths.trim() !== '' ? parseInt(intervalMonths, 10) : null;

    if (kmVal === null && monthsVal === null) {
      return t('maintenance.errors.intervalRequired');
    }
    if ((kmVal !== null && kmVal <= 0) || (monthsVal !== null && monthsVal <= 0)) {
      return t('maintenance.errors.intervalPositive');
    }
    if (kind === 'CUSTOM' && customLabel.trim() === '') {
      return t('maintenance.errors.customLabelRequired');
    }
    if (!lastServicedAt) {
      return t('maintenance.errors.performedAtRequired');
    }
    return null;
  }

  async function handleSave() {
    const err = validate();
    if (err) {
      setFieldError(err);
      return;
    }
    setFieldError(null);

    const body: MaintenanceScheduleRequest = {
      kind,
      customLabel: kind === 'CUSTOM' ? customLabel.trim() || null : null,
      intervalKm: intervalKm.trim() !== '' ? parseInt(intervalKm, 10) : null,
      intervalMonths: intervalMonths.trim() !== '' ? parseInt(intervalMonths, 10) : null,
      lastServicedAt,
      lastServicedKm: lastServicedKm.trim() !== '' ? parseInt(lastServicedKm, 10) : null,
    };

    setSaving(true);
    try {
      const updated = await maintenanceApi.updateSchedule(fleetId, truckId, schedule.id, body);
      onUpdated(updated);
      setIsEditing(false);
    } catch {
      setFieldError(t('common.error'));
    } finally {
      setSaving(false);
    }
  }

  if (!isEditing) {
    return (
      <div className="flex items-start justify-between py-3 px-4 bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 truncate">
            {kindLabel(schedule)}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">
            {intervalSummary(schedule)}
          </p>
        </div>
        <div className="mx-4 text-right flex-shrink-0">
          {schedule.nextDueAt || schedule.nextDueKm ? (
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-0.5">
                {t('maintenance.nextDue')}
              </p>
              {schedule.nextDueAt && (
                <p className="text-xs text-gray-700 font-medium">
                  {formatLocalDate(schedule.nextDueAt)}
                </p>
              )}
              {schedule.nextDueKm && (
                <p className="text-xs text-gray-500">
                  {schedule.nextDueKm.toLocaleString()} km
                </p>
              )}
            </div>
          ) : (
            <p className="text-xs text-gray-400">—</p>
          )}
        </div>
        <button
          onClick={startEdit}
          aria-label={t('maintenance.scheduleEdit')}
          className="flex-shrink-0 ml-1 w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-primary-600 hover:bg-primary-50 transition-colors"
        >
          <Pencil className="w-4 h-4" />
        </button>
      </div>
    );
  }

  // Edit mode
  return (
    <div className="py-3 px-4 bg-white rounded-xl border border-primary-200 shadow-sm space-y-3">
      {/* Kind */}
      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1">
          {t('maintenance.kindLabel')}
        </label>
        <select
          value={kind}
          onChange={(e) => setKind(e.target.value as MaintenanceKind)}
          className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          {MAINTENANCE_KINDS.map((k) => (
            <option key={k} value={k}>
              {t(`maintenance.kind.${k}`)}
            </option>
          ))}
        </select>
      </div>

      {/* Custom label (only when CUSTOM) */}
      {kind === 'CUSTOM' && (
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">
            {t('maintenance.customLabelLabel')}
          </label>
          <input
            type="text"
            value={customLabel}
            onChange={(e) => setCustomLabel(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
      )}

      {/* Interval km + months */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">
            {t('maintenance.intervalKmLabel')}
          </label>
          <input
            type="number"
            min="1"
            value={intervalKm}
            onChange={(e) => setIntervalKm(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">
            {t('maintenance.intervalMonthsLabel')}
          </label>
          <input
            type="number"
            min="1"
            value={intervalMonths}
            onChange={(e) => setIntervalMonths(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
      </div>

      {/* Last serviced at + km */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">
            {t('maintenance.lastServicedAtLabel')}
          </label>
          <input
            type="date"
            value={lastServicedAt}
            onChange={(e) => setLastServicedAt(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
            required
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">
            {t('maintenance.lastServicedKmLabel')}
          </label>
          <input
            type="number"
            min="0"
            value={lastServicedKm}
            onChange={(e) => setLastServicedKm(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
      </div>

      {/* Inline error */}
      {fieldError && (
        <p className="text-xs text-red-600 font-medium">{fieldError}</p>
      )}

      {/* Save / Cancel */}
      <div className="flex gap-2 pt-1">
        <button
          type="button"
          onClick={cancelEdit}
          disabled={saving}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-300 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
        >
          <X className="w-3.5 h-3.5" />
          {t('maintenance.scheduleCancel')}
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary-600 text-white text-xs font-semibold hover:bg-primary-700 disabled:opacity-50 transition-colors"
        >
          <Check className="w-3.5 h-3.5" />
          {saving ? '…' : t('maintenance.scheduleSave')}
        </button>
      </div>
    </div>
  );
}
