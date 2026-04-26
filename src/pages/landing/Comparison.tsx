import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

const Comparison = () => {
  const { t } = useTranslation();

  const headerCell = 'text-center py-3.5 px-4 text-xs font-semibold text-slate-600';
  const headerCellNaklos = 'text-center py-3.5 px-4 text-xs font-extrabold text-primary-700 bg-primary-50/50 border-x border-primary-100';
  const rowLabel = 'py-3 px-4 text-slate-700 font-medium';
  const cellExcel = 'text-center py-3 px-4 text-slate-600';
  const cellNaklos = 'text-center py-3 px-4 bg-primary-50/50 border-x border-primary-100';

  const rows: Array<{ labelKey: string; excel: ReactNode; naklos: ReactNode }> = [
    {
      labelKey: 'landing.comparison.rows.monthly',
      excel: <span className="font-mono">₺0</span>,
      naklos: (
        <>
          <span className="font-extrabold text-primary-700 text-base font-mono">₺790</span>
          <span className="block text-[10px] text-slate-500 mt-0.5">{t('landing.comparison.values.naklosFoundingPrice')}</span>
        </>
      ),
    },
    {
      labelKey: 'landing.comparison.rows.docs',
      excel: <span className="text-slate-500">{t('landing.comparison.values.manuel')}</span>,
      naklos: <span className="font-semibold text-confirm-700">{t('landing.comparison.values.autoAlert')}</span>,
    },
    {
      labelKey: 'landing.comparison.rows.anomaly',
      excel: <span className="text-slate-500">{t('landing.comparison.values.yok')}</span>,
      naklos: (
        <span className="font-semibold text-confirm-700">
          {t('landing.comparison.values.rules', { count: 12 })}
        </span>
      ),
    },
    {
      labelKey: 'landing.comparison.rows.maintenance',
      excel: <span className="text-slate-500">{t('landing.comparison.values.manuel')}</span>,
      naklos: <span className="font-semibold text-confirm-700">{t('landing.comparison.values.auto')}</span>,
    },
    {
      labelKey: 'landing.comparison.rows.driverApp',
      excel: <span className="text-slate-500">{t('landing.comparison.values.yok')}</span>,
      naklos: <span className="font-semibold text-confirm-700">✓</span>,
    },
  ];

  return (
    <section id="compare" className="py-20 md:py-24">
      <div className="max-w-3xl mx-auto px-4 md:px-6">
        <div className="text-center mb-10">
          <p className="font-serif italic text-sm text-primary-700 mb-3">{t('landing.comparison.eyebrow')}</p>
          <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
            {t('landing.comparison.title')}
          </h2>
          <p className="text-slate-600 mt-3 max-w-xl mx-auto">{t('landing.comparison.subtitle')}</p>
        </div>

        <div className="bg-white rounded-2xl shadow-card border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left py-3.5 px-4 text-[11px] font-semibold uppercase tracking-wider text-slate-500" />
                <th className={headerCell}>Excel</th>
                <th className={headerCellNaklos}>naklos Pro</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((row) => (
                <tr key={row.labelKey}>
                  <td className={rowLabel}>{t(row.labelKey)}</td>
                  <td className={cellExcel}>{row.excel}</td>
                  <td className={cellNaklos}>{row.naklos}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
};

export default Comparison;
