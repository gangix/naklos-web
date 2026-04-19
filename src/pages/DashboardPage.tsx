import { useNavigate } from 'react-router-dom';
import { Truck, Users, Plus, UserPlus, Fuel, ArrowRight, ClipboardCheck, AlertTriangle, CheckCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useFleet } from '../contexts/FleetContext';
import { useFleetRoster } from '../contexts/FleetRosterContext';
import { useFuelCounts } from '../contexts/FuelCountsContext';
import { computeTruckWarnings } from '../utils/truckWarnings';
import { computeDriverWarnings } from '../utils/driverWarnings';
import type { Severity } from '../types/severity';
import { SEVERITY_DOT_CLASS } from '../types/severity';

interface Priority {
  entity: 'truck' | 'driver';
  entityId: string;
  entityLabel: string;
  /** Translated document label ("Zorunlu Sigorta", "Ehliyet", ...). */
  docLabel: string;
  /** Translated free-form issue line ("10 gün kaldı", "Süresi dolmuş", ...). */
  issueLabel: string;
  severity: Severity;
  daysLeft: number | null;
}

const SEVERITY_RANK: Record<Severity, number> = { CRITICAL: 3, WARNING: 2, INFO: 1 };

const DashboardPage = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { plan } = useFleet();
  const { total: fuelAttentionCount } = useFuelCounts();
  const { trucks, drivers, loading } = useFleetRoster();
  const forceOn = import.meta.env.VITE_FEATURE_FUEL_TRACKING === 'true';
  const fuelTrackingEnabled = forceOn || (plan && plan !== 'FREE');

  if (loading) {
    return (
      <div className="p-4 flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    );
  }

  // --- Compliance score ------------------------------------------------
  // Total cells = every document slot across the fleet that a warning
  // would be computed for. Attention cells = the ones returned by the
  // warning utilities (they match the Compliance page's tier logic).
  // Score is % of non-attention cells — the higher the percentage, the
  // healthier the fleet.
  const truckWarningsPerEntity = trucks.map((truck) => ({ truck, warnings: computeTruckWarnings(truck) }));
  const driverWarningsPerEntity = drivers.map((driver) => ({ driver, warnings: computeDriverWarnings(driver) }));

  // Truck has 3 doc slots (compulsory, comprehensive, inspection).
  // Driver has 2 required (license, SRC) plus CPC only if the cert is
  // on record — mirror the compute* rule set exactly.
  const truckCells = trucks.length * 3;
  const driverCells = drivers.reduce((acc, d) => {
    const hasCpc = !!d.certificates?.find((c) => c.type === 'CPC');
    return acc + (hasCpc ? 3 : 2);
  }, 0);
  const totalCells = truckCells + driverCells;
  const attentionCells =
    truckWarningsPerEntity.reduce((acc, x) => acc + x.warnings.length, 0) +
    driverWarningsPerEntity.reduce((acc, x) => acc + x.warnings.length, 0);
  const validCells = Math.max(0, totalCells - attentionCells);
  const complianceScore = totalCells === 0 ? null : Math.round((validCells / totalCells) * 100);

  // --- Top priorities --------------------------------------------------
  // Flatten all warnings into one list, rank by severity then urgency,
  // take 3. Each row points straight at the entity's detail page — the
  // PR 1 auto-focus rule opens the Belgeler tab when warnings exist.
  const priorities: Priority[] = [];
  for (const { truck, warnings } of truckWarningsPerEntity) {
    for (const w of warnings) {
      priorities.push({
        entity: 'truck',
        entityId: truck.id,
        entityLabel: truck.plateNumber,
        docLabel: t(docLabelKeyForTruckType(w.type)),
        issueLabel: t(w.key, w.params),
        severity: w.severity,
        daysLeft: (w.params.count as number | undefined) ?? null,
      });
    }
  }
  for (const { driver, warnings } of driverWarningsPerEntity) {
    for (const w of warnings) {
      priorities.push({
        entity: 'driver',
        entityId: driver.id,
        entityLabel: `${driver.firstName} ${driver.lastName}`,
        docLabel: t(docLabelKeyForDriverType(w.type)),
        issueLabel: t(w.key, w.params),
        severity: w.severity,
        daysLeft: (w.params.count as number | undefined) ?? null,
      });
    }
  }
  priorities.sort((a, b) => {
    const rankDiff = SEVERITY_RANK[b.severity] - SEVERITY_RANK[a.severity];
    if (rankDiff !== 0) return rankDiff;
    // Within same severity: lower daysLeft = more urgent (null = missing, goes last within tier).
    const ad = a.daysLeft ?? Number.POSITIVE_INFINITY;
    const bd = b.daysLeft ?? Number.POSITIVE_INFINITY;
    return ad - bd;
  });
  const topPriorities = priorities.slice(0, 3);
  const morePrioritiesCount = Math.max(0, priorities.length - topPriorities.length);

  // --- Locale + header date -------------------------------------------
  const localeTag = t('common.localeTag', { defaultValue: 'en-US' });
  const today = new Date();
  const weekday = today.toLocaleDateString(localeTag, { weekday: 'long' });
  const fullDate = today.toLocaleDateString(localeTag, { day: 'numeric', month: 'long', year: 'numeric' });

  const isEmptyRoster = trucks.length === 0 && drivers.length === 0;
  const isHealthy = priorities.length === 0 && fuelAttentionCount === 0;

  return (
    <div>
      {/* Header — date micro-line + title + quick actions (unchanged) */}
      <div className="mb-6 flex items-end justify-between gap-4 flex-wrap animate-[fadeUp_300ms_ease-out]">
        <div>
          <p className="text-xs text-gray-500 mb-1">
            <span className="font-medium text-gray-600">{weekday}</span>
            <span className="mx-1.5 text-gray-300">·</span>
            <span>{fullDate}</span>
          </p>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">{t('dashboard.myFleet')}</h1>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => navigate('/manager/trucks?add=1')}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-semibold rounded-lg bg-primary-600 text-white hover:bg-primary-700 hover:shadow-lg hover:shadow-primary-500/20 transition-all">
            <Plus className="w-4 h-4" />
            {t('dashboard.quickActions.addTruck', { defaultValue: 'Araç ekle' })}
          </button>
          <button
            onClick={() => navigate('/manager/drivers?add=1')}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg border border-primary-600 text-primary-600 hover:bg-primary-50 transition-colors">
            <UserPlus className="w-4 h-4" />
            {t('dashboard.quickActions.addDriver', { defaultValue: 'Sürücü ekle' })}
          </button>
          {fuelTrackingEnabled && (
            <button
              onClick={() => navigate('/manager/fuel-imports')}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg border border-primary-600 text-primary-600 hover:bg-primary-50 transition-colors">
              <Fuel className="w-4 h-4" />
              {t('dashboard.quickActions.importFuel', { defaultValue: 'Yakıt içe aktar' })}
            </button>
          )}
        </div>
      </div>

      {/* ZONE 1 — Hero / Onboarding.
          Empty roster → onboarding nudge in place of the score.
          Otherwise a heroic compliance-health card with one CTA. */}
      {isEmptyRoster ? (
        <section
          className="mb-6 animate-[fadeUp_400ms_ease-out_60ms_both]"
        >
          <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center">
            <div className="w-14 h-14 rounded-2xl bg-primary-50 text-primary-600 mx-auto mb-3 flex items-center justify-center">
              <Truck className="w-7 h-7" />
            </div>
            <p className="text-lg font-extrabold text-gray-900 tracking-tight">
              {t('dashboard.onboarding.title')}
            </p>
            <p className="text-sm text-gray-600 mt-1 max-w-md mx-auto">
              {t('dashboard.onboarding.subtitle')}
            </p>
            <div className="mt-5 flex gap-2 flex-wrap justify-center">
              <button
                onClick={() => navigate('/manager/trucks?add=1')}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-lg bg-primary-600 text-white hover:bg-primary-700 hover:shadow-lg hover:shadow-primary-500/20 transition-all">
                <Plus className="w-4 h-4" />
                {t('dashboard.quickActions.addTruck', { defaultValue: 'Araç ekle' })}
              </button>
              <button
                onClick={() => navigate('/manager/drivers?add=1')}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg border border-primary-600 text-primary-600 hover:bg-primary-50 transition-colors">
                <UserPlus className="w-4 h-4" />
                {t('dashboard.quickActions.addDriver', { defaultValue: 'Sürücü ekle' })}
              </button>
            </div>
          </div>
        </section>
      ) : (
        <section className="mb-6 animate-[fadeUp_400ms_ease-out_60ms_both]">
          <ComplianceHero
            score={complianceScore}
            validCells={validCells}
            attentionCells={attentionCells}
            onGo={() => navigate('/manager/compliance')}
          />
        </section>
      )}

      {/* ZONE 2 — Top Priorities (max 3).
          Only renders when the fleet is populated AND has issues.
          Replaces the old "warning list" section — instead of 20 rows of
          equal weight, 3 bold cards with one-click resolution. */}
      {!isEmptyRoster && topPriorities.length > 0 && (
        <section className="mb-6 animate-[fadeUp_400ms_ease-out_140ms_both]">
          <div className="flex items-baseline justify-between mb-3">
            <h2 className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
              {t('dashboard.priorities.heading')}
            </h2>
            {morePrioritiesCount > 0 && (
              <button
                onClick={() => navigate('/manager/compliance')}
                className="text-xs font-semibold text-primary-600 hover:text-primary-700 inline-flex items-center gap-1"
              >
                {t('dashboard.priorities.more', { count: morePrioritiesCount })}
                <ArrowRight className="w-3 h-3" />
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {topPriorities.map((p) => (
              <PriorityCard
                key={`${p.entity}-${p.entityId}-${p.docLabel}`}
                priority={p}
                onResolve={() =>
                  navigate(p.entity === 'truck' ? `/manager/trucks/${p.entityId}` : `/manager/drivers/${p.entityId}`)
                }
              />
            ))}
          </div>
        </section>
      )}

      {/* ZONE 2b — Healthy-state banner (only when fleet populated).
          Replaces the old green card; now stacks under the hero so the
          score stays the top-of-page anchor even on a perfect fleet. */}
      {!isEmptyRoster && isHealthy && (
        <section className="mb-6 animate-[fadeUp_400ms_ease-out_140ms_both]">
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 text-center">
            <CheckCircle className="w-9 h-9 text-emerald-500 mx-auto mb-2" />
            <p className="text-sm font-extrabold text-emerald-900 tracking-tight">
              {t('dashboard.allCurrent')}
            </p>
            <p className="text-xs text-emerald-700 mt-1">{t('dashboard.allCurrentSubtitle')}</p>
          </div>
        </section>
      )}

      {/* ZONE 3 — Trend strip.
          Small compact tiles: roster counts + fuel attention (if paid).
          Intentionally secondary weight — the score + priorities are the
          action surface; this strip is the "quick-link" row. */}
      {!isEmptyRoster && (
        <section className="animate-[fadeUp_400ms_ease-out_220ms_both]">
          <h2 className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 mb-3">
            {t('dashboard.trend.heading')}
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <TrendTile
              label={t('nav.trucks')}
              icon={Truck}
              iconTone="bg-blue-50 text-blue-600"
              value={trucks.length}
              onClick={() => navigate('/manager/trucks')}
            />
            <TrendTile
              label={t('nav.drivers')}
              icon={Users}
              iconTone="bg-emerald-50 text-emerald-600"
              value={drivers.length}
              onClick={() => navigate('/manager/drivers')}
            />
            {fuelTrackingEnabled && (
              <TrendTile
                label={t('dashboard.trend.fuelAlerts', { defaultValue: 'Yakıt uyarıları' })}
                icon={Fuel}
                iconTone="bg-amber-50 text-amber-600"
                value={fuelAttentionCount}
                alarm={fuelAttentionCount > 0}
                onClick={() => navigate('/manager/fuel-alerts')}
              />
            )}
          </div>
        </section>
      )}

      {/* Keyframes used by the fadeUp animation. Scoped via a style tag so
          we don't have to bolt onto tailwind.config.js for a one-off. */}
      <style>{`
        @keyframes fadeUp {
          0%   { opacity: 0; transform: translateY(6px); }
          100% { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

/** Returns the i18n key for a truck-document type's display label. */
function docLabelKeyForTruckType(type: 'compulsory-insurance' | 'comprehensive-insurance' | 'inspection'): string {
  if (type === 'compulsory-insurance') return 'doc.compulsoryInsurance';
  if (type === 'comprehensive-insurance') return 'doc.comprehensiveInsurance';
  return 'doc.inspection';
}

/** Returns the i18n key for a driver-document type's display label. */
function docLabelKeyForDriverType(type: 'license' | 'src' | 'cpc'): string {
  if (type === 'license') return 'doc.license';
  if (type === 'src') return 'doc.src';
  return 'doc.cpc';
}

// ----------------------------------------------------------------------
// Hero — Compliance Health card.
// ----------------------------------------------------------------------

interface ComplianceHeroProps {
  score: number | null;
  validCells: number;
  attentionCells: number;
  onGo: () => void;
}

/** Heroic compliance-health card. The score sits in huge display weight
 *  on the left; the right side lists the split and carries the single
 *  CTA into the full Compliance matrix. Accent stripe on the left edge
 *  and tone of the score match the compliance-score pill on the
 *  CompliancePage so users feel the two surfaces are the same system. */
function ComplianceHero({ score, validCells, attentionCells, onGo }: ComplianceHeroProps) {
  const { t } = useTranslation();
  if (score === null) {
    // Defensive — only hit when totalCells is 0, which we already branch
    // on at the caller (isEmptyRoster). Render nothing if it slips.
    return null;
  }
  const tone =
    score >= 95 ? 'emerald'
    : score >= 80 ? 'info'
    : score >= 60 ? 'attention'
    : 'urgent';
  const accent: { stripe: string; tag: string; tagText: string; btn: string } = {
    emerald: {
      stripe: 'bg-emerald-500',
      tag: 'bg-emerald-50',
      tagText: 'text-emerald-700',
      btn: 'bg-emerald-600 hover:bg-emerald-700',
    },
    info: {
      stripe: 'bg-info-500',
      tag: 'bg-info-50',
      tagText: 'text-info-700',
      btn: 'bg-info-600 hover:bg-info-700',
    },
    attention: {
      stripe: 'bg-attention-500',
      tag: 'bg-attention-50',
      tagText: 'text-attention-700',
      btn: 'bg-attention-600 hover:bg-attention-700',
    },
    urgent: {
      stripe: 'bg-urgent-500',
      tag: 'bg-urgent-50',
      tagText: 'text-urgent-700',
      btn: 'bg-urgent-600 hover:bg-urgent-700',
    },
  }[tone];

  return (
    <div className="relative bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
      {/* Left accent — carries the severity signal without tinting the whole card */}
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${accent.stripe}`} aria-hidden="true" />
      <div className="pl-6 pr-5 py-6 flex flex-col md:flex-row md:items-center gap-5 md:gap-8">
        <div className="flex-shrink-0">
          <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wider uppercase ${accent.tag} ${accent.tagText}`}>
            <ClipboardCheck className="w-3 h-3" />
            {t('dashboard.hero.label')}
          </div>
          <div className="mt-2 flex items-baseline gap-2 leading-none">
            <span className="text-6xl md:text-7xl font-extrabold text-gray-900 tabular-nums">%{score}</span>
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-gray-600 leading-relaxed">
            <span className="font-bold text-gray-900 tabular-nums">{validCells}</span>
            <span className="mx-1">/</span>
            <span className="tabular-nums">{validCells + attentionCells}</span>{' '}
            {t('dashboard.hero.validLabel')}
          </p>
          {attentionCells > 0 ? (
            <p className="text-sm mt-1 leading-relaxed">
              <span className={`inline-flex items-center gap-1.5 font-bold ${accent.tagText}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${accent.stripe}`} />
                <span className="tabular-nums">{attentionCells}</span>
                <span>{t('dashboard.hero.attentionLabel')}</span>
              </span>
            </p>
          ) : (
            <p className="text-sm mt-1 text-emerald-700 font-medium">
              {t('dashboard.hero.allClear')}
            </p>
          )}
        </div>
        <div className="flex-shrink-0 md:self-center">
          <button
            onClick={onGo}
            className={`inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold rounded-lg text-white transition-colors ${accent.btn}`}
          >
            {t('dashboard.hero.cta')}
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------
// Priority card — one row in "Top Priorities" zone.
// ----------------------------------------------------------------------

interface PriorityCardProps {
  priority: Priority;
  onResolve: () => void;
}

/** Single priority card. Thin severity stripe on top, bold issue line,
 *  entity + doc sub-line, and a primary-coloured "Aç" button that routes
 *  straight to the detail page's Belgeler tab (auto-focused via the PR 1
 *  rule when warnings exist). */
function PriorityCard({ priority, onResolve }: PriorityCardProps) {
  const { t } = useTranslation();
  const severityLabel =
    priority.severity === 'CRITICAL' ? t('dashboard.priorities.severity.critical')
    : priority.severity === 'WARNING' ? t('dashboard.priorities.severity.warning')
    : t('dashboard.priorities.severity.info');
  const severityTextCls: Record<Severity, string> = {
    CRITICAL: 'text-urgent-700',
    WARNING: 'text-attention-700',
    INFO: 'text-info-700',
  };
  const stripeCls = SEVERITY_DOT_CLASS[priority.severity].replace('bg-', 'bg-');
  const EntityIcon = priority.entity === 'truck' ? Truck : Users;

  return (
    <div className="group relative bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-md hover:border-gray-300 transition-all">
      {/* Top severity stripe — thin, high-contrast */}
      <div className={`h-1 ${stripeCls}`} aria-hidden="true" />
      <div className="p-4 flex flex-col h-full">
        <div className="flex items-center gap-2 mb-2">
          <span className={`text-[10px] font-bold tracking-wider uppercase ${severityTextCls[priority.severity]}`}>
            {severityLabel}
          </span>
          <span className="text-gray-300">·</span>
          <span className="inline-flex items-center gap-1 text-xs text-gray-500">
            <EntityIcon className="w-3 h-3" />
            {priority.entityLabel}
          </span>
        </div>
        <p className="text-sm font-bold text-gray-900 leading-tight">{priority.docLabel}</p>
        <p className="text-xs text-gray-600 mt-1 tabular-nums">{priority.issueLabel}</p>
        <div className="mt-4 flex items-center justify-end">
          <button
            onClick={onResolve}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg bg-gray-900 text-white hover:bg-black transition-colors"
          >
            {t('dashboard.priorities.resolve')}
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------
// Trend tile — compact stat card in the bottom strip.
// ----------------------------------------------------------------------

interface TrendTileProps {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  iconTone: string;
  value: number;
  /** When true the tile shows a subtle urgent-tone background so a fleet
   *  with many pending fuel anomalies doesn't look indistinguishable from
   *  a clean one. */
  alarm?: boolean;
  onClick: () => void;
}

function TrendTile({ label, icon: Icon, iconTone, value, alarm, onClick }: TrendTileProps) {
  return (
    <button
      onClick={onClick}
      className={`group text-left rounded-xl border p-4 transition-all ${
        alarm
          ? 'bg-urgent-50 border-urgent-200 hover:border-urgent-300'
          : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-sm'
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${iconTone}`}>
          <Icon className="w-4 h-4" />
        </div>
        {alarm && (
          <AlertTriangle className="w-3.5 h-3.5 text-urgent-500 opacity-0 group-hover:opacity-100 transition-opacity" />
        )}
      </div>
      <div className="text-2xl font-extrabold text-gray-900 tabular-nums leading-none">{value}</div>
      <div className="text-[11px] text-gray-500 mt-1.5 uppercase tracking-wider font-semibold">{label}</div>
    </button>
  );
}

export default DashboardPage;
