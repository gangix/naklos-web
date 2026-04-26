import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ApiError, publicInviteApi, type InvitePreview } from '../services/api';
import LanguageSwitcher from '../components/common/LanguageSwitcher';

/**
 * Public landing page for driver invitations: /invite/:token
 *
 * Flow:
 *   1. On mount, GET /public/invite/{token}/preview to validate the token and
 *      pull the driver's first name + their fleet name (so we can greet them
 *      and confirm they're joining the right org).
 *   2. Driver picks a password (min 8 chars, must match confirmation).
 *   3. POST /public/invite/accept consumes the token, provisions the
 *      Keycloak user, and links them to the existing driver row. Token
 *      consumption is the proof of email ownership — no separate verify step.
 *
 * No auth context required: this page renders before login. The success CTA
 * sends the user to `/` where the landing-page Header triggers Keycloak login.
 */
export default function InviteAcceptPage() {
  const { token } = useParams<{ token: string }>();
  const { t } = useTranslation();

  const [preview, setPreview] = useState<InvitePreview | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(true);

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [alreadyAccepted, setAlreadyAccepted] = useState(false);

  // 1) Preview the token on mount.
  useEffect(() => {
    if (!token) {
      setPreviewError(t('invite.errors.tokenExpired'));
      setPreviewLoading(false);
      return;
    }
    let cancelled = false;
    publicInviteApi
      .preview(token)
      .then((data) => {
        if (cancelled) return;
        setPreview(data);
        setPreviewLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        // 410 (expired/invalid) and any other failure both land here — there's
        // no useful distinction to surface to a driver who hasn't logged in.
        setPreviewError(t('invite.errors.tokenExpired'));
        setPreviewLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [token, t]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitError(null);

    if (password.length < 8) {
      setSubmitError(t('invite.errors.passwordTooShort'));
      return;
    }
    if (password !== confirm) {
      setSubmitError(t('invite.errors.passwordsMismatch'));
      return;
    }
    if (!token) return;

    setSubmitting(true);
    try {
      await publicInviteApi.accept(token, password);
      setSuccess(true);
    } catch (err) {
      // Branch on HTTP status (set by ApiError) so we can show the right copy
      // for already-accepted (409) vs. expired (410) vs. anything else.
      if (err instanceof ApiError) {
        if (err.status === 409) {
          setAlreadyAccepted(true);
        } else if (err.status === 410) {
          setPreviewError(t('invite.errors.tokenExpired'));
          setPreview(null);
        } else {
          setSubmitError(err.message);
        }
      } else {
        setSubmitError(err instanceof Error ? err.message : String(err));
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-warm-50 font-sans flex flex-col">
      {/* Minimal header — the landing Header expects useAuth, which isn't
          guaranteed to be ready on a public route. */}
      <header className="border-b border-slate-200 bg-warm/90 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 md:px-6 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group" aria-label="naklos">
            <img src="/naklos-icon.svg" alt="" className="w-8 h-8" aria-hidden="true" />
            <span className="font-extrabold text-slate-900 tracking-tight group-hover:text-primary-700 transition-colors">
              naklos
            </span>
          </Link>
          <LanguageSwitcher variant="light" />
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          {previewLoading && <LoadingCard />}

          {!previewLoading && previewError && !success && !alreadyAccepted && (
            <ErrorCard message={previewError} />
          )}

          {!previewLoading && preview && !success && !alreadyAccepted && (
            <FormCard
              preview={preview}
              password={password}
              confirm={confirm}
              submitting={submitting}
              submitError={submitError}
              onPassword={setPassword}
              onConfirm={setConfirm}
              onSubmit={handleSubmit}
            />
          )}

          {success && <SuccessCard email={preview?.email ?? ''} />}

          {alreadyAccepted && <AlreadyAcceptedCard />}
        </div>
      </main>
    </div>
  );
}

/* ---------- subcomponents ---------- */

function LoadingCard() {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-10 flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-primary-700 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function ErrorCard({ message }: { message: string }) {
  const { t } = useTranslation();
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 text-center">
      <div className="w-12 h-12 rounded-full bg-attention-50 text-attention-700 flex items-center justify-center mx-auto mb-4 text-2xl">
        !
      </div>
      <p className="text-slate-700 leading-relaxed mb-6">{message}</p>
      <Link
        to="/"
        className="inline-block px-5 py-2.5 bg-primary-700 hover:bg-primary-800 text-white text-sm font-bold rounded-lg transition-colors"
      >
        {t('error.goHome')}
      </Link>
    </div>
  );
}

function FormCard(props: {
  preview: InvitePreview;
  password: string;
  confirm: string;
  submitting: boolean;
  submitError: string | null;
  onPassword: (v: string) => void;
  onConfirm: (v: string) => void;
  onSubmit: (e: FormEvent) => void;
}) {
  const { t } = useTranslation();
  const { preview, password, confirm, submitting, submitError, onPassword, onConfirm, onSubmit } = props;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
      <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mb-3">
        {t('invite.title')}
      </h1>
      <p className="text-slate-600 leading-relaxed mb-6">
        {t('invite.welcome', {
          firstName: preview.firstName,
          fleetName: preview.fleetName,
        })}
      </p>

      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">
            {t('invite.emailLabel')}
          </label>
          <input
            type="email"
            value={preview.email}
            readOnly
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 text-sm cursor-not-allowed"
          />
          <p className="mt-1.5 text-xs text-slate-500">{t('invite.emailHint')}</p>
        </div>

        <div>
          <label htmlFor="invite-password" className="block text-sm font-semibold text-slate-700 mb-1.5">
            {t('invite.passwordLabel')}
          </label>
          <input
            id="invite-password"
            type="password"
            value={password}
            onChange={(e) => onPassword(e.target.value)}
            placeholder={t('invite.passwordPlaceholder')}
            autoComplete="new-password"
            minLength={8}
            required
            className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary-700/30 focus:border-primary-700 transition-colors"
          />
        </div>

        <div>
          <label htmlFor="invite-password-confirm" className="block text-sm font-semibold text-slate-700 mb-1.5">
            {t('invite.passwordConfirmLabel')}
          </label>
          <input
            id="invite-password-confirm"
            type="password"
            value={confirm}
            onChange={(e) => onConfirm(e.target.value)}
            autoComplete="new-password"
            minLength={8}
            required
            className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary-700/30 focus:border-primary-700 transition-colors"
          />
        </div>

        {submitError && (
          <div className="bg-attention-50 border border-attention-200 text-attention-700 rounded-lg px-3.5 py-2.5 text-sm whitespace-pre-line">
            {submitError}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full px-5 py-3 bg-primary-700 hover:bg-primary-800 disabled:bg-primary-700/60 disabled:cursor-not-allowed text-white text-sm font-bold rounded-lg transition-colors"
        >
          {submitting ? t('invite.submitting') : t('invite.submit')}
        </button>
      </form>
    </div>
  );
}

function SuccessCard({ email }: { email: string }) {
  const { t } = useTranslation();
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 text-center">
      <div className="w-12 h-12 rounded-full bg-confirm-500/10 text-confirm-700 flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
        ✓
      </div>
      <h2 className="text-xl font-extrabold text-slate-900 tracking-tight mb-3">
        {t('invite.successTitle')}
      </h2>
      <p className="text-slate-600 leading-relaxed mb-6">
        {t('invite.successBody', { email })}
      </p>
      <Link
        to="/"
        className="inline-block px-5 py-2.5 bg-primary-700 hover:bg-primary-800 text-white text-sm font-bold rounded-lg transition-colors"
      >
        {t('invite.loginCta')}
      </Link>
    </div>
  );
}

function AlreadyAcceptedCard() {
  const { t } = useTranslation();
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 text-center">
      <div className="w-12 h-12 rounded-full bg-primary-50 text-primary-700 flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
        i
      </div>
      <p className="text-slate-700 leading-relaxed mb-6">
        {t('invite.errors.alreadyAccepted')}
      </p>
      <Link
        to="/"
        className="inline-block px-5 py-2.5 bg-primary-700 hover:bg-primary-800 text-white text-sm font-bold rounded-lg transition-colors"
      >
        {t('invite.loginCta')}
      </Link>
    </div>
  );
}
