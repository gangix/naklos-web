import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import HttpBackend from 'i18next-http-backend';

export const SUPPORTED_LANGUAGES = ['tr', 'en', 'de'] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

i18n
  .use(HttpBackend)
  .use(initReactI18next)
  .init({
    fallbackLng: 'tr',
    supportedLngs: [...SUPPORTED_LANGUAGES],
    load: 'languageOnly',
    saveMissing: false,
    backend: {
      loadPath: '/locales/{{lng}}/translation.json',
    },
    interpolation: {
      escapeValue: false,
    },
    returnNull: false,
  });

export default i18n;
