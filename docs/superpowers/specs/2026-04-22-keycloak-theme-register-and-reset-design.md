# Keycloak theme: brand register + password-reset flow

**Date:** 2026-04-22
**Status:** Draft — pending user review
**Author:** olcay.bilir + Claude
**Scope:** Extend the existing `naklos` Keycloak login theme to cover the full registration and password-reset flow with consistent Naklos branding. Out of scope: OTP, IdP-link edge cases, OAuth consent, `terms.ftl` required action, realm config changes, any `naklos-web` source changes.

---

## 1. Problem

Today, `auth.naklos.com.tr` serves a branded login page (via the custom `naklos` Keycloak theme) but every other auth page — registration, forgot-password, set-new-password, verify-email, link-expired, error — falls back to stock `keycloak.v2` PatternFly. For a B2B SaaS onboarding founding customers, the first impression breaks the moment a user clicks "Sign up" or "Forgot password." The register page in particular shows generic PatternFly chrome with no logo, no Turkish default, no legal footer, and no trust copy.

This is blocking on Naklos's founding-customer onboarding because half the pages in the signup and recovery paths look like an unconfigured admin console.

## 2. Goals

1. Every page in the registration + password-reset flow uses the Naklos brand lockup, Plus Jakarta Sans typography, brand blue (`#00488d`) primary CTA, and a legal footer.
2. Turkish is the default locale; EN and DE are switchable via the existing language switcher.
3. Self-serve signup continues to work exactly as it does today — fields are unchanged (email, password, confirm, first name, last name), plus a new inline terms checkbox.
4. Company/tenant creation continues to happen post-auth in `src/pages/FleetSetupPage.tsx` (naklos-web). The Keycloak theme does not touch tenancy.
5. No realm config changes; `realm-export.json` already has `loginTheme=naklos`, `defaultLocale=tr`, `verifyEmail=true`, `resetPasswordAllowed=true`, `registrationAllowed=true`, `registrationEmailAsUsername=true`.

## 3. Non-goals

- `login-otp.ftl` (TOTP) — not enabled in the realm yet.
- `login-idp-link-confirm-override.ftl`, `login-idp-link-email.ftl` — Google account-linking edge cases fall back to stock keycloak.v2.
- `login-oauth-grant.ftl` (consent screen) — not hit in current flows.
- `terms.ftl` as a Keycloak required action — terms acceptance stays in `FleetSetupPage` (the existing versioned acceptance via `TERMS_VERSION = '2026-04-11'` remains the legally-durable record). The new Keycloak checkbox is additional UX consent, not a replacement.
- Any changes to `naklos-web` (including `FleetSetupPage.tsx`, `AuthContext`, `keycloak.ts`).
- Changes to realm config, user federation, or password policy.

## 4. Approach

**Chosen:** extend `keycloak.v2` with a shared `template.ftl` override that owns all chrome (brand header, language switcher, legal footer). Each new flow is a thin FTL that fills only its `form` / `header` / `info` sections via `<@layout.registrationLayout>`. This is Keycloak's idiomatic pattern for branding and avoids the duplication of copying header/footer blocks into each FTL.

**Alternatives considered:**
- *Inline duplication per FTL.* Copy the lockup and footer into each of the 6 new templates. Fastest to ship but turns every brand tweak into a 6-file edit.
- *FreeMarker `<#include>` partials (`brand-header.ftl`, `legal-footer.ftl`).* Also DRY, but `template.ftl` override is what keycloak.v2 is designed for — same outcome, cleaner inheritance.
- *Keycloak User Profile (`register-user-profile.ftl` + declarative JSON).* Future-proof but overkill for 5 simple fields and diverges from how the existing `login.ftl` is structured.

**Why `template.ftl` over explicit partials:** Every page already calls `<@layout.registrationLayout>`, which wraps the entire page in `template.ftl`. Overriding the template once gives every current and future FTL the brand chrome for free, without anyone having to remember to `<#include>` a partial.

## 5. File structure

All paths relative to `/Users/olcay.bilir/IdeaProjects/naklos/docker/keycloak/themes/naklos/login/`.

