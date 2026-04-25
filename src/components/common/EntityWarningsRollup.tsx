import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronRight, ChevronDown, AlertTriangle, Fuel, Wrench } from 'lucide-react';
import type { EntityWarning } from '../../types/entityWarning';
import { compareWarnings } from '../../types/entityWarning';
import type { Severity } from '../../types/severity';
import { worstSeverity } from '../../utils/severity';
import RelativeTime from './RelativeTime';

interface Props {
  warnings: EntityWarning[];
  entityType: 'truck' | 'driver';
  /** Called when the user clicks a row's CTA. Receives the warning so the
   *  parent can switch to the right tab (and optionally scroll/highlight). */
  onNavigate: (warning: EntityWarning) => void;
  /** When true, collapse warnings into per-kind groups (Belgeler / Yakıt /
   *  Bakım) with summary headers and inline expand. Use for entities that
   *  span all 3 domains (trucks). Default false — drivers only have docs,
   *  so per-row rendering is fine. */
  groupByKind?: boolean;
}

type WarningKind = EntityWarning['kind'];

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

const KIND_ORDER: WarningKind[] = ['doc', 'fuel', 'maintenance'];

/**
 * Per-entity warnings rollup: shows docs + fuel + maintenance issues for one
 * truck or driver in a single triage card. Mirrors the dashboard
 * PriorityBriefing's row layout but scoped to one entity. Per-row CTA hands
 * navigation back to the parent so the rollup stays page-agnostic.
 *
 * When `groupByKind` is enabled, the card collapses warnings into per-domain
 * groups (one row per kind: doc / fuel / maintenance) with a summary header
 * and inline expand. Critical-containing groups start expanded so the
 * manager sees what's wrong without an extra click.
 */
export default function EntityWarningsRollup({
  warnings,
  entityType,
  onNavigate,
  groupByKind = false,
}: Props) {
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
        {groupByKind ? (
          <GroupedBody warnings={sorted} t={t} onNavigate={onNavigate} />
        ) : (
          sorted.map((w, i) => (
            <RollupRow
              key={`${w.kind}-${rowKey(w)}-${i}`}
              warning={w}
              t={t}
              onNavigate={onNavigate}
            />
          ))
        )}
      </div>
    </section>
  );
}

interface GroupedBodyProps {
  warnings: EntityWarning[];
  t: ReturnType<typeof useTranslation>['t'];
  onNavigate: (w: EntityWarning) => void;
}

/** Renders the rollup's body grouped by `kind`. Each domain becomes one
 *  collapsible group; critical-containing groups start open. */
function GroupedBody({ warnings, t, onNavigate }: GroupedBodyProps) {
  const groups = useMemo(() => {
    const byKind = new Map<WarningKind, EntityWarning[]>();
    for (const w of warnings) {
      const arr = byKind.get(w.kind) ?? [];
      arr.push(w);
      byKind.set(w.kind, arr);
    }
    return KIND_ORDER
      .filter((k) => byKind.has(k))
      .map((k) => ({ kind: k, items: byKind.get(k)! }));
  }, [warnings]);

  // Per-group open state. Initialise from the first render's "any critical?"
  // check so groups with urgent items are open by default. Subsequent toggles
  // are user-driven and override the initial state.
  const [openByKind, setOpenByKind] = useState<Record<WarningKind, boolean>>(
    () => ({
      doc: groups.find((g) => g.kind === 'doc')?.items.some((w) => w.severity === 'CRITICAL') ?? false,
      fuel: groups.find((g) => g.kind === 'fuel')?.items.some((w) => w.severity === 'CRITICAL') ?? false,
      maintenance: groups.find((g) => g.kind === 'maintenance')?.items.some((w) => w.severity === 'CRITICAL') ?? false,
    }),
  );

  return (
    <>
      {groups.map(({ kind, items }) => (
        <KindGroup
          key={kind}
          kind={kind}
          items={items}
          open={openByKind[kind]}
          onToggle={() => setOpenByKind((s) => ({ ...s, [kind]: !s[kind] }))}
          t={t}
          onNavigate={onNavigate}
        />
      ))}
    </>
  );
}

interface KindGroupProps {
  kind: WarningKind;
  items: EntityWarning[];
  open: boolean;
  onToggle: () => void;
  t: ReturnType<typeof useTranslation>['t'];
  onNavigate: (w: EntityWarning) => void;
}

