import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Check, ChevronLeft, ChevronRight, Image as ImageIcon, Phone, X } from 'lucide-react';
import { toast } from 'sonner';
import type { AnomalyPendingItem, Severity } from '../../types/fuelAnomaly';
import { fuelAnomalyApi } from '../../services/fuelAnomalyApi';
import { formatCurrency, formatDateTime } from '../../utils/format';
import SeverityBadge from './SeverityBadge';
import Plate from './Plate';
import DismissalReasonSheet from './DismissalReasonSheet';
import { num, parseContext, richExplanation } from './ruleExplanation';
import { excludesEntryOnConfirm } from '../../types/fuelAnomaly';
import './fuelAlertsAnimations.css';

interface Props {
  fleetId: string;
  alert: AnomalyPendingItem;
  onClose: () => void;
  onAfterMutation: () => void;
  /** Optional navigation — when provided, ← / → keys + header buttons step
   *  through sibling alerts without closing the modal. Keeps triage in a
   *  single focused pass instead of close-open-close-open. */
  onPrev?: () => void;
  onNext?: () => void;
  /** 1-based current position in the nav sequence, for the "3 / 12" caption. */
  position?: { current: number; total: number };
}

const stripeGradient: Record<Severity, string> = {
  CRITICAL: 'bg-gradient-to-r from-urgent-600 to-urgent-700',
  WARNING: 'bg-gradient-to-r from-attention-600 to-attention-700',
  INFO: 'bg-gradient-to-r from-info-600 to-info-700',
};

const tintBg: Record<Severity, string> = {
  CRITICAL: 'bg-urgent-50/60',
  WARNING: 'bg-attention-50/60',
  INFO: 'bg-info-50/60',
};

const tintBorder: Record<Severity, string> = {
  CRITICAL: 'border-urgent-200',
  WARNING: 'border-attention-200',
  INFO: 'border-info-200',
};

const tintText: Record<Severity, string> = {
  CRITICAL: 'text-urgent-700',
  WARNING: 'text-attention-700',
  INFO: 'text-info-700',
};

function fmtL(v: number | null, digits = 1): string {
  if (v === null) return '—';
  return `${v.toLocaleString('tr-TR', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })} L`;
}

function fmtKm(v: number | null): string {
  if (v === null) return '—';
  return `${v.toLocaleString('tr-TR', { maximumFractionDigits: 0 })} km`;
}

/** Plain-Turkish detail modal. Matches the mockup's pattern: severity stripe
 *  top, plain-Turkish paragraph on tinted bg, side-by-side comparison,
 *  two big buttons (confirm green / dismiss white), and an inline reason
 *  sheet revealed after "Sorun değil". */
