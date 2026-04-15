import type { UnmatchedPlateGroup } from '../../types/fuel';
import ResolutionActionMenu from './ResolutionActionMenu';

interface Props {
  fleetId: string;
  group: UnmatchedPlateGroup;
  onResolved: () => void;
}

export default function UnmatchedPlateRow({ fleetId, group, onResolved }: Props) {
  return (
    <div className="border rounded-lg p-4 flex items-start justify-between bg-white">
      <div>
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold">{group.displayPlate}</span>
          <span className="text-xs text-gray-500">({group.normalizedPlate})</span>
        </div>
        <div className="text-sm text-gray-600 mt-1">
          {group.entryCount} kayıt · {Number(group.totalLiters).toFixed(2)} L · ₺{Number(group.totalPriceTl).toFixed(2)}
        </div>
        <div className="text-xs text-gray-500">
          İlk: {new Date(group.firstOccurredAt).toLocaleDateString('tr-TR')} · Son: {new Date(group.lastOccurredAt).toLocaleDateString('tr-TR')}
        </div>
      </div>
      <ResolutionActionMenu
        fleetId={fleetId}
        normalizedPlate={group.normalizedPlate}
        displayPlate={group.displayPlate}
        batches={group.batches}
        onResolved={onResolved}
      />
    </div>
  );
}
