import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowLeft, Upload, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import { fuelFormatApi, fuelImportApi } from '../services/api';
import type {
  CommitOverride,
  DraftPreview,
  FuelImportFormatDto,
  PreviewRow,
} from '../types/fuel';

const classificationBadge = (c: PreviewRow['classification'], errorMessage: string | null) => {
  if (errorMessage) return { cls: 'bg-red-100 text-red-700', label: 'Hata', icon: <XCircle className="w-3 h-3" /> };
  switch (c) {
    case 'NEW':                 return { cls: 'bg-green-100 text-green-700', label: 'Yeni', icon: <CheckCircle2 className="w-3 h-3" /> };
    case 'DUPLICATE':           return { cls: 'bg-gray-200 text-gray-700',   label: 'Yinelenen', icon: null };
    case 'POSSIBLE_DUPLICATE':  return { cls: 'bg-yellow-100 text-yellow-800', label: 'Olası yinelenen', icon: <AlertTriangle className="w-3 h-3" /> };
  }
};

const FuelImportPage = () => {
  const { fleetId = '' } = useParams();
  const navigate = useNavigate();

  const [formats, setFormats] = useState<FuelImportFormatDto[]>([]);
  const [formatId, setFormatId] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<DraftPreview | null>(null);
  const [overrides, setOverrides] = useState<Record<number, 'IMPORT'>>({}); // per row: flipped flag
  const [loading, setLoading] = useState(false);
  const [committing, setCommitting] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const all = await fuelFormatApi.list(fleetId);
        // only active fleet-scoped formats are importable
        const importable = all.filter((f) => f.active && !f.global);
        setFormats(importable);
      } catch (err: any) {
        toast.error(err.message ?? 'Formatlar yüklenemedi');
      }
    })();
  }, [fleetId]);

  const runPreview = async () => {
    if (!file || !formatId) {
      toast.error('Format ve dosya seçin');
      return;
    }
    try {
      setLoading(true);
      const result = await fuelImportApi.preview(fleetId, formatId, file);
      setPreview(result);
      setOverrides({});
    } catch (err: any) {
      toast.error(err.message ?? 'Önizleme başarısız');
    } finally {
      setLoading(false);
    }
  };

  const commit = async () => {
    if (!preview) return;
    const overrideList: CommitOverride[] = Object.entries(overrides).map(([rowIndex, action]) => ({
      rowIndex: Number(rowIndex),
      action,
    }));
    try {
      setCommitting(true);
      const batch = await fuelImportApi.commit(fleetId, preview.draftId, overrideList);
      toast.success('İçe aktarma tamamlandı');
      navigate(`/admin/fleets/${fleetId}/fuel-imports/${batch.id}`);
    } catch (err: any) {
      toast.error(err.message ?? 'Commit başarısız');
    } finally {
      setCommitting(false);
    }
  };

  const toggleOverride = (rowIndex: number) => {
    setOverrides((o) => {
      const next = { ...o };
      if (next[rowIndex] === 'IMPORT') delete next[rowIndex];
      else next[rowIndex] = 'IMPORT';
      return next;
    });
  };

  const summary = preview?.summary;

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(`/admin/fleets/${fleetId}/fuel-formats`)}
          className="p-2 hover:bg-gray-100 rounded"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-2xl font-semibold">Yakıt Statement İçe Aktar</h1>
      </div>

      <div className="bg-white border rounded p-4 space-y-3">
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
          <label className="block">
            <span className="text-sm font-medium">Statement dosyası (XLSX)</span>
            <input
              type="file"
              accept=".xlsx"
              className="mt-1 block text-sm"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </label>
        </div>
        <div className="flex justify-end">
          <button
            onClick={runPreview}
            disabled={!file || !formatId || loading}
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
          >
            <Upload className="w-4 h-4" />
            Önizle
          </button>
        </div>
      </div>

      {preview && summary && (
        <>
          <div className="grid grid-cols-5 gap-2">
            <StatCard label="Toplam" value={summary.total} />
            <StatCard label="Yeni" value={summary.newCount} highlight="green" />
            <StatCard label="Yinelenen" value={summary.duplicateCount} highlight="gray" />
            <StatCard label="Olası yinelenen" value={summary.possibleDuplicateCount} highlight="yellow" />
            <StatCard label="Hata / Eşlenmemiş" value={summary.errorCount + summary.unmatchedCount} highlight="red" />
          </div>

          <div className="border rounded overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left">
                <tr>
                  <th className="px-3 py-2">#</th>
                  <th className="px-3 py-2">Plaka</th>
                  <th className="px-3 py-2">Tarih</th>
                  <th className="px-3 py-2">Yakıt</th>
                  <th className="px-3 py-2 text-right">Litre</th>
                  <th className="px-3 py-2 text-right">Tutar</th>
                  <th className="px-3 py-2">Durum</th>
                  <th className="px-3 py-2">Araç</th>
                  <th className="px-3 py-2 text-right">İşlem</th>
                </tr>
              </thead>
              <tbody>
                {preview.rows.map((r) => {
                  const b = classificationBadge(r.classification, r.errorMessage);
                  const overridden = overrides[r.rowIndex] === 'IMPORT';
                  return (
                    <tr key={r.rowIndex} className="border-t">
                      <td className="px-3 py-2 text-gray-500">{r.rowIndex}</td>
                      <td className="px-3 py-2">{r.plate ?? '—'}</td>
                      <td className="px-3 py-2">{r.occurredAt ?? '—'}</td>
                      <td className="px-3 py-2">{r.fuelType ?? '—'}</td>
                      <td className="px-3 py-2 text-right">{r.liters ?? '—'}</td>
                      <td className="px-3 py-2 text-right">{r.totalPrice ?? '—'}</td>
                      <td className="px-3 py-2">
                        <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded ${b.cls}`}>
                          {b.icon}{b.label}
                        </span>
                        {r.errorMessage && <span className="block text-xs text-red-600">{r.errorMessage}</span>}
                      </td>
                      <td className="px-3 py-2">
                        {r.matchedTruckId
                          ? <span className="text-xs text-gray-600" title={r.matchedTruckId}>Eşlendi</span>
                          : <span className="text-xs text-amber-700">Eşleşmedi</span>}
                      </td>
                      <td className="px-3 py-2 text-right">
                        {r.classification === 'POSSIBLE_DUPLICATE' && (
                          <label className="inline-flex items-center gap-1 text-xs cursor-pointer">
                            <input
                              type="checkbox"
                              checked={overridden}
                              onChange={() => toggleOverride(r.rowIndex)}
                            />
                            Yine de içe aktar
                          </label>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end gap-2">
            <button
              onClick={() => { setPreview(null); setOverrides({}); }}
              className="px-4 py-2 border rounded"
            >
              Vazgeç
            </button>
            <button
              onClick={commit}
              disabled={committing}
              className="px-4 py-2 bg-green-600 text-white rounded disabled:opacity-50"
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
    <div className={`border rounded p-3 ${cls}`}>
      <p className="text-xs text-gray-600">{label}</p>
      <p className="text-xl font-semibold">{value}</p>
    </div>
  );
};

export default FuelImportPage;