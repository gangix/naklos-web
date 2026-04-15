import type { UnmatchedPlateGroup } from '../../types/fuel';
import ResolutionActionMenu from './ResolutionActionMenu';

interface Props {
  fleetId: string;
  group: UnmatchedPlateGroup;
  onResolved: () => void;
}

export default function UnmatchedPlateRow({ fleetId, group, onResolved }: Props) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 flex items-start justify-between gap-4">
      <div className="min-w-0">
        <div className="flex items-baseline gap-2 flex-wrap">
          <span className="text-lg font-extrabold text-gray-900 tracking-tight">{group.displayPlate}</span>
          <span className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">{group.normalizedPlate}</span>
        </div>
        <div className="text-sm text-gray-700 mt-1.5 font-medium">
          {group.entryCount} kayıt
          <span className="mx-1.5 text-gray-300">·</span>
          {Number(group.totalLiters).toFixed(2)} L
          <span className="mx-1.5 text-gray-300">·</span>
          ₺{Number(group.totalPriceTl).toFixed(2)}
        </div>
        <div className="text-xs text-gray-500 mt-0.5">
          İlk: {new Date(group.firstOccurredAt).toLocaleDateString('tr-TR')}
          <span className="mx-1.5 text-gray-300">·</span>
          Son: {new Date(group.lastOccurredAt).toLocaleDateString('tr-TR')}
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
