import { Upload, Sliders, Bell } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function HowItWorks() {
  const { t } = useTranslation();

  const steps = [
    { icon: Upload,   titleKey: 'landing.howItWorks.steps.s1.title', descKey: 'landing.howItWorks.steps.s1.desc' },
    { icon: Sliders,  titleKey: 'landing.howItWorks.steps.s2.title', descKey: 'landing.howItWorks.steps.s2.desc' },
    { icon: Bell,     titleKey: 'landing.howItWorks.steps.s3.title', descKey: 'landing.howItWorks.steps.s3.desc' },
  ];

  return (
    <section className="relative bg-white py-20 md:py-24 border-y border-slate-100">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-12">
          <div className="inline-block font-serif italic text-sm text-primary-700 mb-3">
            {t('landing.howItWorks.eyebrow')}
          </div>
          <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight mb-3">
            {t('landing.howItWorks.title')}
          </h2>
          <p className="text-slate-600 text-base max-w-xl mx-auto">
            {t('landing.howItWorks.subtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {steps.map((step, i) => {
            const Icon = step.icon;
            return (
              <div
                key={step.titleKey}
                className="relative bg-warm-50 rounded-2xl p-6 border border-slate-100"
              >
                <div className="absolute -top-3 -left-3 w-9 h-9 rounded-xl bg-primary-700 text-white flex items-center justify-center font-extrabold text-sm">
                  {i + 1}
                </div>
                <div className="w-11 h-11 rounded-xl bg-white text-primary-700 flex items-center justify-center mb-4 border border-slate-100">
                  <Icon className="w-5 h-5" aria-hidden="true" />
                </div>
                <h3 className="font-bold text-slate-900 mb-2 text-base">{t(step.titleKey)}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{t(step.descKey)}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
