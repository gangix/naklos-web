import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import LanguageSwitcher from '../../components/common/LanguageSwitcher';

const Header = () => {
  const { t } = useTranslation();
  const { register, login } = useAuth();

  return (
    <header className="border-b border-slate-200 bg-warm sticky top-0 z-30 backdrop-blur-sm bg-warm/90">
      <div className="max-w-6xl mx-auto px-4 md:px-6 h-14 flex items-center justify-between">
        <a href="/" className="flex items-center gap-2 group" aria-label="naklos">
          <div className="w-8 h-8 rounded-lg bg-primary-700 flex items-center justify-center text-white font-extrabold text-sm">
            N
          </div>
          <span className="font-extrabold text-slate-900 tracking-tight group-hover:text-primary-700 transition-colors">naklos</span>
          <span className="ml-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-confirm-500/10 text-confirm-700 border border-confirm-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-confirm-500" aria-hidden="true" />
            {t('landing.nav.beta')}
          </span>
        </a>
        <nav className="hidden md:flex items-center gap-7 text-sm text-slate-600 font-medium">
          <a href="/#features" className="hover:text-slate-900 transition-colors">{t('landing.nav.features')}</a>
          <a href="/#pricing" className="hover:text-slate-900 transition-colors">{t('landing.nav.pricing')}</a>
          <a href="/#faq" className="hover:text-slate-900 transition-colors">{t('landing.nav.faq')}</a>
          <a href="/blog" className="hover:text-slate-900 transition-colors">{t('landing.nav.blog')}</a>
        </nav>
        <div className="flex items-center gap-3">
          <LanguageSwitcher variant="light" />
          <button
            type="button"
            onClick={login}
            className="hidden sm:inline text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors"
          >
            {t('landing.nav.login')}
          </button>
          <button
            type="button"
            onClick={register}
            className="px-4 py-1.5 bg-primary-700 hover:bg-primary-800 text-white text-sm font-bold rounded-lg transition-colors"
          >
            {t('landing.hero.cta')}
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
