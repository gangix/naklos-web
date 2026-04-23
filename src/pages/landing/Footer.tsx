import { Truck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const CONTACT_EMAIL = 'info@naklos.com.tr';

// Legal placeholders — swap for real values once the Ltd. Şti. is
// registered. 'TBD' is more honest than an invented tax number.
const TAX_OFFICE = 'TBD';
const TAX_NUMBER = 'TBD';
const ADDRESS_CITY = 'İstanbul, Türkiye';

export default function Footer() {
  const { t } = useTranslation();
  return (
    <footer className="relative border-t border-slate-100 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10 text-sm">
          <div>
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-7 h-7 rounded-lg bg-primary-700 flex items-center justify-center">
                <Truck className="w-3.5 h-3.5 text-white" aria-hidden="true" />
              </div>
              <span className="font-extrabold text-slate-900 tracking-tight">Naklos</span>
            </div>
            <p className="font-semibold text-slate-700">{t('landing.footer.legalHeading')}</p>
            <p className="text-slate-500 mt-1">{t('landing.footer.addressLabel')} {ADDRESS_CITY}</p>
            <p className="text-slate-500">{t('landing.footer.taxLabel')} {TAX_OFFICE} / {TAX_NUMBER}</p>
          </div>

          <div>
            <ul className="space-y-2">
              <li><Link to="/blog" className="text-slate-600 hover:text-slate-900 transition-colors">{t('landing.nav.blog')}</Link></li>
              <li><Link to="/privacy" className="text-slate-600 hover:text-slate-900 transition-colors">{t('landing.footer.privacy')}</Link></li>
              <li><Link to="/terms" className="text-slate-600 hover:text-slate-900 transition-colors">{t('landing.footer.terms')}</Link></li>
              <li><Link to="/kvkk" className="text-slate-600 hover:text-slate-900 transition-colors">{t('landing.footer.kvkk')}</Link></li>
              <li><Link to="/cerez-politikasi" className="text-slate-600 hover:text-slate-900 transition-colors">{t('landing.footer.cookies')}</Link></li>
              <li><Link to="/founding-terms" className="text-slate-600 hover:text-slate-900 transition-colors">{t('landing.footer.foundingTerms')}</Link></li>
            </ul>
          </div>

          <div>
            <a href={`mailto:${CONTACT_EMAIL}`} className="text-slate-600 hover:text-slate-900 transition-colors">
              {CONTACT_EMAIL}
            </a>
          </div>
        </div>

        <p className="text-xs text-slate-500 text-center border-t border-slate-100 pt-6">
          {t('landing.footer.copyright', { year: new Date().getFullYear() })}
        </p>
      </div>
    </footer>
  );
}
