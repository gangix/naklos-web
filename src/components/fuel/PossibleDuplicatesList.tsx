import { useEffect, useState } from 'react';
import { fuelReviewApi } from '../../services/api';
import type { PossibleDuplicatePair } from '../../types/fuel';
import DuplicateComparisonCard from './DuplicateComparisonCard';

interface Props { fleetId: string; batchId: string | null; }

export default function PossibleDuplicatesList({ fleetId, batchId }: Props) {
  const [pairs, setPairs] = useState<PossibleDuplicatePair[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    setLoading(true);
    try {
      setPairs(await fuelReviewApi.listDuplicates(fleetId, batchId ?? undefined));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fleetId, batchId]);

  if (loading) return <p className="text-gray-500">Yükleniyor…</p>;
  if (pairs.length === 0) return <p className="text-gray-500">Bekleyen olası yineleme yok.</p>;

  return (
    <div className="space-y-3">
      {pairs.map(p => (
        <DuplicateComparisonCard
          key={p.flaggedEntry.id}
          fleetId={fleetId}
          pair={p}
          onResolved={refresh}
        />
      ))}
    </div>
  );
}