```
login/
├── theme.properties                (unchanged)
├── template.ftl                    NEW    — owns <head>, <body>, brand header,
│                                            language switcher, legal footer.
│                                            Override of keycloak.v2's template.ftl.
├── login.ftl                       REFACTOR — drop inline lockup, lean on template.ftl
├── register.ftl                    NEW    — email, password, confirm, first/last name,
│                                            terms checkbox, Google social
├── login-reset-password.ftl        NEW    — "enter your email" form
├── login-update-password.ftl       NEW    — "set a new password" form
├── login-verify-email.ftl          NEW    — "we sent you a link" info screen
├── login-page-expired.ftl          NEW    — expired-link recovery
├── error.ftl                       NEW    — branded error page
├── info.ftl                        NEW    — branded info / success page
├── messages/
│   ├── messages_tr.properties      EXTEND — register, reset, update, verify, error, footer keys
│   ├── messages_en.properties      EXTEND — same keys, English
│   └── messages_de.properties      NEW    — first-pass German; flag for native review
└── resources/css/login.css         EXTEND — .naklos-checkbox, .naklos-info-card,
                                             .naklos-legal-footer, .naklos-lang-switch
```

## 6. Components

### 6.1 `template.ftl` (the chrome)

Overrides `keycloak.v2/login/template.ftl`. Responsibilities:

- HTML document, `<head>` with Plus Jakarta Sans link + CSRF meta + favicon.
- Outer layout with three zones: **brand header** (lockup + language switcher), **main card** (inherits child FTL content), **legal footer** (Gizlilik · Şartlar · KVKK · Çerezler).
- Language switcher uses the existing keycloak.v2 locale mechanism — no custom state; just styled.
- Legal links hard-coded to `https://naklos.com.tr/privacy`, `/terms`, `/kvkk`, `/cerez-politikasi` so they're independent of the Keycloak subdomain.
- Mobile breakpoint: ≤ 420px collapses first-name/last-name row to stacked, keeps footer links wrapping to two lines if needed.

### 6.2 `register.ftl`

Layout mirrors the approved mockup in `.superpowers/brainstorm/.../register-mockup.html`:

