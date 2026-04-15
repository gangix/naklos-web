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

  const btnPrimary =
    "px-3 py-1.5 text-sm font-medium rounded bg-primary-600 text-white hover:bg-primary-700 shadow-sm";
  const btnSecondary =
    "px-3 py-1.5 text-sm font-medium rounded bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 shadow-sm";
  const btnGhost =
    "px-3 py-1.5 text-sm font-medium rounded border border-gray-200 text-gray-600 hover:bg-gray-100 hover:text-gray-900 hover:border-gray-300";

  return (
    <div className="flex gap-2 flex-wrap items-center">
      <button className={btnPrimary} onClick={createTruck}>
        Araç oluştur
      </button>
      <button className={btnSecondary} onClick={() => setAliasOpen(true)}>
        Takma ad
      </button>
      <button className={btnSecondary} onClick={markSubcontractor}>
        Taşeron
      </button>
      {batches.map(b => (
        <button
          key={b.batchId}
          className={btnGhost}
          onClick={() => dismiss(b.batchId)}
          title={`${b.batchFileName} içinde yoksay`}>
          Yoksay ({b.entryCount})
        </button>
      ))}
      {aliasOpen && (
        <AliasModal
          fleetId={fleetId}
          normalizedPlate={normalizedPlate}
          onClose={() => setAliasOpen(false)}
          onSuccess={(count) => {
            toast.success(`Takma ad kaydedildi. ${count} kayıt bağlandı.`);
            setAliasOpen(false);
            onResolved();
          }}
        />
      )}
    </div>
  );
}
