import { useTranslation } from 'react-i18next';
import { FileText, Fuel, Wrench } from 'lucide-react';

type Pillar = {
  icon: typeof Fuel;
  toneStripe: string;
  toneIconBg: string;
  toneIconText: string;
  titleKey: string;
  descKey: string;
};

const PILLARS: Pillar[] = [
  {
    icon: FileText,
    toneStripe: 'bg-urgent-500',
    toneIconBg: 'bg-urgent-100',
    toneIconText: 'text-urgent-600',
    titleKey: 'landing.features.docs.title',
    descKey: 'landing.features.docs.description',
  },
  {
    icon: Fuel,
    toneStripe: 'bg-attention-500',
    toneIconBg: 'bg-attention-50',
    toneIconText: 'text-attention-600',
    titleKey: 'landing.features.fuel.title',
    descKey: 'landing.features.fuel.description',
  },
  {
    icon: Wrench,
    toneStripe: 'bg-info-500',
    toneIconBg: 'bg-info-50',
    toneIconText: 'text-info-600',
    titleKey: 'landing.features.maintenance.title',
    descKey: 'landing.features.maintenance.description',
  },
];

const Features = () => {
  const { t } = useTranslation();

  return (
    <section id="features" className="py-20 md:py-24 bg-white border-y border-slate-100">
      <div className="max-w-6xl mx-auto px-4 md:px-6">
        <div className="text-center mb-12">
          <p className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-3">{t('landing.features.eyebrow')}</p>
          <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight max-w-2xl mx-auto leading-tight">
            {t('landing.features.title')}
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {PILLARS.map((p) => {
            const Icon = p.icon;
            return (
              <div
                key={p.titleKey}
                className="bg-warm rounded-2xl p-7 border border-slate-200 hover:border-slate-300 transition-colors relative overflow-hidden"
              >
                <span className={`absolute top-0 left-0 bottom-0 w-0.5 ${p.toneStripe}`} aria-hidden="true" />
                <div className={`w-11 h-11 rounded-xl ${p.toneIconBg} ${p.toneIconText} flex items-center justify-center mb-5`}>
                  <Icon className="w-5 h-5" aria-hidden="true" />
                </div>
                <h3 className="font-extrabold text-slate-900 mb-2 text-[17px]">{t(p.titleKey)}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{t(p.descKey)}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Features;
