import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Filter, X } from 'lucide-react';
import { useFleet } from '../contexts/FleetContext';
import { useFuelCounts } from '../contexts/FuelCountsContext';
import UnmatchedPlateList from '../components/fuel/UnmatchedPlateList';
import DismissedEntriesList from '../components/fuel/DismissedEntriesList';
import FuelSectionNav from '../components/fuel/FuelSectionNav';

type Tab = 'unmatched' | 'dismissed';

export default function FuelReviewPage() {
  const { t } = useTranslation();
  const { fleetId } = useFleet();
  const [params, setParams] = useSearchParams();
  const batchId = params.get('batchId');
  const tab = (params.get('tab') as Tab) ?? 'unmatched';
  const { unmatched: unmatchedCount } = useFuelCounts();

  if (!fleetId) return null;

  const setTab = (next: Tab) => {
    const newParams = new URLSearchParams(params);
    if (next === 'unmatched') newParams.delete('tab');
    else newParams.set('tab', next);
    setParams(newParams, { replace: true });
  };

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

      <div className="flex gap-2 border-b border-gray-200">
        <TabButton
          active={tab === 'unmatched'}
          onClick={() => setTab('unmatched')}
          label={t('fuelReview.tabs.unmatched')}
          count={unmatchedCount}
        />
        <TabButton
          active={tab === 'dismissed'}
          onClick={() => setTab('dismissed')}
          label={t('fuelReview.tabs.dismissed')}
          count={0}
        />
      </div>

      {tab === 'unmatched' && <UnmatchedPlateList fleetId={fleetId} batchId={batchId} />}
      {tab === 'dismissed' && <DismissedEntriesList fleetId={fleetId} />}
    </div>
  );
}

interface TabButtonProps {
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
}

function TabButton({ active, onClick, label, count }: TabButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-4 py-2 -mb-px text-sm font-semibold transition-colors border-b-2 ${
        active
          ? 'text-primary-700 border-primary-600'
          : 'text-gray-600 border-transparent hover:text-gray-900'
      }`}
    >
      {label}
      {count > 0 && (
        <span
          className={`ml-1.5 inline-flex items-center justify-center min-w-[20px] h-[18px] px-1.5 text-[10px] font-bold rounded-full tabular-nums ${
            active ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-700'
          }`}
        >
          {count > 99 ? '99+' : count}
        </span>
      )}
    </button>
  );
}
