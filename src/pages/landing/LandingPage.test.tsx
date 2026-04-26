import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { I18nextProvider, initReactI18next } from 'react-i18next';
import i18n from 'i18next';
import trRes from '../../../public/locales/tr/translation.json';
import LandingPage from '../LandingPage';

// Auth context used by Hero / Pricing / FinalCTA / Header for register/login CTAs
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

// Pricing + FinalCTA fetch /api/public/founding-status on mount.
// Stub the publicApi so the test doesn't try to hit the network.
vi.mock('../../services/publicApi', () => ({
  publicApi: {
    foundingStatus: () => Promise.resolve({ taken: 3, remaining: 7 }),
  },
}));

const testI18n = i18n.createInstance();
await testI18n.use(initReactI18next).init({
  lng: 'tr',
  resources: { tr: { translation: trRes } },
});

const renderPage = () => render(
  <MemoryRouter>
    <I18nextProvider i18n={testI18n}>
      <LandingPage />
    </I18nextProvider>
  </MemoryRouter>
);

describe('LandingPage', () => {
  it('renders all major sections (Hero / Features / Pricing / FAQ / FinalCTA)', () => {
    renderPage();

    // Hero
    expect(screen.getAllByText(/excel'i bırakın/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/filonuzu/i).length).toBeGreaterThanOrEqual(1);

    // Features (3 pillars)
    expect(screen.getByText(/tek ekran, üç farklı takip/i)).toBeInTheDocument();

    // Pricing — beta banner + cards
    expect(screen.getByText(/anlaşılır fiyatlandırma/i)).toBeInTheDocument();

    // FAQ
    expect(screen.getByText(/sık sorulan sorular/i)).toBeInTheDocument();

    // Final CTA — "10 dakika" line
    expect(screen.getByText(/10 dakika/i)).toBeInTheDocument();

    // Footer links
    expect(screen.getAllByText(/kvkk/i).length).toBeGreaterThanOrEqual(1);
  });

  it('does NOT render forbidden content (floating widget / removed sections)', () => {
    renderPage();

    // WhatsApp floating widget removed (text mention in FAQ support copy is fine)
    expect(screen.queryByText(/wa\.me/)).not.toBeInTheDocument();
    // Old marketing audit CTA removed
    expect(screen.queryByText(/free fuel audit/i)).not.toBeInTheDocument();
    // HowItWorks section removed from the landing flow
    expect(screen.queryByText(/three steps — data to action/i)).not.toBeInTheDocument();
  });
});
