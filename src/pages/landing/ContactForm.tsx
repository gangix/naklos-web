import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { getLeadSource, resetLeadSource } from './leadSource';

const CONSENT_VERSION = '2026-04-20-v1';

type FleetSize = '1-5' | '6-25' | '26-100' | '100+';

interface FormState {
  name: string;
  email: string;
  phone: string;
  company: string;
  fleetSize: FleetSize | '';
  message: string;
  consent: boolean;
}

interface Errors {
  name?: string;
  email?: string;
  fleetSize?: string;
  consent?: string;
}

const INITIAL_STATE: FormState = {
  name: '',
  email: '',
  phone: '',
  company: '',
  fleetSize: '',
  message: '',
  consent: false,
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ContactForm() {
  const { t, i18n } = useTranslation();
  const [state, setState] = useState<FormState>(INITIAL_STATE);
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);

  const validate = (s: FormState): Errors => {
    const e: Errors = {};
    if (!s.name.trim()) e.name = t('landing.contact.form.validationRequired');
    if (!s.email.trim()) e.email = t('landing.contact.form.validationRequired');
    else if (!EMAIL_RE.test(s.email)) e.email = t('landing.contact.form.validationEmail');
    if (!s.fleetSize) e.fleetSize = t('landing.contact.form.validationRequired');
    if (!s.consent) e.consent = t('landing.contact.form.validationConsent');
    return e;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const validationErrors = validate(state);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    setSubmitting(true);
    const source = getLeadSource();
    const payload = {
      name: state.name.trim(),
      email: state.email.trim(),
      phone: state.phone.trim() || undefined,
      company: state.company.trim() || undefined,
      fleetSize: state.fleetSize,
      message: state.message.trim() || undefined,
      source,
      consent: {
        accepted: state.consent,
        version: CONSENT_VERSION,
        locale: i18n.language as 'tr' | 'en' | 'de',
      },
    };

    try {
      const res = await fetch('/api/public/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast.success(t('landing.contact.form.success'));
        setState(INITIAL_STATE);
        resetLeadSource();
      } else if (res.status === 429) {
        toast.error(t('landing.contact.form.errorRateLimit'));
      } else {
        toast.error(t('landing.contact.form.errorGeneric'));
      }
    } catch {
      toast.error(t('landing.contact.form.errorGeneric'));
    } finally {
      setSubmitting(false);
    }
  };

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setState((prev) => ({ ...prev, [key]: value }));
    if (errors[key as keyof Errors]) {
      setErrors((prev) => ({ ...prev, [key]: undefined }));
    }
  };

  return (
    <section id="contact" className="relative bg-white py-16 md:py-20 px-4 border-t border-slate-100">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight mb-3">
            {t('landing.contact.title')}
          </h2>
          <p className="text-slate-600 text-base">
            {t('landing.contact.subtitle')}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div>
            <label htmlFor="lead-name" className="block text-sm font-semibold text-slate-700 mb-1.5">
              {t('landing.contact.form.name')} <span className="text-urgent-600" aria-hidden="true">*</span>
            </label>
            <input
              id="lead-name"
              type="text"
              value={state.name}
              onChange={(e) => update('name', e.target.value)}
              className={`w-full px-4 py-3 bg-warm-50 border rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-400 ${errors.name ? 'border-urgent-500' : 'border-slate-200'}`}
              required
              aria-invalid={!!errors.name}
              aria-describedby={errors.name ? 'lead-name-err' : undefined}
            />
            {errors.name && <p id="lead-name-err" className="mt-1 text-xs text-urgent-600">{errors.name}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="lead-email" className="block text-sm font-semibold text-slate-700 mb-1.5">
                {t('landing.contact.form.email')} <span className="text-urgent-600" aria-hidden="true">*</span>
              </label>
              <input
                id="lead-email"
                type="email"
                value={state.email}
                onChange={(e) => update('email', e.target.value)}
                className={`w-full px-4 py-3 bg-warm-50 border rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-400 ${errors.email ? 'border-urgent-500' : 'border-slate-200'}`}
                required
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? 'lead-email-err' : undefined}
              />
              {errors.email && <p id="lead-email-err" className="mt-1 text-xs text-urgent-600">{errors.email}</p>}
            </div>

            <div>
              <label htmlFor="lead-phone" className="block text-sm font-semibold text-slate-700 mb-1.5">
                {t('landing.contact.form.phone')}
              </label>
              <input
                id="lead-phone"
                type="tel"
                value={state.phone}
                onChange={(e) => update('phone', e.target.value)}
                className="w-full px-4 py-3 bg-warm-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-400"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="lead-company" className="block text-sm font-semibold text-slate-700 mb-1.5">
                {t('landing.contact.form.company')}
              </label>
              <input
                id="lead-company"
                type="text"
                value={state.company}
                onChange={(e) => update('company', e.target.value)}
                className="w-full px-4 py-3 bg-warm-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-400"
              />
            </div>

            <div>
              <label htmlFor="lead-fleet" className="block text-sm font-semibold text-slate-700 mb-1.5">
                {t('landing.contact.form.fleetSize')} <span className="text-urgent-600" aria-hidden="true">*</span>
              </label>
              <select
                id="lead-fleet"
                value={state.fleetSize}
                onChange={(e) => update('fleetSize', e.target.value as FleetSize)}
                className={`w-full px-4 py-3 bg-warm-50 border rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-400 ${errors.fleetSize ? 'border-urgent-500' : 'border-slate-200'}`}
                required
                aria-invalid={!!errors.fleetSize}
              >
                <option value="">—</option>
                <option value="1-5">{t('landing.contact.form.fleetSizeOptions.xs')}</option>
                <option value="6-25">{t('landing.contact.form.fleetSizeOptions.s')}</option>
                <option value="26-100">{t('landing.contact.form.fleetSizeOptions.m')}</option>
                <option value="100+">{t('landing.contact.form.fleetSizeOptions.l')}</option>
              </select>
              {errors.fleetSize && <p className="mt-1 text-xs text-urgent-600">{errors.fleetSize}</p>}
            </div>
          </div>

          <div>
            <label htmlFor="lead-msg" className="block text-sm font-semibold text-slate-700 mb-1.5">
              {t('landing.contact.form.message')}
            </label>
            <textarea
              id="lead-msg"
              value={state.message}
              onChange={(e) => update('message', e.target.value)}
              rows={4}
              className="w-full px-4 py-3 bg-warm-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-400 resize-y"
              maxLength={2000}
            />
          </div>

          <div>
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={state.consent}
                onChange={(e) => update('consent', e.target.checked)}
                className="mt-1 w-4 h-4 accent-primary-700"
                aria-invalid={!!errors.consent}
              />
              <span className="text-sm text-slate-700 leading-relaxed">
                {t('landing.contact.form.consent')}
              </span>
            </label>
            {errors.consent && <p className="mt-1 text-xs text-urgent-600 ml-7">{errors.consent}</p>}
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full md:w-auto px-8 py-3.5 bg-primary-700 text-white rounded-xl font-bold hover:bg-primary-800 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
          >
            {submitting ? t('landing.contact.form.submitting') : t('landing.contact.form.submit')}
          </button>
        </form>
      </div>
    </section>
  );
}
