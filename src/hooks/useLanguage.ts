import { useCallback, useEffect, useState } from 'react';
import i18n, { SUPPORTED_LANGUAGES, type SupportedLanguage } from '../i18n';
import keycloak from '../auth/keycloak';

const STORAGE_KEY = 'naklos.language';

function isSupported(value: string | undefined | null): value is SupportedLanguage {
  return value != null && (SUPPORTED_LANGUAGES as readonly string[]).includes(value);
}

/** Pull the primary-subtag from a BCP-47 locale tag ('en-US' → 'en',
 *  'de-AT' → 'de'). Case-insensitive. */
function primarySubtag(tag: string): string {
  return tag.split('-')[0].toLowerCase();
}

/** Walk navigator.languages in priority order and return the first one
 *  whose primary subtag we support. Falls back to navigator.language for
 *  browsers that don't expose the list. Returns null if nothing matches. */
function fromBrowserLocale(): SupportedLanguage | null {
  if (typeof navigator === 'undefined') return null;
  const list = (navigator.languages && navigator.languages.length > 0)
    ? navigator.languages
    : [navigator.language].filter(Boolean);
  for (const tag of list) {
    const primary = primarySubtag(tag);
    if (isSupported(primary)) return primary;
  }
  return null;
}

function readInitial(): SupportedLanguage {
  // 1. Explicit user choice persists across sessions.
  // Guard: localStorage is not available in SSR / Node (prerender). Fall through.
  const stored = typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
  if (isSupported(stored)) return stored;

  // 2. Signed-in users carry their preferred locale on the Keycloak token.
  const tokenLocale = (keycloak.tokenParsed as { locale?: string } | undefined)?.locale;
  if (isSupported(tokenLocale)) return tokenLocale;

  // 3. First-time visitors: honour the browser's language preferences
  //    (Accept-Language equivalent exposed as navigator.languages). A
  //    German visitor lands on naklos.com.tr and sees German, not Turkish.
  const fromBrowser = fromBrowserLocale();
  if (fromBrowser) return fromBrowser;

  // 4. Ultimate fallback — Turkish is the primary market.
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
