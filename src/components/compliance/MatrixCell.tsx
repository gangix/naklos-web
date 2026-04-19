import { Check, AlertCircle, AlertTriangle, Info, Minus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { CellStatus } from '../../utils/docCellStatus';
import { CELL_STYLE } from '../../utils/docCellStatus';

interface Props {
  status: CellStatus;
  /** Days until expiry. null when status is MISSING. */
  days: number | null;
  onClick?: () => void;
  /** Name of the document for the aria-label (e.g. "Zorunlu Sigorta"). */
  docLabel: string;
  /** Name of the entity for the aria-label (e.g. "34 ABC 123"). */
  entityLabel: string;
}

function iconFor(status: CellStatus) {
  const cls = 'w-3.5 h-3.5 flex-shrink-0';
  if (status === 'CRITICAL') return <AlertCircle className={cls} />;
  if (status === 'WARNING') return <AlertTriangle className={cls} />;
  if (status === 'INFO') return <Info className={cls} />;
  if (status === 'VALID') return <Check className={cls} />;
  return <Minus className={cls} />;
}

/** One cell of the compliance matrix. Tinted by status, carries the status
 *  glyph so the matrix stays readable for color-blind users, and is clickable
 *  — the click routes back to the entity's Belgeler tab where the actual
 *  update happens. */
export default function MatrixCell({ status, days, onClick, docLabel, entityLabel }: Props) {
  const { t } = useTranslation();
  const style = CELL_STYLE[status];

  const bodyText = (() => {
    if (status === 'MISSING') return t('compliance.cell.missing');
    if (days === null) return '';
    if (days < 0) return t('compliance.cell.expired');
    return t('compliance.cell.daysLeft', { count: days });
  })();

  const aria = `${entityLabel} · ${docLabel} · ${
    status === 'MISSING' ? t('compliance.cell.missing')
    : status === 'VALID'  ? t('compliance.cell.valid')
    : status === 'CRITICAL' ? t('compliance.cell.critical')
    : status === 'WARNING'  ? t('compliance.cell.warning')
    : t('compliance.cell.info')
  }`;

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={aria}
      className={`w-full h-full min-h-[44px] px-2.5 py-1.5 ${style.bg} ${style.text}
        flex items-center justify-center gap-1.5 text-[11px] font-semibold
        tabular-nums rounded-md transition-all hover:ring-2 hover:ring-offset-1
        hover:ring-slate-300 focus:outline-none focus-visible:ring-2
        focus-visible:ring-primary-500 cursor-pointer`}
    >
      {iconFor(status)}
      <span className="truncate">{bodyText}</span>
    </button>
  );
}