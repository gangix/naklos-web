import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowLeft, Copy, Plus, Power, Upload } from 'lucide-react';
import { fuelFormatApi } from '../services/api';
import type { FuelImportFormatDto } from '../types/fuel';

const FuelFormatsPage = () => {
  const { fleetId = '' } = useParams();
  const navigate = useNavigate();
  const [formats, setFormats] = useState<FuelImportFormatDto[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      setLoading(true);
      const data = await fuelFormatApi.list(fleetId);
      setFormats(data);
    } catch (err: any) {
      toast.error(err.message ?? 'Formatlar yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (fleetId) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fleetId]);

  const clone = async (starter: FuelImportFormatDto) => {
    const name = window.prompt(`"${starter.name}" için yeni ad:`, `${starter.name} (Kopya)`);
    if (!name) return;
    try {
      await fuelFormatApi.clone(fleetId, starter.id, name);
      toast.success('Format klonlandı');
      await load();
    } catch (err: any) {
      toast.error(err.message ?? 'Klonlama başarısız');
    }
  };

  const deactivate = async (f: FuelImportFormatDto) => {
    if (!window.confirm(`"${f.name}" pasifleştirilsin mi?`)) return;
    try {
      await fuelFormatApi.deactivate(fleetId, f.id);
      toast.success('Format pasifleştirildi');
      await load();
    } catch (err: any) {
      toast.error(err.message ?? 'Pasifleştirme başarısız');
    }
  };

  const globals = formats.filter((f) => f.global);
  const fleetScoped = formats.filter((f) => !f.global);

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(`/admin/fleets/${fleetId}`)}
          className="p-2 hover:bg-gray-100 rounded"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-2xl font-semibold">Yakıt İçe Aktarma Formatları</h1>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => navigate(`/admin/fleets/${fleetId}/fuel-formats/new`)}
          className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          Yeni Format
        </button>
        <button
          onClick={() => navigate(`/admin/fleets/${fleetId}/fuel-imports`)}
          className="inline-flex items-center gap-2 bg-white border px-4 py-2 rounded hover:bg-gray-50"
        >
          <Upload className="w-4 h-4" />
          Statement İçe Aktar
        </button>
      </div>

      {loading ? (
        <p className="text-gray-500">Yükleniyor…</p>
      ) : (
        <>
          <section>
            <h2 className="font-semibold mb-2">Filonuza Ait Formatlar</h2>
            {fleetScoped.length === 0 ? (
              <p className="text-gray-500 text-sm">Henüz fleet-scope bir format yok. Bir başlangıç formatını klonlayabilir veya sıfırdan oluşturabilirsiniz.</p>
            ) : (
              <FormatTable rows={fleetScoped} onDeactivate={deactivate} />
            )}
          </section>

          <section>
            <h2 className="font-semibold mb-2">Başlangıç Formatları (Genel)</h2>
            {globals.length === 0 ? (
              <p className="text-gray-500 text-sm">Başlangıç formatı bulunamadı.</p>
            ) : (
              <FormatTable rows={globals} onClone={clone} />
            )}
          </section>
        </>
      )}
    </div>
  );
};

interface TableProps {
  rows: FuelImportFormatDto[];
  onClone?: (f: FuelImportFormatDto) => void;
  onDeactivate?: (f: FuelImportFormatDto) => void;
}

const FormatTable = ({ rows, onClone, onDeactivate }: TableProps) => (
  <div className="border rounded overflow-x-auto">
    <table className="w-full text-sm">
      <thead className="bg-gray-50 text-left">
        <tr>
          <th className="px-3 py-2">Provider</th>
          <th className="px-3 py-2">Ad</th>
          <th className="px-3 py-2">Sürüm</th>
          <th className="px-3 py-2">Alan Sayısı</th>
          <th className="px-3 py-2">Durum</th>
          <th className="px-3 py-2 text-right">İşlem</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((f) => (
          <tr key={f.id} className="border-t">
            <td className="px-3 py-2">{f.provider}</td>
            <td className="px-3 py-2">{f.name}</td>
            <td className="px-3 py-2">v{f.version}</td>
            <td className="px-3 py-2">{Object.keys(f.columnMapping).length}</td>
            <td className="px-3 py-2">
              {f.active ? (
                <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-xs">Aktif</span>
              ) : (
                <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-xs">Pasif</span>
              )}
            </td>
            <td className="px-3 py-2 text-right space-x-2">
              {onClone && (
                <button
                  onClick={() => onClone(f)}
                  className="inline-flex items-center gap-1 text-blue-600 hover:underline text-sm"
                >
                  <Copy className="w-3 h-3" /> Klonla
                </button>
              )}
              {onDeactivate && f.active && (
                <button
                  onClick={() => onDeactivate(f)}
                  className="inline-flex items-center gap-1 text-red-600 hover:underline text-sm"
                >
                  <Power className="w-3 h-3" /> Pasifleştir
                </button>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export default FuelFormatsPage;