// src/pages/blog/BlogIndexPage.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { I18nextProvider, initReactI18next } from 'react-i18next';
import i18n from 'i18next';
import BlogIndexPage from './BlogIndexPage';

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

describe('BlogIndexPage', () => {
  it('renders the first post title and description', () => {
    render(
      <MemoryRouter>
        <I18nextProvider i18n={testI18n}>
          <BlogIndexPage />
        </I18nextProvider>
      </MemoryRouter>,
    );
    expect(screen.getByText('Filo Yakıt Takibi Nasıl Yapılır?')).toBeInTheDocument();
    expect(
      screen.getByText(/OPET, Shell ve BP yakıt kartı ekstrelerinden/),
    ).toBeInTheDocument();
  });
});
