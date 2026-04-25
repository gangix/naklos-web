import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

const Comparison = () => {
  const { t } = useTranslation();

  const headerCell = 'text-center py-3.5 px-4 text-xs font-semibold text-slate-600';
  const headerCellNaklos = 'text-center py-3.5 px-4 text-xs font-extrabold text-primary-700 bg-primary-50/50 border-x border-primary-100';
  const rowLabel = 'py-3 px-4 text-slate-700 font-medium';
  const cellMono = 'text-center py-3 px-4 text-slate-700 font-mono';
  const cellNaklos = 'text-center py-3 px-4 bg-primary-50/50 border-x border-primary-100';

  const rows: Array<{
    labelKey: string;
    excel: string;
    naklos: ReactNode;
    fleetio: { value: string; tone?: 'positive' | 'negative' | 'neutral' };
    arvento: { value: string; tone?: 'positive' | 'negative' | 'neutral' };
  }> = [
    {
      labelKey: 'landing.comparison.rows.monthly',
      excel: '₺0',
      naklos: (
        <>
          <span className="font-extrabold text-primary-700 text-base font-mono">₺790</span>
          <span className="block text-[10px] text-slate-500 mt-0.5">{t('landing.comparison.values.naklosFoundingPrice')}</span>
        </>
      ),
      fleetio: { value: '~₺1.700' },
      arvento: { value: '~₺3.910' },
    },
    {
      labelKey: 'landing.comparison.rows.hardware',
      excel: t('landing.comparison.values.yok'),
      naklos: <span className="font-semibold text-confirm-700">{t('landing.comparison.values.yok')}</span>,
      fleetio: { value: t('landing.comparison.values.yok'), tone: 'positive' },
      arvento: { value: t('landing.comparison.values.needed'), tone: 'negative' },
    },
    {
      labelKey: 'landing.comparison.rows.commitment',
      excel: '—',
      naklos: <span className="font-semibold text-confirm-700">{t('landing.comparison.values.yok')}</span>,
      fleetio: { value: t('landing.comparison.values.monthly'), tone: 'positive' },
      arvento: { value: t('landing.comparison.values.longTerm'), tone: 'negative' },
    },
    {
      labelKey: 'landing.comparison.rows.kvkk',
      excel: '—',
      naklos: <span className="text-confirm-600">✓</span>,
      fleetio: { value: '✗', tone: 'negative' },
      arvento: { value: '✓', tone: 'positive' },
    },
    {
      labelKey: 'landing.comparison.rows.docs',
      excel: t('landing.comparison.values.manuel'),
      naklos: <span className="text-confirm-600">✓</span>,
      fleetio: { value: '✗', tone: 'negative' },
      arvento: { value: '✓', tone: 'positive' },
    },
    {
      labelKey: 'landing.comparison.rows.anomaly',
      excel: t('landing.comparison.values.yok'),
      naklos: (
        <>
          <span className="text-confirm-600">✓</span>
          <span className="text-[10px] text-slate-500 ml-1">{t('landing.comparison.values.anomalyRulesNote')}</span>
        </>
      ),
      fleetio: { value: t('landing.comparison.values.kismen'), tone: 'neutral' },
      arvento: { value: t('landing.comparison.values.kismen'), tone: 'neutral' },
    },
    {
      labelKey: 'landing.comparison.rows.cancel',
      excel: '—',
      naklos: <span className="font-semibold text-confirm-700">{t('landing.comparison.values.always')}</span>,
      fleetio: { value: t('landing.comparison.values.always'), tone: 'positive' },
      arvento: { value: t('landing.comparison.values.duringContract'), tone: 'negative' },
    },
  ];

  const toneClass = (tone?: 'positive' | 'negative' | 'neutral') => {
    if (tone === 'positive') return 'text-confirm-700 font-semibold';
    if (tone === 'negative') return 'text-urgent-700 font-semibold';
    if (tone === 'neutral') return 'text-attention-700 font-semibold';
    return 'text-slate-700';
  };

  return (
    <section id="compare" className="py-20 md:py-24">
      <div className="max-w-5xl mx-auto px-4 md:px-6">
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
                <th className={headerCell}>Fleetio</th>
                <th className={headerCell}>Arvento</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((row) => (
                <tr key={row.labelKey}>
                  <td className={rowLabel}>{t(row.labelKey)}</td>
                  <td className={cellMono}>{row.excel}</td>
                  <td className={cellNaklos}>{row.naklos}</td>
                  <td className={`text-center py-3 px-4 ${toneClass(row.fleetio.tone)}`}>{row.fleetio.value}</td>
                  <td className={`text-center py-3 px-4 ${toneClass(row.arvento.tone)}`}>{row.arvento.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="text-center text-xs text-slate-500 mt-4">
          {t('landing.comparison.footnote')}
        </p>
      </div>
    </section>
  );
};

export default Comparison;
