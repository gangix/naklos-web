import { useTranslation } from 'react-i18next';

const QUESTIONS = ['q1', 'q2', 'q3', 'q4', 'q5', 'q6'] as const;

const FAQ = () => {
  const { t } = useTranslation();

  return (
    <section id="faq" className="py-20 md:py-24 bg-warm">
      <div className="max-w-3xl mx-auto px-4 md:px-6">
        <div className="text-center mb-10">
          <p className="font-serif italic text-sm text-primary-700 mb-3">{t('landing.faq.eyebrow')}</p>
          <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
            {t('landing.faq.title')}
          </h2>
        </div>

        <div className="space-y-3">
          {QUESTIONS.map((q) => (
            <details
              key={q}
              className="bg-white rounded-xl border border-slate-200 px-5 py-4 [&[open]>summary>span]:rotate-180 group"
            >
              <summary className="flex items-center justify-between cursor-pointer font-bold text-slate-900 text-base">
                {t(`landing.faq.${q}.q`)}
                <span aria-hidden="true" className="transition-transform">▾</span>
              </summary>
              <p className="text-sm text-slate-600 mt-3 leading-relaxed">{t(`landing.faq.${q}.a`)}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FAQ;