function KindGroup({ kind, items, open, onToggle, t, onNavigate }: KindGroupProps) {
  const sev = worstSeverity(items);
  const critical = items.filter((w) => w.severity === 'CRITICAL').length;
  const warning = items.filter((w) => w.severity === 'WARNING').length;
  const info = items.filter((w) => w.severity === 'INFO').length;

  const navigateForGroup = () => {
    // Use the first item (worst-sorted) as the navigation target — caller's
    // onNavigate routes per-kind, not per-item, so this works.
    onNavigate(items[0]);
  };

  return (
    <div>
      {/* Group header — click body toggles open; CTA + chevron on the right
          stop propagation and route to the canonical surface. */}
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className={`group w-full text-left transition-colors flex items-stretch ${ROW_BG_CLASS[sev]}`}
      >
        <span className={`w-1 flex-shrink-0 ${STRIPE_CLASS[sev]}`} aria-hidden="true" />
        <div className="flex-1 flex items-center gap-3 px-4 py-3.5">
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${ICON_WRAP_CLASS[sev]}`}>
            {kind === 'doc' && <AlertTriangle className="w-4 h-4" />}
            {kind === 'fuel' && <Fuel className="w-4 h-4" />}
            {kind === 'maintenance' && <Wrench className="w-4 h-4" />}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-900">
              {t(`entityWarnings.kind.${kind}`)}
              <span className="ml-2 text-xs font-normal text-slate-500">
                {formatCounts(critical, warning, info, t)}
              </span>
            </p>
          </div>
          {open ? (
            <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0 group-hover:text-slate-600 transition-colors" />
          ) : (
            <ChevronRight className="w-4 h-4 text-slate-400 flex-shrink-0 group-hover:text-slate-600 transition-colors" />
          )}
        </div>
      </button>

      {/* Group CTA shortcut — small inline link on the second line of the
          header so users can jump to the canonical surface without
          expanding first. Visible only when collapsed. */}
      {!open && (
        <div className="px-4 pb-2 -mt-2 flex justify-end">
          <button
            type="button"
            onClick={navigateForGroup}
            className="text-xs font-semibold text-primary-600 hover:text-primary-700 transition-colors"
          >
            {ctaTextForKind(kind, t)} →
          </button>
        </div>
      )}

      {open && (
        <div className="bg-slate-50/40 border-t border-slate-100 divide-y divide-slate-100">
          {items.map((w, i) => (
            <RollupRow
              key={`${w.kind}-${rowKey(w)}-${i}`}
              warning={w}
              t={t}
              onNavigate={onNavigate}
              indent
            />
          ))}
        </div>
      )}
    </div>
  );
}

function formatCounts(
  critical: number,
  warning: number,
  info: number,
  t: ReturnType<typeof useTranslation>['t'],
): string {
  const parts: string[] = [];
  if (critical > 0) parts.push(t('entityWarnings.counts.critical', { count: critical }));
  if (warning > 0) parts.push(t('entityWarnings.counts.warning', { count: warning }));
  if (info > 0) parts.push(t('entityWarnings.counts.info', { count: info }));
  return parts.join(' · ');
}

function ctaTextForKind(kind: WarningKind, t: ReturnType<typeof useTranslation>['t']): string {
  if (kind === 'doc') return t('entityWarnings.goToDocs');
  if (kind === 'fuel') return t('entityWarnings.goToFuel');
  return t('entityWarnings.goToMaintenance');
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
  /** When true, indent and downplay icon — used inside grouped expansion. */
  indent?: boolean;
}

function RollupRow({ warning, t, onNavigate, indent }: RollupRowProps) {
  const sev = warning.severity;
  return (
    <button
      type="button"
      onClick={() => onNavigate(warning)}
      className={`group w-full text-left transition-colors flex items-stretch ${ROW_BG_CLASS[sev]}`}
    >
      <span className={`w-1 flex-shrink-0 ${STRIPE_CLASS[sev]}`} aria-hidden="true" />
      <div className={`flex-1 flex items-center gap-3 px-4 py-3 ${indent ? 'pl-12' : 'py-3.5'}`}>
        {!indent && (
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${ICON_WRAP_CLASS[sev]}`}>
            {warning.kind === 'doc' && <AlertTriangle className="w-4 h-4" />}
            {warning.kind === 'fuel' && <Fuel className="w-4 h-4" />}
            {warning.kind === 'maintenance' && <Wrench className="w-4 h-4" />}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-900 truncate">
            {labelFor(warning, t)}
          </p>
        </div>
        <span className={`text-xs whitespace-nowrap ${PILL_CLASS[sev]}`}>
          {timePillFor(warning, t)}
        </span>
        {!indent && (
          <span className="text-xs text-slate-500 whitespace-nowrap">
            {ctaTextFor(warning, t)}
          </span>
        )}
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
