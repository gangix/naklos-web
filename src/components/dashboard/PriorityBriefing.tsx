import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Truck, Users, Fuel } from 'lucide-react';
import type { Severity } from '../../types/severity';
import type { FuelPendingBreakdown } from '../../contexts/FuelCountsContext';

export interface PriorityDocItem {
  labelKey: string;
  daysLeft: number | null;
}

export interface PriorityDocGroup {
  entity: 'truck' | 'driver';
  entityId: string;
  name: string;
  items: PriorityDocItem[];
  worstDaysLeft: number | null;
}

interface Props {
  /** Doc-expiry groups (trucks + drivers with at least one item). Already
   *  sorted by the caller (expired first, then soonest, missing dates last). */
  warningGroups: PriorityDocGroup[];
  /** Total pending fuel alerts across the fleet. Rendered as a single
   *  aggregate row at the top when > 0 — deep per-truck breakdown lives
   *  on the fuel-alerts page. */
  fuelAttentionCount: number;
  /** Hide the fuel row even when count > 0 (e.g. FREE plan with the
   *  anomaly feature gated). */
  fuelEnabled: boolean;
  /** Worst severity across the pending anomaly list — drives the fuel row's
   *  tone so a CRITICAL anomaly paints the row red instead of blue. `null`
   *  means either no anomalies or the aggregate is driven only by
   *  unmatched plates (no severity); the row falls back to info tone. */
  fuelWorstSeverity: Severity | null;
  /** Per-severity counts behind `fuelAttentionCount`. Used to render the
   *  "3 acil · 7 uyarı" micro-summary under the fuel row title — a silent
   *  row of 10 anomalies is an information gap the manager shouldn't have
   *  to click through to close. */
  fuelBreakdown: FuelPendingBreakdown;
}

type Tone = 'urgent' | 'attention' | 'info';

function toneFromDays(daysLeft: number | null): Tone {
  if (daysLeft === null) return 'info';
  if (daysLeft <= 7) return 'urgent';
  return 'attention';
}

function toneFromSeverity(s: Severity | null): Tone {
  if (s === 'CRITICAL') return 'urgent';
  if (s === 'WARNING') return 'attention';
  return 'info';
}

// Tonal system — the whole row (stripe, icon chip, right-side pill, row bg)
// pulls from a single tone so severity reads at a glance without requiring
// the user to parse text. Urgent rows lift out of the surface; attention /
// info recede so the eye lands on what matters first.
const stripeClass: Record<Tone, string> = {
  urgent: 'bg-urgent-500',
  attention: 'bg-attention-500',
  info: 'bg-info-500',
};

const rowBgClass: Record<Tone, string> = {
  // Soft wash — just enough to separate urgent rows from their quieter
  // neighbours. Hover deepens the tint instead of switching palettes.
  urgent: 'bg-urgent-50/50 hover:bg-urgent-50',
  attention: 'hover:bg-slate-50/70',
  info: 'hover:bg-slate-50/70',
};

const iconWrapClass: Record<Tone, string> = {
  urgent: 'bg-urgent-100 text-urgent-600 ring-1 ring-urgent-200/70',
  attention: 'bg-attention-50 text-attention-600',
  info: 'bg-info-50 text-info-600',
};

// Right-side day / "aç" pill — urgent gets a filled chip so the day count
// carries weight equal to the stripe. Attention reads as solid-color text
// (already loud enough). Info stays near-silent.
const pillClass: Record<Tone, string> = {
  urgent:
    'bg-urgent-100 text-urgent-700 px-2 py-0.5 rounded-md font-bold tabular-nums',
  attention: 'text-attention-700 font-bold tabular-nums',
  info: 'text-slate-500 font-bold tabular-nums',
};

const openPillClass: Record<Tone, string> = {
  urgent: 'bg-urgent-100 text-urgent-700 px-2 py-0.5 rounded-md font-bold uppercase tracking-wider',
  attention: 'text-attention-700 font-bold uppercase tracking-wider',
  info: 'text-info-700 font-bold uppercase tracking-wider',
};

/** "Bugün incelemelerin" — merged fuel aggregate + per-entity doc warnings.
 *  Each row's tone (urgent / attention / info) is derived from the most
 *  severe signal behind it, so the card works as a single at-a-glance
 *  triage surface: red = act today, amber = this week, blue = heads-up. */
