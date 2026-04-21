import { ArrowRight, Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';

export default function Benefits() {
  const { t } = useTranslation();
  const { register } = useAuth();

  const items = [
    t('landing.benefits.items.b1'),
    t('landing.benefits.items.b2'),
    t('landing.benefits.items.b3'),
    t('landing.benefits.items.b4'),
    t('landing.benefits.items.b5'),
  ];

  return (
    <section className="relative bg-white py-20 md:py-24 border-y border-slate-100">
      <div className="max-w-5xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-5 tracking-tight leading-tight">
              {t('landing.benefits.title')}
            </h2>
            <button
              onClick={register}
              className="group mt-3 px-6 py-3.5 bg-slate-900 text-white rounded-xl font-semibold hover:bg-slate-800 transition-colors flex items-center gap-2"
            >
              {t('landing.benefits.cta')}
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" aria-hidden="true" />
            </button>
          </div>
          <div className="bg-warm-50 rounded-2xl p-8 border border-slate-200">
            <ul className="space-y-4">
              {items.map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-5 h-5 rounded-full bg-confirm-500/15 text-confirm-600 flex items-center justify-center mt-0.5" aria-hidden="true">
                    <Check className="w-3 h-3" strokeWidth={3} />
                  </div>
                  <span className="text-slate-700 text-[15px] leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
