import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronRight, AlertTriangle, Fuel, Wrench } from 'lucide-react';
import type { EntityWarning } from '../../types/entityWarning';
import { compareWarnings } from '../../types/entityWarning';
import type { Severity } from '../../types/severity';
import RelativeTime from './RelativeTime';

interface Props {
  warnings: EntityWarning[];
  entityType: 'truck' | 'driver';
  /** Called when the user clicks a row's CTA. Receives the warning so the
   *  parent can switch to the right tab (and optionally scroll/highlight). */
  onNavigate: (warning: EntityWarning) => void;
}

const STRIPE_CLASS: Record<Severity, string> = {
  CRITICAL: 'bg-urgent-500',
  WARNING: 'bg-attention-500',
  INFO: 'bg-info-500',
};

const ROW_BG_CLASS: Record<Severity, string> = {
  CRITICAL: 'bg-urgent-50/50 hover:bg-urgent-50',
  WARNING: 'hover:bg-slate-50/70',
  INFO: 'hover:bg-slate-50/70',
};

const ICON_WRAP_CLASS: Record<Severity, string> = {
  CRITICAL: 'bg-urgent-100 text-urgent-600',
  WARNING: 'bg-attention-50 text-attention-600',
  INFO: 'bg-info-50 text-info-600',
};

const PILL_CLASS: Record<Severity, string> = {
  CRITICAL: 'bg-urgent-100 text-urgent-700 px-2 py-0.5 rounded-md font-bold tabular-nums',
  WARNING: 'text-attention-700 font-bold tabular-nums',
  INFO: 'text-slate-500 font-bold tabular-nums',
};

/**
 * Per-entity warnings rollup: shows docs + fuel + maintenance issues for one
 * truck or driver in a single triage card. Mirrors the dashboard
 * PriorityBriefing's row layout but scoped to one entity. Per-row CTA hands
 * navigation back to the parent so the rollup stays page-agnostic.
 */
export default function EntityWarningsRollup({ warnings, entityType, onNavigate }: Props) {
  const { t } = useTranslation();

  const sorted = useMemo(() => [...warnings].sort(compareWarnings), [warnings]);
  const criticalCount = warnings.filter((w) => w.severity === 'CRITICAL').length;

  if (warnings.length === 0) return null;

  return (
    <section className="mb-4">
      <div className="flex items-baseline justify-between gap-3 mb-3 flex-wrap">
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
          {t(`entityWarnings.title.${entityType}`, { count: warnings.length })}
          {criticalCount > 0 && (
            <span className="ml-1.5 text-urgent-700 normal-case tracking-normal">
              {t('entityWarnings.criticalSuffix', { count: criticalCount })}
            </span>
          )}
        </h2>
      </div>

      <div className="bg-white rounded-xl shadow-card border border-slate-200 overflow-hidden divide-y divide-slate-100">
        {sorted.map((w, i) => (
          <RollupRow key={`${w.kind}-${rowKey(w)}-${i}`} warning={w} t={t} onNavigate={onNavigate} />
        ))}
      </div>
    </section>
  );
}

function rowKey(w: EntityWarning): string {
  if (w.kind === 'doc') return w.labelKey;
  if (w.kind === 'fuel') return w.anomalyId;
  return w.scheduleId;
}

interface RollupRowProps {
  warning: EntityWarning;
  t: ReturnType<typeof useTranslation>['t'];
  onNavigate: (w: EntityWarning) => void;
}

function RollupRow({ warning, t, onNavigate }: RollupRowProps) {
  const sev = warning.severity;
  return (
    <button
      type="button"
      onClick={() => onNavigate(warning)}
      className={`group w-full text-left transition-colors flex items-stretch ${ROW_BG_CLASS[sev]}`}
    >
      <span className={`w-1 flex-shrink-0 ${STRIPE_CLASS[sev]}`} aria-hidden="true" />
      <div className="flex-1 flex items-center gap-3 px-4 py-3.5">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${ICON_WRAP_CLASS[sev]}`}>
          {warning.kind === 'doc' && <AlertTriangle className="w-4 h-4" />}
          {warning.kind === 'fuel' && <Fuel className="w-4 h-4" />}
          {warning.kind === 'maintenance' && <Wrench className="w-4 h-4" />}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-900 truncate">
            {labelFor(warning, t)}
          </p>
        </div>
        <span className={`text-xs whitespace-nowrap ${PILL_CLASS[sev]}`}>
          {timePillFor(warning, t)}
        </span>
        <span className="text-xs text-slate-500 whitespace-nowrap">
          {ctaTextFor(warning, t)}
        </span>
        <ChevronRight className="w-4 h-4 text-slate-400 flex-shrink-0 group-hover:text-slate-600 transition-colors" />
      </div>
    </button>
  );
}

function labelFor(w: EntityWarning, t: ReturnType<typeof useTranslation>['t']): string {
  if (w.kind === 'doc') return t(w.labelKey);
  if (w.kind === 'fuel') return `${t('entityWarnings.kind.fuel')}: ${w.ruleCode}`;
  return w.label;
}

function timePillFor(w: EntityWarning, t: ReturnType<typeof useTranslation>['t']): React.ReactNode {
  if (w.kind === 'fuel') {
    return <RelativeTime date={w.detectedAt} />;
  }
  const days = w.kind === 'doc' ? w.daysLeft : w.daysLeft;
  if (days === null) return t('common.dateMissing');
  if (days < 0) return t('common.daysExpiredShort', { count: Math.abs(days) });
  if (days === 0) return t('common.today');
  return t('common.daysRemainingShort', { count: days });
}

function ctaTextFor(w: EntityWarning, t: ReturnType<typeof useTranslation>['t']): string {
  if (w.kind === 'doc') return t('entityWarnings.goToDocs');
  if (w.kind === 'fuel') return t('entityWarnings.goToFuel');
  return t('entityWarnings.goToMaintenance');
}