export default function FuelAlertDetailModal({
  fleetId,
  alert,
  onClose,
  onAfterMutation,
  onPrev,
  onNext,
  position,
}: Props) {
  const { t } = useTranslation();
  const dialogRef = useRef<HTMLDivElement>(null);
  const [showReasonSheet, setShowReasonSheet] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [dismissing, setDismissing] = useState(false);

  // Close the dismissal-reason sheet when stepping to a sibling alert —
  // otherwise a stale reason pre-fills for a different anomaly.
  useEffect(() => {
    setShowReasonSheet(false);
  }, [alert.anomalyId]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (confirming || dismissing) return;
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowLeft' && onPrev) onPrev();
      else if (e.key === 'ArrowRight' && onNext) onNext();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose, onPrev, onNext, confirming, dismissing]);

  const ctx = useMemo(() => parseContext(alert.contextJson), [alert.contextJson]);
  const explanation = useMemo(() => richExplanation(alert), [alert]);
  const isDataBroken = excludesEntryOnConfirm(alert.ruleCode);

  const prevLiters = num(ctx.previousLiters);
  const prevOdo = num(ctx.previousOdo) ?? num(ctx.previousOdometerKm);
  const prevPrice = num(ctx.previousTotalPrice);
  const prevOccurredAt = (ctx.previousOccurredAt ?? ctx.prevOccurredAt) as string | null | undefined;

  const hasPrevious = prevLiters !== null || prevOdo !== null || prevPrice !== null;

  const title = t(`fuelAlerts.rules.${alert.ruleCode}.title`, {
    defaultValue: alert.ruleCode,
  });
  const driverName =
    [alert.driverFirstName, alert.driverLastName].filter(Boolean).join(' ') || null;

  const curLiters = alert.liters != null ? Number(alert.liters) : null;
  const curPrice = alert.totalPrice != null ? Number(alert.totalPrice) : null;

  async function handleConfirm() {
    setConfirming(true);
    try {
      await fuelAnomalyApi.confirm(fleetId, alert.anomalyId);
      toast.success(
        isDataBroken
          ? t('fuelAlerts.toast.confirmed')
          : t('fuelAlerts.toast.catBRecorded', { count: 1 }),
      );
      onAfterMutation();
      onClose();
    } catch (err) {
      console.error('Confirm failed', err);
      toast.error(
        err instanceof Error ? err.message : t('fuelAlerts.toast.loadError'),
      );
    } finally {
      setConfirming(false);
    }
  }

  async function handleDismiss(payload: {
    reason: 'FALSE_POSITIVE' | 'DATA_ENTRY_ERROR' | 'EXPLAINED_BY_DRIVER' | 'OTHER';
    note: string | null;
  }) {
    setDismissing(true);
    try {
      await fuelAnomalyApi.dismiss(fleetId, alert.anomalyId, {
        reason: payload.reason,
        note: payload.note,
      });
      toast.success(
        isDataBroken
          ? t('fuelAlerts.toast.dismissed')
          : t('fuelAlerts.toast.catBClosed', { count: 1 }),
      );
      onAfterMutation();
      onClose();
    } catch (err) {
      console.error('Dismiss failed', err);
      toast.error(
        err instanceof Error ? err.message : t('fuelAlerts.toast.loadError'),
      );
    } finally {
      setDismissing(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/45 backdrop-blur-[2px] flex items-start justify-center overflow-y-auto py-10 px-4"
      onClick={(e) => {
        if (e.target === e.currentTarget && !confirming && !dismissing) {
          onClose();
        }
      }}
    >
        <div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="fuel-alert-modal-title"
          className="fuel-alerts-modal-in w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* severity top strip */}
          <div className={`h-1.5 ${stripeGradient[alert.severity]}`} aria-hidden="true" />

          {/* Header */}
          <div className="px-6 pt-5 pb-4 flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <SeverityBadge severity={alert.severity} size="xs" />
                <span className="text-xs font-semibold text-slate-500 tabular-nums">
                  {formatDateTime(alert.detectedAt)}
                </span>
              </div>
              <h2
                id="fuel-alert-modal-title"
                className="text-xl font-extrabold text-slate-900 tracking-tight"
              >
                {title}
              </h2>
              <div className="mt-2 flex items-center gap-3 flex-wrap">
                <Plate plate={alert.plate} size="md" chip />
                {driverName && (
                  <span className="text-sm text-slate-600">
                    <span className="font-medium text-slate-800">{driverName}</span>
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              {position && (onPrev || onNext) && (
                <>
                  <button
                    type="button"
                    onClick={onPrev}
                    disabled={!onPrev || confirming || dismissing}
                    className="w-9 h-9 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    aria-label={t('fuelAlerts.modal.prev')}
                    title={t('fuelAlerts.modal.prev')}
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <span className="px-1 text-xs text-slate-500 tabular-nums min-w-[48px] text-center">
                    {position.current} / {position.total}
                  </span>
                  <button
                    type="button"
                    onClick={onNext}
                    disabled={!onNext || confirming || dismissing}
                    className="w-9 h-9 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    aria-label={t('fuelAlerts.modal.next')}
                    title={t('fuelAlerts.modal.next')}
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                  <div className="w-px h-6 bg-slate-200 mx-1" />
                </>
              )}
              <button
                type="button"
                onClick={onClose}
                disabled={confirming || dismissing}
                className="w-9 h-9 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-700 disabled:opacity-50 transition-colors"
                aria-label="Kapat"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Plain-Turkish explanation on tinted bg */}
          <div className={`px-6 py-5 border-t border-slate-100 ${tintBg[alert.severity]}`}>
            <p className="text-[15px] text-slate-800 leading-relaxed">
              {explanation}
            </p>
            {isDataBroken && (
              <p className="mt-2 text-xs text-slate-500">
                {t('fuelAlerts.modal.confirmHint.dataBroken')}
              </p>
            )}
          </div>

          {/* Side-by-side comparison */}
          <div className="px-6 py-5 border-t border-slate-100">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
              {t('fuelAlerts.modal.comparisonTitle')}
            </h3>

            {hasPrevious ? (
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border border-slate-200 p-4 bg-slate-50/60">
                  <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
                    {t('fuelAlerts.modal.previous')}
                  </div>
                  {prevOccurredAt && (
                    <div className="text-xs text-slate-500 tabular-nums mb-3">
                      {formatDateTime(prevOccurredAt)}
                    </div>
                  )}
                  <dl className="space-y-1.5">
                    <DlRow label={t('fuelAlerts.modal.liters')} value={fmtL(prevLiters)} />
                    <DlRow label={t('fuelAlerts.modal.odometer')} value={fmtKm(prevOdo)} />
                    <DlRow
                      label={t('fuelAlerts.modal.amount')}
                      value={prevPrice !== null ? formatCurrency(prevPrice) : '—'}
                    />
                  </dl>
                </div>
                <CurrentCard
                  alert={alert}
                  curLiters={curLiters}
                  curPrice={curPrice}
                  variant="with-previous"
                />
              </div>
            ) : (
              <CurrentCard
                alert={alert}
                curLiters={curLiters}
                curPrice={curPrice}
                variant="standalone"
              />
            )}
          </div>

          {/* Action shortcuts */}
          <div className="px-6 pb-5 flex items-center gap-3 border-t border-slate-100 pt-4 flex-wrap">
            {alert.hasReceipt && (
              <button
                type="button"
                className="inline-flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
              >
                <ImageIcon className="w-4 h-4 text-slate-500" />
                {t('fuelAlerts.modal.viewReceipt')}
              </button>
            )}
            {alert.driverPhone && (
              <a
                href={`tel:${alert.driverPhone}`}
                className="inline-flex items-center gap-2 px-3 py-2 text-xs font-medium text-primary-700 border border-primary-100 bg-primary-50 rounded-lg hover:bg-primary-100 transition-colors"
              >
                <Phone className="w-4 h-4" />
                {t('fuelAlerts.modal.callDriver')}
              </a>
            )}
            <div className="ml-auto text-xs text-slate-400 tabular-nums">
              {t('fuelAlerts.modal.ruleCodeLabel', { code: alert.ruleCode })}
            </div>
          </div>

          {/* Action buttons — hidden once reason sheet is open */}
          {!showReasonSheet && (
            <div className="px-6 py-5 border-t border-slate-100 bg-slate-50/50">
              {isDataBroken ? (
                <>
                  <div className="grid grid-cols-1 gap-3">
                    <button
                      type="button"
                      onClick={handleConfirm}
                      disabled={confirming || dismissing}
                      className="group inline-flex flex-col items-start gap-0.5 px-5 py-4 rounded-xl bg-confirm-500 hover:bg-confirm-600 text-white shadow-sm hover:shadow disabled:opacity-60 disabled:pointer-events-none transition-all text-left"
                    >
                      <div className="flex items-center gap-2 font-bold text-sm">
                        <Check className="w-4 h-4" strokeWidth={2.5} />
                        {confirming ? '…' : t('fuelAlerts.modal.confirmBtn.title')}
                      </div>
                      <span className="text-xs font-normal text-white/80">
                        {t('fuelAlerts.modal.confirmBtn.hint.dataBroken')}
                      </span>
                    </button>
                  </div>
                  <p className="mt-3 text-xs text-slate-500">
                    {t('fuelAlerts.modal.fixDataHint')}
                  </p>
                </>
              ) : (
                <>
                  <p className="text-sm font-semibold text-slate-900 mb-3">
                    {t('fuelAlerts.modal.catB.question')}
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={handleConfirm}
                      disabled={confirming || dismissing}
                      className="group inline-flex flex-col items-start gap-0.5 px-5 py-4 rounded-xl bg-confirm-500 hover:bg-confirm-600 text-white shadow-sm hover:shadow disabled:opacity-60 disabled:pointer-events-none transition-all text-left"
                    >
                      <div className="flex items-center gap-2 font-bold text-sm">
                        <Check className="w-4 h-4" strokeWidth={2.5} />
                        {confirming ? '…' : t('fuelAlerts.modal.catB.confirm')}
                      </div>
                      <span className="text-xs font-normal text-white/80">
                        {t('fuelAlerts.modal.catB.confirmHint')}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowReasonSheet(true)}
                      disabled={confirming || dismissing}
                      className="group inline-flex flex-col items-start gap-0.5 px-5 py-4 rounded-xl bg-white border-2 border-slate-200 hover:border-slate-300 hover:bg-slate-50 disabled:opacity-60 disabled:pointer-events-none transition-all text-left"
                    >
                      <div className="flex items-center gap-2 font-bold text-sm text-slate-900">
                        <X className="w-4 h-4 text-slate-500" strokeWidth={2.5} />
                        {t('fuelAlerts.modal.catB.dismiss')}
                      </div>
                      <span className="text-xs font-normal text-slate-500">
                        {t('fuelAlerts.modal.catB.dismissHint')}
                      </span>
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

        {/* Inline reason sheet — only reachable for behaviour rules. */}
        {showReasonSheet && !isDataBroken && (
          <DismissalReasonSheet
            submitting={dismissing}
            onSubmit={handleDismiss}
            onCancel={() => setShowReasonSheet(false)}
          />
        )}
      </div>
    </div>
  );
}

interface CurrentCardProps {
  alert: AnomalyPendingItem;
  curLiters: number | null;
  curPrice: number | null;
  /** with-previous: stacked dl, "this record" badge, emphasized liters row.
   *  standalone:    3-col dl, no badge, "no comparison" helper underneath. */
  variant: 'with-previous' | 'standalone';
}

function CurrentCard({ alert, curLiters, curPrice, variant }: CurrentCardProps) {
  const { t } = useTranslation();
  const sev = alert.severity;
  const withPrev = variant === 'with-previous';
  const badgeBg =
    sev === 'CRITICAL'
      ? 'bg-urgent-500'
      : sev === 'WARNING'
        ? 'bg-attention-500'
        : 'bg-info-500';

  return (
    <div
      className={`rounded-lg border-2 p-4 relative ${tintBorder[sev]} ${tintBg[sev]}`}
    >
      {withPrev && (
        <div
          className={`absolute -top-2 right-3 inline-flex items-center gap-1 px-2 py-0.5 text-white text-[10px] font-bold rounded-md tracking-wider uppercase ${badgeBg}`}
        >
          {t('fuelAlerts.modal.thisRecord')}
        </div>
      )}
      <div
        className={`text-[11px] font-semibold uppercase tracking-wider mb-2 ${tintText[sev]}`}
      >
        {t('fuelAlerts.modal.currentIssue')}
      </div>
      {alert.occurredAt && (
        <div className={`text-xs tabular-nums mb-3 ${tintText[sev]}`}>
          {formatDateTime(alert.occurredAt)}
        </div>
      )}
      <dl className={withPrev ? 'space-y-1.5' : 'grid grid-cols-3 gap-3'}>
        <DlRow
          label={t('fuelAlerts.modal.liters')}
          value={fmtL(curLiters)}
          emphasize={withPrev}
          vertical={!withPrev}
        />
        <DlRow
          label={t('fuelAlerts.modal.odometer')}
          value={fmtKm(alert.reportedOdometerKm)}
          vertical={!withPrev}
        />
        <DlRow
          label={t('fuelAlerts.modal.amount')}
          value={curPrice !== null ? formatCurrency(curPrice) : '—'}
          vertical={!withPrev}
        />
      </dl>
      {!withPrev && (
        <p className="mt-3 text-xs text-slate-500">
          {t('fuelAlerts.modal.noComparison')}
        </p>
      )}
    </div>
  );
}

interface DlRowProps {
  label: string;
  value: string;
  emphasize?: boolean;
  vertical?: boolean;
}

function DlRow({ label, value, emphasize, vertical }: DlRowProps) {
  if (vertical) {
    return (
      <div className="flex flex-col">
        <dt className="text-[11px] text-slate-500 uppercase tracking-wider">{label}</dt>
        <dd className="font-semibold text-slate-900 tabular-nums mt-0.5">{value}</dd>
      </div>
    );
  }
  return (
    <div className="flex justify-between text-sm">
      <dt className="text-slate-600">{label}</dt>
      <dd
        className={`tabular-nums ${emphasize ? 'font-bold text-slate-900' : 'font-semibold text-slate-900'}`}
      >
        {value}
      </dd>
    </div>
  );
}
