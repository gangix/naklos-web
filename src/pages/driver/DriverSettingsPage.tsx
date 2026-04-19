import { useTranslation } from 'react-i18next';
import { NavLink } from 'react-router-dom';
import { toast } from 'sonner';
import { ChevronRight, UserCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { driverApi } from '../../services/api';
import { Select } from '../../components/common/FormField';
import { SUPPORTED_LANGUAGES, type SupportedLanguage } from '../../i18n';

const LANGUAGE_LABELS: Record<SupportedLanguage, string> = {
  tr: 'Türkçe',
  en: 'English',
  de: 'Deutsch',
};

const Eyebrow = ({ children }: { children: React.ReactNode }) => (
  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-500 mb-3">
    {children}
  </p>
);

/** Driver-scoped settings surface. Kept intentionally narrow: identity
 *  summary, language preference (canonical home — removed from the top-bar
 *  dropdown), a navigational link to the profile/documents page, and an
 *  About footer. Profile edits and document uploads continue to live on
 *  DriverProfilePage. */
const DriverSettingsPage = () => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();

  const handleLanguageChange = async (locale: SupportedLanguage) => {
    if (locale === i18n.language) return;
    try {
      await driverApi.updateLocale(locale);
      i18n.changeLanguage(locale);
      toast.success(t('toast.success.languageUpdated'));
    } catch {
      toast.error(t('toast.error.generic'));
    }
  };

  return (
    <div className="p-4 pb-20">
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">
          {t('driverSettings.pageTitle')}
        </h1>
        <p className="text-sm text-gray-600 mt-1">
          {t('driverSettings.pageSubtitle')}
        </p>
      </div>

      <div
        className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-4 animate-[fadeIn_140ms_ease-out]"
        style={{ animationDelay: '0ms', animationFillMode: 'backwards' }}
      >
        <Eyebrow>{t('driverSettings.accountCard.eyebrow')}</Eyebrow>
        <p className="text-base font-semibold text-gray-900">{user?.name ?? '—'}</p>
        <p className="text-xs text-gray-500 mt-1">
          {t('driverSettings.accountCard.roleLabel')}
        </p>
      </div>

      <div
        className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-4 animate-[fadeIn_140ms_ease-out]"
        style={{ animationDelay: '60ms', animationFillMode: 'backwards' }}
      >
        <Eyebrow>{t('driverSettings.preferencesCard.eyebrow')}</Eyebrow>
        <Select
          label={t('settings.language')}
          value={i18n.language}
          onChange={(e) => handleLanguageChange(e.target.value as SupportedLanguage)}
        >
          {SUPPORTED_LANGUAGES.map((lang) => (
            <option key={lang} value={lang}>{LANGUAGE_LABELS[lang]}</option>
          ))}
        </Select>
        <p className="text-xs text-gray-500 mt-2">
          {t('driverSettings.preferencesCard.languageHint')}
        </p>
      </div>

      <NavLink
        to="/driver/profile"
        className="block bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-4 hover:bg-gray-50 active:bg-gray-100 transition-colors animate-[fadeIn_140ms_ease-out]"
        style={{ animationDelay: '120ms', animationFillMode: 'backwards' }}
      >
        <Eyebrow>{t('driverSettings.profileCard.eyebrow')}</Eyebrow>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary-50 text-primary-600 grid place-items-center flex-shrink-0">
            <UserCircle className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900">
              {t('driverSettings.profileCard.title')}
            </p>
            <p className="text-xs text-gray-600 mt-0.5">
              {t('driverSettings.profileCard.desc')}
            </p>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
        </div>
      </NavLink>

      <div
        className="pt-6 pb-2 text-center animate-[fadeIn_140ms_ease-out]"
        style={{ animationDelay: '180ms', animationFillMode: 'backwards' }}
      >
        <p className="text-xs text-gray-500">{t('driverSettings.about.version')}</p>
      </div>
    </div>
  );
};

export default DriverSettingsPage;