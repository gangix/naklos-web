import { useEffect, useState } from 'react';
import { useTranslation, Trans } from 'react-i18next';
import { toast } from 'sonner';
import { Trash2 } from 'lucide-react';
import { useFleet } from '../contexts/FleetContext';
import { fuelReviewApi } from '../services/api';
import type { PlateResolutionDto } from '../types/fuel';
import FuelSectionNav from '../components/fuel/FuelSectionNav';
import ConfirmActionModal from '../components/fuel/ConfirmActionModal';

const KIND_BADGE: Record<PlateResolutionDto['kind'], string> = {
  ALIAS: 'bg-blue-100 text-blue-700',
  SUBCONTRACTOR: 'bg-amber-100 text-amber-700',
};

export default function FuelResolutionsPage() {
  const { t } = useTranslation();
  const { fleetId } = useFleet();
  const [items, setItems] = useState<PlateResolutionDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingDelete, setPendingDelete] = useState<PlateResolutionDto | null>(null);

  const load = async () => {
    if (!fleetId) return;
    setLoading(true);
    try {
      setItems(await fuelReviewApi.listResolutions(fleetId));
    } catch (e: any) {
      toast.error(e?.message ?? t('fuelReview.resolutions.loadError'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, [fleetId]);

  const runDelete = async () => {
    if (!fleetId || !pendingDelete) return;
    try {
      await fuelReviewApi.deleteResolution(fleetId, pendingDelete.normalizedPlate);
      // Optimistic removal — no re-fetch needed.
      setItems(prev => prev.filter(r => r.normalizedPlate !== pendingDelete.normalizedPlate));
      toast.success(t('fuelReview.resolutions.deleted'));
      setPendingDelete(null);
    } catch (e: any) {
      toast.error(e?.message ?? t('fuelReview.resolutions.deleteError'));
    }
  };

  if (!fleetId) return null;

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <FuelSectionNav />
      <div>
        <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">
          {t('fuelReview.resolutions.title')}
        </h1>
        <p className="text-sm text-gray-600 mt-1">
          {t('fuelReview.resolutions.description')}
        </p>
      </div>

      {loading ? (
        <p className="text-gray-500">{t('fuelReview.loading')}</p>
      ) : items.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 text-center text-sm text-gray-600">
          {t('fuelReview.resolutions.empty')}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left">
              <tr>
                <th className="px-4 py-2.5 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  {t('fuelReview.resolutions.colPlate')}
                </th>
                <th className="px-4 py-2.5 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  {t('fuelReview.resolutions.colKind')}
                </th>
                <th className="px-4 py-2.5 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  {t('fuelReview.resolutions.colCanonical')}
                </th>
                <th className="px-4 py-2.5 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  {t('fuelReview.resolutions.colCreated')}
                </th>
                <th className="px-4 py-2.5"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map(r => (
                <tr key={r.normalizedPlate} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono font-semibold text-gray-900">{r.normalizedPlate}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${KIND_BADGE[r.kind]}`}>
                      {t(`fuelReview.resolutions.kind.${r.kind}`)}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-gray-700">{r.canonicalPlate ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-600">{new Date(r.createdAt).toLocaleDateString('tr-TR')}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => setPendingDelete(r)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-red-300 text-red-700 hover:bg-red-50 hover:border-red-400 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                      {t('fuelReview.resolutions.delete')}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {pendingDelete && (
        <ConfirmActionModal
          title={t('fuelReview.resolutions.delete')}
          description={
            <Trans
              i18nKey="fuelReview.resolutions.confirmDelete"
              values={{ plate: pendingDelete.normalizedPlate }}
              components={{ strong: <strong className="font-mono text-gray-900" /> }}
            />
          }
          confirmLabel={t('fuelReview.resolutions.delete')}
          tone="danger"
          onConfirm={runDelete}
          onClose={() => setPendingDelete(null)}
        />
      )}
    </div>
  );
}
