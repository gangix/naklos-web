import { ArrowRight, Users } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function SocialProof() {
  const { t } = useTranslation();

  const scrollToContact = () => {
    document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="relative max-w-5xl mx-auto px-4 py-16 md:py-20">
      <div className="bg-white rounded-2xl border border-slate-200 p-8 md:p-12 relative overflow-hidden">
        <span className="absolute top-0 left-0 bottom-0 w-0.5 bg-confirm-500" aria-hidden="true" />
        <div className="flex items-start gap-6">
          <div className="hidden md:flex w-14 h-14 rounded-xl bg-warm-50 text-confirm-600 items-center justify-center flex-shrink-0 border border-slate-100">
            <Users className="w-6 h-6" aria-hidden="true" />
          </div>
          <div className="flex-1">
            <div className="font-serif italic text-sm text-primary-700 mb-2">
              {t('landing.socialProof.eyebrow')}
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight mb-3 leading-tight">
              {t('landing.socialProof.title')}
            </h2>
            <p className="text-slate-600 text-base leading-relaxed mb-6 max-w-2xl">
              {t('landing.socialProof.body')}
            </p>
            <button
              onClick={scrollToContact}
              className="group inline-flex items-center gap-2 px-5 py-3 bg-slate-900 text-white rounded-xl font-semibold hover:bg-slate-800 transition-colors text-sm"
            >
              {t('landing.socialProof.cta')}
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
