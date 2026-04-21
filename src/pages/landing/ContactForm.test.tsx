import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { I18nextProvider, initReactI18next } from 'react-i18next';
import i18n from 'i18next';
import { toast } from 'sonner';
import ContactForm from './ContactForm';
import { setLeadSource, getLeadSource } from './leadSource';

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const testI18n = i18n.createInstance();
await testI18n.use(initReactI18next).init({
  lng: 'en',
  resources: {
    en: {
      translation: {
        landing: {
          contact: {
            title: 'Talk to a human',
            subtitle: 'Subtitle.',
            form: {
              name: 'Your name',
              email: 'Email address',
              phone: 'Phone',
              company: 'Company',
              fleetSize: 'How many trucks?',
              fleetSizeOptions: { xs: '1-5', s: '6-25', m: '26-100', l: '100+' },
              message: 'Message',
              consent: 'I consent.',
              submit: 'Send',
              submitting: 'Sending…',
              success: 'Thanks',
              errorGeneric: 'Oops',
              errorRateLimit: 'Too many',
              validationRequired: 'Required.',
              validationEmail: 'Invalid email.',
              validationConsent: 'Please consent.',
            },
          },
        },
      },
    },
  },
});

const renderForm = () => render(
  <I18nextProvider i18n={testI18n}>
    <ContactForm />
  </I18nextProvider>
);

beforeEach(() => {
  vi.clearAllMocks();
  globalThis.fetch = vi.fn();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('ContactForm', () => {
  it('renders all required fields', () => {
    renderForm();
    expect(screen.getByLabelText(/your name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/how many trucks/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/i consent/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /send/i })).toBeInTheDocument();
  });

  it('blocks submission when required fields are missing', async () => {
    renderForm();
    fireEvent.click(screen.getByRole('button', { name: /send/i }));

    await waitFor(() => {
      expect(screen.getAllByText(/required/i).length).toBeGreaterThanOrEqual(1);
    });
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it('blocks submission when consent is not accepted', async () => {
    renderForm();
    fireEvent.change(screen.getByLabelText(/your name/i), { target: { value: 'Ali' } });
    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'ali@example.com' } });
    fireEvent.change(screen.getByLabelText(/how many trucks/i), { target: { value: '6-25' } });
    fireEvent.click(screen.getByRole('button', { name: /send/i }));

    await waitFor(() => {
      expect(screen.getByText(/please consent/i)).toBeInTheDocument();
    });
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it('rejects invalid email format', async () => {
    renderForm();
    fireEvent.change(screen.getByLabelText(/your name/i), { target: { value: 'Ali' } });
    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'not-an-email' } });
    fireEvent.change(screen.getByLabelText(/how many trucks/i), { target: { value: '6-25' } });
    fireEvent.click(screen.getByLabelText(/i consent/i));
    fireEvent.click(screen.getByRole('button', { name: /send/i }));

    await waitFor(() => {
      expect(screen.getByText(/invalid email/i)).toBeInTheDocument();
    });
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it('submits with correct payload and shows success toast on 201', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      status: 201,
      json: async () => ({ id: 'abc-123' }),
    });

    renderForm();
    fireEvent.change(screen.getByLabelText(/your name/i), { target: { value: 'Ali Yılmaz' } });
    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'ali@example.com' } });
    fireEvent.change(screen.getByLabelText(/how many trucks/i), { target: { value: '6-25' } });
    fireEvent.click(screen.getByLabelText(/i consent/i));
    fireEvent.click(screen.getByRole('button', { name: /send/i }));

    await waitFor(() => {
      expect(globalThis.fetch).toHaveBeenCalledWith(
        '/api/public/lead',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: expect.any(String),
        })
      );
    });

    const call = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    const body = JSON.parse(call[1].body);
    expect(body.name).toBe('Ali Yılmaz');
    expect(body.email).toBe('ali@example.com');
    expect(body.fleetSize).toBe('6-25');
    expect(body.source).toBe('contact');
    expect(body.consent.accepted).toBe(true);
    expect(body.consent.locale).toBe('en');

    expect(toast.success).toHaveBeenCalledWith('Thanks');
  });

  it('shows rate-limit toast on 429', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
      status: 429,
    });

    renderForm();
    fireEvent.change(screen.getByLabelText(/your name/i), { target: { value: 'Ali' } });
    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'ali@example.com' } });
    fireEvent.change(screen.getByLabelText(/how many trucks/i), { target: { value: '6-25' } });
    fireEvent.click(screen.getByLabelText(/i consent/i));
    fireEvent.click(screen.getByRole('button', { name: /send/i }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Too many');
    });
  });

  it('shows generic error toast on 5xx', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
      status: 500,
    });

    renderForm();
    fireEvent.change(screen.getByLabelText(/your name/i), { target: { value: 'Ali' } });
    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'ali@example.com' } });
    fireEvent.change(screen.getByLabelText(/how many trucks/i), { target: { value: '6-25' } });
    fireEvent.click(screen.getByLabelText(/i consent/i));
    fireEvent.click(screen.getByRole('button', { name: /send/i }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Oops');
    });
  });

  it('shows generic error toast on network failure', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('Network fail'));

    renderForm();
    fireEvent.change(screen.getByLabelText(/your name/i), { target: { value: 'Ali' } });
    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'ali@example.com' } });
    fireEvent.change(screen.getByLabelText(/how many trucks/i), { target: { value: '6-25' } });
    fireEvent.click(screen.getByLabelText(/i consent/i));
    fireEvent.click(screen.getByRole('button', { name: /send/i }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Oops');
    });
  });

  it('uses leadSource="enterprise-pricing" when set, resets after submit', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true, status: 201, json: async () => ({ id: 'x' }),
    });

    setLeadSource('enterprise-pricing');

    renderForm();
    fireEvent.change(screen.getByLabelText(/your name/i), { target: { value: 'Ali' } });
    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'ali@example.com' } });
    fireEvent.change(screen.getByLabelText(/how many trucks/i), { target: { value: '100+' } });
    fireEvent.click(screen.getByLabelText(/i consent/i));
    fireEvent.click(screen.getByRole('button', { name: /send/i }));

    await waitFor(() => expect(globalThis.fetch).toHaveBeenCalled());

    const body = JSON.parse((globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0][1].body);
    expect(body.source).toBe('enterprise-pricing');
    expect(getLeadSource()).toBe('contact');
  });
});
