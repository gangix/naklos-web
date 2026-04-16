import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, Check, X, Gauge, Clock3 } from 'lucide-react';
import { toast } from 'sonner';
import { fuelReviewApi } from '../../services/api';
import type { AnomalyEntryView, AnomalyReason } from '../../types/fuel';
import { formatDateTime } from '../../utils/format';

interface Props {
  fleetId: string;
}

const REASON_TONE: Record<AnomalyReason, { bg: string; border: string; text: string }> = {
  ODOMETER_ROLLBACK:         { bg: 'bg-red-50',    border: 'border-red-200',    text: 'text-red-700' },
  ODOMETER_CONSUMPTION_HIGH: { bg: 'bg-amber-50',  border: 'border-amber-200',  text: 'text-amber-700' },
  ODOMETER_CONSUMPTION_LOW:  { bg: 'bg-amber-50',  border: 'border-amber-200',  text: 'text-amber-700' },
  RAPID_REFUEL:              { bg: 'bg-blue-50',   border: 'border-blue-200',   text: 'text-blue-700' },
};

const REASON_ICON: Record<AnomalyReason, typeof Gauge> = {
  ODOMETER_ROLLBACK:         Gauge,
  ODOMETER_CONSUMPTION_HIGH: Gauge,
  ODOMETER_CONSUMPTION_LOW:  Gauge,
  RAPID_REFUEL:              Clock3,
};

export default function AnomalyList({ fleetId }: Props) {
  const { t } = useTranslation();
  const [anomalies, setAnomalies] = useState<AnomalyEntryView[] | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [pendingAction, setPendingAction] = useState<string | null>(null);

  const load = async () => {
    try {
      setLoadError(false);
      const data = await fuelReviewApi.listAnomalies(fleetId);
      setAnomalies(data);
    } catch (err) {
      console.error(err);
      setLoadError(true);
    }
  };

  useEffect(() => { void load(); }, [fleetId]);

  const handleConfirm = async (entryId: string) => {
    setPendingAction(entryId);
    try {
      await fuelReviewApi.confirmAnomaly(fleetId, entryId);
      toast.success(t('fuelReview.anomaly.confirmedToast'));
      await load();
    } catch {
      toast.error(t('common.error'));
    } finally {
      setPendingAction(null);
    }
  };

  const handleDismiss = async (entryId: string) => {
    setPendingAction(entryId);
    try {
      await fuelReviewApi.dismissAnomaly(fleetId, entryId);
      toast.success(t('fuelReview.anomaly.dismissedToast'));
      await load();
    } catch {
      toast.error(t('common.error'));
    } finally {
      setPendingAction(null);
    }
  };

  if (anomalies === null && !loadError) {
    return (
      <div className="space-y-3">
        {[0, 1, 2].map(i => (
          <div key={i} className="animate-pulse bg-gray-100 h-24 rounded-xl" />
        ))}
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
        {t('fuelReview.anomaly.loadError')}
      </div>
    );
  }

  if (!anomalies || anomalies.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-10 text-center">
        <Check className="w-10 h-10 text-green-500 mx-auto mb-3" strokeWidth={1.5} />
        <p className="text-sm text-gray-600">{t('fuelReview.anomaly.empty')}</p>
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {anomalies.map(a => {
        const tone = REASON_TONE[a.reason];
        const Icon = REASON_ICON[a.reason];
        const liters = parseFloat(a.liters).toFixed(2);
        const price = parseFloat(a.totalPrice).toFixed(2);
        const prevLiters = a.previousLiters != null ? parseFloat(a.previousLiters).toFixed(2) : null;
        const deltaKm =
          a.odometerKm != null && a.previousOdometerKm != null
            ? a.odometerKm - a.previousOdometerKm
            : null;
        const isPending = pendingAction === a.entryId;

        return (
          <li
            key={a.entryId}
            className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className={`flex items-center gap-2 px-4 py-2 ${tone.bg} ${tone.border} border-b`}>
              <Icon className={`w-4 h-4 ${tone.text}`} />
              <span className={`text-xs font-semibold ${tone.text}`}>
                {t(`fuelReview.anomaly.reason.${a.reason}`)}
              </span>
            </div>
            <div className="p-4 grid grid-cols-1 md:grid-cols-[1fr_auto] gap-4 items-start">
              <div className="space-y-2 min-w-0">
                <div className="flex items-baseline gap-3 flex-wrap">
                  <span className="font-mono text-sm font-semibold text-gray-900">
                    {a.plateTextRaw}
                  </span>
                  <span className="text-xs text-gray-500">
                    {formatDateTime(a.occurredAt)}
                  </span>
                </div>
                <p className="text-sm text-gray-700 tabular-nums">
                  {liters} L · ₺{price}
                  {a.odometerKm != null && (
                    <span className="text-gray-500">
                      {' · '}
                      {a.odometerKm.toLocaleString('tr-TR')} km
                    </span>
                  )}
                </p>
                {a.reason !== 'RAPID_REFUEL' && a.previousOdometerKm != null && (
                  <p className="text-xs text-gray-500">
                    {t('fuelReview.anomaly.baseline', {
                      prevOdo: a.previousOdometerKm.toLocaleString('tr-TR'),
                      prevLiters,
                      prevAt: a.previousOccurredAt ? formatDateTime(a.previousOccurredAt) : '—',
                      delta: deltaKm != null ? deltaKm.toLocaleString('tr-TR') : '—',
                    })}
                  </p>
                )}
                {a.reason === 'RAPID_REFUEL' && (
                  <p className="text-xs text-gray-500">
                    {t('fuelReview.anomaly.rapidRefuelHint')}
                  </p>
                )}
              </div>
              <div className="flex gap-2 flex-wrap md:flex-nowrap justify-end">
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => void handleConfirm(a.entryId)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded-lg border border-green-300 text-green-700 hover:bg-green-50 transition-colors disabled:opacity-50">
                  <Check className="w-4 h-4" />
                  {t('fuelReview.anomaly.confirm')}
                </button>
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => void handleDismiss(a.entryId)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50">
                  <X className="w-4 h-4" />
                  {t('fuelReview.anomaly.dismiss')}
                </button>
              </div>
            </div>
            {(a.reason === 'ODOMETER_ROLLBACK' || a.reason === 'ODOMETER_CONSUMPTION_LOW') && (
              <div className="bg-amber-50 border-t border-amber-100 px-4 py-2 flex items-center gap-2 text-xs text-amber-700">
                <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{t('fuelReview.anomaly.warningExcluded')}</span>
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
