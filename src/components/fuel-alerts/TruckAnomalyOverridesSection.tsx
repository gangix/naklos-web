import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { fuelAnomalyApi } from '../../services/fuelAnomalyApi';
import { formatDecimal } from '../../utils/format';
import type {
  FuelType,
  TruckAnomalyRuleOverride,
  TruckBaseline,
} from '../../types/fuelAnomaly';

interface Props {
  fleetId: string;
  truckId: string;
}

const FUEL_TYPES: FuelType[] = ['DIESEL', 'GASOLINE', 'LPG', 'ELECTRIC'];

export default function TruckAnomalyOverridesSection({ fleetId, truckId }: Props) {
  const { t } = useTranslation();
  const [baseline, setBaseline] = useState<TruckBaseline | null>(null);
  const [overrides, setOverrides] = useState<TruckAnomalyRuleOverride[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [manualInput, setManualInput] = useState<string>('');
  const [fuelType, setFuelType] = useState<FuelType | ''>('');
  const [tankCapacity, setTankCapacity] = useState<string>('');

  const hydrate = useCallback((b: TruckBaseline) => {
    setBaseline(b);
    setManualInput(b.manual ?? '');
    setFuelType(b.fuelType ?? '');
    setTankCapacity(b.tankCapacityLiters != null ? String(b.tankCapacityLiters) : '');
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    Promise.all([
      fuelAnomalyApi.getBaseline(fleetId, truckId),
      fuelAnomalyApi.getOverrides(fleetId, truckId).catch(() => []),
    ])
      .then(([b, o]) => {
        if (cancelled) return;
        hydrate(b);
        setOverrides(o ?? []);
      })
      .catch((err) => {
        if (cancelled) return;
        console.error('Failed to load truck anomaly config', err);
        setError(err instanceof Error ? err.message : t('fuelAlerts.toast.loadError'));
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [fleetId, truckId, t, hydrate]);

  const save = useCallback(async () => {
    setSaving(true);
    try {
      const manual = manualInput.trim();
      const tank = tankCapacity.trim();
      const next = await fuelAnomalyApi.updateBaseline(fleetId, truckId, {
        expectedLPer100KmManual: manual.length === 0 ? null : manual,
        fuelType: fuelType === '' ? null : fuelType,
        tankCapacityLiters: tank.length === 0 ? null : Math.floor(Number(tank)),
      });
      hydrate(next);
      toast.success(t('fuelAlerts.overrides.saved'));
    } catch (err) {
      console.error('Save baseline failed', err);
      toast.error(err instanceof Error ? err.message : t('fuelAlerts.toast.loadError'));
    } finally {
      setSaving(false);
    }
  }, [fleetId, truckId, manualInput, fuelType, tankCapacity, hydrate, t]);

  const derivedDisplay = baseline ? formatDecimal(baseline.derived) : null;

  const dirty = baseline
    ? manualInput.trim() !== (baseline.manual ?? '') ||
      fuelType !== (baseline.fuelType ?? '') ||
      tankCapacity.trim() !== (baseline.tankCapacityLiters != null ? String(baseline.tankCapacityLiters) : '')
    : false;

  return (
    <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 mt-4">
      <header>
        <h2 className="text-lg font-extrabold tracking-tight text-slate-900">
          {t('fuelAlerts.overrides.sectionTitle')}
        </h2>
        <p className="mt-0.5 text-xs text-slate-500">
          {t('fuelAlerts.overrides.subtitle')}
        </p>
      </header>

      {loading && (
        <div className="mt-4 h-40 bg-slate-50 rounded-lg animate-pulse" />
      )}

      {error && !loading && (
        <div className="mt-4 bg-urgent-50 border border-urgent-200 rounded-lg p-3">
          <p className="text-xs font-semibold text-urgent-700">
            {t('fuelAlerts.toast.loadError')}
          </p>
          <p className="mt-0.5 text-xs text-urgent-600">{error}</p>
        </div>
      )}

      {!loading && !error && baseline && (
        <div className="mt-4 space-y-5">
          {/* Baseline row */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              {t('fuelAlerts.overrides.baseline.title')}
            </p>
            <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="bg-slate-50 rounded-lg border border-slate-200 p-3">
                <label className="block text-xs font-medium text-slate-600">
                  {t('fuelAlerts.overrides.baseline.manual')}
                </label>
                <div className="mt-1 flex items-baseline gap-2">
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={manualInput}
                    onChange={(e) => setManualInput(e.target.value)}
                    placeholder={t('fuelAlerts.overrides.baseline.manualPlaceholder')}
                    className="w-24 px-2 py-1 text-sm font-semibold text-slate-900 tabular-nums border border-slate-300 rounded-md focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 bg-white"
                  />
                  <span className="text-xs text-slate-500">
                    {t('fuelAlerts.overrides.baseline.unit')}
                  </span>
                </div>
              </div>
              <div className="bg-slate-50 rounded-lg border border-slate-200 p-3">
                <label className="block text-xs font-medium text-slate-600">
                  {t('fuelAlerts.overrides.baseline.derived')}
                </label>
                <p className="mt-1 text-sm font-semibold text-slate-900 tabular-nums">
                  {derivedDisplay != null
                    ? `${derivedDisplay} ${t('fuelAlerts.overrides.baseline.unit')}`
                    : '—'}
                </p>
              </div>
            </div>
          </div>

          {/* Fuel type + tank capacity grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
                {t('fuelAlerts.overrides.fuelType.label')}
              </label>
              <select
                value={fuelType}
                onChange={(e) => setFuelType(e.target.value as FuelType | '')}
                className="mt-1 w-full px-3 py-2 text-sm text-slate-900 border border-slate-300 rounded-lg bg-white focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
              >
                <option value="">
                  {t('fuelAlerts.overrides.fuelType.notSet')}
                </option>
                {FUEL_TYPES.map((ft) => (
                  <option key={ft} value={ft}>
                    {t(`fuelAlerts.overrides.fuelType.${ft}`)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
                {t('fuelAlerts.overrides.tankCapacity.label')}
              </label>
              <div className="mt-1 flex items-baseline gap-2">
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={tankCapacity}
                  onChange={(e) => setTankCapacity(e.target.value)}
                  className="w-24 px-3 py-2 text-sm font-semibold text-slate-900 tabular-nums border border-slate-300 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 bg-white"
                />
                <span className="text-xs text-slate-500">
                  {t('fuelAlerts.overrides.tankCapacity.unit')}
                </span>
              </div>
            </div>
          </div>

          {/* Save */}
          <div className="flex items-center justify-end pt-1">
            <button
              type="button"
              onClick={() => void save()}
              disabled={!dirty || saving}
              className="px-4 py-2 text-sm font-semibold rounded-lg bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {saving
                ? t('fuelAlerts.overrides.saving')
                : t('fuelAlerts.overrides.save')}
            </button>
          </div>

          {/* Per-rule overrides (read-only) */}
          <div className="pt-4 border-t border-slate-100">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              {t('fuelAlerts.overrides.rulesTitle')}
            </p>
            {overrides.length === 0 ? (
              <p className="mt-2 text-xs text-slate-500">
                {t('fuelAlerts.overrides.rulesEmpty')}
              </p>
            ) : (
              <ul className="mt-2 divide-y divide-slate-100 border border-slate-200 rounded-lg">
                {overrides.map((o) => (
                  <li
                    key={o.id.ruleCode}
                    className="px-3 py-2 flex items-center justify-between gap-3 text-sm"
                  >
                    <span className="text-slate-800 truncate">
                      {t(`fuelAlerts.rules.${o.id.ruleCode}.title`, {
                        defaultValue: o.id.ruleCode,
                      })}
                    </span>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                          o.enabled
                            ? 'bg-emerald-50 text-confirm-700 border border-emerald-200'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {o.enabled
                          ? t('fuelAlerts.overrides.ruleOn')
                          : t('fuelAlerts.overrides.ruleOff')}
                      </span>
                      {o.thresholdJson && (
                        <span className="font-mono text-[10px] text-slate-500 truncate max-w-[140px]">
                          {o.thresholdJson}
                        </span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
