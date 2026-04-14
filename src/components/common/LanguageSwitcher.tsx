import { useTranslation } from 'react-i18next';
import { useLanguage } from '../../hooks/useLanguage';
import type { SupportedLanguage } from '../../i18n';

const LABELS: Record<SupportedLanguage, string> = {
  tr: 'Türkçe',
  en: 'English',
  de: 'Deutsch',
};

export default function LanguageSwitcher() {
  const { t } = useTranslation();
  const { language, setLanguage, supported } = useLanguage();

  return (
    <label className="flex items-center gap-1 text-sm">
      <span className="sr-only">{t('common.language')}</span>
      <select
        value={language}
        onChange={(e) => setLanguage(e.target.value as SupportedLanguage)}
        aria-label={t('common.language')}
        className="rounded-md bg-white/10 text-slate-200 border-0 px-2 py-1 text-xs font-medium hover:bg-white/15 focus:bg-white/15 focus:outline-none focus:ring-1 focus:ring-white/30 cursor-pointer"
      >
        {supported.map((lang) => (
          <option key={lang} value={lang} className="bg-slate-800 text-slate-100">
            {LABELS[lang]}
          </option>
        ))}
      </select>
    </label>
  );
}
