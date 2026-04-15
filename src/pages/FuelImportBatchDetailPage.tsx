import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowLeft } from 'lucide-react';
import { fuelImportApi } from '../services/api';
import { useFleet } from '../contexts/FleetContext';
import type { FuelImportBatchDto } from '../types/fuel';

const FuelImportBatchDetailPage = () => {
  const { batchId = '' } = useParams();
  const { fleetId } = useFleet();
  const navigate = useNavigate();
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

  if (loading) return <p className="p-6 text-gray-500">Yükleniyor…</p>;
  if (!batch) return <p className="p-6 text-gray-500">Kayıt bulunamadı.</p>;

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(`/manager/fuel-imports`)}
          className="p-2 hover:bg-gray-100 rounded"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-2xl font-semibold">İçe Aktarma Özeti</h1>
      </div>

      <div className="bg-white border rounded p-4 space-y-2 text-sm">
        <Row k="Dosya" v={batch.fileName} />
        <Row k="Provider" v={batch.provider} />
        <Row k="Durum" v={batch.status} />
        <Row k="Yüklenme" v={new Date(batch.uploadedAt).toLocaleString('tr-TR')} />
        {batch.completedAt && <Row k="Tamamlanma" v={new Date(batch.completedAt).toLocaleString('tr-TR')} />}
      </div>

      <div className="grid grid-cols-3 gap-2">
        <Stat label="Toplam Satır" value={batch.rowCountTotal} />
        <Stat label="Aktarıldı" value={batch.rowCountImported} tone="green" />
        <Stat label="Eşleşmeyen (aktarıldı)" value={batch.rowCountUnmatched} tone="yellow"
              linkTo={batch.rowCountUnmatched > 0 ? `/manager/fuel-review?batchId=${batch.id}&tab=unmatched` : undefined} />
        <Stat label="Yinelenen" value={batch.rowCountSkippedDuplicate} tone="gray" />
        <Stat label="Olası yinelenen" value={batch.rowCountSkippedPossibleDup} tone="yellow"
              linkTo={batch.rowCountSkippedPossibleDup > 0 ? `/manager/fuel-review?batchId=${batch.id}&tab=duplicates` : undefined} />
        <Stat label="Hata" value={batch.rowCountError} tone="red" />
      </div>
    </div>
  );
};

const Row = ({ k, v }: { k: string; v: string }) => (
  <div className="flex justify-between border-b last:border-b-0 pb-1">
    <span className="text-gray-500">{k}</span>
    <span className="font-medium">{v}</span>
  </div>
);

const Stat = ({ label, value, tone, linkTo }: { label: string; value: number; tone?: 'green' | 'red' | 'yellow' | 'gray'; linkTo?: string }) => {
  const cls =
    tone === 'green'  ? 'border-green-200 bg-green-50' :
    tone === 'red'    ? 'border-red-200 bg-red-50' :
    tone === 'yellow' ? 'border-yellow-200 bg-yellow-50' :
    tone === 'gray'   ? 'border-gray-200 bg-gray-50' :
    'border-gray-200 bg-white';
  return (
    <div className={`border rounded p-3 ${cls}`}>
      <p className="text-xs text-gray-600">{label}</p>
      {linkTo ? (
        <Link to={linkTo} className="text-xl font-semibold underline text-primary-600 hover:text-primary-700">
          {value}
        </Link>
      ) : (
        <p className="text-xl font-semibold">{value}</p>
      )}
    </div>
  );
};

export default FuelImportBatchDetailPage;