import { useEffect, useState } from 'react';
import { fuelReviewApi } from '../../services/api';
import type { UnmatchedPlateGroup } from '../../types/fuel';
import UnmatchedPlateRow from './UnmatchedPlateRow';

interface Props { fleetId: string; batchId: string | null; }

export default function UnmatchedPlateList({ fleetId, batchId }: Props) {
  const [groups, setGroups] = useState<UnmatchedPlateGroup[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    setLoading(true);
    try {
      const data = await fuelReviewApi.listUnmatched(fleetId, batchId ?? undefined);
      setGroups(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fleetId, batchId]);

  if (loading) return <p className="text-gray-500">Yükleniyor…</p>;
  if (groups.length === 0) return <p className="text-gray-500">Eşleşmeyen plaka yok.</p>;

  return (
    <div className="space-y-2">
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
