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
      toast.error(e?.message ?? 'Takma ad oluşturulamadı.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-lg font-bold mb-4">Takma ad ekle</h2>
        <p className="text-sm text-gray-600 mb-4">
          <strong>{normalizedPlate}</strong> yerine doğru plakayı yazın. Geçmiş ve gelecek kayıtlara uygulanacak.
        </p>
        <input
          className="w-full border rounded px-3 py-2 mb-4"
          placeholder="Gerçek plaka (örn. 34 ABC 123)"
          value={canonicalPlate}
          onChange={e => setCanonicalPlate(e.target.value)}
          autoFocus
        />
        <div className="flex justify-end gap-2">
          <button className="px-4 py-2 border rounded" onClick={onClose} disabled={submitting}>İptal</button>
          <button
            className="px-4 py-2 bg-primary-600 text-white rounded disabled:opacity-50"
            onClick={submit}
            disabled={submitting || !canonicalPlate.trim()}>
            {submitting ? 'Kaydediliyor…' : 'Kaydet'}
          </button>
        </div>
      </div>
    </div>
  );
}
