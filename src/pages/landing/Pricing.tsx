import { useEffect, useState } from 'react';
import { useTranslation, Trans } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { publicApi } from '../../services/publicApi';
import type { FoundingStatus } from '../../types/founding';

const Pricing = () => {
  const { t } = useTranslation();
  const { register } = useAuth();
  const navigate = useNavigate();
  const [founding, setFounding] = useState<FoundingStatus | null>(null);

  useEffect(() => {
    void publicApi.foundingStatus().then(setFounding);
  }, []);

  const goContact = () => navigate('/iletisim'); // adjust if route differs

  const remaining = founding?.remaining ?? 7; // fallback so badge isn't blank during fetch
  const isFull = remaining === 0;

  return (
    <section id="pricing" className="py-20 md:py-28 bg-white border-t border-slate-100">
      <div className="max-w-4xl mx-auto px-4 md:px-6">
        <div className="text-center mb-10">
          <p className="font-serif italic text-sm text-primary-700 mb-3">{t('landing.pricing.eyebrow')}</p>
          <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight mb-3">
            {t('landing.pricing.title')}
          </h2>
          <p className="text-slate-600 max-w-xl mx-auto">
            <Trans i18nKey="landing.pricing.subtitle" components={{ strong: <strong className="text-slate-900" /> }} />
          </p>
        </div>

        <div className="max-w-2xl mx-auto mb-10 px-5 py-3 rounded-xl bg-confirm-500/10 border border-confirm-500/20 text-center">
          <span className="inline-flex items-center gap-2 text-sm font-semibold text-confirm-700">
            <span className="w-1.5 h-1.5 rounded-full bg-confirm-500" aria-hidden="true" />
            {t('landing.pricing.betaBanner')}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-stretch">
          {/* Free */}
          <div className="bg-warm rounded-2xl border border-slate-200 p-7 flex flex-col">
            <div className="mb-5">
              <h3 className="text-xl font-extrabold text-slate-900 mb-1">{t('landing.pricing.free.title')}</h3>
              <p className="text-sm text-slate-600">{t('landing.pricing.free.subtitle')}</p>
            </div>
            <div className="mb-6">
              <span className="text-4xl font-extrabold text-slate-900">{t('landing.pricing.free.price')}</span>
              <span className="text-slate-500 text-sm ml-1">{t('landing.pricing.free.period')}</span>
            </div>
            <ul className="space-y-2.5 mb-7 text-sm text-slate-700 flex-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <li key={n} className="flex items-start gap-2">
                  <span className="text-confirm-600 mt-0.5">✓</span>
                  {t(`landing.pricing.free.feature${n}`)}
                </li>
              ))}
            </ul>
            <button
              type="button"
              onClick={() => register()}
              className="w-full text-center px-5 py-3 bg-white border-2 border-slate-300 hover:border-slate-400 text-slate-900 rounded-xl font-bold text-sm transition-colors"
            >
              {t('landing.pricing.free.cta')}
            </button>
          </div>

          {/* Pro */}
          <div className="relative bg-gradient-to-br from-primary-700 to-primary-800 text-white rounded-2xl p-7 flex flex-col shadow-cardHover">
            <div className="absolute -top-3 right-5">
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-accent-500 text-white text-[11px] font-extrabold uppercase tracking-wider rounded-full shadow-card">
                {isFull
                  ? t('landing.pricing.pro.foundingBadge_full')
                  : t('landing.pricing.pro.foundingBadge_remaining', { count: remaining })}
              </span>
            </div>

            <div className="mb-5">
              <h3 className="text-xl font-extrabold mb-1">{t('landing.pricing.pro.title')}</h3>
              <p className="text-sm text-primary-100">{t('landing.pricing.pro.subtitle')}</p>
            </div>
            <div className="mb-2">
              {!isFull && (
                <>
                  <span className="text-base text-primary-200 line-through font-mono">{t('landing.pricing.pro.standardPrice')}</span>
                  <span className="text-4xl font-extrabold font-mono ml-2">{t('landing.pricing.pro.foundingPrice')}</span>
                </>
              )}
              {isFull && <span className="text-4xl font-extrabold font-mono">{t('landing.pricing.pro.standardPrice')}</span>}
              <span className="text-primary-100 text-sm ml-1">{t('landing.pricing.pro.period')}</span>
            </div>
            {!isFull && <p className="text-xs text-primary-100 mb-6">{t('landing.pricing.pro.foundingNote')}</p>}
            {isFull && <p className="text-xs text-primary-100 mb-6">&nbsp;</p>}

            <ul className="space-y-2.5 mb-7 text-sm flex-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <li key={n} className="flex items-start gap-2">
                  <span className="text-confirm-500 mt-0.5">✓</span>
                  {t(`landing.pricing.pro.feature${n}`)}
                </li>
              ))}
            </ul>

            <button
              type="button"
              onClick={() => register()}
              className="w-full text-center px-5 py-3 bg-white text-primary-800 hover:bg-warm rounded-xl font-bold text-sm transition-colors"
            >
              {t('landing.pricing.pro.cta')}
            </button>
          </div>
        </div>

        <div className="text-center mt-8">
          <p className="text-sm text-slate-600">
            <Trans
              i18nKey="landing.pricing.enterpriseLink"
              components={{
                a: (
                  <a
                    onClick={goContact}
                    className="font-semibold text-primary-700 hover:text-primary-800 underline underline-offset-2 cursor-pointer"
                  />
                ),
              }}
            />
          </p>
        </div>
      </div>
    </section>
  );
};

export default Pricing;
