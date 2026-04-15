import { fuelReviewApi } from '../../services/api';
import type { FuelEntryDto, PossibleDuplicatePair } from '../../types/fuel';
import { toast } from 'sonner';

interface Props {
  fleetId: string;
  pair: PossibleDuplicatePair;
  onResolved: () => void;
}

function EntryCell({ entry }: { entry: FuelEntryDto | null }) {
  if (!entry) return <div className="text-sm text-gray-500">Eşleşen kayıt bulunamadı</div>;
  return (
    <div className="text-sm">
      <div className="font-semibold">{entry.plateTextRaw}</div>
      <div>{new Date(entry.occurredAt).toLocaleString('tr-TR')}</div>
      <div>{Number(entry.liters).toFixed(2)} L · ₺{Number(entry.totalPrice).toFixed(2)}</div>
      {entry.stationName && <div className="text-gray-600">{entry.stationName}</div>}
      {entry.transactionId && <div className="text-xs text-gray-500">Txn {entry.transactionId}</div>}
    </div>
  );
}

export default function DuplicateComparisonCard({ fleetId, pair, onResolved }: Props) {
  const confirmDupe = async () => {
    if (!window.confirm('Bu kayıt yinelenmiş olarak onaylanıp silinsin mi?')) return;
    try {
      await fuelReviewApi.confirmDuplicate(fleetId, pair.flaggedEntry.id);
      toast.success('Yineleme onaylandı ve kayıt silindi.');
      onResolved();
    } catch (e: any) {
      toast.error(e?.message ?? 'Onaylama başarısız.');
    }
  };
  const dismissDupe = async () => {
    try {
      await fuelReviewApi.dismissDuplicate(fleetId, pair.flaggedEntry.id);
      toast.success('Uyarı temizlendi.');
      onResolved();
    } catch (e: any) {
      toast.error(e?.message ?? 'Temizleme başarısız.');
    }
  };

  return (
    <div className="border rounded-lg p-4 bg-white">
      <div className="text-xs text-gray-500 mb-2">Parti: {pair.batchFileName ?? '—'}</div>
      <div className="grid grid-cols-2 gap-4">
        <div className="border-r pr-4">
          <div className="text-xs text-amber-700 font-semibold mb-1">İŞARETLENEN</div>
          <EntryCell entry={pair.flaggedEntry} />
        </div>
        <div>
          <div className="text-xs text-gray-500 font-semibold mb-1">ORİJİNAL (ŞÜPHELİ)</div>
          <EntryCell entry={pair.suspectedOriginal} />
        </div>
      </div>
      <div className="flex justify-end gap-2 mt-4">
        <button className="px-3 py-1 text-sm border rounded" onClick={dismissDupe}>
          Yineleme değil
        </button>
        <button className="px-3 py-1 text-sm bg-red-600 text-white rounded" onClick={confirmDupe}>
          Yinelemeyi onayla
        </button>
      </div>
    </div>
  );
}
