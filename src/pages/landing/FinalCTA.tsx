import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { publicApi } from '../../services/publicApi';
import type { FoundingStatus } from '../../types/founding';

const FinalCTA = () => {
  const { t } = useTranslation();
  const { register } = useAuth();
  const [founding, setFounding] = useState<FoundingStatus | null>(null);

  useEffect(() => {
    void publicApi.foundingStatus().then(setFounding);
  }, []);

  const remaining = founding?.remaining ?? 7;
  const isFull = remaining === 0;

  return (
    <section className="py-20 md:py-24 bg-primary-800 text-white relative overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:48px_48px]" aria-hidden="true" />
      <div className="relative max-w-3xl mx-auto px-4 md:px-6 text-center">
        <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-5 leading-tight">
          {t('landing.finalCta.title1')}<br />
          <span className="font-serif italic font-normal text-primary-200">{t('landing.finalCta.title2')}</span>{' '}
          {t('landing.finalCta.title3')}
        </h2>
        <p className="text-primary-100 text-lg mb-8 max-w-xl mx-auto">{t('landing.finalCta.subtitle')}</p>
        <button
          type="button"
          onClick={() => register()}
          className="inline-flex items-center gap-2 px-8 py-4 bg-white text-primary-800 rounded-xl font-bold text-base hover:bg-warm transition-colors shadow-card"
        >
          {t('landing.finalCta.cta')}
          <span aria-hidden="true">→</span>
        </button>
        <p className="text-primary-200 text-xs mt-5 font-mono">
          {isFull
            ? t('landing.finalCta.foundingFooter_full')
            : t('landing.finalCta.foundingFooter_remaining', { count: remaining })}
        </p>
      </div>
    </section>
  );
};

export default FinalCTA;
