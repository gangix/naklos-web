import { useCallback, useEffect, useState } from 'react';
import i18n, { SUPPORTED_LANGUAGES, type SupportedLanguage } from '../i18n';
import keycloak from '../auth/keycloak';

const STORAGE_KEY = 'naklos.language';

function isSupported(value: string | undefined | null): value is SupportedLanguage {
  return value != null && (SUPPORTED_LANGUAGES as readonly string[]).includes(value);
}

function readInitial(): SupportedLanguage {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (isSupported(stored)) return stored;

  const tokenLocale = (keycloak.tokenParsed as { locale?: string } | undefined)?.locale;
  if (isSupported(tokenLocale)) return tokenLocale;

  return 'tr';
}

async function writeToKeycloak(lang: SupportedLanguage): Promise<void> {
  if (!keycloak.token) return;
  const base = (keycloak as { authServerUrl?: string }).authServerUrl?.replace(/\/$/, '') ?? '';
  const realm = (keycloak as { realm?: string }).realm;
  if (!base || !realm) return;
  try {
    await fetch(`${base}/realms/${realm}/account`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${keycloak.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ attributes: { locale: [lang] } }),
    });
  } catch (err) {
    // Non-fatal; localStorage is the primary store.
    console.warn('Failed to sync locale to Keycloak:', err);
  }
}

/**
 * Single source of truth for the active UI language. Reads from
 * localStorage, then the Keycloak `locale` ID-token claim, then defaults
 * to Turkish. Writing flips i18next, the document `lang` attribute,
 * localStorage, and the Keycloak account attribute (best-effort).
 *
 * Call once near the App root; consume from anywhere via the same hook.
 */
export function useLanguage() {
  const [language, setLanguageState] = useState<SupportedLanguage>(readInitial);

  useEffect(() => {
    void i18n.changeLanguage(language);
    document.documentElement.lang = language;
  }, [language]);

  const setLanguage = useCallback((lang: SupportedLanguage) => {
    localStorage.setItem(STORAGE_KEY, lang);
    setLanguageState(lang);
    void writeToKeycloak(lang);
  }, []);

  return { language, setLanguage, supported: SUPPORTED_LANGUAGES };
}
