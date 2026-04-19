import { Truck, Users, AlertTriangle, Fuel, Check, Minus, ArrowRight, Mail } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import LanguageSwitcher from '../components/common/LanguageSwitcher';

const LandingPage = () => {
  const { t } = useTranslation();
  const { login, loginWith, register } = useAuth();

  const features = [
    {
      icon: Truck,
      title: t('landing.features.vehicles.title'),
      description: t('landing.features.vehicles.description'),
      bg: 'bg-blue-50',
      text: 'text-blue-600',
    },
    {
      icon: Users,
      title: t('landing.features.drivers.title'),
      description: t('landing.features.drivers.description'),
      bg: 'bg-emerald-50',
      text: 'text-emerald-600',
    },
    {
      icon: AlertTriangle,
      title: t('landing.features.docs.title'),
      description: t('landing.features.docs.description'),
      bg: 'bg-amber-50',
      text: 'text-amber-600',
    },
    {
      icon: Fuel,
      title: t('landing.features.fuel.title'),
      description: t('landing.features.fuel.description'),
      bg: 'bg-violet-50',
      text: 'text-violet-600',
    },
  ];

  const benefits = [
    t('landing.benefits.items.b1'),
    t('landing.benefits.items.b2'),
    t('landing.benefits.items.b3'),
    t('landing.benefits.items.b4'),
    t('landing.benefits.items.b5'),
  ];

  return (
    <div className="min-h-screen bg-[#fafbfc]">
      {/* Subtle dot grid background */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.35]"
        style={{
          backgroundImage: 'radial-gradient(circle, #cbd5e1 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />

      {/* Top bar */}
      <header className="relative bg-white/80 backdrop-blur-md border-b border-gray-200/60 sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-sm shadow-primary-500/20">
              <Truck className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-extrabold tracking-tight text-gray-900">Naklos</span>
          </div>
          <div className="flex items-center gap-1">
            <LanguageSwitcher variant="light" />
            <div className="w-px h-5 bg-gray-200 mx-1" aria-hidden="true" />
            <button
              onClick={login}
              className="px-4 py-2 text-sm font-semibold text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-lg transition-all"
            >
              {t('landing.nav.login')}
            </button>
          </div>
        </div>
      </header>

      {/* Hero — text on the left, app preview mockup on the right (desktop).
          On mobile the mockup stacks below the text. */}
      <section className="relative max-w-6xl mx-auto px-4 pt-16 pb-16 md:pt-24 md:pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-10 items-center">
          {/* Text column */}
          <div className="text-center lg:text-left">
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary-50 text-primary-700 rounded-full text-xs font-semibold mb-8 border border-primary-100">
              <span className="w-1.5 h-1.5 bg-primary-500 rounded-full animate-pulse" />
              {t('landing.hero.badge')}
            </div>

            <h1 className="text-5xl md:text-6xl lg:text-[64px] font-extrabold text-gray-900 mb-6 leading-[1.05] tracking-tight">
              {t('landing.hero.title1')}
              <br />
              <span className="bg-gradient-to-r from-primary-600 via-primary-500 to-blue-400 bg-clip-text text-transparent">
                {t('landing.hero.title2')}
              </span>
            </h1>

            <p className="text-lg text-gray-500 max-w-lg mx-auto lg:mx-0 mb-10 leading-relaxed">
              {t('landing.hero.tagline')}
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center lg:items-start justify-center lg:justify-start gap-3 mb-8">
              <button
                onClick={register}
                className="group w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-primary-600 to-primary-500 text-white rounded-xl font-bold text-base hover:shadow-xl hover:shadow-primary-500/25 transition-all hover:-translate-y-0.5 flex items-center justify-center gap-2"
              >
                {t('landing.hero.ctaPrimary')}
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
              <button
                onClick={login}
                className="w-full sm:w-auto px-8 py-4 bg-white text-gray-700 rounded-xl font-semibold border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all text-base"
              >
                {t('landing.hero.ctaSecondary')}
              </button>
            </div>

            {/* Google OAuth */}
            <div className="max-w-sm mx-auto lg:mx-0">
              <button
                onClick={() => loginWith('google')}
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all flex items-center justify-center gap-3 text-sm"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                {t('landing.hero.ctaGoogle')}
              </button>
            </div>
          </div>

          {/* Mockup column — stylized preview of the manager dashboard.
              Not a real screenshot (intentional placeholder), but close
              enough to the real UI that visitors know what they're signing
              up for. Replace with a real screenshot once product design
              stabilises. */}
          <div className="relative mt-4 lg:mt-0">
            <HeroMockup t={t} />
          </div>
        </div>
      </section>

      {/* Features grid */}
      <section className="relative max-w-6xl mx-auto px-4 py-16 md:py-24">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.title}
                className="group bg-white rounded-2xl p-6 border border-gray-100 hover:border-gray-200 hover:shadow-lg hover:shadow-gray-200/50 transition-all duration-300 hover:-translate-y-1"
              >
                <div className={`w-11 h-11 rounded-xl ${feature.bg} ${feature.text} flex items-center justify-center mb-5`}>
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-gray-900 mb-2 text-[15px]">{feature.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{feature.description}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Benefits */}
      <section className="relative bg-white py-20 md:py-24 border-y border-gray-100">
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-5 tracking-tight leading-tight">
                {t('landing.benefits.title')}
              </h2>
              <button
                onClick={register}
                className="group mt-3 px-6 py-3.5 bg-gray-900 text-white rounded-xl font-semibold hover:bg-black transition-all flex items-center gap-2"
              >
                {t('landing.benefits.cta')}
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
            <div className="bg-gray-50 rounded-2xl p-8 border border-gray-100">
              <ul className="space-y-4">
                {benefits.map((benefit) => (
                  <li key={benefit} className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mt-0.5">
                      <Check className="w-3 h-3" strokeWidth={3} />
                    </div>
                    <span className="text-gray-600 text-[15px] leading-relaxed">{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="relative py-20 md:py-28 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 items-start">
            {/* Free */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-lg hover:shadow-gray-200/50 hover:-translate-y-1 transition-all duration-300">
              <h3 className="text-sm font-bold text-gray-900 mb-1">{t('landing.pricing.tiers.free')}</h3>
              <div className="mb-5">
                <span className="text-3xl font-extrabold text-gray-900 tracking-tight">{t('landing.pricing.free')}</span>
              </div>
              <ul className="space-y-3 mb-8 text-sm text-gray-600">
                <li className="flex items-center gap-2.5"><Check className="w-4 h-4 text-emerald-500 flex-shrink-0" /> {t('landing.pricing.features.trucks5')}</li>
                <li className="flex items-center gap-2.5"><Check className="w-4 h-4 text-emerald-500 flex-shrink-0" /> {t('landing.pricing.features.drivers5')}</li>
                <li className="flex items-center gap-2.5"><Check className="w-4 h-4 text-emerald-500 flex-shrink-0" /> {t('landing.pricing.features.docsAndEmails')}</li>
                <li className="flex items-center gap-2.5"><Minus className="w-4 h-4 text-gray-300 flex-shrink-0" /> <span className="text-gray-400">{t('landing.pricing.features.fuelPerformanceDenied')}</span></li>
                <li className="flex items-center gap-2.5"><Minus className="w-4 h-4 text-gray-300 flex-shrink-0" /> <span className="text-gray-400">{t('landing.pricing.features.bulkImport')}</span></li>
              </ul>
              <button
                onClick={register}
                className="w-full py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-colors text-sm"
              >
                {t('landing.pricing.startFree')}
              </button>
            </div>

            {/* Pro — highlighted */}
            <div className="bg-white rounded-2xl border-2 border-primary-500 ring-1 ring-primary-500/20 p-6 hover:shadow-xl hover:shadow-primary-500/10 hover:-translate-y-1 transition-all duration-300 relative lg:scale-[1.03]">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="bg-primary-600 text-white text-[11px] font-bold px-3 py-1 rounded-full tracking-wide">
                  {t('landing.pricing.popular')}
                </span>
              </div>
              <h3 className="text-sm font-bold text-primary-700 mb-1">{t('landing.pricing.tiers.pro')}</h3>
              <div className="mb-5">
                <span className="text-3xl font-extrabold text-gray-900 tracking-tight">499 ₺</span>
                <span className="text-sm text-gray-500 font-medium">{t('landing.pricing.perMonth')}</span>
              </div>
              <ul className="space-y-3 mb-8 text-sm text-gray-600">
                <li className="flex items-center gap-2.5"><Check className="w-4 h-4 text-emerald-500 flex-shrink-0" /> {t('landing.pricing.features.trucks25')}</li>
                <li className="flex items-center gap-2.5"><Check className="w-4 h-4 text-emerald-500 flex-shrink-0" /> {t('landing.pricing.features.drivers25')}</li>
                <li className="flex items-center gap-2.5"><Check className="w-4 h-4 text-emerald-500 flex-shrink-0" /> {t('landing.pricing.features.fuelPerformance')}</li>
                <li className="flex items-center gap-2.5"><Check className="w-4 h-4 text-emerald-500 flex-shrink-0" /> {t('landing.pricing.features.weeklyDigest')}</li>
                <li className="flex items-center gap-2.5"><Check className="w-4 h-4 text-emerald-500 flex-shrink-0" /> {t('landing.pricing.features.bulkImport')}</li>
              </ul>
              <a
                href="mailto:info@naklos.com.tr?subject=Naklos%20Professional"
                className="w-full py-3 bg-primary-600 text-white rounded-xl font-semibold hover:bg-primary-700 transition-colors text-sm flex items-center justify-center gap-2"
              >
                <Mail className="w-4 h-4" />
                {t('landing.pricing.contactUs')}
              </a>
            </div>

            {/* Business */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-lg hover:shadow-gray-200/50 hover:-translate-y-1 transition-all duration-300">
              <h3 className="text-sm font-bold text-gray-900 mb-1">{t('landing.pricing.tiers.business')}</h3>
              <div className="mb-5">
                <span className="text-3xl font-extrabold text-gray-900 tracking-tight">999 ₺</span>
                <span className="text-sm text-gray-500 font-medium">{t('landing.pricing.perMonth')}</span>
              </div>
              <ul className="space-y-3 mb-8 text-sm text-gray-600">
                <li className="flex items-center gap-2.5"><Check className="w-4 h-4 text-emerald-500 flex-shrink-0" /> {t('landing.pricing.features.trucks100')}</li>
                <li className="flex items-center gap-2.5"><Check className="w-4 h-4 text-emerald-500 flex-shrink-0" /> {t('landing.pricing.features.drivers100')}</li>
                <li className="flex items-center gap-2.5"><Check className="w-4 h-4 text-emerald-500 flex-shrink-0" /> {t('landing.pricing.features.fuelPerformance')}</li>
                <li className="flex items-center gap-2.5"><Check className="w-4 h-4 text-emerald-500 flex-shrink-0" /> {t('landing.pricing.features.weeklyDigest')}</li>
                <li className="flex items-center gap-2.5"><Check className="w-4 h-4 text-emerald-500 flex-shrink-0" /> {t('landing.pricing.features.bulkImport')}</li>
              </ul>
              <a
                href="mailto:info@naklos.com.tr?subject=Naklos%20Business"
                className="w-full py-3 bg-gray-900 text-white rounded-xl font-semibold hover:bg-black transition-colors text-sm flex items-center justify-center gap-2"
              >
                <Mail className="w-4 h-4" />
                {t('landing.pricing.contactUs')}
              </a>
            </div>

            {/* Enterprise */}
            <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6 hover:shadow-lg hover:shadow-gray-900/30 hover:-translate-y-1 transition-all duration-300">
              <h3 className="text-sm font-bold text-gray-300 mb-1">{t('landing.pricing.tiers.enterprise')}</h3>
              <div className="mb-5">
                <span className="text-2xl font-extrabold text-white tracking-tight">{t('landing.pricing.contactPrice')}</span>
              </div>
              <ul className="space-y-3 mb-8 text-sm text-gray-400">
                <li className="flex items-center gap-2.5"><Check className="w-4 h-4 text-emerald-400 flex-shrink-0" /> {t('landing.pricing.features.trucksUnlimited')}</li>
                <li className="flex items-center gap-2.5"><Check className="w-4 h-4 text-emerald-400 flex-shrink-0" /> {t('landing.pricing.features.driversUnlimited')}</li>
                <li className="flex items-center gap-2.5"><Check className="w-4 h-4 text-emerald-400 flex-shrink-0" /> {t('landing.pricing.features.fuelPerformance')}</li>
                <li className="flex items-center gap-2.5"><Check className="w-4 h-4 text-emerald-400 flex-shrink-0" /> {t('landing.pricing.features.apiAccess')}</li>
                <li className="flex items-center gap-2.5"><Check className="w-4 h-4 text-emerald-400 flex-shrink-0" /> {t('landing.pricing.features.prioritySupport')}</li>
              </ul>
              <a
                href="mailto:info@naklos.com.tr?subject=Naklos%20Enterprise"
                className="w-full py-3 bg-white text-gray-900 rounded-xl font-semibold hover:bg-gray-100 transition-colors text-sm flex items-center justify-center gap-2"
              >
                <Mail className="w-4 h-4" />
                {t('landing.pricing.contactUs')}
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative py-12 px-4">
        <div className="max-w-6xl mx-auto text-center text-sm text-gray-400">
          <div className="flex items-center justify-center gap-2.5 mb-4">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center">
              <Truck className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-extrabold text-gray-900 tracking-tight">Naklos</span>
          </div>
          <div className="flex items-center justify-center gap-6 mb-4">
            <Link to="/privacy" className="hover:text-gray-600 transition-colors">
              {t('landing.footer.privacy')}
            </Link>
            <Link to="/terms" className="hover:text-gray-600 transition-colors">
              {t('landing.footer.terms')}
            </Link>
          </div>
          <p className="text-gray-400">{t('landing.footer.copyright', { year: new Date().getFullYear() })}</p>
        </div>
      </footer>
    </div>
  );
};

/** Stylized preview of the manager dashboard used in the hero.
 *  Pure HTML/Tailwind so it costs nothing to ship and translates
 *  automatically via t(). Lives inside a mock browser chrome so
 *  visitors immediately read it as "this is the app". */
function HeroMockup({ t }: { t: (k: string, opts?: Record<string, unknown>) => string }) {
  return (
    <div className="relative mx-auto max-w-lg">
      {/* Soft glow behind the mockup */}
      <div
        className="absolute -inset-6 rounded-[32px] bg-gradient-to-br from-primary-400/25 via-blue-300/15 to-emerald-200/20 blur-2xl pointer-events-none"
        aria-hidden="true"
      />

      {/* Browser chrome */}
      <div className="relative rounded-2xl bg-white shadow-[0_30px_80px_-20px_rgba(15,23,42,0.35)] ring-1 ring-slate-200/80 overflow-hidden">
        <div className="flex items-center gap-1.5 px-3 h-8 border-b border-slate-100 bg-slate-50">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-400" />
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
          <span className="ml-3 flex-1 text-[10px] text-slate-400 font-mono truncate">
            naklos.com.tr/manager/dashboard
          </span>
        </div>

        {/* Mini app */}
        <div className="bg-[#fafbfc] p-4">
          {/* Mini nav */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1.5">
              <div className="w-5 h-5 rounded-md bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center">
                <Truck className="w-3 h-3 text-white" />
              </div>
              <span className="text-[11px] font-extrabold text-slate-900 tracking-tight">Naklos</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-primary-50 text-primary-600 font-bold">PRO</span>
              <span className="w-5 h-5 rounded-full bg-slate-200" />
            </div>
          </div>

          {/* Page title */}
          <div className="mb-3">
            <div className="text-[9px] uppercase tracking-wider text-slate-400 font-semibold">
              {t('landing.hero.preview.label')}
            </div>
            <div className="h-4 w-28 mt-1 rounded bg-slate-200/80" />
          </div>

          {/* 3 stat tiles */}
          <div className="grid grid-cols-3 gap-2 mb-3">
            <StatTile label={t('landing.hero.preview.stat1Label')} value="24" tone="blue" icon={<Truck className="w-3 h-3" />} />
            <StatTile label={t('landing.hero.preview.stat2Label')} value="18" tone="emerald" icon={<Users className="w-3 h-3" />} />
            <StatTile label={t('landing.hero.preview.stat3Label')} value="3" tone="amber" alarm icon={<Fuel className="w-3 h-3" />} />
          </div>

          {/* Priority rows */}
          <div className="rounded-lg border border-slate-200 bg-white p-2.5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                {t('landing.hero.preview.priorityTitle')}
              </span>
              <span className="text-[9px] text-slate-400 tabular-nums">2</span>
            </div>
            <div className="space-y-1.5">
              <PriorityRow label={t('landing.hero.preview.priorityItem1')} tone="rose" cta={t('landing.hero.preview.priorityCta')} />
              <PriorityRow label={t('landing.hero.preview.priorityItem2')} tone="amber" cta={t('landing.hero.preview.priorityCta')} />
            </div>
          </div>
        </div>
      </div>

      {/* Floating "Verimlilik %91" pill for character */}
      <div className="absolute -bottom-5 -right-5 bg-white rounded-xl shadow-[0_12px_30px_-10px_rgba(15,23,42,0.3)] ring-1 ring-slate-200 px-3 py-2 hidden sm:block">
        <div className="text-[9px] uppercase tracking-wider text-emerald-600 font-bold">{t('landing.features.fuel.title')}</div>
        <div className="text-lg font-extrabold text-slate-900 tabular-nums leading-none">%91</div>
      </div>
    </div>
  );
}

function StatTile({
  label, value, tone, icon, alarm,
}: {
  label: string;
  value: string;
  tone: 'blue' | 'emerald' | 'amber';
  icon: React.ReactNode;
  alarm?: boolean;
}) {
  const bg = tone === 'blue' ? 'bg-blue-50 text-blue-600'
           : tone === 'emerald' ? 'bg-emerald-50 text-emerald-600'
           : 'bg-amber-50 text-amber-600';
  return (
    <div className={`rounded-lg p-2 border ${alarm ? 'border-amber-200 bg-amber-50/40' : 'border-slate-100 bg-white'}`}>
      <div className={`w-5 h-5 rounded ${bg} flex items-center justify-center mb-1`}>
        {icon}
      </div>
      <div className="text-sm font-extrabold text-slate-900 tabular-nums leading-none">{value}</div>
      <div className="text-[9px] uppercase tracking-wider text-slate-400 font-semibold mt-1 truncate">{label}</div>
    </div>
  );
}

function PriorityRow({ label, tone, cta }: { label: string; tone: 'rose' | 'amber'; cta: string }) {
  const bar = tone === 'rose' ? 'bg-urgent-500' : 'bg-attention-500';
  const btn = tone === 'rose' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700';
  return (
    <div className="rounded-md bg-slate-50 border border-slate-100 overflow-hidden flex items-stretch">
      <span className={`w-0.5 ${bar}`} aria-hidden="true" />
      <div className="flex-1 flex items-center justify-between px-2 py-1.5">
        <span className="text-[10px] font-semibold text-slate-700 truncate">{label}</span>
        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${btn} flex-shrink-0 ml-2`}>{cta}</span>
      </div>
    </div>
  );
}

export default LandingPage;
