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
  if (groups.length === 0) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
        <p className="text-sm font-medium text-green-900">Tüm plakalar eşleşmiş durumda.</p>
        <p className="text-xs text-green-700 mt-1">İçe aktarılan yakıt kayıtları mevcut araçlarınıza bağlandı.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="bg-blue-50/60 border border-blue-200 rounded-xl p-4 text-sm text-gray-700">
        <p className="mb-2">
          <strong className="text-gray-900">Bu plakalar bir araca bağlanamadı.</strong>{' '}
          Her plaka için dört seçeneğiniz var:
        </p>
        <ul className="space-y-1 text-xs text-gray-600 pl-1">
          <li>
            <span className="inline-block w-28 font-semibold text-gray-800">Araç oluştur</span>
            <span>— Bu plaka size ait, henüz araç olarak eklenmemiş.</span>
          </li>
          <li>
            <span className="inline-block w-28 font-semibold text-gray-800">Plaka düzelt</span>
            <span>— Statement'teki plaka yanlış yazılmış. Doğrusuna yönlendir.</span>
          </li>
          <li>
            <span className="inline-block w-28 font-semibold text-gray-800">Taşeron</span>
            <span>— Taşerona ait, filo analizlerinden dışla.</span>
          </li>
          <li>
            <span className="inline-block w-28 font-semibold text-gray-800">Yoksay</span>
            <span>— Bu partide görmezden gel (başka partide tekrar görünebilir).</span>
          </li>
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
