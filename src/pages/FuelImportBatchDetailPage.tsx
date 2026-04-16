import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowLeft, CheckCircle2, AlertTriangle, Info } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { fuelImportApi } from '../services/api';
import { useFleet } from '../contexts/FleetContext';
import type { FuelImportBatchDto } from '../types/fuel';
import FuelSectionNav from '../components/fuel/FuelSectionNav';
import { formatDateTime } from '../utils/format';

// ── Outcome types ────────────────────────────────────────────────────────────

type Outcome = {
  kind: 'cleanSuccess' | 'partialSuccess' | 'mixedWithErrors' | 'allDuplicates' | 'allErrors' | 'mixed';
  tone: 'green' | 'amber' | 'red' | 'gray';
  values: Record<string, number>;
};

function selectOutcome(b: FuelImportBatchDto): Outcome {
  const total = b.rowCountTotal;
  const imported = b.rowCountImported;
  const skippedDup = b.rowCountSkippedDuplicate;
  const unmatched = b.rowCountUnmatched;
  const error = b.rowCountError;
  const duplicates = skippedDup;

  // Empty file (no rows parsed at all) — treat as a hard failure.
  if (total === 0) {
    return { kind: 'allErrors', tone: 'red', values: {} };
  }
  if (error === total) {
    return { kind: 'allErrors', tone: 'red', values: {} };
  }
  if (imported === total && error === 0 && unmatched === 0) {
    return { kind: 'cleanSuccess', tone: 'green', values: { count: imported } };
  }
  if (imported > 0 && error > 0) {
    return { kind: 'mixedWithErrors', tone: 'red', values: { imported, error } };
  }
  if (imported > 0 && unmatched > 0 && error === 0) {
    return { kind: 'partialSuccess', tone: 'amber', values: { imported, unmatched } };
  }
  if (imported === 0 && duplicates === total) {
    return { kind: 'allDuplicates', tone: 'gray', values: {} };
  }
  return { kind: 'mixed', tone: 'gray', values: { imported, duplicates } };
}

// ── Tone maps ────────────────────────────────────────────────────────────────

const TONE_BG: Record<Outcome['tone'], string> = {
  green: 'bg-green-50 border border-green-200 text-green-900',
  amber: 'bg-amber-50 border border-amber-200 text-amber-900',
  red:   'bg-red-50 border border-red-200 text-red-900',
  gray:  'bg-gray-50 border border-gray-200 text-gray-900',
};
const TONE_ICON: Record<Outcome['tone'], string> = {
  green: 'text-green-600',
  amber: 'text-amber-600',
  red:   'text-red-600',
  gray:  'text-gray-500',
};
const TONE_BORDER_DIVIDER: Record<Outcome['tone'], string> = {
  green: 'border-green-200/60',
  amber: 'border-amber-200/60',
  red:   'border-red-200/60',
  gray:  'border-gray-200/60',
};

const CHIP_TONE_CLS: Record<'neutral' | 'green' | 'amber' | 'red', string> = {
  neutral: 'bg-gray-50 border border-gray-200 text-gray-700',
  green:   'bg-green-50 border border-green-200 text-green-700',
  amber:   'bg-amber-50 border border-amber-200 text-amber-700',
  red:     'bg-red-50 border border-red-200 text-red-700',
};

const reviewUrl = (batchId: string) =>
  `/manager/fuel-review?batchId=${batchId}`;

// ── OutcomeBanner ────────────────────────────────────────────────────────────