- H1: `${msg("registerTitle")}` → "Hesap oluştur"
- Subtitle: `${msg("registerSubtitle")}` → "Filonu 5 dakikada kur. Kredi kartı istemiyoruz."
- Social providers: `<#list social.providers>` — renders Google (and any future provider) with no provider hard-coded. Matches the pattern already in `login.ftl`. Apple is intentionally **not** hard-coded: it only appears if added to the realm later.
- Divider: "VEYA"
- Fields: email, password (with show/hide toggle), confirm password, first name + last name on one row at ≥ 420px.
- Terms checkbox: renders `${msg("registerTermsLabelHtml", termsUrl, privacyUrl, kvkkUrl)}` with three inline links. Client-side required (`required` attribute) and server-side re-validated (see §8).
- Primary CTA: "Hesap oluştur" (brand blue #00488d, full width).
- Below CTA: "Zaten hesabın var mı? Giriş yap" back-to-login link.

### 6.3 `login-reset-password.ftl`

- H1: "Şifreni mi unuttun?"
- Sub: "E-posta adresini gir, sıfırlama linki gönderelim."
- Single field: email, TR placeholder `ornek@firma.com`.
- CTA: "Link gönder"
- Back link: "← Girişe dön"

### 6.4 `login-update-password.ftl`

- H1: "Yeni şifre belirle"
- Sub: "Güvenli bir şifre seç — en az 8 karakter."
- Fields: new password, confirm new password (both with show/hide toggle).
- CTA: "Şifreyi kaydet"
- Rendered after user clicks the reset link. Keycloak auto-logs in on success.

### 6.5 `login-verify-email.ftl`

- Stateful message-only page.
- H1: "E-postanı doğrula"
- Sub: "${user.email} adresine bir link gönderdik. Hesabını aktifleştirmek için link'e tıkla."
- Secondary sub: "Link ulaşmadıysa spam klasörünü kontrol et ya da yeniden gönderebilirsin."
- "Yeniden gönder" button (uses Keycloak's standard `kc_action` resend mechanism).

### 6.6 `login-page-expired.ftl`

- H1: "Link süresi doldu"
- Sub: "Güvenlik nedeniyle link geçersiz. Baştan başlayabilirsin."
- Two CTAs from keycloak.v2 defaults (restart login, continue login) — styled in brand blue.

### 6.7 `error.ftl`

- H1: "Bir şeyler ters gitti"
- Sub: rendered from `${message.summary}` if present, else generic.
- Single CTA: "Girişe dön" linking to the login URL.

### 6.8 `info.ftl`

- Mirror of `error.ftl` visually, but with confirm-green accent (`confirm-500 = #16a34a`) on any icon / headline color if Keycloak passes a success state.
- Used as a generic success page for flows that don't have their own template (e.g., "E-postana link gönderdik" after reset request).

## 7. i18n

Keys added to `messages_tr.properties`, `messages_en.properties`, and (new) `messages_de.properties`. Turkish values shown below; EN and DE are direct translations of the same keys.

```properties
# register + common
registerTitle = Hesap oluştur
registerSubtitle = Filonu 5 dakikada kur. Kredi kartı istemiyoruz.
registerSubmit = Hesap oluştur
registerTermsLabelHtml = Devam ederek <a href="{0}">Kullanım Şartları</a>, <a href="{1}">Gizlilik Politikası</a> ve <a href="{2}">KVKK Aydınlatma Metni</a>'ni kabul ediyorum.
registerTermsRequired = Devam etmek için şartları kabul etmelisin.
registerAlreadyHaveAccount = Zaten hesabın var mı?

# reset / update password
emailForgotTitle = Şifreni mi unuttun?
emailForgotSubtitle = E-posta adresini gir, sıfırlama linki gönderelim.
emailForgotSubmit = Link gönder
emailInstructionSent = E-postana link gönderdik. Gelen kutunu kontrol et.
updatePasswordTitle = Yeni şifre belirle
updatePasswordSubtitle = Güvenli bir şifre seç — en az 8 karakter.
updatePasswordSubmit = Şifreyi kaydet

# verify / expired / error
emailVerifyTitle = E-postanı doğrula
emailVerifySubtitle = {0} adresine bir link gönderdik. Hesabını aktifleştirmek için link'e tıkla.
emailVerifyInstruction2 = Link ulaşmadıysa spam klasörünü kontrol et ya da yeniden gönderebilirsin.
pageExpiredTitle = Link süresi doldu
pageExpiredSubtitle = Güvenlik nedeniyle link geçersiz. Baştan başlayabilirsin.
errorTitle = Bir şeyler ters gitti
errorBackToLogin = Girişe dön

# footer (shared via template.ftl)
footerPrivacy = Gizlilik
footerTerms = Şartlar
footerKvkk = KVKK
footerCookies = Çerezler
```

Placeholders use Keycloak's MessageFormat convention (`{0}`, `{1}`, `{2}`) — same pattern already used by the built-in messages.

**DE translation:** written as a first pass by the implementer; the spec calls it out explicitly as "needs native review before GA." For pilot, DE is a nice-to-have fallback — EN/TR are the real launch targets.

## 8. Validation & error handling

**Client-side:**
- Required fields use HTML5 `required`. Email uses `type="email"`.
- Terms checkbox has `required` and a matching `:invalid` style (red outline, helper text).
- Password show/hide toggles live inside the input group; `aria-controls` points to the input ID.

**Server-side:**
- Keycloak enforces email format, required fields, and password policy from realm config — no duplicate validation in FTL.
- Terms checkbox is **re-validated server-side** via a small custom `FormAction` SPI extension (or, if we want to stay pure-FTL, we accept that a determined user can bypass it client-side and rely on `FleetSetupPage` as the legal backstop). Default: rely on `FleetSetupPage` acceptance as the binding record and treat the Keycloak checkbox as UX-only. Flag for implementation-plan review.
- Existing error keys (`invalidEmailMessage`, `invalidPasswordMessage`, `usernameExistsMessage`, etc.) keep working — we just style them.

**Rate limiting:** Keycloak's built-in brute-force protection covers login + reset. No additional wiring needed.

## 9. Data flow

**Registration:**
```
Landing ──► Keycloak register.ftl (NEW, branded)
              └─ submit ──► realm creates user, flags VERIFY_EMAIL required action
                            └─► login-verify-email.ftl (NEW) "E-postanı kontrol et"
                                └─ user clicks link in email
                                   └─► auto-login ──► naklos-web /
                                                       └─► FleetSetupPage (unchanged)
```

**Forgot password:**
```
login.ftl "Şifremi unuttum" ──► login-reset-password.ftl (NEW)
                                  └─ submit ──► info.ftl (NEW) "E-postana link gönderdik"
                                                └─ user clicks link in email
                                                   └─► login-update-password.ftl (NEW)
                                                        └─ submit ──► auto-login
```

**Edge paths:**
- Any expired or stale recovery link → `login-page-expired.ftl` → user restarts the relevant flow.
- Any Keycloak server-side error → `error.ftl` → user returns to login.

`FleetSetupPage.tsx` and the versioned `TERMS_VERSION` acceptance it collects are untouched.

## 10. Testing

1. `cd naklos && docker-compose up` — Keycloak + Postgres locally, theme volume-mounted from `docker/keycloak/themes/naklos`.
2. For each of TR / EN / DE, visit: register, forgot-password, update-password, verify-email (via email link), page-expired (by using an expired link or forging a stale state), error (by forcing a broken realm state). 7 pages × 3 locales = 21 manual checks. Capture screenshots into `docs/superpowers/specs/2026-04-22-keycloak-theme-register-and-reset/screenshots/`.
3. End-to-end: register a new user → verify email via maildev/mailhog → observe auto-login → land on `FleetSetupPage` → complete company creation → confirm landing on dashboard.
4. End-to-end: trigger forgot-password → click email link → set new password → confirm login works with new password.
5. Mobile spot-check: DevTools ≤ 420px, all 6 pages. Verify first/last-name stacks, footer wraps, language switcher doesn't overflow header.
6. Regression check on the existing login flow: `login.ftl` continues to render brand lockup, Google button, legal footer after its refactor to lean on `template.ftl`.
7. Cross-browser: latest Chrome and Safari. Firefox spot-check.

**Definition of done:**
- All 7 pages (login refactored + 6 new) render branded chrome in TR / EN / DE.
- Registration → verify-email → auto-login → `FleetSetupPage` passes end-to-end locally.
- Forgot-password → link → update-password → auto-login passes end-to-end locally.
- Page-expired and error paths both render branded chrome.
- Screenshots committed to the spec folder.
- No regressions on the existing login flow.

## 11. Deployment

Theme rides the existing `naklos/Dockerfile.keycloak` image. Flow per the existing README:

1. Merge PR to `naklos/main`.
2. Railway auto-rebuilds the Keycloak service image.
3. Redeploy picks up the new theme files. No realm-level action needed (realm already set to `loginTheme=naklos`).

Rollback: revert PR, redeploy. No data migration, no state change — purely FTL and CSS.

## 12. Risks & open questions

- **DE copy quality.** First-pass translation written by the implementer, not a native speaker. Low risk for pilot (no German customers yet), but flag before GA.
- **Terms checkbox server-side enforcement.** Current spec defers to `FleetSetupPage` as the legal record and treats the Keycloak checkbox as UX. If we want it binding at the Keycloak layer, we need a small `FormAction` SPI — add as a follow-up ticket, not a blocker.
- **`login.ftl` regression.** Refactoring it to lean on the new `template.ftl` touches a working page. Mitigation: explicit regression step in testing (§10.6); screenshot diff before / after.
- **Legal link hostname.** URLs are hard-coded to `naklos.com.tr`. If we ever stand up a staging brand (e.g. `staging.naklos.com.tr`), these will point at prod content. Acceptable risk for pilot; if it becomes a pain, move to theme.properties variables.
- **Cache busting.** `login.css` is extended, not versioned. If users have stale CSS cached, the new pages may look half-styled briefly. Existing `login.ftl` already hedges against this with inline styles on critical elements (see its social-button markup). New pages should follow the same "inline the critical bits" convention for the brand lockup and primary CTA.
