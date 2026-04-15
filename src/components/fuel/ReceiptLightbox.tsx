import { useEffect, useRef, useState } from 'react';
import { Download, X } from 'lucide-react';
import keycloak from '../../auth/keycloak';
import { fuelEntryApi } from '../../services/fuelEntryApi';

interface Props {
  fleetId: string;
  entryId: string;
  fileName?: string | null;
  onClose: () => void;
}

export default function ReceiptLightbox({ fleetId, entryId, fileName, onClose }: Props) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const blobUrlRef = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const headers: Record<string, string> = {};
        if (keycloak.token) headers['Authorization'] = `Bearer ${keycloak.token}`;
        const res = await fetch(fuelEntryApi.receiptUrl(fleetId, entryId), { headers });
        if (!res.ok) throw new Error('fetch failed');
        const blob = await res.blob();
        if (cancelled) return;
        const url = URL.createObjectURL(blob);
        blobUrlRef.current = url;
        setBlobUrl(url);
      } catch {
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();

    return () => {
      cancelled = true;
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
        blobUrlRef.current = null;
      }
    };
  }, [fleetId, entryId]);

  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onEsc);
    return () => window.removeEventListener('keydown', onEsc);
  }, [onClose]);

  const handleDownload = () => {
    if (!blobUrl) return;
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = fileName ?? 'receipt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={fileName ?? 'Receipt'}
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>

      {/* Controls */}
      <div className="absolute top-4 right-4 flex items-center gap-2">
        {blobUrl && (
          <button
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            onClick={handleDownload}
            title="İndir">
            <Download size={20} />
          </button>
        )}
        <button
          className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          onClick={onClose}
          title="Kapat">
          <X size={20} />
        </button>
      </div>

      {/* Content */}
      {loading && (
        <div className="flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        </div>
      )}

      {error && !loading && (
        <div className="text-white/70 text-sm">Fiş yüklenemedi.</div>
      )}

      {blobUrl && !loading && (
        <img
          src={blobUrl}
          alt={fileName ?? 'receipt'}
          className="max-w-[90vw] max-h-[90vh] object-contain rounded"
        />
      )}
    </div>
  );
}