export default function PriorityBriefing({
  warningGroups,
  fuelAttentionCount,
  fuelEnabled,
  fuelWorstSeverity,
  fuelBreakdown,
}: Props) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const showFuelRow = fuelEnabled && fuelAttentionCount > 0;
  const totalCount = (showFuelRow ? 1 : 0) + warningGroups.length;

  const rows = useMemo(() => warningGroups, [warningGroups]);

  // Count critical items across the whole card so the header can surface
  // "3 acil · 15 konu" when any exist. Doc urgency is tied to days-left
  // (≤7 days = urgent) to mirror toneFromDays.
  const criticalCount = useMemo(() => {
    const fuelCritical =
      showFuelRow && fuelWorstSeverity === 'CRITICAL' ? fuelBreakdown.critical : 0;
    const docCritical = warningGroups.filter(
      (g) => g.worstDaysLeft !== null && g.worstDaysLeft <= 7,
    ).length;
    return fuelCritical + docCritical;
  }, [showFuelRow, fuelWorstSeverity, fuelBreakdown.critical, warningGroups]);

  if (totalCount === 0) return null;

  const fuelTone = toneFromSeverity(fuelWorstSeverity);

  return (
    <section className="mb-6">
      {/* Scoped entrance animation — staggered fade-up on first mount.
          Disabled automatically under prefers-reduced-motion. */}
      <style>{`
        @keyframes pbRowIn {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .pb-row {
          animation: pbRowIn 260ms ease-out both;
        }
        @media (prefers-reduced-motion: reduce) {
          .pb-row { animation: none; }
        }
      `}</style>

      <div className="flex items-baseline justify-between gap-3 mb-3 flex-wrap">
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
          {t('dashboard.priority.title')}
        </h2>
        <span className="text-xs text-slate-500 tabular-nums flex items-center gap-1.5">
          {criticalCount > 0 && (
            <>
              <span className="inline-flex items-center gap-1 font-semibold text-urgent-700">
                <span
                  className="w-1.5 h-1.5 rounded-full bg-urgent-500"
                  aria-hidden="true"
                />
                {t('dashboard.priority.criticalCount', { count: criticalCount })}
              </span>
              <span className="text-slate-300" aria-hidden="true">·</span>
            </>
          )}
          <span>{t('dashboard.priority.count', { count: totalCount })}</span>
        </span>
      </div>

      <div className="bg-white rounded-xl shadow-card border border-slate-200 overflow-hidden divide-y divide-slate-100">
        {showFuelRow && (
          <button
            type="button"
            onClick={() => navigate('/manager/fuel-alerts')}
            style={{ animationDelay: '0ms' }}
            className={`pb-row group w-full text-left transition-colors flex items-stretch ${rowBgClass[fuelTone]}`}
          >
            <span
              className={`w-1 flex-shrink-0 ${stripeClass[fuelTone]}`}
              aria-hidden="true"
            />
            <div className="flex-1 flex items-center gap-3 px-4 py-3.5">
              <div
                className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${iconWrapClass[fuelTone]}`}
              >
                <Fuel className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-900 flex items-center gap-1.5">
                  <span className="truncate">
                    {t('dashboard.priority.fuelRow', { count: fuelAttentionCount })}
                  </span>
                  {fuelTone === 'urgent' && (
                    <span
                      className="inline-block w-1.5 h-1.5 rounded-full bg-urgent-500 flex-shrink-0"
                      aria-hidden="true"
                    />
                  )}
                </p>
                <FuelSubtitle
                  breakdown={fuelBreakdown}
                  t={t}
                />
              </div>
              <span className={`text-xs whitespace-nowrap ${openPillClass[fuelTone]}`}>
                {t('dashboard.priority.open')}
              </span>
              <ChevronRight className="w-4 h-4 text-slate-400 flex-shrink-0 group-hover:text-slate-600 transition-colors" />
            </div>
          </button>
        )}

        {rows.map((group, index) => {
          const tone = toneFromDays(group.worstDaysLeft);
          const isTruck = group.entity === 'truck';
          const href = isTruck
            ? `/manager/trucks/${group.entityId}`
            : `/manager/drivers/${group.entityId}`;
          const docsSummary = group.items.map((i) => t(i.labelKey)).join(', ');
          // Stagger — fuel row (if present) takes slot 0, so doc rows
          // continue from slot 1. Cap at 240ms so long lists don't crawl.
          const slot = (showFuelRow ? 1 : 0) + index;
          const delay = Math.min(slot * 50, 240);

          return (
            <button
              key={`${group.entity}-${group.entityId}`}
              type="button"
              onClick={() => navigate(href)}
              style={{ animationDelay: `${delay}ms` }}
              className={`pb-row group w-full text-left transition-colors flex items-stretch ${rowBgClass[tone]}`}
            >
              <span
                className={`w-1 flex-shrink-0 ${stripeClass[tone]}`}
                aria-hidden="true"
              />
              <div className="flex-1 flex items-center gap-3 px-4 py-3.5">
                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    isTruck ? 'bg-blue-50 text-blue-500' : 'bg-emerald-50 text-emerald-500'
                  }`}
                >
                  {isTruck ? <Truck className="w-4 h-4" /> : <Users className="w-4 h-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900 flex items-center gap-1.5">
                    <span className="truncate">{group.name}</span>
                    {tone === 'urgent' && (
                      <span
                        className="inline-block w-1.5 h-1.5 rounded-full bg-urgent-500 flex-shrink-0"
                        aria-hidden="true"
                      />
                    )}
                  </p>
                  <p className="text-xs text-slate-500 truncate">
                    {t('dashboard.priority.docList', {
                      count: group.items.length,
                      labels: docsSummary,
                    })}
                  </p>
                </div>
                <DayLabel value={group.worstDaysLeft} t={t} tone={tone} />
                <ChevronRight className="w-4 h-4 text-slate-400 flex-shrink-0 group-hover:text-slate-600 transition-colors" />
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}

interface FuelSubtitleProps {
  breakdown: FuelPendingBreakdown;
  t: ReturnType<typeof useTranslation>['t'];
}

/** Severity-aware subtitle: "3 acil · 7 uyarı · 1 bilgi" when the breakdown
 *  has content, falling back to the flat "İncelemeni bekliyor" when the
 *  pending list is empty (unmatched-plate-only aggregate). */
function FuelSubtitle({ breakdown, t }: FuelSubtitleProps) {
  const { critical, warning, info } = breakdown;
  const parts: Array<{ key: string; tone: Tone; text: string }> = [];
  if (critical > 0) {
    parts.push({
      key: 'c',
      tone: 'urgent',
      text: t('dashboard.priority.fuelCritical', { count: critical }),
    });
  }
  if (warning > 0) {
    parts.push({
      key: 'w',
      tone: 'attention',
      text: t('dashboard.priority.fuelWarning', { count: warning }),
    });
  }
  if (info > 0) {
    parts.push({
      key: 'i',
      tone: 'info',
      text: t('dashboard.priority.fuelInfo', { count: info }),
    });
  }

  if (parts.length === 0) {
    return (
      <p className="text-xs text-slate-500 mt-0.5">
        {t('dashboard.priority.fuelSubtitle')}
      </p>
    );
  }

  const toneText: Record<Tone, string> = {
    urgent: 'text-urgent-700 font-semibold',
    attention: 'text-attention-700 font-semibold',
    info: 'text-slate-500',
  };

  return (
    <p className="text-xs mt-0.5 tabular-nums flex items-center gap-1 flex-wrap">
      {parts.map((p, i) => (
        <span key={p.key} className="inline-flex items-center gap-1">
          {i > 0 && (
            <span className="text-slate-300" aria-hidden="true">
              ·
            </span>
          )}
          <span className={toneText[p.tone]}>{p.text}</span>
        </span>
      ))}
    </p>
  );
}

interface DayLabelProps {
  value: number | null;
  t: ReturnType<typeof useTranslation>['t'];
  tone: Tone;
}

/** Compact day-counter: "2g geçti", "3 gün", "bugün", "tarih eksik". Urgent
 *  tone renders as a filled red pill so the day count carries visual weight
 *  equal to the stripe; attention / info stay as coloured text. */
function DayLabel({ value, t, tone }: DayLabelProps) {
  const label =
    value === null
      ? t('common.dateMissing')
      : value < 0
        ? t('common.daysExpiredShort', { count: Math.abs(value) })
        : value === 0
          ? t('common.today')
          : t('common.daysRemainingShort', { count: value });

  return (
    <span className={`text-xs whitespace-nowrap ${pillClass[tone]}`}>
      {label}
    </span>
  );
}
