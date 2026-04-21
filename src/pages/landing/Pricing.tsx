import { Check } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { setLeadSource } from './leadSource';

export default function Pricing() {
  const { t } = useTranslation();
  const { register } = useAuth();

  const handleEnterpriseClick = () => {
    setLeadSource('enterprise-pricing');
    document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section id="pricing" className="relative py-20 md:py-28 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-block font-serif italic text-sm text-primary-700 mb-3">
            {t('landing.pricing.eyebrow')}
          </div>
          <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight mb-3">
            {t('landing.pricing.title')}
          </h2>
          <p className="text-slate-600 text-base max-w-xl mx-auto">
            {t('landing.pricing.subtitle')}
          </p>
        </div>

        {/* Founding banner */}
        <div className="max-w-3xl mx-auto mb-12 px-5 py-3 rounded-xl bg-primary-50 border border-primary-100 text-center">
          <span className="text-sm font-semibold text-primary-800">
            {t('landing.pricing.foundingBanner')}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 items-start">
          {/* Starter */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 transition-colors hover:border-slate-300">
            <h3 className="text-sm font-bold text-slate-900 mb-1">{t('landing.pricing.tiers.free')}</h3>
            <div className="mb-1">
              <span className="text-2xl font-extrabold text-slate-900 tracking-tight">{t('landing.pricing.free')}</span>
            </div>
            <p className="text-xs text-slate-500 mb-5">{t('landing.pricing.freeSub')}</p>
            <div className="text-[11px] text-slate-400 mb-5 -mt-3">
              <span className="line-through">{t('landing.pricing.proPrice')}</span>
              <span className="ml-1">· {t('landing.pricing.futureLabel')}</span>
            </div>
            <ul className="space-y-3 mb-8 text-sm text-slate-700">
              <li className="flex items-center gap-2.5"><Check className="w-4 h-4 text-confirm-600 flex-shrink-0" aria-hidden="true" /> {t('landing.pricing.features.trucks5')}</li>
              <li className="flex items-center gap-2.5"><Check className="w-4 h-4 text-confirm-600 flex-shrink-0" aria-hidden="true" /> {t('landing.pricing.features.fuelPerformance')}</li>
              <li className="flex items-center gap-2.5"><Check className="w-4 h-4 text-confirm-600 flex-shrink-0" aria-hidden="true" /> {t('landing.pricing.features.docsAndEmails')}</li>
              <li className="flex items-center gap-2.5"><Check className="w-4 h-4 text-confirm-600 flex-shrink-0" aria-hidden="true" /> {t('landing.pricing.features.bulkImport')}</li>
              <li className="flex items-center gap-2.5"><Check className="w-4 h-4 text-confirm-600 flex-shrink-0" aria-hidden="true" /> {t('landing.pricing.features.drivers5')}</li>
            </ul>
            <button
              onClick={register}
              className="w-full py-3 bg-slate-100 text-slate-800 rounded-xl font-semibold hover:bg-slate-200 transition-colors text-sm"
            >
              {t('landing.pricing.foundingCta')}
            </button>
          </div>

          {/* Owner — highlighted */}
          <div className="bg-white rounded-2xl border-2 border-primary-600 p-6 transition-colors relative lg:scale-[1.03]">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <span className="bg-primary-700 text-white text-[11px] font-bold px-3 py-1 rounded-full tracking-wide">
                {t('landing.pricing.popular')}
              </span>
            </div>
            <h3 className="text-sm font-bold text-primary-800 mb-1">{t('landing.pricing.tiers.pro')}</h3>
            <div className="mb-5">
              <span className="text-3xl font-extrabold text-slate-900 tracking-tight">{t('landing.pricing.free')}</span>
              <div className="text-[11px] text-slate-500 mt-1">
                <span className="line-through">{t('landing.pricing.proPrice')}</span>
                <span className="ml-1">→ <span className="font-semibold text-primary-800">{t('landing.pricing.ownerLockInPrice')}</span>{t('landing.pricing.perMonth')}</span>
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">{t('landing.pricing.lockInLabel')}</div>
            </div>
            <ul className="space-y-3 mb-8 text-sm text-slate-700">
              <li className="flex items-center gap-2.5"><Check className="w-4 h-4 text-confirm-600 flex-shrink-0" aria-hidden="true" /> {t('landing.pricing.features.fuelPerformance')}</li>
              <li className="flex items-center gap-2.5"><Check className="w-4 h-4 text-confirm-600 flex-shrink-0" aria-hidden="true" /> {t('landing.pricing.features.docsAndEmails')}</li>
              <li className="flex items-center gap-2.5"><Check className="w-4 h-4 text-confirm-600 flex-shrink-0" aria-hidden="true" /> {t('landing.pricing.features.bulkImport')}</li>
              <li className="flex items-center gap-2.5"><Check className="w-4 h-4 text-confirm-600 flex-shrink-0" aria-hidden="true" /> {t('landing.pricing.features.weeklyDigest')}</li>
              <li className="flex items-center gap-2.5"><Check className="w-4 h-4 text-confirm-600 flex-shrink-0" aria-hidden="true" /> {t('landing.pricing.features.prioritySupport')}</li>
            </ul>
            <button
              onClick={register}
              className="w-full py-3 bg-primary-700 text-white rounded-xl font-semibold hover:bg-primary-800 transition-colors text-sm"
            >
              {t('landing.pricing.foundingCta')}
            </button>
          </div>

          {/* Business */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 transition-colors hover:border-slate-300">
            <h3 className="text-sm font-bold text-slate-900 mb-1">{t('landing.pricing.tiers.business')}</h3>
            <div className="mb-1">
              <span className="text-3xl font-extrabold text-slate-900 tracking-tight">{t('landing.pricing.free')}</span>
            </div>
            <div className="text-[11px] text-slate-500 mb-1">
              <span className="line-through">{t('landing.pricing.businessPrice')}</span>
              <span className="ml-1">→ <span className="font-semibold text-primary-800">{t('landing.pricing.businessLockInPrice')}</span>{t('landing.pricing.perMonth')}</span>
            </div>
            <p className="text-xs text-slate-400 mb-1">{t('landing.pricing.lockInLabel')}</p>
            <p className="text-xs text-slate-500 mb-5">{t('landing.pricing.businessNote')}</p>
            <ul className="space-y-3 mb-8 text-sm text-slate-700">
              <li className="flex items-center gap-2.5"><Check className="w-4 h-4 text-confirm-600 flex-shrink-0" aria-hidden="true" /> {t('landing.pricing.features.fuelPerformance')}</li>
              <li className="flex items-center gap-2.5"><Check className="w-4 h-4 text-confirm-600 flex-shrink-0" aria-hidden="true" /> {t('landing.pricing.features.docsAndEmails')}</li>
              <li className="flex items-center gap-2.5"><Check className="w-4 h-4 text-confirm-600 flex-shrink-0" aria-hidden="true" /> {t('landing.pricing.features.bulkImport')}</li>
              <li className="flex items-center gap-2.5"><Check className="w-4 h-4 text-confirm-600 flex-shrink-0" aria-hidden="true" /> {t('landing.pricing.features.weeklyDigest')}</li>
              <li className="flex items-center gap-2.5"><Check className="w-4 h-4 text-confirm-600 flex-shrink-0" aria-hidden="true" /> {t('landing.pricing.features.trucks25')}</li>
            </ul>
            <button
              onClick={register}
              className="w-full py-3 bg-slate-900 text-white rounded-xl font-semibold hover:bg-slate-800 transition-colors text-sm"
            >
              {t('landing.pricing.foundingCta')}
            </button>
          </div>

          {/* Enterprise */}
          <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 transition-colors">
            <h3 className="text-sm font-bold text-slate-300 mb-1">{t('landing.pricing.tiers.enterprise')}</h3>
            <div className="mb-5">
              <span className="text-2xl font-extrabold text-white tracking-tight">{t('landing.pricing.contactPrice')}</span>
            </div>
            <ul className="space-y-3 mb-8 text-sm text-slate-400">
              <li className="flex items-center gap-2.5"><Check className="w-4 h-4 text-confirm-500 flex-shrink-0" aria-hidden="true" /> {t('landing.pricing.features.trucksUnlimited')}</li>
              <li className="flex items-center gap-2.5"><Check className="w-4 h-4 text-confirm-500 flex-shrink-0" aria-hidden="true" /> {t('landing.pricing.features.driversUnlimited')}</li>
              <li className="flex items-center gap-2.5"><Check className="w-4 h-4 text-confirm-500 flex-shrink-0" aria-hidden="true" /> {t('landing.pricing.features.apiAccess')}</li>
              <li className="flex items-center gap-2.5"><Check className="w-4 h-4 text-confirm-500 flex-shrink-0" aria-hidden="true" /> {t('landing.pricing.features.prioritySupport')}</li>
            </ul>
            <button
              onClick={handleEnterpriseClick}
              className="w-full py-3 bg-white text-slate-900 rounded-xl font-semibold hover:bg-slate-100 transition-colors text-sm"
            >
              {t('landing.pricing.contactUs')}
            </button>
          </div>
        </div>

        <div className="mt-8 text-center">
          <Link
            to="/founding-terms"
            className="text-sm text-slate-600 hover:text-slate-900 underline decoration-slate-300 hover:decoration-slate-600 underline-offset-2 transition-colors"
          >
            {t('landing.pricing.termsLinkLabel')} →
          </Link>
        </div>
      </div>
    </section>
  );
}
