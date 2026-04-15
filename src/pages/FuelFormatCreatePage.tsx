import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileInput } from '../components/common/FormField';
import { toast } from 'sonner';
import { ArrowLeft, Upload } from 'lucide-react';
import { fuelFormatApi } from '../services/api';
import { useFleet } from '../contexts/FleetContext';
import { SEMANTIC_FIELDS, REQUIRED_SEMANTIC_FIELDS } from '../types/fuel';
import type { FuelProvider, SuggestedMappingDto } from '../types/fuel';
import { consumePendingSample } from '../state/pendingSampleFile';

const PROVIDERS: FuelProvider[] = ['GENERIC', 'OPET', 'SHELL', 'BP', 'PETROL_OFISI'];

const FuelFormatCreatePage = () => {
  const { fleetId } = useFleet();
  const navigate = useNavigate();

  const [provider, setProvider] = useState<FuelProvider>('GENERIC');
  const [name, setName] = useState('');
  const [sampleFile, setSampleFile] = useState<File | null>(null);
  const [suggested, setSuggested] = useState<SuggestedMappingDto | null>(null);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  // If we arrived here via the FuelImportPage recovery banner, a sample file
  // was stashed in the in-memory pending cache. Auto-attach + auto-suggest so
  // the user lands on a pre-populated mapping.
  const handledPendingRef = useRef(false);
  useEffect(() => {
    if (handledPendingRef.current || !fleetId) return;
    const pending = consumePendingSample();
    if (pending) {
      handledPendingRef.current = true;
      void handleSample(pending);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fleetId]);

  const handleSample = async (file: File) => {
    if (!fleetId) return;
    setSampleFile(file);
    try {
      setUploading(true);
      const result = await fuelFormatApi.suggestMapping(fleetId, file);
      setSuggested(result);
      setMapping({ ...result.mapping });
    } catch (err: any) {
      toast.error(err.message ?? 'Örneğe dayalı öneri başarısız');
    } finally {
      setUploading(false);
    }
  };

  const missingRequired = REQUIRED_SEMANTIC_FIELDS.filter((f) => !mapping[f]);

  const save = async () => {
    if (!fleetId) return;
    if (!name.trim()) {
      toast.error('Ad gerekli');
      return;
    }
    if (missingRequired.length > 0) {
      toast.error(`Zorunlu alanlar eksik: ${missingRequired.join(', ')}`);
      return;
    }
    try {
      setSaving(true);
      await fuelFormatApi.create(fleetId, {
        provider,
        name: name.trim(),
        columnMapping: mapping,
        sampleHeaders: suggested?.sampleHeaders ?? [],
      });
      toast.success('Format oluşturuldu');
      navigate(`/manager/fuel-formats`);
    } catch (err: any) {
      toast.error(err.message ?? 'Kaydetme başarısız');
    } finally {
      setSaving(false);
    }
  };

  const sourceBadge = () => {
    if (!suggested) return null;
    const label =
      suggested.source === 'CLAUDE' ? 'Claude önerisi' :
      suggested.source === 'HEURISTIC' ? 'Sezgisel eşleme' : 'Eşleşme yok';
    const cls =
      suggested.source === 'CLAUDE' ? 'bg-purple-100 text-purple-700' :
      suggested.source === 'HEURISTIC' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600';
    return (
      <span className={`text-xs px-2 py-0.5 rounded ${cls}`}>
        {label} · güven {Math.round(suggested.overallConfidence * 100)}%
      </span>
    );
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(`/manager/fuel-formats`)}
          className="p-2 hover:bg-gray-100 rounded"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-2xl font-semibold">Yeni Yakıt Formatı</h1>
      </div>

      <div className="bg-white border rounded p-4 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <label className="block">
            <span className="text-sm font-medium">Provider</span>
            <select
              className="mt-1 w-full border rounded px-2 py-1"
              value={provider}
              onChange={(e) => setProvider(e.target.value as FuelProvider)}
            >
              {PROVIDERS.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-sm font-medium">Format Adı</span>
            <input
              type="text"
              className="mt-1 w-full border rounded px-2 py-1"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="ör. Opet Detaylı Hareket 2026"
            />
          </label>
        </div>

        <div>
          <FileInput
            label="Örnek XLSX yükle (isteğe bağlı — eşlemeyi otomatik önerir)"
            accept=".xlsx"
            disabled={uploading}
            onChange={(f) => { if (f) void handleSample(f); }}
            selectedFileName={sampleFile?.name ?? null}
          />
          {uploading && <p className="text-sm text-gray-500 mt-2">Analiz ediliyor…</p>}
          {suggested && <div className="mt-2 flex items-center gap-2">{sourceBadge()}</div>}
        </div>

        <div>
          <h2 className="font-medium mb-2">Kolon Eşlemesi</h2>
          <p className="text-sm text-gray-500 mb-2">
            Zorunlu alanlar: {REQUIRED_SEMANTIC_FIELDS.join(', ')}
          </p>
          <div className="border rounded overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left">
                <tr>
                  <th className="px-3 py-2">Alan</th>
                  <th className="px-3 py-2">Kaynak Kolon</th>
                </tr>
              </thead>
              <tbody>
                {SEMANTIC_FIELDS.map((field) => (
                  <tr key={field} className="border-t">
                    <td className="px-3 py-2">
                      {field}
                      {(REQUIRED_SEMANTIC_FIELDS as readonly string[]).includes(field) && (
                        <span className="text-red-500 ml-1">*</span>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      {suggested && suggested.sampleHeaders.length > 0 ? (
                        <select
                          className="border rounded px-2 py-1 w-full"
                          value={mapping[field] ?? ''}
                          onChange={(e) => setMapping((m) => ({ ...m, [field]: e.target.value }))}
                        >
                          <option value="">— seçiniz —</option>
                          {suggested.sampleHeaders.map((h) => (
                            <option key={h} value={h}>{h}</option>
                          ))}
                        </select>
                      ) : (
                        <input
                          className="border rounded px-2 py-1 w-full"
                          value={mapping[field] ?? ''}
                          onChange={(e) => setMapping((m) => ({ ...m, [field]: e.target.value }))}
                          placeholder="kolon başlığını yazın"
                        />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <button
            onClick={() => navigate(`/manager/fuel-formats`)}
            className="px-4 py-2 border rounded"
          >
            İptal
          </button>
          <button
            onClick={save}
            disabled={saving || missingRequired.length > 0}
            className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50 inline-flex items-center gap-2"
          >
            <Upload className="w-4 h-4" />
            Kaydet
          </button>
        </div>
      </div>
    </div>
  );
};

export default FuelFormatCreatePage;