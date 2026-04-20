import { Truck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const CONTACT_EMAIL = 'info@naklos.com.tr';

export default function Footer() {
  const { t } = useTranslation();
  return (
    <footer className="relative py-12 px-4">
      <div className="max-w-6xl mx-auto text-center text-sm text-slate-500">
        <div className="flex items-center justify-center gap-2.5 mb-4">
          <div className="w-7 h-7 rounded-lg bg-primary-700 flex items-center justify-center">
            <Truck className="w-3.5 h-3.5 text-white" aria-hidden="true" />
          </div>
          <span className="font-extrabold text-slate-900 tracking-tight">Naklos</span>
        </div>
        <div className="flex items-center justify-center gap-6 mb-3">
          <Link to="/privacy" className="hover:text-slate-700 transition-colors">
            {t('landing.footer.privacy')}
          </Link>
          <Link to="/terms" className="hover:text-slate-700 transition-colors">
            {t('landing.footer.terms')}
          </Link>
          <a href={`mailto:${CONTACT_EMAIL}`} className="hover:text-slate-700 transition-colors">
            {CONTACT_EMAIL}
          </a>
        </div>
        <p className="text-slate-500">{t('landing.footer.copyright', { year: new Date().getFullYear() })}</p>
      </div>
    </footer>
  );
}
