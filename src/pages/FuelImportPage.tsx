import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { toast } from 'sonner';
import { Upload, CheckCircle2, XCircle, Sparkles, ChevronRight } from 'lucide-react';
import { fuelFormatApi, fuelImportApi } from '../services/api';
import { useFleet } from '../contexts/FleetContext';
import { FileInput } from '../components/common/FormField';
import FuelSectionNav from '../components/fuel/FuelSectionNav';
import { setPendingSample } from '../state/pendingSampleFile';
import { formatDateTime } from '../utils/format';
import type {
  CommitOverride,
  DraftPreview,
  FuelImportBatchDto,
  FuelImportFormatDto,
  PreviewRow,
} from '../types/fuel';

const classificationBadge = (c: PreviewRow['classification'], hasError: boolean) => {
  if (hasError) return { cls: 'bg-red-100 text-red-700', label: 'Hata', icon: <XCircle className="w-3 h-3" /> };
  switch (c) {
    case 'NEW':                return { cls: 'bg-green-100 text-green-700', label: 'Yeni', icon: <CheckCircle2 className="w-3 h-3" /> };
    case 'DUPLICATE':          return { cls: 'bg-gray-200 text-gray-700', label: 'Yinelenen', icon: null };
    case 'POSSIBLE_DUPLICATE': return { cls: 'bg-amber-100 text-amber-800', label: 'Olası yinelenen', icon: null };
  }
};

// Resolve a structured row error to a localized message. Backend sends
// errorCode + errorParams; the {field} param itself is also an i18n key
// (semantic field name) that we translate before interpolation.
const renderRowError = (row: PreviewRow, t: TFunction): string | null => {
  if (!row.errorCode && !row.errorMessage) return null;
  if (!row.errorCode) return row.errorMessage;
  const params: Record<string, string | number> = { ...(row.errorParams ?? {}) };
  if (typeof params.field === 'string') {
    params.field = t(`fuelImport.field.${params.field}`, { defaultValue: params.field as string });
  }
  return t(`fuelImport.error.${row.errorCode}`, {
    ...params,
    defaultValue: row.errorMessage ?? row.errorCode,
  });
};

