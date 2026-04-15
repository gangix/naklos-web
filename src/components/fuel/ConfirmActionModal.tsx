import { useEffect, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

interface Props {
  /** Shown in the extrabold header. */
  title: string;
  /** One-sentence lead under the title. May contain formatted children. */
  description: ReactNode;
  /** Optional bullet list of consequences — "bunu yaparsanız ne olur". */
  bullets?: ReactNode[];
  /** Label on the confirmation button. Defaults to "Onayla". */
  confirmLabel?: string;
  /** Label on the cancel button. Defaults to "İptal". */
  cancelLabel?: string;
  /** Tone of the confirm button. `neutral` = primary blue. `danger` = red. */
  tone?: 'neutral' | 'danger';
  /** Async confirm handler. Modal auto-closes on resolve; toasts/errors are
   *  the caller's responsibility. */
  onConfirm: () => Promise<void>;
  /** Close handler for cancel / backdrop / Escape. */
  onClose: () => void;
}

/** Shared confirm dialog for destructive-ish review actions. Same visual
 *  language as AliasModal so the fuel review surface feels consistent. */
export default function ConfirmActionModal({
  title,
  description,
  bullets,
  confirmLabel,
  cancelLabel,
  tone = 'neutral',
  onConfirm,
  onClose,
}: Props) {
  const { t } = useTranslation();
  const resolvedConfirmLabel = confirmLabel ?? t('fuelReview.common.confirm');
  const resolvedCancelLabel = cancelLabel ?? t('fuelReview.common.cancel');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !submitting) onClose();
    };
    window.addEventListener('keydown', onEsc);
    return () => window.removeEventListener('keydown', onEsc);
  }, [onClose, submitting]);

  const confirmClass =
    tone === 'danger'
      ? 'px-4 py-2 text-sm font-semibold rounded-lg bg-red-600 text-white hover:bg-red-700 hover:shadow-lg hover:shadow-red-500/20 transition-all disabled:opacity-50 disabled:pointer-events-none'
      : 'px-4 py-2 text-sm font-semibold rounded-lg bg-primary-600 text-white hover:bg-primary-700 hover:shadow-lg hover:shadow-primary-500/20 transition-all disabled:opacity-50 disabled:pointer-events-none';

  const submit = async () => {
    try {
      setSubmitting(true);
      await onConfirm();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={(e) => { if (e.target === e.currentTarget && !submitting) onClose(); }}>
      <div className="bg-white rounded-xl shadow-xl border border-gray-200 p-6 w-full max-w-md">
        <h2 className="text-xl font-extrabold text-gray-900 tracking-tight mb-1">{title}</h2>
        <div className="text-sm text-gray-600 mb-4">{description}</div>
        {bullets && bullets.length > 0 && (
          <ul className="space-y-1.5 text-xs text-gray-600 bg-gray-50 border border-gray-200 rounded-lg p-3 mb-5">
            {bullets.map((b, i) => (
              <li key={i} className="flex gap-2">
                <span className="text-gray-400">•</span>
                <span>{b}</span>
              </li>
            ))}
          </ul>
        )}
        <div className="flex justify-end gap-2">
          <button
            className="px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-colors"
            onClick={onClose}
            disabled={submitting}>
            {resolvedCancelLabel}
          </button>
          <button className={confirmClass} onClick={submit} disabled={submitting}>
            {submitting ? t('fuelReview.common.processing') : resolvedConfirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
