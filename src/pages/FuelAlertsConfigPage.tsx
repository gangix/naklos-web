import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { ArrowLeft, ChevronDown, ChevronRight } from 'lucide-react';
import { useFleet } from '../contexts/FleetContext';
import { fuelAnomalyApi } from '../services/fuelAnomalyApi';
import FuelSectionNav from '../components/fuel/FuelSectionNav';
import {
  RULE_CODES,
  RULE_SEVERITY,
  SEVERITY_DOT_CLASS,
  type FleetAnomalyRuleConfig,
  type FleetAnomalySettings,
  type RuleCode,
} from '../types/fuelAnomaly';
import {
  RULE_SCHEMAS,
  normalizeThresholdValues,
  parseThresholdJson,
  serializeThresholdJson,
  type FieldValues,
} from '../utils/anomalyRuleSchema';
import RuleThresholdFields from '../components/fuel-alerts/RuleThresholdFields';

type SaveState = 'idle' | 'saving' | 'saved' | 'error';

// ─── SettingRow: shared shell for a label/hint + control row ───────────────
interface SettingRowProps {
  label: string;
  hint?: string;
  children: ReactNode;
}

function SettingRow({ label, hint, children }: SettingRowProps) {
  return (
    <div className="flex items-start justify-between gap-4 px-5 py-4">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-slate-900">{label}</p>
        {hint && <p className="text-xs text-slate-500 mt-0.5">{hint}</p>}
      </div>
      {children}
    </div>
  );
}

// ─── Reusable switch atom ──────────────────────────────────────────────────
interface SwitchProps {
  checked: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
  label?: string;
  size?: 'sm' | 'md';
}

function Switch({ checked, onChange, disabled, label, size = 'md' }: SwitchProps) {
  const dim = size === 'sm'
    ? { track: 'w-9 h-5', knob: 'w-3.5 h-3.5', knobOn: 'translate-x-4' }
    : { track: 'w-11 h-6', knob: 'w-4 h-4', knobOn: 'translate-x-5' };
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex shrink-0 items-center ${dim.track} rounded-full transition-colors ${
        checked ? 'bg-primary-600' : 'bg-slate-300'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      <span
        className={`inline-block ${dim.knob} rounded-full bg-white shadow transform transition-transform ${
          checked ? dim.knobOn : 'translate-x-1'
        }`}
      />
    </button>
  );
}

// ─── Fleet settings section ────────────────────────────────────────────────
interface SettingsSectionProps {
  fleetId: string;
  initial: FleetAnomalySettings;
  onSaved: (next: FleetAnomalySettings) => void;
}

function SettingsSection({ fleetId, initial, onSaved }: SettingsSectionProps) {
  const { t } = useTranslation();
  const [enabled, setEnabled] = useState(initial.enabled);
  const [digestHour, setDigestHour] = useState(initial.digestHour);
  const [instantCritical, setInstantCritical] = useState(initial.instantCriticalEmail);
  const [state, setState] = useState<SaveState>('idle');

  const dirty =
    enabled !== initial.enabled ||
    digestHour !== initial.digestHour ||
    instantCritical !== initial.instantCriticalEmail;

  const save = useCallback(async () => {
    setState('saving');
    try {
      const updated = await fuelAnomalyApi.updateSettings(fleetId, {
        enabled,
        digestHour,
        instantCriticalEmail: instantCritical,
      });
      setState('saved');
      onSaved(updated);
      toast.success(t('fuelAlerts.config.settings.saved'), {
        description: t('fuelAlerts.config.settings.rescanNote'),
      });
      // reset the inline "saved" flash after 2s
      setTimeout(() => setState('idle'), 2000);
    } catch (err) {
      console.error('Save settings failed', err);
      setState('error');
      toast.error(err instanceof Error ? err.message : t('fuelAlerts.toast.loadError'));
    }
  }, [fleetId, enabled, digestHour, instantCritical, onSaved, t]);

  return (
    <section className="bg-white rounded-xl border border-slate-200 shadow-sm">
      <header className="px-5 pt-5 pb-3 border-b border-slate-100">
        <h2 className="text-lg font-extrabold tracking-tight text-slate-900">
          {t('fuelAlerts.config.settings.title')}
        </h2>
      </header>

      <div className="divide-y divide-slate-100">
        <SettingRow
          label={t('fuelAlerts.config.settings.enabled.label')}
          hint={t('fuelAlerts.config.settings.enabled.hint')}
        >
          <Switch
            checked={enabled}
            onChange={setEnabled}
            label={t('fuelAlerts.config.settings.enabled.label')}
          />
        </SettingRow>

        <SettingRow
          label={t('fuelAlerts.config.settings.digestHour.label')}
          hint={t('fuelAlerts.config.settings.digestHour.hint')}
        >
          <input
            type="number"
            min={0}
            max={23}
            value={digestHour}
            onChange={(e) => {
              const n = Number(e.target.value);
              if (Number.isFinite(n)) setDigestHour(Math.max(0, Math.min(23, Math.floor(n))));
            }}
            className="w-20 px-3 py-1.5 text-sm font-semibold text-slate-900 tabular-nums text-right border border-slate-300 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
          />
        </SettingRow>

        <SettingRow
          label={t('fuelAlerts.config.settings.instantCriticalEmail.label')}
          hint={t('fuelAlerts.config.settings.instantCriticalEmail.hint')}
        >
          <Switch
            checked={instantCritical}
            onChange={setInstantCritical}
            label={t('fuelAlerts.config.settings.instantCriticalEmail.label')}
          />
        </SettingRow>

        {/* Read-only (not yet editable) */}
        <div className="px-5 py-4 bg-slate-50/60">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            {t('fuelAlerts.config.settings.readOnly.title')}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            {t('fuelAlerts.config.settings.readOnly.hint')}
          </p>
          <dl className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <dt className="text-slate-500">workingHoursJson</dt>
              <dd className="mt-1 font-mono text-slate-700 truncate">
                {initial.workingHoursJson || '—'}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">digestRecipients</dt>
              <dd className="mt-1 font-mono text-slate-700 truncate">
                {initial.digestRecipients.length > 0
                  ? initial.digestRecipients.join(', ')
                  : '—'}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      <footer className="px-5 py-3 border-t border-slate-100 flex items-center justify-end gap-3">
        {state === 'saved' && (
          <span className="text-xs font-medium text-confirm-600">
            {t('fuelAlerts.config.settings.saved')}
          </span>
        )}
        <button
          type="button"
          onClick={() => void save()}
          disabled={!dirty || state === 'saving'}
          className="px-4 py-2 text-sm font-semibold rounded-lg bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {state === 'saving'
            ? t('fuelAlerts.config.settings.saving')
            : t('fuelAlerts.config.settings.save')}
        </button>
      </footer>
    </section>
  );
}

