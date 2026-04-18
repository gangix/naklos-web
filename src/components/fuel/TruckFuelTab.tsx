import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Plus, TrendingUp, TrendingDown } from 'lucide-react';
import { fuelEntryApi } from '../../services/fuelEntryApi';
import { fuelAnomalyApi } from '../../services/fuelAnomalyApi';
import {
  formatCompactCurrency,
  formatCurrency,
  formatDate,
  formatDecimal,
  formatRelativeTime,
} from '../../utils/format';
import {
  efficiencyStatus,
  monthlyRollup,
} from '../../utils/fuelStats';
import EfficiencyStatusPill from './EfficiencyStatusPill';
import i18n from '../../i18n';
import type { TruckFuelEntryDto } from '../../types/fuel';
import type { TruckBaseline } from '../../types/fuelAnomaly';
import FuelEntryRow from './FuelEntryRow';
import FuelEntryFormModal from './FuelEntryFormModal';
import ConfirmActionModal from './ConfirmActionModal';
import ReceiptLightbox from './ReceiptLightbox';

interface Props {
  fleetId: string;
  truckId: string;
  truckPlate: string;
  truckPrimaryFuelType?: TruckFuelEntryDto['fuelType'];
}

export default function TruckFuelTab({ fleetId, truckId, truckPlate, truckPrimaryFuelType }: Props) {
  const { t } = useTranslation();

  const [entries, setEntries] = useState<TruckFuelEntryDto[]>([]);
  const [baseline, setBaseline] = useState<TruckBaseline | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [formModal, setFormModal] = useState<{ mode: 'add' | 'edit'; initial?: TruckFuelEntryDto } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<TruckFuelEntryDto | null>(null);
  const [receiptTarget, setReceiptTarget] = useState<TruckFuelEntryDto | null>(null);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);

  const rowRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const fetchData = useCallback(async () => {
    setLoadError(false);
    try {
      // Baseline is best-effort — the endpoint 404s when the anomaly feature
      // flag is off, and we don't want that to kill the whole tab. Monthly
      // rollup + "this month" stats are computed client-side from the entries
      // list so one fetch feeds everything above.
      const [e, b] = await Promise.all([
        fuelEntryApi.listForTruck(fleetId, truckId),
        fuelAnomalyApi.getBaseline(fleetId, truckId).catch(() => null),
      ]);
      setEntries(e);
      setBaseline(b);
    } catch {
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, [fleetId, truckId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSaved = async () => {
    await fetchData();
    setFormModal(null);
    toast.success(t('fuelEntry.add.submit'));
  };

  const handleDuplicate = (collidingEntryId: string) => {
    setFormModal(null);
    const el = rowRefs.current[collidingEntryId];
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    setHighlightedId(collidingEntryId);
    setTimeout(() => setHighlightedId(null), 2000);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      await fuelEntryApi.deleteManual(fleetId, deleteTarget.id);
      await fetchData();
      toast.success(t('fuelEntry.delete.confirm'));
    } catch {
      toast.error(t('fuelEntry.error.deleteFailed'));
    } finally {
      setDeleteTarget(null);
    }
  };

  // 6-month rollup + derived values — computed once per entries change.
  // IMPORTANT: must live ABOVE the early returns below so the hook count
  // stays constant across loading → ready transitions (Rules of Hooks).
  const derived = useMemo(() => {
    const rollup = monthlyRollup(entries, 6);
    const currentMonth = rollup[rollup.length - 1];
    const previousMonth = rollup[rollup.length - 2];
    const hasAnyFuelData = rollup.some((m) => m.totalLiters > 0);
    return {
      rollup,
      currentMonth,
      previousMonth,
      hasAnyFuelData,
      lastEntry: entries[0] ?? null,
      monthVsPrevPct:
        previousMonth && previousMonth.totalPrice > 0 && currentMonth
          ? Math.round(
              ((currentMonth.totalPrice - previousMonth.totalPrice) /
                previousMonth.totalPrice) *
                100,
            )
          : null,
      maxMonthPrice: Math.max(...rollup.map((m) => m.totalPrice), 1),
      trendTotal: rollup.reduce((s, m) => s + m.totalPrice, 0),
    };
  }, [entries]);

  // --- Loading state ---
  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse bg-gray-200 h-20 rounded-xl" />
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="animate-pulse bg-gray-200 h-12 rounded" />
          ))}
        </div>
      </div>
    );
  }

  // --- Error state ---
  if (loadError) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700 flex items-center justify-between gap-4">
        <span>{t('fuelEntry.loadError')}</span>
        <button
          onClick={() => { setLoading(true); fetchData(); }}
          className="px-3 py-1.5 text-sm font-medium rounded-lg border border-red-300 text-red-700 hover:bg-red-100 transition-colors"
        >
          Tekrar dene
        </button>
      </div>
    );
  }

  // "Şu anki" (actual rolling) and "Hedef" (manual target) — shown side-by-side
  // so the manager can compare at a glance. Null = not enough history yet.
  const actualConsumption = baseline?.derived ?? null;
  const targetConsumption = baseline?.manual ?? null;
  const { status: effStatus, deviationPct } = efficiencyStatus(
    actualConsumption,
    targetConsumption,
  );
  const {
    rollup, currentMonth, previousMonth, lastEntry,
    monthVsPrevPct, maxMonthPrice, hasAnyFuelData,
  } = derived;

  return (
    <div className="space-y-4">
      {/* ============ 1. EFFICIENCY HERO — actual vs target at a glance ============ */}
      <section className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 sm:p-6">
        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-5 items-center">
          <div className="grid grid-cols-2 gap-6">
            {/* Actual — real data, confident black */}
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 mb-2">
                {t('fuelEntry.efficiency.actual')}
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight tabular-nums">
                  {actualConsumption !== null ? formatDecimal(actualConsumption) : '—'}
                </span>
                <span className="text-sm text-gray-500 font-medium">
                  {t('fuelEntry.summary.avgConsumptionUnit')}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {actualConsumption !== null
                  ? t('fuelEntry.efficiency.actualSource')
                  : t('fuelEntry.summary.avgConsumptionEmpty')}
              </p>
            </div>
            {/* Target — optional goal, muted grey */}
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 mb-2">
                {t('fuelEntry.efficiency.target')}
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl sm:text-4xl font-extrabold text-gray-400 tracking-tight tabular-nums">
                  {targetConsumption !== null ? formatDecimal(targetConsumption) : '—'}
                </span>
                <span className="text-sm text-gray-400 font-medium">
                  {t('fuelEntry.summary.avgConsumptionUnit')}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {targetConsumption !== null
                  ? t('fuelEntry.efficiency.targetSource')
                  : t('fuelEntry.efficiency.targetEmpty')}
              </p>
            </div>
          </div>

          {/* Status pill + sparkline */}
          <div className="flex flex-col items-start md:items-end gap-3">
            {actualConsumption !== null && (
              <EfficiencyStatusPill
                status={effStatus}
                deviationPct={deviationPct}
                hasTarget={targetConsumption !== null}
              />
            )}
            {hasAnyFuelData && <Sparkline rollup={rollup} />}
          </div>
        </div>
      </section>

      {/* ============ 2. BU AY + SON DOLUM ============ */}
      <section className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
              {t('fuelEntry.thisMonth.label')}
            </span>
            {monthVsPrevPct !== null && (
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold tabular-nums ${
                  monthVsPrevPct > 0
                    ? 'bg-red-50 text-red-700'
                    : 'bg-emerald-50 text-emerald-700'
                }`}
              >
                {monthVsPrevPct > 0 ? (
                  <TrendingUp className="w-3 h-3" strokeWidth={2.5} />
                ) : (
                  <TrendingDown className="w-3 h-3" strokeWidth={2.5} />
                )}
                %{Math.abs(monthVsPrevPct)}
              </span>
            )}
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight tabular-nums">
            {currentMonth ? formatCurrency(currentMonth.totalPrice) : '—'}
          </div>
          {currentMonth && (
            <div className="mt-2 flex items-center gap-3 text-xs text-gray-500 tabular-nums">
              <span>
                <span className="font-semibold text-gray-700">{currentMonth.fillCount}</span>{' '}
                {t('fuelEntry.thisMonth.fills')}
              </span>
              <span>·</span>
              <span>
                <span className="font-semibold text-gray-700">
                  {formatDecimal(currentMonth.totalLiters, 0)}
                </span>{' '}
                L
              </span>
            </div>
          )}
          {previousMonth && previousMonth.fillCount > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-100 text-xs text-gray-500">
              {t('fuelEntry.thisMonth.lastMonth')}:{' '}
              <span className="font-semibold text-gray-700 tabular-nums">
                {formatCurrency(previousMonth.totalPrice)}
              </span>
              {' · '}
              <span className="tabular-nums">
                {previousMonth.fillCount} {t('fuelEntry.thisMonth.fills')}
              </span>
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
              {t('fuelEntry.lastFuel.label')}
            </span>
            {lastEntry && (
              <span className="text-[10px] text-gray-400">
                {formatRelativeTime(lastEntry.occurredAt)}
              </span>
            )}
          </div>
          {lastEntry ? (
            <>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight tabular-nums">
                  {formatDecimal(parseFloat(lastEntry.liters))}
                </span>
                <span className="text-sm text-gray-500 font-medium">L</span>
                <span className="ml-auto text-xl font-bold text-gray-700 tabular-nums">
                  {formatCurrency(parseFloat(lastEntry.totalPrice))}
                </span>
              </div>
              <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
                <span className="tabular-nums">{formatDate(lastEntry.occurredAt)}</span>
                {lastEntry.stationName && (
                  <>
                    <span>·</span>
                    <span className="truncate">{lastEntry.stationName}</span>
                  </>
                )}
              </div>
            </>
          ) : (
            <div className="text-sm text-gray-400">{t('fuelEntry.empty')}</div>
          )}
        </div>
      </section>

      {/* ============ 3. 6-MONTH TREND STRIP ============ */}
      {hasAnyFuelData && (
        <section>
          <div className="flex items-baseline justify-between mb-3">
            <h2 className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
              {t('fuelEntry.trend.label')}
            </h2>
            <span className="text-[11px] text-gray-500 tabular-nums">
              {t('fuelEntry.trend.totalLabel')} {formatCurrency(derived.trendTotal)}
            </span>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="grid grid-cols-6 divide-x divide-gray-100">
              {rollup.map((m, i) => {
                const isCurrent = i === rollup.length - 1;
                const heightPct = Math.round((m.totalPrice / maxMonthPrice) * 100);
                return (
                  <div
                    key={m.yearMonth}
                    className={`p-3 text-center ${isCurrent ? 'bg-primary-50/40' : ''}`}
                  >
                    <div
                      className={`text-[10px] font-semibold uppercase tracking-wider ${
                        isCurrent ? 'text-primary-700' : 'text-gray-500'
                      }`}
                    >
                      {new Intl.DateTimeFormat(i18n.language, { month: 'short' })
                        .format(new Date(m.year, m.monthIdx, 1))}
                    </div>
                    <div className="mt-2 h-12 flex items-end justify-center">
                      <div
                        className={`w-4 rounded-t ${
                          isCurrent ? 'bg-primary-500' : 'bg-gray-300'
                        }`}
                        style={{ height: `${Math.max(heightPct, m.totalPrice > 0 ? 8 : 0)}%` }}
                      />
                    </div>
                    <div className="mt-2 text-xs font-bold text-gray-900 tabular-nums">
                      {m.totalPrice > 0 ? formatCompactCurrency(m.totalPrice) : '—'}
                    </div>
                    <div
                      className={`text-[10px] tabular-nums ${
                        isCurrent ? 'text-primary-700 font-semibold' : 'text-gray-400'
                      }`}
                    >
                      {m.totalLiters > 0 ? `${Math.round(m.totalLiters)} L` : ''}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ============ 4. ENTRIES LIST ============ */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
            {t('fuelEntry.list.heading', { count: entries.length })}
          </h2>
          <button
            onClick={() => setFormModal({ mode: 'add' })}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-primary-600 text-white hover:bg-primary-700 shadow-sm transition-colors"
          >
            <Plus className="w-3.5 h-3.5" strokeWidth={2.5} />
            {t('fuelEntry.add.button')}
          </button>
        </div>

        <div className="rounded-xl shadow-sm border border-gray-200 bg-white overflow-hidden">
          <div className="hidden sm:flex bg-gray-50 px-4 py-2 text-xs uppercase tracking-wider font-semibold text-gray-500 items-center gap-4">
            <div className="w-32 flex-shrink-0">Tarih</div>
            <div className="flex-1">İstasyon</div>
            <div className="w-24 text-right">Litre</div>
            <div className="w-24 text-right">Tutar</div>
            <div className="w-10 flex-shrink-0" />
            <div className="flex-shrink-0">Kaynak</div>
            <div className="flex-shrink-0 w-16" />
          </div>

          {entries.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-sm text-gray-500 mb-4">{t('fuelEntry.empty')}</p>
              <button
                onClick={() => setFormModal({ mode: 'add' })}
                className="bg-primary-600 text-white px-4 py-2 text-sm font-semibold rounded-lg hover:bg-primary-700 hover:shadow-lg hover:shadow-primary-500/20 transition-all"
              >
                {t('fuelEntry.add.button')}
              </button>
            </div>
          ) : (
            entries.map((entry) => (
              <div
                key={entry.id}
                ref={(el) => { rowRefs.current[entry.id] = el; }}
                className={
                  highlightedId === entry.id
                    ? 'ring-2 ring-amber-400 rounded transition-all'
                    : ''
                }
              >
                <FuelEntryRow
                  fleetId={fleetId}
                  entry={entry}
                  onEdit={(entry) => setFormModal({ mode: 'edit', initial: entry })}
                  onDelete={(entry) => setDeleteTarget(entry)}
                  onReceiptClick={(entry) => setReceiptTarget(entry)}
                />
              </div>
            ))
          )}
        </div>
      </section>

      {/* Add / Edit modal */}
      {formModal && (
        <FuelEntryFormModal
          fleetId={fleetId}
          truckId={truckId}
          truckPlate={truckPlate}
          truckPrimaryFuelType={truckPrimaryFuelType}
          mode={formModal.mode}
          initial={formModal.initial}
          onClose={() => setFormModal(null)}
          onSaved={handleSaved}
          onDuplicate={handleDuplicate}
        />
      )}

      {/* Delete confirmation modal */}
      {deleteTarget && (
        <ConfirmActionModal
          title={t('fuelEntry.delete.title')}
          description={t('fuelEntry.delete.description', {
            date: formatDate(deleteTarget.occurredAt),
            liters: parseFloat(deleteTarget.liters).toFixed(2),
          })}
          tone="danger"
          confirmLabel={t('fuelEntry.delete.confirm')}
          onConfirm={handleDeleteConfirm}
          onClose={() => setDeleteTarget(null)}
        />
      )}

      {/* Receipt lightbox */}
      {receiptTarget && (
        <ReceiptLightbox
          fleetId={fleetId}
          entryId={receiptTarget.id}
          fileName={`${receiptTarget.id}.jpg`}
          onClose={() => setReceiptTarget(null)}
        />
      )}
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────────────
// Local visual primitives
// ───────────────────────────────────────────────────────────────────────────

/** 6-month consumption trend sparkline. Points are monthly total liters
 *  normalized to the viewBox height. Pure SVG + CSS `currentColor` so the
 *  primary accent lives in one Tailwind class (no hex literals). */
function Sparkline({ rollup }: { rollup: ReturnType<typeof monthlyRollup> }) {
  const { values, area, line, last } = useMemo(() => {
    const vals = rollup.map((m) => m.totalLiters);
    const max = Math.max(...vals, 1);
    const w = 140;
    const h = 40;
    const step = w / (vals.length - 1);
    const pts = vals.map((v, i) => {
      const x = i * step;
      const y = 4 + (h - 8) * (1 - v / max);
      return [x, y] as const;
    });
    const toPath = pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`);
    return {
      values: vals,
      area: `M ${toPath[0]} L ${toPath.slice(1).join(' L ')} L ${w},${h} L 0,${h} Z`,
      line: `M ${toPath[0]} L ${toPath.slice(1).join(' L ')}`,
      last: pts[pts.length - 1],
    };
  }, [rollup]);
  if (values.length === 0) return null;
  return (
    <svg
      viewBox="0 0 140 40"
      className="w-[140px] h-10 text-primary-500"
      aria-label="6-month fuel trend"
    >
      <defs>
        <linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.2" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#sparkGrad)" />
      <path d={line} stroke="currentColor" strokeWidth={1.5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={last[0]} cy={last[1]} r={2.5} fill="currentColor" />
    </svg>
  );
}
