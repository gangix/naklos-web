import { Fuel, AlertTriangle, Truck, Upload } from 'lucide-react';
import { useTranslation } from 'react-i18next';

type Tone = 'urgent' | 'attention' | 'info' | 'confirm';

const toneStripe: Record<Tone, string> = {
  urgent:    'bg-urgent-500',
  attention: 'bg-attention-500',
  info:      'bg-info-500',
  confirm:   'bg-confirm-500',
};

const toneIcon: Record<Tone, string> = {
  urgent:    'text-urgent-600',
  attention: 'text-attention-600',
  info:      'text-info-600',
  confirm:   'text-confirm-600',
};

export default function Features() {
  const { t } = useTranslation();

  const features: Array<{ icon: typeof Fuel; titleKey: string; descKey: string; tone: Tone }> = [
    { icon: Fuel,           titleKey: 'landing.features.fuel.title',     descKey: 'landing.features.fuel.description',     tone: 'urgent' },
    { icon: AlertTriangle,  titleKey: 'landing.features.docs.title',     descKey: 'landing.features.docs.description',     tone: 'attention' },
    { icon: Truck,          titleKey: 'landing.features.vehicles.title', descKey: 'landing.features.vehicles.description', tone: 'info' },
    { icon: Upload,         titleKey: 'landing.features.drivers.title',  descKey: 'landing.features.drivers.description',  tone: 'confirm' },
  ];

  return (
    <section className="relative max-w-6xl mx-auto px-4 py-16 md:py-24">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {features.map((feature) => {
          const Icon = feature.icon;
          return (
            <div
              key={feature.titleKey}
              className="group relative bg-white rounded-2xl p-6 border border-slate-200 overflow-hidden hover:border-slate-300 transition-colors"
            >
              <span className={`absolute top-0 left-0 bottom-0 w-0.5 ${toneStripe[feature.tone]}`} aria-hidden="true" />
              <div className={`w-11 h-11 rounded-xl bg-warm-50 ${toneIcon[feature.tone]} flex items-center justify-center mb-5 border border-slate-100`}>
                <Icon className="w-5 h-5" aria-hidden="true" />
              </div>
              <h3 className="font-bold text-slate-900 mb-2 text-[15px]">{t(feature.titleKey)}</h3>
              <p className="text-sm text-slate-600 leading-relaxed">{t(feature.descKey)}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