// ─── Single rule row ───────────────────────────────────────────────────────
interface RuleRowProps {
  fleetId: string;
  ruleCode: RuleCode;
  initial: FleetAnomalyRuleConfig | null;
  onSaved: (next: FleetAnomalyRuleConfig) => void;
}

function RuleRow({ fleetId, ruleCode, initial, onSaved }: RuleRowProps) {
  const { t } = useTranslation();
  const schema = RULE_SCHEMAS[ruleCode];
  const hasFields = schema.length > 0;
  const [enabled, setEnabled] = useState(initial?.enabled ?? true);
  const [notify, setNotify] = useState(initial?.notify ?? true);
  const [values, setValues] = useState<FieldValues>(() =>
    parseThresholdJson(ruleCode, initial?.thresholdJson),
  );
  const [expanded, setExpanded] = useState(false);
  const [state, setState] = useState<SaveState>('idle');

  const initialValues = useMemo(
    () => parseThresholdJson(ruleCode, initial?.thresholdJson),
    [ruleCode, initial?.thresholdJson],
  );
  const valuesDirty = useMemo(
    () => schema.some((f) => values[f.key] !== initialValues[f.key]),
    [schema, values, initialValues],
  );
  const dirty =
    enabled !== (initial?.enabled ?? true) ||
    notify !== (initial?.notify ?? true) ||
    valuesDirty;

  const save = useCallback(async () => {
    setState('saving');
    // Normalize once so the local form state matches exactly what's persisted.
    // Without this, typing e.g. 30.7 rounds to 31 server-side but the UI keeps
    // 30.7, and the dirty flag stays stuck at "unsaved changes".
    const normalized = normalizeThresholdValues(ruleCode, values);
    try {
      const updated = await fuelAnomalyApi.updateRule(fleetId, ruleCode, {
        enabled,
        notifyEnabled: notify,
        thresholdJson: serializeThresholdJson(ruleCode, normalized),
      });
      setState('saved');
      setValues(normalized);
      onSaved(updated);
      toast.success(t('fuelAlerts.config.rules.saved'), {
        description: t('fuelAlerts.config.rules.rescanNote'),
      });
      setTimeout(() => setState('idle'), 2000);
    } catch (err) {
      console.error(`Save rule ${ruleCode} failed`, err);
      setState('error');
      toast.error(err instanceof Error ? err.message : t('fuelAlerts.toast.loadError'));
    }
  }, [fleetId, ruleCode, enabled, notify, values, onSaved, t]);

  const severity = RULE_SEVERITY[ruleCode];
  const title = t(`fuelAlerts.rules.${ruleCode}.title`, { defaultValue: ruleCode });
  const desc = t(`fuelAlerts.config.rules.${ruleCode}.desc`, { defaultValue: '' });

  return (
    <div className="border-b border-slate-100 last:border-b-0">
      {/* Row */}
      <div className="px-5 py-4 flex items-start gap-4">
        <span
          className={`mt-1.5 flex-shrink-0 w-2.5 h-2.5 rounded-full ${SEVERITY_DOT_CLASS[severity]}`}
          aria-label={severity}
        />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-slate-900">{title}</p>
          {desc && (
            <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{desc}</p>
          )}

          {/* Toggle group */}
          <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2">
            <label className="inline-flex items-center gap-2 text-xs font-medium text-slate-600 cursor-pointer">
              <Switch checked={enabled} onChange={setEnabled} size="sm" label={t('fuelAlerts.config.rules.enabled')} />
              {t('fuelAlerts.config.rules.enabled')}
            </label>
            <label className="inline-flex items-center gap-2 text-xs font-medium text-slate-600 cursor-pointer">
              <Switch
                checked={notify}
                onChange={setNotify}
                size="sm"
                disabled={!enabled}
                label={t('fuelAlerts.config.rules.notify')}
              />
              {t('fuelAlerts.config.rules.notify')}
            </label>
            {hasFields && (
              <button
                type="button"
                onClick={() => setExpanded((v) => !v)}
                className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-slate-900"
              >
                {expanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                {t('fuelAlerts.config.rules.threshold')}
              </button>
            )}
          </div>
        </div>
      </div>

      {hasFields && expanded && (
        <div className="px-5 pb-4 pt-1 border-t border-slate-100 bg-slate-50/40">
          <RuleThresholdFields
            fields={schema}
            values={values}
            onChange={setValues}
            disabled={!enabled}
          />
        </div>
      )}

      {/* Save row */}
      {(dirty || state === 'saved') && (
        <div className="px-5 pb-4 flex items-center justify-end gap-3">
          {state === 'saved' && (
            <span className="text-xs font-medium text-confirm-600">
              {t('fuelAlerts.config.rules.saved')}
            </span>
          )}
          <button
            type="button"
            onClick={() => void save()}
            disabled={state === 'saving'}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-900 text-white hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {state === 'saving'
              ? t('fuelAlerts.config.settings.saving')
              : t('fuelAlerts.config.rules.save')}
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────
export default function FuelAlertsConfigPage() {
  const { t } = useTranslation();
  const { fleetId } = useFleet();
  const [settings, setSettings] = useState<FleetAnomalySettings | null>(null);
  const [rules, setRules] = useState<FleetAnomalyRuleConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!fleetId) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    fuelAnomalyApi.getConfig(fleetId)
      .then((data) => {
        if (cancelled) return;
        setSettings(data.settings);
        setRules(data.rules ?? []);
      })
      .catch((err) => {
        if (cancelled) return;
        console.error('Failed to load anomaly config', err);
        setError(err instanceof Error ? err.message : t('fuelAlerts.toast.loadError'));
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [fleetId, t]);

  // Index rules by code for O(1) lookup when rendering the 12 fixed rows
  const ruleByCode = useMemo(() => {
    const m = new Map<string, FleetAnomalyRuleConfig>();
    for (const r of rules) m.set(r.id.ruleCode, r);
    return m;
  }, [rules]);

  const handleRuleSaved = useCallback((next: FleetAnomalyRuleConfig) => {
    setRules((prev) => {
      const idx = prev.findIndex((r) => r.id.ruleCode === next.id.ruleCode);
      if (idx === -1) return [...prev, next];
      const copy = prev.slice();
      copy[idx] = next;
      return copy;
    });
  }, []);

  if (!fleetId) return null;

  return (
    <div className="min-h-screen bg-warm">
      <div className="p-6 max-w-4xl mx-auto space-y-6 pb-20">
        <FuelSectionNav />

        {/* Page header */}
        <div>
          <Link
            to="/manager/fuel-alerts"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            {t('fuelAlerts.config.backToList')}
          </Link>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900">
            {t('fuelAlerts.config.pageTitle')}
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            {t('fuelAlerts.config.subtitle')}
          </p>
        </div>

        {/* Loading */}
        {loading && (
          <div className="space-y-3">
            <div className="h-48 bg-white rounded-xl border border-slate-200 animate-pulse" />
            <div className="h-96 bg-white rounded-xl border border-slate-200 animate-pulse" />
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div className="bg-urgent-50 border border-urgent-200 rounded-xl p-5">
            <p className="text-sm font-semibold text-urgent-700">
              {t('fuelAlerts.toast.loadError')}
            </p>
            <p className="mt-1 text-xs text-urgent-600">{error}</p>
          </div>
        )}

        {/* Content */}
        {!loading && !error && settings && (
          <>
            <SettingsSection
              fleetId={fleetId}
              initial={settings}
              onSaved={setSettings}
            />

            <section className="bg-white rounded-xl border border-slate-200 shadow-sm">
              <header className="px-5 pt-5 pb-3 border-b border-slate-100">
                <h2 className="text-lg font-extrabold tracking-tight text-slate-900">
                  {t('fuelAlerts.config.rules.title')}
                </h2>
                <p className="mt-0.5 text-xs text-slate-500">
                  {t('fuelAlerts.config.rules.subtitle')}
                </p>
              </header>
              <div>
                {RULE_CODES.map((code) => (
                  <RuleRow
                    key={code}
                    fleetId={fleetId}
                    ruleCode={code}
                    initial={ruleByCode.get(code) ?? null}
                    onSaved={handleRuleSaved}
                  />
                ))}
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
}
