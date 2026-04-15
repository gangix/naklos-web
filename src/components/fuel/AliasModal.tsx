import { useState } from 'react';
import { fuelReviewApi } from '../../services/api';
import { toast } from 'sonner';

interface Props {
  fleetId: string;
  normalizedPlate: string;
  onClose: () => void;
  onSuccess: (relinkedCount: number) => void;
}

export default function AliasModal({ fleetId, normalizedPlate, onClose, onSuccess }: Props) {
  const [canonicalPlate, setCanonicalPlate] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    const trimmed = canonicalPlate.trim();
    if (!trimmed) return;
    try {
      setSubmitting(true);
      const { relinkedCount } = await fuelReviewApi.alias(fleetId, normalizedPlate, trimmed);
      onSuccess(relinkedCount);
    } catch (e: any) {
      toast.error(e?.message ?? 'Plaka düzeltilemedi.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl border border-gray-200 p-6 w-full max-w-md">
        <h2 className="text-xl font-extrabold text-gray-900 tracking-tight mb-1">Plaka düzelt</h2>
        <p className="text-sm text-gray-600 mb-5">
          Statement'te <strong className="font-mono text-gray-900">{normalizedPlate}</strong> olarak görünen plakanın gerçekte hangi araca ait olduğunu yazın. Hem geçmiş hem gelecek kayıtlar doğru araca bağlanır.
        </p>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Doğru plaka</label>
        <input
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent mb-5"
          placeholder="Örn. 34 ABC 123"
          value={canonicalPlate}
          onChange={e => setCanonicalPlate(e.target.value)}
          autoFocus
        />
        <div className="flex justify-end gap-2">
          <button
            className="px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-colors"
            onClick={onClose}
            disabled={submitting}>
            İptal
          </button>
          <button
            className="px-4 py-2 text-sm font-semibold rounded-lg bg-primary-600 text-white hover:bg-primary-700 hover:shadow-lg hover:shadow-primary-500/20 transition-all disabled:opacity-50 disabled:pointer-events-none"
            onClick={submit}
            disabled={submitting || !canonicalPlate.trim()}>
            {submitting ? 'Kaydediliyor…' : 'Kaydet'}
          </button>
        </div>
      </div>
    </div>
  );
}
