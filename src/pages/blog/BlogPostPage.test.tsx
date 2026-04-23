// src/pages/blog/BlogPostPage.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { I18nextProvider, initReactI18next } from 'react-i18next';
import i18n from 'i18next';
import BlogPostPage from './BlogPostPage';

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    login: vi.fn(),
    loginWith: vi.fn(),
    register: vi.fn(),
  }),
}));

vi.mock('../../components/common/LanguageSwitcher', () => ({
  default: () => <div data-testid="language-switcher" />,
}));

const testI18n = i18n.createInstance();
await testI18n.use(initReactI18next).init({
  lng: 'tr',
  resources: { tr: { translation: {} } },
});

function renderAt(url: string) {
  return render(
    <MemoryRouter initialEntries={[url]}>
      <I18nextProvider i18n={testI18n}>
        <Routes>
          <Route path="/blog/:slug" element={<BlogPostPage />} />
          <Route path="*" element={<div>404</div>} />
        </Routes>
      </I18nextProvider>
    </MemoryRouter>,
  );
}

describe('BlogPostPage', () => {
  it('renders the post title and prose for a known slug', () => {
    renderAt('/blog/yakit-takibi-nasil-yapilir');
    expect(
      screen.getByRole('heading', { name: 'Filo Yakıt Takibi Nasıl Yapılır?' }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Neden yakıt takibi önemli\?/)).toBeInTheDocument();
  });

  it('renders 404 for an unknown slug', () => {
    renderAt('/blog/does-not-exist');
    expect(screen.getByText('404')).toBeInTheDocument();
  });

  // re-enabled in Sprint 3 once i18n keys land
  it.skip('renders the CTA after the post prose', () => {
    renderAt('/blog/yakit-takibi-nasil-yapilir');
    // CTA button text comes from i18n — key "blog.cta.button" → "Ücretsiz başla →"
    expect(screen.getByRole('link', { name: /Ücretsiz başla/i })).toBeInTheDocument();
  });
});