const FuelImportPage = () => {
  const { fleetId } = useFleet();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [formats, setFormats] = useState<FuelImportFormatDto[]>([]);
  const [formatId, setFormatId] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<DraftPreview | null>(null);
  const [loading, setLoading] = useState(false);
  const [committing, setCommitting] = useState(false);
  const [batches, setBatches] = useState<FuelImportBatchDto[] | null>(null);
  /** Rows the user wants to force-import despite the POSSIBLE_DUPLICATE flag.
   *  Keyed by rowIndex; default behaviour (unchecked) is SKIP per CommitOverride
   *  contract, so we only record the IMPORT overrides. */
  const [forceImport, setForceImport] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (!fleetId) return;
    (async () => {
      try {
        const all = await fuelFormatApi.list(fleetId);
        // Active formats — both fleet-scoped and the read-only global starters
        // (e.g. GENERIC). Users can import with a starter directly; cloning
        // is only needed when they want to customize the mapping.
        const importable = all.filter((f) => f.active);
        setFormats(importable);
      } catch (err: any) {
        toast.error(err.message ?? 'Formatlar yüklenemedi');
      }
    })();
  }, [fleetId]);

  // Batch history — last 20, shown below the upload form. Reloaded after a
  // commit so the just-created batch shows up without a page refresh.
  const loadBatches = async () => {
    if (!fleetId) return;
    try {
      const page = await fuelImportApi.listBatches(fleetId, 0, 20);
      setBatches(page.content);
    } catch {
      // best-effort — the history card just won't render if this fails
    }
  };
  useEffect(() => { void loadBatches(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [fleetId]);

  const runPreview = async () => {
    if (!fleetId) return;
    if (!file || !formatId) {
      toast.error('Format ve dosya seçin');
      return;
    }
    try {
      setLoading(true);
      const result = await fuelImportApi.preview(fleetId, formatId, file);
      setPreview(result);
      setForceImport(new Set());
    } catch (err: any) {
      toast.error(err.message ?? 'Önizleme başarısız');
    } finally {
      setLoading(false);
    }
  };

  const commit = async () => {
    if (!fleetId || !preview) return;
    try {
      setCommitting(true);
      const overrides: CommitOverride[] = Array.from(forceImport).map((rowIndex) => ({
        rowIndex,
        action: 'IMPORT',
      }));
      const batch = await fuelImportApi.commit(fleetId, preview.draftId, overrides);
      toast.success('İçe aktarma tamamlandı');
      void loadBatches();
      navigate(`/manager/fuel-imports/${batch.id}`);
    } catch (err: any) {
      toast.error(err.message ?? 'Commit başarısız');
    } finally {
      setCommitting(false);
    }
  };

  const toggleForceImport = (rowIndex: number) =>
    setForceImport((prev) => {
      const next = new Set(prev);
      if (next.has(rowIndex)) next.delete(rowIndex);
      else next.add(rowIndex);
      return next;
    });

  const summary = preview?.summary;

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <FuelSectionNav />
      <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Yakıt Statement İçe Aktar</h1>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className="block">
            <span className="text-sm font-medium">Format</span>
            <select
              className="mt-1 w-full border rounded px-2 py-1"
              value={formatId}
              onChange={(e) => setFormatId(e.target.value)}
            >
              <option value="">— seçiniz —</option>
              {formats.map((f) => (
                <option key={f.id} value={f.id}>{f.provider} · {f.name} (v{f.version})</option>
              ))}
            </select>
          </label>
          <FileInput
            label="Statement dosyası (XLSX)"
            accept=".xlsx"
            onChange={setFile}
            selectedFileName={file?.name ?? null}
          />
        </div>
        <div className="flex justify-end">
          <button
            onClick={runPreview}
            disabled={!file || !formatId || loading}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg bg-primary-600 text-white hover:bg-primary-700 hover:shadow-lg hover:shadow-primary-500/20 transition-all disabled:opacity-50"
          >
            <Upload className="w-4 h-4" />
            Önizle
          </button>
        </div>
      </div>

      {preview && summary && (
        <>
          {/* Format mismatch recovery — when every row failed parsing, the format
              clearly doesn't fit the file. Offer one-click escape hatch. */}
          {summary.total > 0 && summary.errorCount === summary.total && (
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-5">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <h3 className="text-base font-extrabold text-amber-900 tracking-tight">
                    Bu dosya seçtiğiniz formata uymuyor
                  </h3>
                  <p className="text-sm text-amber-800 mt-1">
                    Sütun isimleri tanınmadı. Endişelenmeyin — dosyanızı bir saniyede tanıyalım. Tek tıkla dosyanıza özel bir format oluşturalım, kolonları otomatik eşleştireceğiz.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      if (file) setPendingSample(file);
                      navigate('/manager/fuel-formats/new');
                    }}
                    className="mt-3 inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg bg-amber-600 text-white hover:bg-amber-700 hover:shadow-lg hover:shadow-amber-500/20 transition-all">
                    <Sparkles className="w-4 h-4" />
                    Dosyama özel format oluştur
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            <StatCard label="Toplam" value={summary.total} />
            <StatCard label="Yeni" value={summary.newCount} highlight="green" />
            <StatCard label="Yinelenen" value={summary.duplicateCount} highlight="gray" />
            <StatCard label="Olası yinelenen" value={summary.possibleDuplicateCount} highlight="yellow" />
            <StatCard label="Hata / Eşlenmemiş" value={summary.errorCount + summary.unmatchedCount} highlight="red" />
          </div>

          {summary.possibleDuplicateCount > 0 && (
            <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-4 text-sm text-amber-900">
              <p className="font-semibold mb-1">
                {summary.possibleDuplicateCount} olası yinelenen kayıt var
              </p>
              <p className="text-amber-800">
                Bu kayıtlar varsayılan olarak atlanacak. Aslında farklı bir dolum olduğunu düşünüyorsanız ilgili satırda
                {' '}<strong>Yine de aktar</strong>{' '} kutusunu işaretleyin.
              </p>
            </div>
          )}

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left">
                <tr>
                  <th className="px-4 py-2.5 text-xs font-semibold text-gray-600 uppercase tracking-wider">#</th>
                  <th className="px-4 py-2.5 text-xs font-semibold text-gray-600 uppercase tracking-wider">Plaka</th>
                  <th className="px-4 py-2.5 text-xs font-semibold text-gray-600 uppercase tracking-wider">Tarih</th>
                  <th className="px-4 py-2.5 text-xs font-semibold text-gray-600 uppercase tracking-wider">Yakıt</th>
                  <th className="px-4 py-2.5 text-xs font-semibold text-gray-600 uppercase tracking-wider text-right">Litre</th>
                  <th className="px-4 py-2.5 text-xs font-semibold text-gray-600 uppercase tracking-wider text-right">Tutar</th>
                  <th className="px-4 py-2.5 text-xs font-semibold text-gray-600 uppercase tracking-wider">Durum</th>
                  <th className="px-4 py-2.5 text-xs font-semibold text-gray-600 uppercase tracking-wider">Araç</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {preview.rows.map((r) => {
                  const errorText = renderRowError(r, t);
                  const b = classificationBadge(r.classification, errorText !== null);
                  return (
                    <tr key={r.rowIndex} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-500">{r.rowIndex}</td>
                      <td className="px-4 py-3">{r.plate ?? '—'}</td>
                      <td className="px-4 py-3">{r.occurredAt ?? '—'}</td>
                      <td className="px-4 py-3">{r.fuelType ?? '—'}</td>
                      <td className="px-4 py-3 text-right">{r.liters ?? '—'}</td>
                      <td className="px-4 py-3 text-right">{r.totalPrice ?? '—'}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded ${b.cls}`}>
                          {b.icon}{b.label}
                        </span>
                        {errorText && <span className="block text-xs text-red-600">{errorText}</span>}
                        {r.classification === 'POSSIBLE_DUPLICATE' && (
                          <label className="mt-1 flex items-center gap-1.5 text-[11px] text-amber-800 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={forceImport.has(r.rowIndex)}
                              onChange={() => toggleForceImport(r.rowIndex)}
                              className="w-3.5 h-3.5 rounded border-amber-400 text-amber-600 focus:ring-amber-500 cursor-pointer"
                            />
                            Yine de aktar
                          </label>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {r.matchedTruckId
                          ? <span className="text-xs text-gray-600" title={r.matchedTruckId}>Eşlendi</span>
                          : <span className="text-xs text-amber-700">Eşleşmedi</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end gap-2">
            <button
              onClick={() => setPreview(null)}
              className="px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-colors"
            >
              Vazgeç
            </button>
            <button
              onClick={commit}
              disabled={committing}
              className="px-4 py-2 text-sm font-semibold rounded-lg bg-primary-600 text-white hover:bg-primary-700 hover:shadow-lg hover:shadow-primary-500/20 transition-all disabled:opacity-50"
            >
              {committing ? 'Aktarılıyor…' : 'Onayla ve Aktar'}
            </button>
          </div>
        </>
      )}

      {/* Batch history — hidden while previewing so the page doesn't become a
          two-workflow soup. Only shown when there's no active preview. */}
      {!preview && batches && batches.length > 0 && (
        <BatchHistoryCard batches={batches} />
      )}
    </div>
  );
};

interface BatchHistoryCardProps {
  batches: FuelImportBatchDto[];
}

/** "Son içe aktarmalar" — the manager's bridge back to batches they
 *  committed earlier but didn't finish reviewing. Without this card the
 *  import surface had no way to surface prior work. */
const BatchHistoryCard = ({ batches }: BatchHistoryCardProps) => {
  const statusTone = (batch: FuelImportBatchDto) => {
    const unmatched = batch.rowCountUnmatched ?? 0;
    const error = batch.rowCountError ?? 0;
    if (error > 0) return 'bg-red-50 text-red-700 border-red-200';
    if (unmatched > 0) return 'bg-amber-50 text-amber-700 border-amber-200';
    return 'bg-green-50 text-green-700 border-green-200';
  };
  const statusLabel = (batch: FuelImportBatchDto) => {
    const imported = batch.rowCountImported ?? 0;
    const unmatched = batch.rowCountUnmatched ?? 0;
    const error = batch.rowCountError ?? 0;
    if (error > 0) return `${error} hata`;
    if (unmatched > 0) return `${unmatched} eşleşmedi`;
    return `${imported} içe aktarıldı`;
  };

  return (
    <section>
      <h2 className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 mb-3">
        Son içe aktarmalar
      </h2>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden divide-y divide-gray-100">
        {batches.map((b) => (
          <Link
            key={b.id}
            to={`/manager/fuel-imports/${b.id}`}
            className="flex items-center gap-4 px-4 py-3 hover:bg-gray-50 transition-colors"
          >
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">{b.fileName}</p>
              <p className="text-xs text-gray-500 mt-0.5">
                {b.provider} · {formatDateTime(b.uploadedAt)}
              </p>
            </div>
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold border flex-shrink-0 ${statusTone(b)}`}
            >
              {statusLabel(b)}
            </span>
            <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
          </Link>
        ))}
      </div>
    </section>
  );
};

const StatCard = ({ label, value, highlight }: { label: string; value: number; highlight?: 'green' | 'red' | 'yellow' | 'gray' }) => {
  const cls =
    highlight === 'green'  ? 'border-green-200 bg-green-50' :
    highlight === 'red'    ? 'border-red-200 bg-red-50' :
    highlight === 'yellow' ? 'border-yellow-200 bg-yellow-50' :
    highlight === 'gray'   ? 'border-gray-200 bg-gray-50' :
    'border-gray-200 bg-white';
  return (
    <div className={`rounded-xl shadow-sm border p-3 ${cls}`}>
      <p className="text-xs text-gray-600">{label}</p>
      <p className="text-xl font-semibold">{value}</p>
    </div>
  );
};

export default FuelImportPage;