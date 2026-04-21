import { ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import HeroMockup from './HeroMockup';

export default function Hero() {
  const { t } = useTranslation();
  const { login, loginWith, register } = useAuth();

  return (
    <section className="relative max-w-6xl mx-auto px-4 pt-16 pb-16 md:pt-24 md:pb-24">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-10 items-center">
        <div className="text-center lg:text-left">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary-50 text-primary-700 rounded-full text-xs font-semibold mb-8 border border-primary-100">
            <span className="w-1.5 h-1.5 bg-primary-600 rounded-full" />
            {t('landing.hero.badge')}
          </div>

          <h1 className="text-5xl md:text-6xl lg:text-[64px] font-extrabold text-slate-900 mb-6 leading-[1.05] tracking-tight">
            {t('landing.hero.title1')}
            <br />
            <span className="text-primary-700">{t('landing.hero.title2')}</span>
          </h1>

          <p className="text-lg text-slate-600 max-w-lg mx-auto lg:mx-0 mb-10 leading-relaxed">
            {t('landing.hero.tagline')}
          </p>

          <div className="flex flex-col sm:flex-row items-center lg:items-start justify-center lg:justify-start gap-3 mb-3">
            <button
              onClick={register}
              className="group w-full sm:w-auto px-8 py-4 bg-primary-700 text-white rounded-xl font-bold text-base hover:bg-primary-800 transition-colors flex items-center justify-center gap-2"
            >
              {t('landing.hero.ctaPrimary')}
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </button>
            <button
              onClick={login}
              className="w-full sm:w-auto px-8 py-4 bg-white text-slate-700 rounded-xl font-semibold border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-colors text-base"
            >
              {t('landing.hero.ctaSecondary')}
            </button>
          </div>

          <p className="text-sm text-slate-600 mb-8 text-center lg:text-left">
            {t('landing.hero.ctaPrimarySub')}
          </p>

          <div className="max-w-sm mx-auto lg:mx-0">
            <button
              onClick={() => loginWith('google')}
              className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl font-medium text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-colors flex items-center justify-center gap-3 text-sm"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden="true">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              {t('landing.hero.ctaGoogle')}
            </button>
          </div>
        </div>

        <div className="relative mt-4 lg:mt-0">
          <HeroMockup />
        </div>
      </div>
    </section>
  );
}
