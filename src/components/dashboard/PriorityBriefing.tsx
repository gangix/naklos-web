import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Truck, Users, Fuel } from 'lucide-react';

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
}

type Tone = 'urgent' | 'attention' | 'info';

function toneFromDays(daysLeft: number | null): Tone {
  if (daysLeft === null) return 'info';
  if (daysLeft <= 7) return 'urgent';
  return 'attention';
}

const stripeClass: Record<Tone, string> = {
  urgent: 'bg-urgent-500',
  attention: 'bg-attention-500',
  info: 'bg-info-500',
};

const dayPillClass: Record<Tone, string> = {
  urgent: 'text-urgent-700',
  attention: 'text-attention-700',
  info: 'text-slate-500',
};

/** "Bugün incelemelerin" — merged fuel aggregate + per-entity doc warnings.
 *  Replaces the old Section B/C split on the dashboard. */
export default function PriorityBriefing({ warningGroups, fuelAttentionCount, fuelEnabled }: Props) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const showFuelRow = fuelEnabled && fuelAttentionCount > 0;
  const totalCount = (showFuelRow ? 1 : 0) + warningGroups.length;

  // Memoize so React doesn't reshuffle on every render of the parent.
  const rows = useMemo(() => warningGroups, [warningGroups]);

  if (totalCount === 0) return null;

  return (
    <section className="mb-6">
      <div className="flex items-baseline justify-between gap-3 mb-3 flex-wrap">
        <h2 className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
          {t('dashboard.priority.title')}
        </h2>
        <span className="text-xs text-slate-500 tabular-nums">
          {t('dashboard.priority.count', { count: totalCount })}
        </span>
      </div>

      <div className="bg-white rounded-xl shadow-card border border-slate-200 overflow-hidden divide-y divide-slate-100">
        {showFuelRow && (
          <button
            type="button"
            onClick={() => navigate('/manager/fuel-alerts')}
            className="group w-full text-left hover:bg-slate-50/60 transition-colors flex items-stretch"
          >
            <span className="w-1 bg-urgent-500 flex-shrink-0" aria-hidden="true" />
            <div className="flex-1 flex items-center gap-3 px-4 py-3.5">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 bg-urgent-50 text-urgent-600">
                <Fuel className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-900">
                  {t('dashboard.priority.fuelRow', { count: fuelAttentionCount })}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {t('dashboard.priority.fuelSubtitle')}
                </p>
              </div>
              <span className="text-xs font-bold text-urgent-700 whitespace-nowrap">
                {t('dashboard.priority.open')}
              </span>
              <ChevronRight className="w-4 h-4 text-slate-400 flex-shrink-0 group-hover:text-slate-600" />
            </div>
          </button>
        )}

        {rows.map((group) => {
          const tone = toneFromDays(group.worstDaysLeft);
          const isTruck = group.entity === 'truck';
          const href = isTruck
            ? `/manager/trucks/${group.entityId}`
            : `/manager/drivers/${group.entityId}`;
          const docsSummary = group.items.map((i) => t(i.labelKey)).join(', ');

          return (
            <button
              key={`${group.entity}-${group.entityId}`}
              type="button"
              onClick={() => navigate(href)}
              className="group w-full text-left hover:bg-slate-50/60 transition-colors flex items-stretch"
            >
              <span className={`w-1 flex-shrink-0 ${stripeClass[tone]}`} aria-hidden="true" />
              <div className="flex-1 flex items-center gap-3 px-4 py-3.5">
                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    isTruck ? 'bg-blue-50 text-blue-500' : 'bg-emerald-50 text-emerald-500'
                  }`}
                >
                  {isTruck ? <Truck className="w-4 h-4" /> : <Users className="w-4 h-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate">{group.name}</p>
                  <p className="text-xs text-slate-500 truncate">
                    {t('dashboard.priority.docList', {
                      count: group.items.length,
                      labels: docsSummary,
                    })}
                  </p>
                </div>
                <DayLabel value={group.worstDaysLeft} t={t} tone={tone} />
                <ChevronRight className="w-4 h-4 text-slate-400 flex-shrink-0 group-hover:text-slate-600" />
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}

interface DayLabelProps {
  value: number | null;
  t: ReturnType<typeof useTranslation>['t'];
  tone: Tone;
}

/** Compact day-counter label: "2g geçti", "3 gün", "bugün", "tarih eksik".
 *  Shorter than the old DayCount so it fits alongside the row's text on
 *  tighter viewports. */
function DayLabel({ value, t, tone }: DayLabelProps) {
  const label =
    value === null ? t('common.dateMissing')
    : value < 0 ? t('common.daysExpiredShort', { count: Math.abs(value) })
    : value === 0 ? t('common.today')
    : t('common.daysRemainingShort', { count: value });

  return (
    <span className={`text-xs font-bold whitespace-nowrap tabular-nums ${dayPillClass[tone]}`}>
      {label}
    </span>
  );
}
