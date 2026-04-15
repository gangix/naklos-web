import { useState } from 'react';
import { fuelReviewApi } from '../../services/api';
import type { UnmatchedBatchBreakdown } from '../../types/fuel';
import AliasModal from './AliasModal';
import { toast } from 'sonner';

interface Props {
  fleetId: string;
  normalizedPlate: string;
  displayPlate: string;
  batches: UnmatchedBatchBreakdown[];
  onResolved: () => void;
}

export default function ResolutionActionMenu(
  { fleetId, normalizedPlate, displayPlate, batches, onResolved }: Props) {

  const [aliasOpen, setAliasOpen] = useState(false);

  const markSubcontractor = async () => {
    if (!window.confirm(`${displayPlate} taşerona ait olarak işaretlensin mi? Geçmiş kayıtlar analitiklerden dışlanacak.`)) return;
    try {
      const { affectedCount } = await fuelReviewApi.subcontractor(fleetId, normalizedPlate);
      toast.success(`${affectedCount} kayıt taşeron olarak işaretlendi.`);
      onResolved();
    } catch (e: any) {
      toast.error(e?.message ?? 'Taşeron işaretleme başarısız.');
    }
  };

  const dismiss = async (batchId: string) => {
    try {
      const { affectedCount } = await fuelReviewApi.dismiss(fleetId, normalizedPlate, batchId);
      toast.success(`${affectedCount} kayıt yoksayıldı (bu partide).`);
      onResolved();
    } catch (e: any) {
      toast.error(e?.message ?? 'Yoksayma başarısız.');
    }
  };

  const createTruck = async () => {
    // v1 shortcut: simple prompts. Replaced with AddTruckModal integration later.
    const capacityKgStr = window.prompt('Kapasite (kg)?');
    if (!capacityKgStr) return;
    const capacityKg = Number(capacityKgStr);
    const type = (window.prompt('Tür? (TIR, KAMYON, KAMYONET)') ?? 'TIR').toUpperCase();
    const cargoVolumeM3Str = window.prompt('Kargo hacmi (m³)?');
    if (!cargoVolumeM3Str) return;
    const cargoVolumeM3 = Number(cargoVolumeM3Str);
    if (!Number.isFinite(capacityKg) || !Number.isFinite(cargoVolumeM3)) {
      toast.error('Kapasite veya hacim geçersiz.');
      return;
    }
    try {
      const r = await fuelReviewApi.createTruck(fleetId, normalizedPlate, {
        plateNumber: displayPlate,
        type,
        capacityKg,
        cargoVolumeM3,
      });
      toast.success(`Araç oluşturuldu. ${r.relinkedFuelEntryCount} geçmiş kayıt bağlandı.`);
      onResolved();
    } catch (e: any) {
      toast.error(e?.message ?? 'Araç oluşturma başarısız.');
    }
  };

  // Canonical button classes lifted from TrucksPage so the fuel surface reads
  // the same as the rest of the manager area.
  const btnPrimary =
    "px-4 py-2 text-sm font-semibold rounded-lg bg-primary-600 text-white hover:bg-primary-700 hover:shadow-lg hover:shadow-primary-500/20 transition-all";
  const btnSecondary =
    "px-4 py-2 text-sm font-medium rounded-lg border border-primary-600 text-primary-600 hover:bg-primary-50 transition-colors";
  const btnGhost =
    "px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-colors";

  return (
    <div className="flex gap-2 flex-wrap items-center">
      <button
        className={btnPrimary}
        onClick={createTruck}
        title="Bu plakayı yeni araç olarak kaydet. Geçmiş kayıtlar otomatik olarak yeni araca bağlanır.">
        Araç oluştur
      </button>
      <button
        className={btnSecondary}
        onClick={() => setAliasOpen(true)}
        title="Yanlış yazılmış plakayı doğrusuna yönlendir (ör. 34A8C123 → 34ABC123). Bu ve gelecekteki kayıtlar doğru araca bağlanır.">
        Plaka düzelt
      </button>
      <button
        className={btnSecondary}
        onClick={markSubcontractor}
        title="Bu plaka taşerona ait. Filo analizlerinden dışlanır, araç oluşturulmaz.">
        Taşeron
      </button>
      {batches.map(b => (
        <button
          key={b.batchId}
          className={btnGhost}
          onClick={() => dismiss(b.batchId)}
          title={`"${b.batchFileName}" partisindeki ${b.entryCount} kaydı incelemeden kaldır. Aynı plaka başka bir partide tekrar görünebilir.`}>
          Yoksay ({b.entryCount})
        </button>
      ))}
      {aliasOpen && (
        <AliasModal
          fleetId={fleetId}
          normalizedPlate={normalizedPlate}
          onClose={() => setAliasOpen(false)}
          onSuccess={(count) => {
            toast.success(`Plaka düzeltildi. ${count} kayıt bağlandı.`);
            setAliasOpen(false);
            onResolved();
          }}
        />
      )}
    </div>
  );
}
