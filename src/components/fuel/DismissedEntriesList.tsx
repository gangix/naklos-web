import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Undo2 } from 'lucide-react';
import { fuelReviewApi } from '../../services/api';
import { useFuelCounts } from '../../contexts/FuelCountsContext';
import type { ResolutionEntryView } from '../../types/fuel';

interface Props {
  fleetId: string;
}

/** "Yoksaylan kayıtlar" — list of fuel entries the manager previously
 *  dismissed, with a one-click undo. Closes the "mistaken dismiss is a
 *  one-way door" gap that existed before the undismiss endpoint landed. */
export default function DismissedEntriesList({ fleetId }: Props) {
  const { t } = useTranslation();
  const { refresh: refreshFuelCounts } = useFuelCounts();
  const [entries, setEntries] = useState<ResolutionEntryView[] | null>(null);
  const [undoing, setUndoing] = useState<string | null>(null);

  const refresh = async () => {
    try {
      const page = await fuelReviewApi.listDismissedEntries(fleetId, 0, 50);
      setEntries(page.content);
    } catch (e: any) {
      toast.error(e?.message ?? t('fuelReview.dismissed.loadError'));
    }
  };

  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fleetId]);

  const undo = async (entryId: string) => {
    try {
      setUndoing(entryId);
      await fuelReviewApi.undismissEntry(fleetId, entryId);
      // Moving a row out of DISMISSED means a new UNMATCHED entry appears,
      // which bumps the top-nav unmatched badge.
      refreshFuelCounts();
      setEntries((prev) => prev?.filter((e) => e.id !== entryId) ?? null);
      toast.success(t('fuelReview.dismissed.undoneToast'));
    } catch (e: any) {
      toast.error(e?.message ?? t('fuelReview.dismissed.undoErrorDefault'));
    } finally {
      setUndoing(null);
    }
  };

  if (entries === null) return <p className="text-gray-500">{t('fuelReview.loading')}</p>;

  if (entries.length === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 text-center">
        <p className="text-sm text-gray-700 font-medium">
          {t('fuelReview.dismissed.empty')}
        </p>
        <p className="text-xs text-gray-500 mt-2 max-w-md mx-auto leading-relaxed">
          {t('fuelReview.dismissed.emptyHint')}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 text-left">
          <tr>
            <th className="px-4 py-2.5 text-xs font-semibold text-gray-600 uppercase tracking-wider">
              {t('fuelReview.dismissed.colPlate')}
            </th>
            <th className="px-4 py-2.5 text-xs font-semibold text-gray-600 uppercase tracking-wider">
              {t('fuelReview.dismissed.colDate')}
            </th>
            <th className="px-4 py-2.5 text-xs font-semibold text-gray-600 uppercase tracking-wider text-right">
              {t('fuelReview.dismissed.colLiters')}
            </th>
            <th className="px-4 py-2.5 text-xs font-semibold text-gray-600 uppercase tracking-wider text-right">
              {t('fuelReview.dismissed.colPrice')}
            </th>
            <th className="px-4 py-2.5 text-xs font-semibold text-gray-600 uppercase tracking-wider">
              {t('fuelReview.dismissed.colStation')}
            </th>
            <th className="px-4 py-2.5"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {entries.map((e) => (
            <tr key={e.id} className="hover:bg-gray-50">
              <td className="px-4 py-3 font-mono font-semibold text-gray-900">{e.plateTextRaw}</td>
              <td className="px-4 py-3 text-gray-700">
                {new Date(e.occurredAt).toLocaleDateString('tr-TR')}
              </td>
              <td className="px-4 py-3 text-right text-gray-700">
                {Number(e.liters).toFixed(2)} L
              </td>
              <td className="px-4 py-3 text-right text-gray-700">
                ₺{Number(e.totalPrice).toFixed(2)}
              </td>
              <td className="px-4 py-3 text-gray-600 truncate max-w-[200px]">
                {e.stationName ?? '—'}
              </td>
              <td className="px-4 py-3 text-right">
                <button
                  onClick={() => void undo(e.id)}
                  disabled={undoing === e.id}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Undo2 className="w-3.5 h-3.5" />
                  {undoing === e.id
                    ? t('fuelReview.dismissed.undoing')
                    : t('fuelReview.dismissed.undo')}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
