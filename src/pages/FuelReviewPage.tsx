import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Filter, X } from 'lucide-react';
import { useFleet } from '../contexts/FleetContext';
import { fuelReviewApi } from '../services/api';
import UnmatchedPlateList from '../components/fuel/UnmatchedPlateList';
import AnomalyList from '../components/fuel/AnomalyList';
import FuelSectionNav from '../components/fuel/FuelSectionNav';
import type { ReviewCounts } from '../types/fuel';

type Tab = 'unmatched' | 'anomalies';

export default function FuelReviewPage() {
  const { t } = useTranslation();
  const { fleetId } = useFleet();
  const [params] = useSearchParams();
  const batchId = params.get('batchId');
  const [tab, setTab] = useState<Tab>('unmatched');
  const [counts, setCounts] = useState<ReviewCounts | null>(null);

  useEffect(() => {
    if (!fleetId) return;
    fuelReviewApi.counts(fleetId).then(setCounts).catch(() => setCounts(null));
  }, [fleetId, tab]);

  if (!fleetId) return null;

  const tabClass = (active: boolean) =>
    `px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
      active
        ? 'bg-primary-600 text-white shadow-sm'
        : 'text-gray-600 border border-gray-200 hover:bg-gray-50 hover:text-gray-900 hover:border-gray-300'
    }`;

  const badge = (value: number | undefined, activeTone: boolean) =>
    typeof value === 'number' && value > 0 ? (
      <span
        className={`ml-1.5 inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1 text-[10px] font-bold rounded-full ${
          activeTone ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-700'
        }`}>
        {value}
      </span>
    ) : null;

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <FuelSectionNav />
      <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">{t('fuelReview.pageTitle')}</h1>

      {batchId && tab === 'unmatched' && (
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

      {/* Inner tabs — two review surfaces sharing the same page. */}
      <nav className="flex gap-2">
        <button
          type="button"
          className={tabClass(tab === 'unmatched')}
          onClick={() => setTab('unmatched')}>
          {t('fuelReview.tabs.unmatched')}
          {badge(counts?.unmatchedPlateGroups, tab === 'unmatched')}
        </button>
        <button
          type="button"
          className={tabClass(tab === 'anomalies')}
          onClick={() => setTab('anomalies')}>
          {t('fuelReview.tabs.anomalies')}
          {badge(counts?.pendingAnomalies, tab === 'anomalies')}
        </button>
      </nav>

      {tab === 'unmatched' && <UnmatchedPlateList fleetId={fleetId} batchId={batchId} />}
      {tab === 'anomalies' && <AnomalyList fleetId={fleetId} />}
    </div>
  );
}
