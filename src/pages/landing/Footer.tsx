import { useTranslation } from 'react-i18next';

const Footer = () => {
  const { t } = useTranslation();

  return (
    <footer className="bg-white border-t border-slate-200 py-10">
      <div className="max-w-6xl mx-auto px-4 md:px-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <img src="/naklos-icon.svg" alt="" className="w-7 h-7" aria-hidden="true" />
          <span className="font-extrabold text-slate-900 tracking-tight">naklos</span>
          <span className="text-xs text-slate-500 ml-2">{t('landing.footer.copyright')}</span>
        </div>
        <div className="flex items-center gap-6 text-xs text-slate-500">
          <a href="/kvkk" className="hover:text-slate-900 transition-colors">{t('landing.footer.kvkk')}</a>
          <a href="/sartlar" className="hover:text-slate-900 transition-colors">{t('landing.footer.terms')}</a>
          <a href="/iletisim" className="hover:text-slate-900 transition-colors">{t('landing.footer.contact')}</a>
          <a href="/blog" className="hover:text-slate-900 transition-colors">{t('landing.footer.blog')}</a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
