import { useTranslation } from 'react-i18next';
import { LayoutGrid, Rows3 } from 'lucide-react';

export type TruckView = 'list' | 'table';

interface Props {
  value: TruckView;
  onChange: (v: TruckView) => void;
}

/** Segmented control: Liste (card grid) ↔ Tablo (dense table). Toggle only
 *  switches presentation — underlying data is identical. */
export default function ViewToggle({ value, onChange }: Props) {
  const { t } = useTranslation();
  const base =
    'inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-colors';
  const active = 'bg-slate-900 text-white';
  const inactive = 'text-slate-600 hover:bg-slate-100';
  return (
    <div
      role="tablist"
      aria-label={`${t('trucks.view.list')} / ${t('trucks.view.table')}`}
      className="inline-flex items-center gap-1 bg-white rounded-lg border border-slate-200 p-1"
    >
      <button
        type="button"
        role="tab"
        aria-selected={value === 'list'}
        onClick={() => onChange('list')}
        className={`${base} ${value === 'list' ? active : inactive}`}
      >
        <LayoutGrid className="w-4 h-4" />
        {t('trucks.view.list')}
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={value === 'table'}
        onClick={() => onChange('table')}
        className={`${base} ${value === 'table' ? active : inactive}`}
      >
        <Rows3 className="w-4 h-4" />
        {t('trucks.view.table')}
      </button>
    </div>
  );
}
