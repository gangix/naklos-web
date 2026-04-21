import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { I18nextProvider, initReactI18next } from 'react-i18next';
import i18n from 'i18next';
import enRes from '../../../public/locales/en/translation.json';
import LandingPage from '../LandingPage';

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
  lng: 'en',
  resources: { en: { translation: enRes } },
});

const renderPage = () => render(
  <MemoryRouter>
    <I18nextProvider i18n={testI18n}>
      <LandingPage />
    </I18nextProvider>
  </MemoryRouter>
);

describe('LandingPage', () => {
  it('renders all major sections', () => {
    renderPage();

    expect(screen.getAllByText(/the fuel leak you can't see in excel/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/we surface it the day it happens/i)).toBeInTheDocument();

    expect(screen.getByText(/three steps — data to action/i)).toBeInTheDocument();
    expect(screen.getByText(/upload your excel/i)).toBeInTheDocument();

    expect(screen.getAllByText(/your cards spend\. which ones aren't driving\?/i).length).toBeGreaterThanOrEqual(1);

    expect(screen.getByText(/goodbye, spreadsheets/i)).toBeInTheDocument();

    expect(screen.getByText(/founding customers lock in/i)).toBeInTheDocument();
    expect(screen.getAllByText(/get founding access/i).length).toBeGreaterThanOrEqual(3);

    expect(screen.getByText(/talk to a human/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/your name/i)).toBeInTheDocument();

    expect(screen.getAllByText(/privacy policy/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/info@naklos\.com\.tr/i)).toBeInTheDocument();
  });

  it('does NOT render forbidden content (WhatsApp / audit)', () => {
    renderPage();

    expect(screen.queryByText(/whatsapp/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/free fuel audit/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/wa\.me/)).not.toBeInTheDocument();
  });
});
