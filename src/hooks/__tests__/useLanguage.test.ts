import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';

vi.mock('../../auth/keycloak', () => ({
  default: {
    token: undefined,
    tokenParsed: undefined,
    authServerUrl: 'http://localhost:8180',
    realm: 'naklos',
  },
}));

vi.mock('../../i18n', async () => {
  const actual = await vi.importActual<typeof import('../../i18n')>('../../i18n');
  return {
    ...actual,
    default: { changeLanguage: vi.fn() },
  };
});

import { useLanguage } from '../useLanguage';

beforeEach(() => {
  localStorage.clear();
  document.documentElement.lang = '';
});

describe('useLanguage', () => {
  it('defaults to tr when no signal is present', () => {
    const origLangs = navigator.languages;
    const origLang = navigator.language;
    Object.defineProperty(navigator, 'languages', { value: [], configurable: true });
    Object.defineProperty(navigator, 'language', { value: '', configurable: true });
    try {
      const { result } = renderHook(() => useLanguage());
      expect(result.current.language).toBe('tr');
      expect(document.documentElement.lang).toBe('tr');
    } finally {
      Object.defineProperty(navigator, 'languages', { value: origLangs, configurable: true });
      Object.defineProperty(navigator, 'language', { value: origLang, configurable: true });
    }
  });

  it('reads stored language from localStorage', () => {
    localStorage.setItem('naklos.language', 'en');
    const { result } = renderHook(() => useLanguage());
    expect(result.current.language).toBe('en');
  });

  it('rejects unsupported locales and falls back to tr', () => {
    localStorage.setItem('naklos.language', 'fr');
    const origLangs = navigator.languages;
    Object.defineProperty(navigator, 'languages', { value: ['fr-FR'], configurable: true });
    try {
      const { result } = renderHook(() => useLanguage());
      expect(result.current.language).toBe('tr');
    } finally {
      Object.defineProperty(navigator, 'languages', { value: origLangs, configurable: true });
    }
  });

  it('writes new language to localStorage and updates document.lang', () => {
    const { result } = renderHook(() => useLanguage());
    act(() => result.current.setLanguage('de'));
    expect(localStorage.getItem('naklos.language')).toBe('de');
    expect(result.current.language).toBe('de');
    expect(document.documentElement.lang).toBe('de');
  });

  it('exposes the supported language list', () => {
    const { result } = renderHook(() => useLanguage());
    expect(result.current.supported).toEqual(['tr', 'en', 'de']);
  });
});
