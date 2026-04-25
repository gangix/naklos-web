import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, History, MapPin } from 'lucide-react';
import { maintenanceApi } from '../../services/maintenanceApi';
import { useMaintenanceWarnings } from '../../contexts/MaintenanceWarningsContext';
import type { MaintenanceRecordDto, MaintenanceScheduleDto } from '../../types/maintenance';
import ScheduleRow from './ScheduleRow';
import LogRecordModal from './LogRecordModal';

interface Props {
  fleetId: string;
  truckId: string;
}

// ── Inline RecordRow ────────────────────────────────────────────────────────

interface RecordRowProps {
  record: MaintenanceRecordDto;
  schedules: MaintenanceScheduleDto[];
}

function RecordRow({ record, schedules }: RecordRowProps) {
  const { t } = useTranslation();

  const schedule = schedules.find((s) => s.id === record.scheduleId);
  const kindLabel = schedule
    ? schedule.kind === 'CUSTOM' && schedule.customLabel
      ? schedule.customLabel
      : t(`maintenance.kind.${schedule.kind}`)
    : '—';

  const parts: string[] = [];

  // Date
  try {
    parts.push(
      new Date(record.performedAt + 'T00:00:00').toLocaleDateString(undefined, {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }),
    );
  } catch {
    parts.push(record.performedAt);
  }

  // Kind
  parts.push(kindLabel);

  // km
  if (record.performedKm != null) {
    parts.push(`${record.performedKm.toLocaleString()} km`);
  }

  // cost
  if (record.costMinor != null && record.costCurrency) {
    parts.push(`${record.costCurrency} ${(record.costMinor / 100).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`);
  }

  // city
  if (record.shopCity) {
    parts.push(record.shopCity);
  }

  return (
    <li className="flex items-start gap-2 py-2.5 px-4 border-b border-gray-100 last:border-0">
      <MapPin className="w-3.5 h-3.5 text-gray-300 mt-0.5 flex-shrink-0" />
      <span className="text-sm text-gray-700">{parts.join(' · ')}</span>
    </li>
  );
}

// ── MaintenanceTab ──────────────────────────────────────────────────────────

export default function MaintenanceTab({ fleetId, truckId }: Props) {
  const { t } = useTranslation();
  const { refresh: refreshWarnings } = useMaintenanceWarnings();

  const [schedules, setSchedules] = useState<MaintenanceScheduleDto[]>([]);
  const [records, setRecords] = useState<MaintenanceRecordDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [logModalOpen, setLogModalOpen] = useState(false);

  async function fetchAll() {
    setLoading(true);
    setError(null);
    try {
      const [sched, recs] = await Promise.all([
        maintenanceApi.listSchedules(fleetId, truckId),
        maintenanceApi.listRecords(fleetId, truckId),
      ]);
      setSchedules(sched);
      // newest first
      setRecords([...recs].sort((a, b) => b.performedAt.localeCompare(a.performedAt)));
    } catch {
      setError(t('common.error'));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fleetId, truckId]);

  function handleScheduleUpdated(updated: MaintenanceScheduleDto) {
    setSchedules((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
    refreshWarnings();
  }

  async function handleRecordLogged(record: MaintenanceRecordDto) {
    setRecords((prev) => [record, ...prev]);
    // Re-fetch schedules so next-due advances
    try {
      const fresh = await maintenanceApi.listSchedules(fleetId, truckId);
      setSchedules(fresh);
    } catch {
      // non-critical — UI will be slightly stale until next refresh
    }
    refreshWarnings();
  }

  return (
    <section id="maintenance-section" className="mb-6">
      {/* Header */}
      <div className="flex items-baseline justify-between mb-3">
        <h2 className="text-lg font-extrabold tracking-tight text-gray-900 flex items-center gap-2">
          <History className="w-5 h-5 text-primary-600" />
          {t('maintenance.sectionTitle')}
        </h2>
        <button
          onClick={() => setLogModalOpen(true)}
          disabled={schedules.length === 0}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary-600 text-white text-xs font-semibold hover:bg-primary-700 disabled:opacity-40 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          {t('maintenance.addRecord')}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-3 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Schedule list */}
      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-16 rounded-xl bg-gray-100 animate-pulse"
            />
          ))}
        </div>
      ) : schedules.length === 0 ? (
        <p className="text-sm text-gray-500 px-1">{t('maintenance.noSchedules')}</p>
      ) : (
        <div className="space-y-2 mb-5">
          {schedules.map((s) => (
            <ScheduleRow
              key={s.id}
              fleetId={fleetId}
              truckId={truckId}
              schedule={s}
              onUpdated={handleScheduleUpdated}
            />
          ))}
        </div>
      )}

      {/* Records section */}
      <h3 className="text-base font-bold tracking-tight text-gray-800 mt-5 mb-2">
        {t('maintenance.recordsTitle')}
      </h3>
      {loading ? (
        <div className="h-12 rounded-xl bg-gray-100 animate-pulse" />
      ) : records.length === 0 ? (
        <p className="text-sm text-gray-500 px-1">{t('maintenance.noRecords')}</p>
      ) : (
        <ul className="bg-white rounded-xl border border-gray-200 shadow-sm divide-y divide-gray-100">
          {records.map((r) => (
            <RecordRow key={r.id} record={r} schedules={schedules} />
          ))}
        </ul>
      )}

      {/* Log Record Modal */}
      {logModalOpen && (
        <LogRecordModal
          fleetId={fleetId}
          truckId={truckId}
          schedules={schedules}
          onClose={() => setLogModalOpen(false)}
          onLogged={handleRecordLogged}
        />
      )}
    </section>
  );
}
