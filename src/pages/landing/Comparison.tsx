import { useTranslation } from 'react-i18next';

const Comparison = () => {
  const { t } = useTranslation();

  const bullets = [
    t('landing.comparison.bullets.b1'),
    t('landing.comparison.bullets.b2'),
    t('landing.comparison.bullets.b3'),
  ];

  return (
    <section id="compare" className="py-16 md:py-20">
      <div className="max-w-3xl mx-auto px-4 md:px-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 md:p-10 shadow-card">
          <h2 className="text-xl md:text-2xl font-extrabold text-slate-900 tracking-tight mb-3">
            {t('landing.comparison.eyebrow')}
          </h2>
          <p className="text-slate-600 mb-5">{t('landing.comparison.lead')}</p>

          <ul className="space-y-2.5 mb-6">
            {bullets.map((b) => (
              <li key={b} className="flex items-start gap-3 text-slate-700">
                <span aria-hidden="true" className="mt-1.5 inline-block w-1.5 h-1.5 rounded-full bg-urgent-500 flex-shrink-0" />
                <span className="text-sm md:text-base">{b}</span>
              </li>
            ))}
          </ul>

          <p className="text-sm md:text-base font-semibold text-slate-900">
            {t('landing.comparison.closing')}
          </p>
        </div>
      </div>
    </section>
  );
};

export default Comparison;
