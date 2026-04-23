import { Truck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import LanguageSwitcher from '../../components/common/LanguageSwitcher';

export default function Header() {
  const { t } = useTranslation();
  const { login } = useAuth();

  return (
    <header className="relative bg-white/90 backdrop-blur-md border-b border-slate-200 sticky top-0 z-20">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-primary-700 flex items-center justify-center">
            <Truck className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-extrabold tracking-tight text-slate-900">Naklos</span>
        </Link>
        <div className="flex items-center gap-1">
          <Link
            to="/blog"
            className="px-3 py-2 text-sm font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
          >
            {t('landing.nav.blog')}
          </Link>
          <LanguageSwitcher variant="light" />
          <div className="w-px h-5 bg-slate-200 mx-1" aria-hidden="true" />
          <button
            onClick={login}
            className="px-4 py-2 text-sm font-semibold text-primary-700 hover:text-primary-800 hover:bg-primary-50 rounded-lg transition-colors"
          >
            {t('landing.nav.login')}
          </button>
        </div>
      </div>
    </header>
  );
}
