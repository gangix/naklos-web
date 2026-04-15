import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Filter, X } from 'lucide-react';
import { useFleet } from '../contexts/FleetContext';
import UnmatchedPlateList from '../components/fuel/UnmatchedPlateList';
import FuelSectionNav from '../components/fuel/FuelSectionNav';

export default function FuelReviewPage() {
  const { t } = useTranslation();
  const { fleetId } = useFleet();
  const [params] = useSearchParams();
  const batchId = params.get('batchId');
  if (!fleetId) return null;
  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <FuelSectionNav />
      <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">{t('fuelReview.pageTitle')}</h1>
      {batchId && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 flex items-center gap-3 text-sm">
          <Filter className="w-4 h-4 text-blue-600 flex-shrink-0" />
          <div className="flex-1 text-blue-900">
            {t('fuelReview.filteredByBatch', { defaultValue: 'Yalnızca seçili partideki kayıtlar gösteriliyor.' })}{' '}
            <Link
              to={`/manager/fuel-imports/${batchId}`}
              className="font-medium text-blue-700 hover:underline">
              {t('fuelReview.viewBatch', { defaultValue: 'Parti detayı →' })}
            </Link>
          </div>
          <Link
            to="/manager/fuel-review"
            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md border border-blue-300 text-blue-700 hover:bg-blue-100 transition-colors flex-shrink-0">
            <X className="w-3 h-3" />
            {t('fuelReview.showAll', { defaultValue: 'Tümünü göster' })}
          </Link>
        </div>
      )}
      <UnmatchedPlateList fleetId={fleetId} batchId={batchId} />
    </div>
  );
}
