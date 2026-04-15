import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ExternalLink } from 'lucide-react';
import type { UnmatchedPlateGroup } from '../../types/fuel';
import ResolutionActionMenu from './ResolutionActionMenu';

interface Props {
  fleetId: string;
  group: UnmatchedPlateGroup;
  onResolved: () => void;
}

export default function UnmatchedPlateRow({ fleetId, group, onResolved }: Props) {
  const { t } = useTranslation();
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 flex items-start justify-between gap-4">
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2 flex-wrap">
          <span className="text-lg font-extrabold text-gray-900 tracking-tight">{group.displayPlate}</span>
          <span className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">{group.normalizedPlate}</span>
        </div>
        <div className="text-sm text-gray-700 mt-1.5 font-medium">
          {t('fuelReview.plateRow.entries', { count: group.entryCount })}
          <span className="mx-1.5 text-gray-300">·</span>
          {Number(group.totalLiters).toFixed(2)} L
          <span className="mx-1.5 text-gray-300">·</span>
          ₺{Number(group.totalPriceTl).toFixed(2)}
        </div>
        <div className="text-xs text-gray-500 mt-0.5">
          {t('fuelReview.plateRow.first')}: {new Date(group.firstOccurredAt).toLocaleDateString('tr-TR')}
          <span className="mx-1.5 text-gray-300">·</span>
          {t('fuelReview.plateRow.last')}: {new Date(group.lastOccurredAt).toLocaleDateString('tr-TR')}
        </div>
        {group.batches.length > 0 && (
          <div className="text-xs text-gray-500 mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="text-gray-400">{t('fuelReview.plateRow.fromBatches', { defaultValue: 'Parti' })}:</span>
            {group.batches.map((b, i) => (
              <span key={b.batchId} className="inline-flex items-center gap-1">
                <Link
                  to={`/manager/fuel-imports/${b.batchId}`}
                  className="inline-flex items-center gap-1 text-primary-600 hover:underline font-medium"
                  title={b.batchFileName}>
                  <span className="truncate max-w-[18ch]">{b.batchFileName}</span>
                  <ExternalLink className="w-3 h-3 flex-shrink-0" />
                </Link>
                <span className="text-gray-400">({b.entryCount})</span>
                {i < group.batches.length - 1 && <span className="text-gray-300">·</span>}
              </span>
            ))}
          </div>
        )}
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
