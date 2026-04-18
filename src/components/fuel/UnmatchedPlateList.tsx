import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { fuelReviewApi } from '../../services/api';
import { useFuelCounts } from '../../contexts/FuelCountsContext';
import type { UnmatchedPlateGroup } from '../../types/fuel';
import UnmatchedPlateRow from './UnmatchedPlateRow';

interface Props { fleetId: string; batchId: string | null; }

export default function UnmatchedPlateList({ fleetId, batchId }: Props) {
  const { t } = useTranslation();
  const { refresh: refreshFuelCounts } = useFuelCounts();
  const [groups, setGroups] = useState<UnmatchedPlateGroup[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    setLoading(true);
    try {
      const data = await fuelReviewApi.listUnmatched(fleetId, batchId ?? undefined);
      setGroups(data);
      // Every resolution (createTruck / alias / subcontractor / dismiss) also
      // shrinks the top-nav unmatched-count badge. Refresh here so the badge
      // and the list move together instead of the user having to reload.
      refreshFuelCounts();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fleetId, batchId]);

  if (loading) return <p className="text-gray-500">{t('fuelReview.loading')}</p>;
  if (groups.length === 0) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
        <p className="text-sm font-medium text-green-900">{t('fuelReview.empty.unmatched.title')}</p>
        <p className="text-xs text-green-700 mt-1">{t('fuelReview.empty.unmatched.subtitle')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="bg-blue-50/60 border border-blue-200 rounded-xl p-4 text-sm text-gray-700">
        <p className="mb-2">{t('fuelReview.banner.lead')}</p>
        <ul className="space-y-1 text-xs text-gray-600 pl-1">
          {(['createTruck', 'alias', 'subcontractor', 'dismiss'] as const).map(key => (
            <li key={key}>
              <span className="inline-block w-28 font-semibold text-gray-800">{t(`fuelReview.banner.${key}.label`)}</span>
              <span>— {t(`fuelReview.banner.${key}.desc`)}</span>
            </li>
          ))}
        </ul>
      </div>
      {groups.map(g => (
        <UnmatchedPlateRow
          key={g.normalizedPlate}
          fleetId={fleetId}
          group={g}
          onResolved={refresh}
        />
      ))}
    </div>
  );
}
