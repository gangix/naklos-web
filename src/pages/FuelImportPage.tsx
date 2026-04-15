import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Upload, CheckCircle2, XCircle, Sparkles } from 'lucide-react';
import { fuelFormatApi, fuelImportApi } from '../services/api';
import { useFleet } from '../contexts/FleetContext';
import { FileInput } from '../components/common/FormField';
import FuelSectionNav from '../components/fuel/FuelSectionNav';
import { setPendingSample } from '../state/pendingSampleFile';
import type {
  DraftPreview,
  FuelImportFormatDto,
  PreviewRow,
} from '../types/fuel';

const classificationBadge = (c: PreviewRow['classification'], errorMessage: string | null) => {
  if (errorMessage) return { cls: 'bg-red-100 text-red-700', label: 'Hata', icon: <XCircle className="w-3 h-3" /> };
  switch (c) {
    case 'NEW':       return { cls: 'bg-green-100 text-green-700', label: 'Yeni', icon: <CheckCircle2 className="w-3 h-3" /> };
    case 'DUPLICATE': return { cls: 'bg-gray-200 text-gray-700', label: 'Yinelenen', icon: null };
  }
};

const FuelImportPage = () => {
  const { fleetId } = useFleet();
  const navigate = useNavigate();

  const [formats, setFormats] = useState<FuelImportFormatDto[]>([]);
  const [formatId, setFormatId] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<DraftPreview | null>(null);
  const [loading, setLoading] = useState(false);
  const [committing, setCommitting] = useState(false);

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
      const batch = await fuelImportApi.commit(fleetId, preview.draftId, []);
      toast.success('İçe aktarma tamamlandı');
      navigate(`/manager/fuel-imports/${batch.id}`);
    } catch (err: any) {
      toast.error(err.message ?? 'Commit başarısız');
    } finally {
      setCommitting(false);
    }
  };

  const summary = preview?.summary;

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <FuelSectionNav />
      <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Yakıt Statement İçe Aktar</h1>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 space-y-3">
        <div className="grid grid-cols-2 gap-4">
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

          <div className="grid grid-cols-4 gap-2">
            <StatCard label="Toplam" value={summary.total} />
            <StatCard label="Yeni" value={summary.newCount} highlight="green" />
            <StatCard label="Yinelenen" value={summary.duplicateCount} highlight="gray" />
            <StatCard label="Hata / Eşlenmemiş" value={summary.errorCount + summary.unmatchedCount} highlight="red" />
          </div>

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
                  const b = classificationBadge(r.classification, r.errorMessage);
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
                        {r.errorMessage && <span className="block text-xs text-red-600">{r.errorMessage}</span>}
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
    </div>
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