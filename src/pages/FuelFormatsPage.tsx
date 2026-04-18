import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Copy, Plus, Power, Upload } from 'lucide-react';
import { fuelFormatApi } from '../services/api';
import { useFleet } from '../contexts/FleetContext';
import type { FuelImportFormatDto } from '../types/fuel';
import FuelSectionNav from '../components/fuel/FuelSectionNav';
import ConfirmActionModal from '../components/fuel/ConfirmActionModal';

const FuelFormatsPage = () => {
  const { fleetId } = useFleet();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [formats, setFormats] = useState<FuelImportFormatDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [cloneTarget, setCloneTarget] = useState<FuelImportFormatDto | null>(null);
  const [deactivateTarget, setDeactivateTarget] = useState<FuelImportFormatDto | null>(null);

  const load = async () => {
    if (!fleetId) return;
    try {
      setLoading(true);
      const data = await fuelFormatApi.list(fleetId);
      setFormats(data);
    } catch (err: any) {
      toast.error(err.message ?? t('fuelFormats.toast.loadError'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (fleetId) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fleetId]);

  const runClone = async (name: string) => {
    if (!fleetId || !cloneTarget) return;
    try {
      await fuelFormatApi.clone(fleetId, cloneTarget.id, name);
      toast.success(t('fuelFormats.toast.cloneSuccess'));
      setCloneTarget(null);
      await load();
    } catch (err: any) {
      toast.error(err.message ?? t('fuelFormats.toast.cloneError'));
    }
  };

  const runDeactivate = async () => {
    if (!fleetId || !deactivateTarget) return;
    try {
      await fuelFormatApi.deactivate(fleetId, deactivateTarget.id);
      toast.success(t('fuelFormats.toast.deactivateSuccess'));
      setDeactivateTarget(null);
      await load();
    } catch (err: any) {
      toast.error(err.message ?? t('fuelFormats.toast.deactivateError'));
    }
  };

  const globals = formats.filter((f) => f.global);
  const fleetScoped = formats.filter((f) => !f.global);

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <FuelSectionNav />
      <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Yakıt İçe Aktarma Formatları</h1>

      <div className="flex gap-2">
        <button
          onClick={() => navigate(`/manager/fuel-formats/new`)}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg bg-primary-600 text-white hover:bg-primary-700 hover:shadow-lg hover:shadow-primary-500/20 transition-all"
        >
          <Plus className="w-4 h-4" />
          Yeni Format
        </button>
        <button
          onClick={() => navigate(`/manager/fuel-imports`)}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-colors"
        >
          <Upload className="w-4 h-4" />
          Statement İçe Aktar
        </button>
      </div>

      {loading ? (
        <p className="text-gray-500">Yükleniyor…</p>
      ) : (
        <>
          <section>
            <h2 className="font-semibold mb-2">Filonuza Ait Formatlar</h2>
            {fleetScoped.length === 0 ? (
              <p className="text-gray-500 text-sm">Henüz fleet-scope bir format yok. Bir başlangıç formatını klonlayabilir veya sıfırdan oluşturabilirsiniz.</p>
            ) : (
              <FormatTable rows={fleetScoped} onDeactivate={setDeactivateTarget} />
            )}
          </section>

          <section>
            <h2 className="font-semibold mb-2">Başlangıç Formatları (Genel)</h2>
            {globals.length === 0 ? (
              <p className="text-gray-500 text-sm">Başlangıç formatı bulunamadı.</p>
            ) : (
              <FormatTable rows={globals} onClone={setCloneTarget} />
            )}
          </section>
        </>
      )}

      {cloneTarget && (
        <CloneNameModal
          initialName={t('fuelFormats.clone.defaultName', { name: cloneTarget.name })}
          onSubmit={runClone}
          onClose={() => setCloneTarget(null)}
        />
      )}

      {deactivateTarget && (
        <ConfirmActionModal
          title={t('fuelFormats.deactivate.title')}
          description={t('fuelFormats.deactivate.description', { name: deactivateTarget.name })}
          confirmLabel={t('fuelFormats.deactivate.confirm')}
          tone="danger"
          onConfirm={runDeactivate}
          onClose={() => setDeactivateTarget(null)}
        />
      )}
    </div>
  );
};

interface CloneNameModalProps {
  initialName: string;
  onSubmit: (name: string) => Promise<void>;
  onClose: () => void;
}

/** Inline text-input modal for naming a cloned format. Small enough (one
 *  trimmed-input field + two buttons) to live here instead of extracting to
 *  components/common — the only other `window.prompt` in the fuel surface
 *  has been removed, so there's nothing else to share with yet. */
function CloneNameModal({ initialName, onSubmit, onClose }: CloneNameModalProps) {
  const { t } = useTranslation();
  const [name, setName] = useState(initialName);
  const [submitting, setSubmitting] = useState(false);
  const trimmed = name.trim();

  const submit = async () => {
    if (!trimmed || submitting) return;
    try {
      setSubmitting(true);
      await onSubmit(trimmed);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl border border-gray-200 p-6 w-full max-w-md">
        <h2 className="text-xl font-extrabold text-gray-900 tracking-tight mb-1">
          {t('fuelFormats.clone.title')}
        </h2>
        <p className="text-sm text-gray-600 mb-5">
          {t('fuelFormats.clone.description')}
        </p>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          {t('fuelFormats.clone.nameLabel')}
        </label>
        <input
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent mb-5"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && trimmed && !submitting) void submit(); }}
          autoFocus
        />
        <div className="flex justify-end gap-2">
          <button
            className="px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-colors"
            onClick={onClose}
            disabled={submitting}
          >
            {t('common.cancel')}
          </button>
          <button
            className="px-4 py-2 text-sm font-semibold rounded-lg bg-primary-600 text-white hover:bg-primary-700 hover:shadow-lg hover:shadow-primary-500/20 transition-all disabled:opacity-50 disabled:pointer-events-none"
            onClick={() => void submit()}
            disabled={submitting || !trimmed}
          >
            {submitting ? t('fuelFormats.clone.saving') : t('fuelFormats.clone.save')}
          </button>
        </div>
      </div>
    </div>
  );
}

interface TableProps {
  rows: FuelImportFormatDto[];
  onClone?: (f: FuelImportFormatDto) => void;
  onDeactivate?: (f: FuelImportFormatDto) => void;
}

const FormatTable = ({ rows, onClone, onDeactivate }: TableProps) => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden overflow-x-auto">
    <table className="w-full text-sm">
      <thead className="bg-gray-50 text-left">
        <tr>
          <th className="px-4 py-2.5 text-xs font-semibold text-gray-600 uppercase tracking-wider">Provider</th>
          <th className="px-4 py-2.5 text-xs font-semibold text-gray-600 uppercase tracking-wider">Ad</th>
          <th className="px-4 py-2.5 text-xs font-semibold text-gray-600 uppercase tracking-wider">Sürüm</th>
          <th className="px-4 py-2.5 text-xs font-semibold text-gray-600 uppercase tracking-wider">Alan Sayısı</th>
          <th className="px-4 py-2.5 text-xs font-semibold text-gray-600 uppercase tracking-wider">Durum</th>
          <th className="px-4 py-2.5 text-xs font-semibold text-gray-600 uppercase tracking-wider text-right">İşlem</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-100">
        {rows.map((f) => (
          <tr key={f.id} className="hover:bg-gray-50">
            <td className="px-4 py-3">{f.provider}</td>
            <td className="px-4 py-3">{f.name}</td>
            <td className="px-4 py-3">v{f.version}</td>
            <td className="px-4 py-3">{Object.keys(f.columnMapping).length}</td>
            <td className="px-4 py-3">
              {f.active ? (
                <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-xs">Aktif</span>
              ) : (
                <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-xs">Pasif</span>
              )}
            </td>
            <td className="px-4 py-3 text-right space-x-2">
              {onClone && (
                <button
                  onClick={() => onClone(f)}
                  className="inline-flex items-center gap-1 text-blue-600 hover:underline text-sm"
                >
                  <Copy className="w-3 h-3" /> Klonla
                </button>
              )}
              {onDeactivate && f.active && (
                <button
                  onClick={() => onDeactivate(f)}
                  className="inline-flex items-center gap-1 text-red-600 hover:underline text-sm"
                >
                  <Power className="w-3 h-3" /> Pasifleştir
                </button>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export default FuelFormatsPage;