function OutcomeBanner({ batch, outcome }: { batch: FuelImportBatchDto; outcome: Outcome }) {
  const { t } = useTranslation();
  const Icon =
    outcome.tone === 'green' ? CheckCircle2 :
    outcome.tone === 'gray'  ? Info :
    AlertTriangle;
  const showReviewLink =
    outcome.kind === 'partialSuccess' ||
    (outcome.kind === 'mixedWithErrors' && batch.rowCountUnmatched > 0);

  return (
    <div className={`rounded-xl p-5 ${TONE_BG[outcome.tone]}`}>
      <div className="flex items-start gap-3">
        <Icon className={`w-5 h-5 mt-0.5 flex-shrink-0 ${TONE_ICON[outcome.tone]}`} />
        <div className="flex-1">
          <h2 className="text-lg font-extrabold tracking-tight">
            {t(`fuelBatch.outcome.${outcome.kind}.title`, outcome.values)}
          </h2>
          <p className="text-sm mt-1 opacity-80">
            {t(`fuelBatch.outcome.${outcome.kind}.body`)}
          </p>
        </div>
      </div>
      {showReviewLink && (
        <div className={`mt-3 pt-3 border-t flex justify-end ${TONE_BORDER_DIVIDER[outcome.tone]}`}>
          <Link
            to={reviewUrl(batch.id)}
            className="text-sm font-semibold hover:underline">
            {t('fuelBatch.outcome.reviewLink')}
          </Link>
        </div>
      )}
    </div>
  );
}

// ── Chip ─────────────────────────────────────────────────────────────────────

function Chip({ label, count, tone, to }: {
  label: string;
  count: number;
  tone: 'neutral' | 'green' | 'amber' | 'red';
  to?: string;
}) {
  const cls = CHIP_TONE_CLS[tone];
  const inner = (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium ${cls}`}>
      <span>{label}</span>
      <span className="font-bold tabular-nums">{count}</span>
    </span>
  );
  return to ? <Link to={to} className="hover:opacity-80 transition-opacity">{inner}</Link> : inner;
}

// ── Page ─────────────────────────────────────────────────────────────────────

const FuelImportBatchDetailPage = () => {
  const { batchId = '' } = useParams();
  const { fleetId } = useFleet();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [batch, setBatch] = useState<FuelImportBatchDto | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!fleetId) return;
    (async () => {
      try {
        setLoading(true);
        const data = await fuelImportApi.getBatch(fleetId, batchId);
        setBatch(data);
      } catch (err: any) {
        toast.error(err.message ?? 'Batch bulunamadı');
      } finally {
        setLoading(false);
      }
    })();
  }, [fleetId, batchId]);

  if (loading) return <p className="p-6 text-gray-500">{t('common.loading')}</p>;
  if (!batch) return <p className="p-6 text-gray-500">{t('common.notFound')}</p>;

  const outcome = selectOutcome(batch);

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <FuelSectionNav />
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(`/manager/fuel-imports`)}
          className="p-2 hover:bg-gray-100 rounded"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">İçe Aktarma Özeti</h1>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 space-y-2 text-sm">
        <Row k="Dosya" v={batch.fileName} />
        <Row k="Provider" v={batch.provider} />
        <Row k="Durum" v={batch.status} />
        <Row k="Yüklenme" v={formatDateTime(batch.uploadedAt)} />
        {batch.completedAt && <Row k="Tamamlanma" v={formatDateTime(batch.completedAt)} />}
      </div>

      <OutcomeBanner batch={batch} outcome={outcome} />

      <div className="flex flex-wrap gap-2">
        <Chip label={t('fuelBatch.chip.total')} count={batch.rowCountTotal} tone="neutral" />
        {batch.rowCountImported > 0 && <Chip label={t('fuelBatch.chip.imported')} count={batch.rowCountImported} tone="green" />}
        {batch.rowCountUnmatched > 0 && <Chip label={t('fuelBatch.chip.unmatched')} count={batch.rowCountUnmatched} tone="amber" to={reviewUrl(batch.id)} />}
        {batch.rowCountSkippedDuplicate > 0 && <Chip label={t('fuelBatch.chip.duplicate')} count={batch.rowCountSkippedDuplicate} tone="neutral" />}
        {batch.rowCountError > 0 && <Chip label={t('fuelBatch.chip.error')} count={batch.rowCountError} tone="red" />}
      </div>
    </div>
  );
};

const Row = ({ k, v }: { k: string; v: string }) => (
  <div className="flex justify-between border-b last:border-b-0 pb-1 min-w-0">
    <span className="text-gray-500">{k}</span>
    <span className="font-medium truncate max-w-[55%]">{v}</span>
  </div>
);

export default FuelImportBatchDetailPage;
