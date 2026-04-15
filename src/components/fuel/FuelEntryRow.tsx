import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Paperclip, Pencil, Trash2 } from 'lucide-react';
import keycloak from '../../auth/keycloak';
import { fuelEntryApi } from '../../services/fuelEntryApi';
import { formatDateTime } from '../../utils/format';
import type { TruckFuelEntryDto } from '../../types/fuel';

interface Props {
  fleetId: string;
  entry: TruckFuelEntryDto;
  onEdit?: (entry: TruckFuelEntryDto) => void;
  onDelete?: (entry: TruckFuelEntryDto) => void;
  onReceiptClick?: (entry: TruckFuelEntryDto) => void;
}

export default function FuelEntryRow({ fleetId, entry, onEdit, onDelete, onReceiptClick }: Props) {
  const { t } = useTranslation();
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [imgError, setImgError] = useState(false);
  const blobUrlRef = useRef<string | null>(null);

  useEffect(() => {
    if (!entry.receiptDocumentId) return;

    let cancelled = false;

    const load = async () => {
      try {
        const headers: Record<string, string> = {};
        if (keycloak.token) headers['Authorization'] = `Bearer ${keycloak.token}`;
        const res = await fetch(fuelEntryApi.receiptUrl(fleetId, entry.id), { headers });
        if (!res.ok) throw new Error('fetch failed');
        const blob = await res.blob();
        if (cancelled) return;
        const url = URL.createObjectURL(blob);
        blobUrlRef.current = url;
        setBlobUrl(url);
      } catch {
        if (!cancelled) setImgError(true);
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
  }, [fleetId, entry.id, entry.receiptDocumentId]);

  const liters = parseFloat(entry.liters);
  const totalPrice = parseFloat(entry.totalPrice);

  const sourceBadgeClass =
    entry.source === 'MANUAL'
      ? 'bg-primary-50 text-primary-700 text-xs px-2 py-0.5 rounded border border-primary-200'
      : 'bg-gray-100 text-gray-700 text-xs px-2 py-0.5 rounded border border-gray-200';

  return (
    <div className="flex items-center gap-4 px-4 py-3 hover:bg-gray-50 border-b border-gray-100">
      {/* Date */}
      <div className="w-32 flex-shrink-0">
        <div className="text-sm text-gray-700">{formatDateTime(entry.occurredAt)}</div>
      </div>

      {/* Station */}
      <div className="flex-1 min-w-0">
        <span className="text-sm text-gray-600 truncate block">
          {entry.stationName ?? <span className="text-gray-400">—</span>}
        </span>
      </div>

      {/* Liters */}
      <div className="w-24 text-right tabular-nums font-medium text-sm text-gray-700">
        {isNaN(liters) ? '—' : `${liters.toFixed(2)} L`}
      </div>

      {/* Total price */}
      <div className="w-24 text-right tabular-nums font-medium text-sm text-gray-700">
        {isNaN(totalPrice) ? '—' : `₺${totalPrice.toFixed(2)}`}
      </div>

      {/* Receipt thumbnail */}
      <div className="w-10 flex-shrink-0 flex items-center justify-center">
        {entry.receiptDocumentId && (
          imgError || !blobUrl ? (
            <Paperclip className="w-4 h-4 text-gray-400" />
          ) : (
            <img
              src={blobUrl}
              alt="receipt"
              className="w-10 h-10 rounded object-cover cursor-pointer"
              onClick={() => onReceiptClick?.(entry)}
            />
          )
        )}
      </div>

      {/* Source badge */}
      <div className="flex-shrink-0">
        <span className={sourceBadgeClass}>
          {t(`fuelEntry.source.${entry.source}`)}
        </span>
      </div>

      {/* Edit / Delete — only for MANUAL entries */}
      {entry.source === 'MANUAL' && (
        <div className="flex items-center gap-1 flex-shrink-0">
          {onEdit && (
            <button
              className="p-1.5 rounded hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
              onClick={() => onEdit(entry)}
              title={t('fuelEntry.edit.title')}>
              <Pencil size={16} />
            </button>
          )}
          {onDelete && (
            <button
              className="p-1.5 rounded hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
              onClick={() => onDelete(entry)}
              title={t('fuelEntry.delete.title')}>
              <Trash2 size={16} />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
