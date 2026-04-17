import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { DismissalReason } from '../../types/fuelAnomaly';

export interface DismissalSubmitPayload {
  reason: DismissalReason;
  note: string | null;
}

interface Props {
  onSubmit: (payload: DismissalSubmitPayload) => void | Promise<void>;
  onCancel: () => void;
  submitting?: boolean;
  /** When true, "Başka bir sebep" free-text input is not auto-focused on
   *  selection (used in bulk-dismiss modal where the sheet mounts inside
   *  a larger dialog). */
  noOtherAutoFocus?: boolean;
}

const REASONS: DismissalReason[] = [
  'FALSE_POSITIVE',
  'DATA_ENTRY_ERROR',
  'EXPLAINED_BY_DRIVER',
  'OTHER',
];

/** 4-radio dismissal reason sheet. "Başka bir sebep" reveals an inline
 *  free-text input (carried into the note field as a prefix).
 *  Renders inline — never wraps itself in a modal shell. */
export default function DismissalReasonSheet({
  onSubmit,
  onCancel,
  submitting = false,
  noOtherAutoFocus = false,
}: Props) {
  const { t } = useTranslation();
  const [reason, setReason] = useState<DismissalReason>('FALSE_POSITIVE');
  const [otherText, setOtherText] = useState('');
  const [note, setNote] = useState('');

  // When reason changes away from OTHER, clear the inline text so we don't
  // carry stale content into the note.
  useEffect(() => {
    if (reason !== 'OTHER') setOtherText('');
  }, [reason]);

  const canSubmit =
    !submitting && (reason !== 'OTHER' || otherText.trim().length > 0);

  function handleSubmit() {
    const trimmedNote = note.trim();
    const trimmedOther = otherText.trim();
    const finalNote =
      reason === 'OTHER'
        ? [trimmedOther, trimmedNote].filter(Boolean).join(' — ')
        : trimmedNote;
    void onSubmit({
      reason,
      note: finalNote.length > 0 ? finalNote : null,
    });
  }

  return (
    <div className="px-6 py-5 border-t border-slate-200 bg-white">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-slate-900">
          {t('fuelAlerts.dismissReason.title')}
        </h3>
        <span className="text-xs text-slate-400">
          {t('fuelAlerts.dismissReason.required')}
        </span>
      </div>

      <div className="space-y-2">
        {REASONS.map((r) => {
          const checked = reason === r;
          return (
            <label
              key={r}
              className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                checked
                  ? 'border-primary-500 bg-primary-50/40'
                  : 'border-slate-200 hover:border-primary-400 hover:bg-primary-50/20'
              }`}
            >
              <input
                type="radio"
                name="dismiss-reason"
                className="mt-0.5 accent-primary-600"
                checked={checked}
                onChange={() => setReason(r)}
              />
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold text-slate-900">
                  {t(`fuelAlerts.dismissReason.${r}.title`)}
                </div>
                {r !== 'OTHER' && (
                  <div className="text-xs text-slate-500 mt-0.5">
                    {t(`fuelAlerts.dismissReason.${r}.desc`)}
                  </div>
                )}
                {r === 'OTHER' && checked && (
                  <input
                    type="text"
                    autoFocus={!noOtherAutoFocus}
                    placeholder={t('fuelAlerts.dismissReason.otherPlaceholder')}
                    value={otherText}
                    onChange={(e) => setOtherText(e.target.value)}
                    className="mt-1.5 w-full text-sm px-3 py-1.5 border border-slate-200 rounded-md bg-slate-50 focus:outline-none focus:border-primary-500 focus:bg-white transition-colors"
                  />
                )}
              </div>
            </label>
          );
        })}
      </div>

      <div className="mt-4">
        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
          {t('fuelAlerts.dismissReason.noteLabel')}
        </label>
        <textarea
          rows={2}
          placeholder={t('fuelAlerts.dismissReason.notePlaceholder')}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="w-full text-sm px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:border-primary-500 focus:bg-white transition-colors resize-none"
        />
      </div>

      <div className="mt-5 flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={submitting}
          className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 disabled:opacity-60 transition-colors"
        >
          {t('fuelAlerts.dismissReason.cancel')}
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="px-4 py-2 text-sm font-bold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-60 disabled:pointer-events-none rounded-lg transition-colors"
        >
          {t('fuelAlerts.dismissReason.submit')}
        </button>
      </div>
    </div>
  );
}
