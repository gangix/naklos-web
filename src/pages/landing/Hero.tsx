import { useTranslation, Trans } from 'react-i18next';
import { Truck, Users } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const Hero = () => {
  const { t } = useTranslation();
  const { register } = useAuth();

  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(15,23,42,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(15,23,42,0.04)_1px,transparent_1px)] bg-[size:48px_48px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_30%,black_50%,transparent_100%)]" aria-hidden="true" />
      <div className="relative max-w-6xl mx-auto px-4 md:px-6 pt-16 md:pt-24 pb-20 md:pb-28">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-10 items-center">

          <div className="lg:col-span-6 text-center lg:text-left">
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-confirm-500/10 border border-confirm-500/20 text-confirm-700 rounded-full text-xs font-semibold mb-6">
              <span className="w-1.5 h-1.5 bg-confirm-500 rounded-full" aria-hidden="true" />
              {t('landing.betaPill')}
            </div>

            <h1 className="text-5xl md:text-6xl lg:text-[68px] font-extrabold text-slate-900 mb-5 leading-[1.02] tracking-tight">
              {t('landing.hero.title1')}<br />
              <span className="font-serif italic font-normal text-primary-700">{t('landing.hero.title2')}</span>{' '}
              {t('landing.hero.title3')}
            </h1>

            <p className="text-lg md:text-xl text-slate-600 max-w-xl mx-auto lg:mx-0 mb-9 leading-relaxed">
              <Trans i18nKey="landing.hero.subtitle" components={{ strong: <strong className="text-slate-900 font-semibold" /> }} />
            </p>

            <div className="flex flex-col sm:flex-row items-center lg:items-start justify-center lg:justify-start gap-3 mb-6">
              <button
                type="button"
                onClick={() => register()}
                className="group w-full sm:w-auto px-7 py-4 bg-primary-700 hover:bg-primary-800 text-white rounded-xl font-bold text-base transition-colors flex items-center justify-center gap-2 shadow-card"
              >
                {t('landing.hero.cta')}
                <span aria-hidden="true" className="group-hover:translate-x-0.5 transition-transform">→</span>
              </button>
              <a href="#compare" className="text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors px-2 py-2">
                {t('landing.nav.comparison')} →
              </a>
            </div>

            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-x-5 gap-y-2 text-xs font-medium text-slate-500">
              {[
                t('landing.hero.trustNoCard'),
                t('landing.hero.trustKvkk'),
                t('landing.hero.trustSupport'),
                t('landing.hero.trustNoHardware'),
              ].map((label) => (
                <span key={label} className="inline-flex items-center gap-1.5">
                  <span className="text-confirm-500" aria-hidden="true">✓</span>
                  {label}
                </span>
              ))}
            </div>
          </div>

          <div className="lg:col-span-6">
            <HeroProductMock />
          </div>
        </div>
      </div>
    </section>
  );
};

function HeroProductMock() {
  return (
    <div className="relative">
      <div className="absolute -top-6 -left-6 w-24 h-24 bg-accent-500/15 rounded-full blur-3xl" aria-hidden="true" />
      <div className="absolute -bottom-8 -right-4 w-32 h-32 bg-primary-500/15 rounded-full blur-3xl" aria-hidden="true" />
      <div className="relative bg-white rounded-2xl shadow-cardHover border border-slate-200 overflow-hidden">
        <div className="flex items-center gap-1.5 px-4 py-2.5 border-b border-slate-100 bg-slate-50">
          <span className="w-2.5 h-2.5 rounded-full bg-slate-300" />
          <span className="w-2.5 h-2.5 rounded-full bg-slate-300" />
          <span className="w-2.5 h-2.5 rounded-full bg-slate-300" />
          <span className="ml-3 text-[11px] font-mono text-slate-400">naklos.com.tr/manager/dashboard</span>
        </div>
        <div className="p-5">
          {/* Date + truck/driver tally — mirrors the real dashboard's header
              chips so the mockup feels like the actual product. */}
          <div className="flex items-center gap-2 text-[11px] text-slate-500 mb-1 flex-wrap">
            <span className="font-medium text-slate-600">Cuma</span>
            <span className="text-slate-300">·</span>
            <span>26 Nisan 2026</span>
            <span className="text-slate-300">·</span>
            <span className="inline-flex items-center gap-1 text-slate-600">
              <Truck className="w-3 h-3 text-blue-500" aria-hidden="true" />
              <span className="font-semibold tabular-nums">12</span>
              <span>araç</span>
            </span>
            <span className="text-slate-300">·</span>
            <span className="inline-flex items-center gap-1 text-slate-600">
              <Users className="w-3 h-3 text-emerald-500" aria-hidden="true" />
              <span className="font-semibold tabular-nums">8</span>
              <span>sürücü</span>
            </span>
          </div>
          <p className="text-xl font-extrabold text-slate-900 tracking-tight mb-3">Filom</p>
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500 mb-3">
            Bugün incelemelerin
            <span className="ml-1.5 normal-case tracking-normal text-urgent-700">(3 acil)</span>
          </p>
          <div className="bg-white rounded-xl shadow-card border border-slate-200 overflow-hidden divide-y divide-slate-100">
            <MockRow tone="urgent" plate="34 ABC 123" subline="3 belge · Muayene, Sigorta, Kasko" rightPill="3 gün" />
            <MockRow tone="urgent" plate="7 yakıt uyarısı" subline="2 acil · 5 uyarı" sublineColor="text-urgent-700 font-semibold" rightPill="aç" isUppercase />
            <MockRow tone="attention" plate="07 QRS 300" subline="1 bakım · Motor yağı" rightPill="25 gün" notFilled />
          </div>
        </div>
      </div>
    </div>
  );
}

interface MockRowProps {
  tone: 'urgent' | 'attention';
  plate: string;
  subline: string;
  sublineColor?: string;
  rightPill: string;
  isUppercase?: boolean;
  notFilled?: boolean;
}

function MockRow({ tone, plate, subline, sublineColor, rightPill, isUppercase, notFilled }: MockRowProps) {
  const stripe = tone === 'urgent' ? 'bg-urgent-500' : 'bg-attention-500';
  const rowBg = tone === 'urgent' ? 'bg-urgent-50/50' : '';
  const iconBg = tone === 'urgent' ? 'bg-urgent-100 text-urgent-600' : 'bg-attention-50 text-attention-600';
  const filledPill = tone === 'urgent' ? 'bg-urgent-100 text-urgent-700' : 'bg-attention-100 text-attention-700';
  const textOnly = tone === 'urgent' ? 'text-urgent-700' : 'text-attention-700';
  const pillClass = notFilled
    ? `${textOnly} font-bold font-mono`
    : `${filledPill} px-2 py-0.5 rounded-md font-bold font-mono ${isUppercase ? 'uppercase tracking-wider' : ''}`;
  return (
    <div className={`flex items-stretch ${rowBg}`}>
      <span className={`w-1 ${stripe}`} aria-hidden="true" />
      <div className="flex-1 flex items-center gap-3 px-4 py-3.5">
        <div className={`w-9 h-9 rounded-lg ${iconBg} flex items-center justify-center`}>
          <span className="text-sm font-bold" aria-hidden="true">{tone === 'urgent' ? '!' : '◆'}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-900">{plate}</p>
          <p className={`text-xs ${sublineColor ?? 'text-slate-500'}`}>{subline}</p>
        </div>
        <span className={`text-xs ${pillClass}`}>{rightPill}</span>
      </div>
    </div>
  );
}

export default Hero;
