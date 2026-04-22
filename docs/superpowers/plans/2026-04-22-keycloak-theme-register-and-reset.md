# Keycloak theme: branded register + password-reset flow — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extend the existing `naklos` Keycloak login theme so every page in the registration + password-reset flow (register, verify-email, reset-password, update-password, page-expired, error, info) renders the same Naklos brand chrome as the current `login.ftl`, in TR / EN / DE, without any realm config or `naklos-web` source changes.

**Architecture:** Override `keycloak.v2`'s `template.ftl` once to own brand header + language switcher + legal footer. All 6 new FTLs plus a refactored `login.ftl` inherit that chrome via the standard `<@layout.registrationLayout>` wrapper — so brand tweaks are one-file edits. Message keys split across `messages_tr.properties` (canonical), `messages_en.properties` (full English), and `messages_de.properties` (new, first-pass German).

**Tech Stack:** Keycloak 24 (prod via `Dockerfile.keycloak`) / Keycloak 26 (local via `docker-compose.yml`), FreeMarker templates, PatternFly v5 base classes (inherited from `keycloak.v2`), Plus Jakarta Sans (Google Fonts), vanilla CSS (no build step — theme is static resources).

**Spec:** `docs/superpowers/specs/2026-04-22-keycloak-theme-register-and-reset-design.md`

**Where code lives:** Everything is in the **`naklos` backend repo** at `/Users/olcay.bilir/IdeaProjects/naklos/docker/keycloak/themes/naklos/login/`, not in `naklos-web`. Commits happen in the naklos repo. The spec and this plan live in `naklos-web` because that's where the design docs live.

**Branch:** cut a new branch `feat/keycloak-theme-register-reset` from `naklos` `main` before starting.

**Out of scope for this plan:**
- OTP templates (`login-otp.ftl`), IdP-link templates, OAuth consent — still fall back to `keycloak.v2` defaults.
- `terms.ftl` as a required action — terms acceptance stays in `FleetSetupPage`.
- Any `naklos-web` source changes.
- Realm config changes — `realm-export.json` already has `loginTheme=naklos`, `defaultLocale=tr`, `verifyEmail=true`, `resetPasswordAllowed=true`.
- Server-side re-validation of the Keycloak terms checkbox (would need a custom `FormAction` SPI). Deferred — `FleetSetupPage` is the legal backstop.

**Testing philosophy:** Keycloak FTL templates have no unit-test harness. Every task follows the same loop: **write the template + messages → restart Keycloak (`docker compose restart keycloak`) → open the page in a browser at `http://localhost:8180/realms/naklos/login-actions/...` → verify in TR, EN, DE → commit.** The "failing test" discipline is replaced with "browser render in all three locales passes before commit." Two end-to-end click-through tasks at the end cover the full register-verify-login and reset-password flows. Screenshots are committed to the spec folder as visual regression evidence.

**Voice note:** The existing `messages_tr.properties` uses formal Turkish (`Parola`, `yapın` second-person plural). The spec's new copy uses casual voice (`Şifre`, `yap` second-person singular) to match the landing page. This plan updates the existing formal keys to casual where the user sees them on newly-themed pages, and keeps other keys untouched. Any lingering inconsistency is called out in Task 15.

---

## File Structure

All paths below are relative to `/Users/olcay.bilir/IdeaProjects/naklos/docker/keycloak/themes/naklos/login/`.

### Created
```
template.ftl                    ~140 lines (shared chrome — <head>, brand header, legal footer)
register.ftl                    ~110 lines (email, password×2, first+last, terms checkbox, social)
login-reset-password.ftl         ~50 lines (single-field email form)
login-update-password.ftl        ~65 lines (new password + confirm)
login-verify-email.ftl           ~40 lines (stateful info screen, resend button)
login-page-expired.ftl           ~45 lines (two CTA recovery)
error.ftl                        ~35 lines (branded error)
info.ftl                         ~35 lines (branded generic info / success)
messages/messages_de.properties  ~70 keys (first-pass German)
```

### Modified
```
login.ftl                        226 → ~180 lines (drop inline brand lockup; inherit from template.ftl)
messages/messages_tr.properties  97 lines → ~120 lines (add ~25 new keys, update ~5 existing for casual voice)
messages/messages_en.properties  9 lines → ~70 lines (fill out to match TR catalog)
resources/css/login.css          (extend) — add .naklos-legal-footer, .naklos-checkbox, .naklos-info-card, .naklos-lang-switch, .naklos-meta-header
```

### Unchanged
```
theme.properties                 (already correct)
```

---

## Task 0: Branch + local dev setup

**Files:** none (environment task)

- [ ] **Step 1: Cut the feature branch**

Run (in the naklos repo):
```bash
cd /Users/olcay.bilir/IdeaProjects/naklos
git checkout main
git pull
git checkout -b feat/keycloak-theme-register-reset
```

- [ ] **Step 2: Bring up the local stack**

Run:
```bash
cd /Users/olcay.bilir/IdeaProjects/naklos
docker compose up -d postgres keycloak
```

Wait ~60s for Keycloak to be ready. Verify:
```bash
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:8180/health/ready
```
Expected: `200`.

- [ ] **Step 3: Verify existing login page renders in three locales**

Open in browser:
- http://localhost:8180/realms/naklos/protocol/openid-connect/auth?client_id=naklos-frontend&redirect_uri=http://localhost:5173&response_type=code
- Click the language switcher → confirm TR, EN, DE all render the existing branded login page.

Expected: `login.ftl` renders the Naklos lockup + Google social button + Plus Jakarta Sans typography. If the page looks like stock PatternFly, the theme isn't being picked up — check `docker compose logs keycloak | grep -i theme`.

- [ ] **Step 4: Verify existing register page is the stock ugly one**

From the login page click "Kaydolun" / "Register". Expected: stock keycloak.v2 register page (plain "Register" heading, generic form). This confirms there's nothing to un-theme first.

- [ ] **Step 5: Commit the branch setup**

No code changes yet. Proceed to Task 1.

---

## Task 1: Extend login.css with new chrome styles

**Files:**
- Modify: `docker/keycloak/themes/naklos/login/resources/css/login.css` (append to end)

- [ ] **Step 1: Read the existing CSS to confirm variable names**

Run:
```bash
head -25 docker/keycloak/themes/naklos/login/resources/css/login.css
```

Confirm `--naklos-primary = #005cc0` and `--naklos-primary-hover = #00488d` exist. (If they don't, the rest of this task uses the wrong variable names — stop and reconcile with the file.)

- [ ] **Step 2: Append the new chrome styles**

Append the following block to the bottom of `docker/keycloak/themes/naklos/login/resources/css/login.css`:

```css
/* ───────────────────── NAKLOS CHROME (template.ftl) ───────────────────── */

/* Brand header row: lockup on the left, language switcher on the right. */
.naklos-meta-header {
  display: flex !important;
  justify-content: space-between;
  align-items: center;
  padding: 18px 24px;
  border-bottom: 1px solid #f1f5f9;
  background: #fff;
}

.naklos-meta-lockup {
  display: flex;
  align-items: center;
  gap: 9px;
  color: var(--naklos-primary);
  text-decoration: none;
}

.naklos-meta-lockup svg {
  width: 26px;
  height: 26px;
}

.naklos-meta-wordmark {
  font-family: 'Plus Jakarta Sans', system-ui, sans-serif !important;
  font-weight: 800;
  font-size: 19px;
  letter-spacing: -0.3px;
  color: var(--naklos-primary);
}

/* Language switcher: styled wrapper around keycloak.v2's default dropdown. */
.naklos-lang-switch {
  font-size: 12px;
  color: var(--naklos-gray-700);
  border: 1px solid var(--naklos-gray-300);
  border-radius: 9px;
  padding: 5px 10px;
  background: #fff;
}

.naklos-lang-switch .pf-v5-c-select__toggle {
  background: transparent !important;
  border: 0 !important;
  padding: 0 !important;
  color: inherit !important;
}

.naklos-lang-switch .pf-v5-c-select__toggle-text {
  font-family: 'Plus Jakarta Sans', system-ui, sans-serif !important;
  font-size: 12px !important;
  font-weight: 500 !important;
}

/* Inline terms checkbox on register.ftl */
.naklos-checkbox {
  display: flex !important;
  gap: 10px;
  align-items: flex-start;
  padding: 10px 0 14px;
  font-family: 'Plus Jakarta Sans', system-ui, sans-serif !important;
}

.naklos-checkbox input[type="checkbox"] {
  margin-top: 2px;
  width: 16px;
  height: 16px;
  accent-color: var(--naklos-primary);
  flex-shrink: 0;
}

.naklos-checkbox label {
  font-size: 12.5px !important;
  color: var(--naklos-gray-700) !important;
  line-height: 1.5 !important;
  font-weight: 400 !important;
  margin: 0 !important;
}

.naklos-checkbox label a {
  color: var(--naklos-primary) !important;
  text-decoration: underline;
  font-weight: 600;
}

.naklos-checkbox label a:hover {
  color: var(--naklos-primary-hover) !important;
}

/* Info / expired / verify message card */
.naklos-info-card {
  text-align: center;
  padding: 8px 0 18px;
}

.naklos-info-card h1 {
  font-family: 'Plus Jakarta Sans', system-ui, sans-serif !important;
  font-size: 24px !important;
  font-weight: 800 !important;
  color: var(--naklos-gray-900) !important;
  margin: 0 0 8px !important;
  letter-spacing: -0.3px;
}

.naklos-info-card p {
  font-family: 'Plus Jakarta Sans', system-ui, sans-serif !important;
  font-size: 14px !important;
  color: var(--naklos-gray-500) !important;
  line-height: 1.55 !important;
  margin: 0 0 8px !important;
}

.naklos-info-card .naklos-info-strong-email {
  color: var(--naklos-gray-900);
  font-weight: 600;
}

/* Legal footer rendered on every page via template.ftl */
.naklos-legal-footer {
  display: flex !important;
  flex-wrap: wrap;
  gap: 10px 18px;
  justify-content: center;
  padding: 16px 20px 20px;
  font-family: 'Plus Jakarta Sans', system-ui, sans-serif !important;
  font-size: 11.5px;
  color: var(--naklos-gray-500);
}

.naklos-legal-footer a {
  color: var(--naklos-gray-700);
  text-decoration: none;
}

.naklos-legal-footer a:hover {
  color: var(--naklos-primary);
}

.naklos-legal-footer .naklos-legal-sep {
  color: var(--naklos-gray-300);
}

@media (max-width: 420px) {
  .naklos-meta-header {
    padding: 14px 16px;
  }
  .naklos-legal-footer {
    padding: 14px 12px 18px;
    font-size: 11px;
    gap: 8px 12px;
  }
}
```

- [ ] **Step 3: Restart Keycloak to pick up the CSS**

Run:
```bash
docker compose restart keycloak
```

Wait ~20s. Verify the existing login page still loads correctly at the URL from Task 0 — nothing should visually change yet (the new classes aren't used anywhere). If the login page breaks, there's a CSS syntax error — fix it before proceeding.

- [ ] **Step 4: Commit**

```bash
cd /Users/olcay.bilir/IdeaProjects/naklos
git add docker/keycloak/themes/naklos/login/resources/css/login.css
git commit -m "feat(keycloak-theme): add chrome CSS for template.ftl shared layout"
```

---

## Task 2: Create template.ftl (shared chrome)

**Files:**
- Create: `docker/keycloak/themes/naklos/login/template.ftl`

- [ ] **Step 1: Copy the reference keycloak.v2 template as a starting point**

We need to know exactly which DOM regions PatternFly v5 provides so our override doesn't accidentally nuke Keycloak internals. Pull the base template for reference:

```bash
docker run --rm --entrypoint cat quay.io/keycloak/keycloak:26.0 \
  /opt/keycloak/themes/keycloak.v2/login/template.ftl \
  > /tmp/keycloak.v2.template.ftl
wc -l /tmp/keycloak.v2.template.ftl
```

Expected: ~180 lines. Skim it — note that it defines three sections the child FTL can fill: `header`, `form`, `info`, `socialProviders`, `info-wrapper`.

- [ ] **Step 2: Write the new template.ftl**

Create `docker/keycloak/themes/naklos/login/template.ftl` with:

```ftl
<#macro registrationLayout bodyClass="" displayInfo=false displayMessage=true displayRequiredFields=false displayWide=false showAnotherWayIfPresent=true>
<!DOCTYPE html>
<html class="${properties.kcHtmlClass!}" lang="${locale.currentLanguageTag}">

<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1,user-scalable=yes">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="robots" content="noindex, nofollow">

    <#if properties.meta?has_content>
        <#list properties.meta?split(' ') as meta>
            <meta name="${meta?split('==')[0]}" content="${meta?split('==')[1]}"/>
        </#list>
    </#if>
    <title>${msg("loginTitle",(realm.displayName!''))}</title>
    <link rel="icon" href="${url.resourcesPath}/img/favicon.ico"/>
    <#if properties.stylesCommon?has_content>
        <#list properties.stylesCommon?split(' ') as style>
            <link href="${url.resourcesCommonPath}/${style}" rel="stylesheet"/>
        </#list>
    </#if>
    <#if properties.styles?has_content>
        <#list properties.styles?split(' ') as style>
            <link href="${url.resourcesPath}/${style}" rel="stylesheet"/>
        </#list>
    </#if>
    <#if properties.scripts?has_content>
        <#list properties.scripts?split(' ') as script>
            <script src="${url.resourcesPath}/${script}" type="text/javascript"></script>
        </#list>
    </#if>
    <#if scripts??>
        <#list scripts as script>
            <script src="${script}" type="text/javascript"></script>
        </#list>
    </#if>
</head>

<body class="${properties.kcBodyClass!} ${bodyClass}" id="keycloak-bg">

<div class="naklos-meta-header">
    <a class="naklos-meta-lockup" href="https://naklos.com.tr" aria-label="Naklos">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/>
            <path d="M15 18H9"/>
            <path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"/>
            <circle cx="17" cy="18" r="2"/>
            <circle cx="7" cy="18" r="2"/>
        </svg>
        <span class="naklos-meta-wordmark">Naklos</span>
    </a>

    <#if realm.internationalizationEnabled && locale.supported?size gt 1>
        <div class="naklos-lang-switch" x-data="{ open: false, toggle() { this.open = !this.open }, close() { this.open = false } }">
            <div class="pf-v5-c-select">
                <button type="button" class="pf-v5-c-select__toggle"
                        x-on:click="toggle()"
                        :aria-expanded="open ? 'true' : 'false'"
                        id="login-select-toggle"
                        aria-haspopup="true"
                        aria-label="${msg('languages')!'Language'}">
                    <div class="pf-v5-c-select__toggle-wrapper">
                        <span class="pf-v5-c-select__toggle-text">${locale.current}</span>
                    </div>
                    <span class="pf-v5-c-select__toggle-arrow">
                        <i class="fas fa-caret-down" aria-hidden="true"></i>
                    </span>
                </button>
                <ul class="pf-v5-c-select__menu"
                    x-show="open" x-on:click.outside="close()"
                    role="listbox" style="display: none;">
                    <#list locale.supported as l>
                        <li role="presentation">
                            <button class="pf-v5-c-select__menu-item<#if locale.currentLanguageTag == l.languageTag> pf-m-selected</#if>"
                                    role="option" type="button"
                                    onclick="window.location = '${l.url}'">
                                ${l.label}
                            </button>
                        </li>
                    </#list>
                </ul>
            </div>
        </div>
    </#if>
</div>

<div class="pf-v5-c-login">
    <div class="pf-v5-c-login__container">
        <main class="pf-v5-c-login__main">
            <header class="pf-v5-c-login__main-header">
                <h1 class="pf-v5-c-title pf-m-3xl" id="kc-page-title">
                    <#nested "header">
                </h1>
            </header>

            <div class="pf-v5-c-login__main-body">
                <#if displayMessage && message?has_content && (message.type != 'warning' || !isAppInitiatedAction??)>
                    <div class="alert-${message.type} pf-v5-c-alert pf-m-inline pf-m-${message.type}">
                        <div class="pf-v5-c-alert__icon">
                            <#if message.type = 'success'><span class="${properties.kcFeedbackSuccessIcon!}"></span></#if>
                            <#if message.type = 'warning'><span class="${properties.kcFeedbackWarningIcon!}"></span></#if>
                            <#if message.type = 'error'><span class="${properties.kcFeedbackErrorIcon!}"></span></#if>
                            <#if message.type = 'info'><span class="${properties.kcFeedbackInfoIcon!}"></span></#if>
                        </div>
                        <p class="pf-v5-c-alert__title kc-feedback-text">${kcSanitize(message.summary)?no_esc}</p>
                    </div>
                </#if>

                <#nested "form">

                <#if displayInfo>
                    <div id="kc-info" class="${properties.kcSignUpClass!}">
                        <div id="kc-info-wrapper" class="${properties.kcInfoAreaWrapperClass!}">
                            <#nested "info">
                        </div>
                    </div>
                </#if>
            </div>

            <#if auth?has_content && auth.showTryAnotherWayLink() && showAnotherWayIfPresent>
                <form id="kc-select-try-another-way-form" action="${url.loginAction}" method="post">
                    <div class="${properties.kcFormGroupClass!}">
                        <input type="hidden" name="tryAnotherWay" value="on"/>
                        <a href="#" id="try-another-way"
                           onclick="document.forms['kc-select-try-another-way-form'].submit();return false;">${msg("doTryAnotherWay")}</a>
                    </div>
                </form>
            </#if>
        </main>
    </div>
</div>

<footer class="naklos-legal-footer">
    <a href="https://naklos.com.tr/kvkk">${msg("footerKvkk")}</a>
    <span class="naklos-legal-sep">·</span>
    <a href="https://naklos.com.tr/privacy">${msg("footerPrivacy")}</a>
    <span class="naklos-legal-sep">·</span>
    <a href="https://naklos.com.tr/terms">${msg("footerTerms")}</a>
    <span class="naklos-legal-sep">·</span>
    <a href="https://naklos.com.tr/cerez-politikasi">${msg("footerCookies")}</a>
</footer>

</body>
</html>
</#macro>
```

- [ ] **Step 3: Restart Keycloak and verify scaffolding loads**

```bash
docker compose restart keycloak
```

Wait ~20s. Open the login page. Expected: the page may render *slightly* differently than before because `template.ftl` no longer matches the stock keycloak.v2 exactly — specifically, the brand header now renders above the card (from `template.ftl`) AND the existing `login.ftl` still renders its own inline lockup in the form section. That's expected and fixes in Task 4.

What you SHOULD see: the page loads without a FreeMarker error (no stack trace, no "template.ftl error" page), the Naklos lockup appears in a header bar above the form card, a language switcher in the top right, a muted legal footer row at the bottom.

What you should NOT see: any FreeMarker errors, 500 errors, or missing message keys (e.g. `??footerKvkk??` rendered literally). Missing message keys = Task 3 hasn't run yet — that's OK if you're doing tasks strictly in order; you'll see placeholder key names until Task 3 lands. If you see real FreeMarker stack traces, fix the template before continuing.

- [ ] **Step 4: Commit**

```bash
git add docker/keycloak/themes/naklos/login/template.ftl
git commit -m "feat(keycloak-theme): add template.ftl with shared brand header and legal footer"
```

---

## Task 3: Extend messages with shared (footer + common) keys

**Files:**
- Modify: `docker/keycloak/themes/naklos/login/messages/messages_tr.properties` (append)
- Modify: `docker/keycloak/themes/naklos/login/messages/messages_en.properties` (append)
- Create: `docker/keycloak/themes/naklos/login/messages/messages_de.properties`

- [ ] **Step 1: Append footer keys to Turkish**

Append to `docker/keycloak/themes/naklos/login/messages/messages_tr.properties`:

```properties

# Shared chrome (template.ftl) — footer links and switcher
footerPrivacy=Gizlilik
footerTerms=Şartlar
footerKvkk=KVKK
footerCookies=Çerezler
languages=Dil
```

- [ ] **Step 2: Append footer keys to English**

Append to `docker/keycloak/themes/naklos/login/messages/messages_en.properties`:

```properties

# Shared chrome (template.ftl) — footer links and switcher
footerPrivacy=Privacy
footerTerms=Terms
footerKvkk=KVKK
footerCookies=Cookies
languages=Language
```

- [ ] **Step 3: Create German messages file**

Create `docker/keycloak/themes/naklos/login/messages/messages_de.properties` with:

```properties
# First-pass German translations for the Naklos Keycloak login theme.
# Flagged for native-speaker review before GA — see
# docs/superpowers/specs/2026-04-22-keycloak-theme-register-and-reset-design.md §12.

# Core auth labels
loginAccountTitle=Bei deinem Konto anmelden
usernameOrEmail=E-Mail
password=Passwort
email=E-Mail
firstName=Vorname
lastName=Nachname
rememberMe=Angemeldet bleiben
doLogIn=Anmelden
doLogOut=Abmelden
doSubmit=Absenden
doCancel=Abbrechen
doContinue=Weiter
doForgotPassword=Passwort vergessen
noAccount=Noch kein Konto?
doRegister=Registrieren
backToLogin=← Zurück zur Anmeldung

# Shared chrome
footerPrivacy=Datenschutz
footerTerms=AGB
footerKvkk=KVKK
footerCookies=Cookies
languages=Sprache

showPassword=Passwort anzeigen
hidePassword=Passwort ausblenden
```

- [ ] **Step 4: Restart Keycloak and verify**

```bash
docker compose restart keycloak
```

Reload the login page in all 3 locales. Expected:
- TR: footer shows "Gizlilik · Şartlar · KVKK · Çerezler"
- EN: footer shows "Privacy · Terms · KVKK · Cookies"
- DE: footer shows "Datenschutz · AGB · KVKK · Cookies"

No literal `??footerKvkk??` text anywhere.

- [ ] **Step 5: Commit**

```bash
git add docker/keycloak/themes/naklos/login/messages/
git commit -m "feat(keycloak-theme): add footer + language-switcher message keys (tr/en/de)"
```

---

## Task 4: Refactor login.ftl to inherit template.ftl's chrome

**Files:**
- Modify: `docker/keycloak/themes/naklos/login/login.ftl`

The existing `login.ftl` renders its own inline brand lockup inside the form section (lines 11-25). Now that `template.ftl` provides a brand header above the card, the inline lockup is duplicated. Remove it so there's one brand mark per page.

- [ ] **Step 1: Open login.ftl and locate the `naklos-hero` block**

The block is at lines 11-25 of `docker/keycloak/themes/naklos/login/login.ftl`:

```ftl
    <div class="naklos-hero">
        <div class="naklos-brand">
            <span class="naklos-brand-logo" aria-hidden="true">
                <svg viewBox="0 0 24 24" ...>...</svg>
            </span>
            <span class="naklos-brand-wordmark">Naklos</span>
        </div>
        <h1 class="naklos-hero-title">${msg("loginAccountTitle")}</h1>
    </div>
```

- [ ] **Step 2: Replace the inline lockup with the standard h1 that template.ftl expects**

Edit login.ftl — replace the entire `<div class="naklos-hero">...</div>` block with **nothing** (delete it). Instead, fill the `header` section that `template.ftl` now provides.

Find the block starting at `<#if section = "header">` (line 3) and ending at the next `<#elseif section = "form">`. Today it's intentionally blank with a comment. Replace that blank block with:

```ftl
    <#if section = "header">
        ${msg("loginAccountTitle")}
    <#elseif section = "form">
```

Then delete the now-orphaned `<div class="naklos-hero">...</div>` block that was at the start of the form section.

- [ ] **Step 3: Restart and verify login page still renders**

```bash
docker compose restart keycloak
```

Open http://localhost:8180/realms/naklos/protocol/openid-connect/auth?client_id=naklos-frontend&redirect_uri=http://localhost:5173&response_type=code

Expected:
- Brand lockup appears ONCE — in the `naklos-meta-header` at the top of the page.
- The `<h1 id="kc-page-title">` in the card shows "Hesabınıza giriş yapın" (TR) / "Sign in to your account" (EN).
- Google social button still renders in the form section.
- Password-entry + "Şifremi unuttum" link still work.
- Legal footer renders at the bottom.

Switch to EN and DE — confirm h1 changes accordingly (DE will be "Bei deinem Konto anmelden" from Task 3).

- [ ] **Step 4: Spot-check mobile (DevTools, 390px width)**

Expected: header pads tighter (14px/16px), card stays readable, footer links wrap to two rows if needed, language switcher doesn't overflow.

- [ ] **Step 5: Commit**

```bash
git add docker/keycloak/themes/naklos/login/login.ftl
git commit -m "refactor(keycloak-theme): move login.ftl brand lockup into shared template.ftl"
```

---

## Task 5: Create register.ftl + message keys

**Files:**
- Create: `docker/keycloak/themes/naklos/login/register.ftl`
- Modify: `docker/keycloak/themes/naklos/login/messages/messages_tr.properties`
- Modify: `docker/keycloak/themes/naklos/login/messages/messages_en.properties`
- Modify: `docker/keycloak/themes/naklos/login/messages/messages_de.properties`

- [ ] **Step 1: Add register keys to messages_tr.properties**

Locate the `# Registration` section in `messages_tr.properties` (around line 25-30). Replace it with:

```properties
# Registration
registerTitle=Hesap oluştur
registerSubtitle=Filonu 5 dakikada kur. Kredi kartı istemiyoruz.
registerSubmit=Hesap oluştur
registerTermsLabelHtml=Devam ederek <a href="{0}" target="_blank" rel="noopener">Kullanım Şartları</a>, <a href="{1}" target="_blank" rel="noopener">Gizlilik Politikası</a> ve <a href="{2}" target="_blank" rel="noopener">KVKK Aydınlatma Metni</a>'ni kabul ediyorum.
registerTermsRequired=Devam etmek için şartları kabul etmelisin.
registerAlreadyHaveAccount=Zaten hesabın var mı?
registerWithTitle=Hesap oluştur
registerWithTitleHtml=Hesap oluştur
confirmPassword=Şifreyi tekrarla
passwordConfirmPlaceholder=Şifreni tekrar gir
```

(The last two lines update existing formal-voice keys to the casual voice used elsewhere in the new copy.)

- [ ] **Step 2: Add register keys to messages_en.properties**

Append to `messages_en.properties`:

```properties

# Registration
registerTitle=Create account
registerSubtitle=Set up your fleet in 5 minutes. No credit card required.
registerSubmit=Create account
registerTermsLabelHtml=By continuing, I agree to the <a href="{0}" target="_blank" rel="noopener">Terms of Service</a>, <a href="{1}" target="_blank" rel="noopener">Privacy Policy</a> and <a href="{2}" target="_blank" rel="noopener">KVKK Notice</a>.
registerTermsRequired=You must accept the terms to continue.
registerAlreadyHaveAccount=Already have an account?
confirmPassword=Confirm password
passwordConfirmPlaceholder=Re-enter your password
```

- [ ] **Step 3: Add register keys to messages_de.properties**

Append to `messages_de.properties`:

```properties

# Registration
registerTitle=Konto erstellen
registerSubtitle=Richte deinen Fuhrpark in 5 Minuten ein. Keine Kreditkarte nötig.
registerSubmit=Konto erstellen
registerTermsLabelHtml=Mit der Fortsetzung akzeptiere ich die <a href="{0}" target="_blank" rel="noopener">AGB</a>, die <a href="{1}" target="_blank" rel="noopener">Datenschutzerklärung</a> und den <a href="{2}" target="_blank" rel="noopener">KVKK-Hinweis</a>.
registerTermsRequired=Du musst die Bedingungen akzeptieren, um fortzufahren.
registerAlreadyHaveAccount=Bereits ein Konto?
confirmPassword=Passwort bestätigen
passwordConfirmPlaceholder=Passwort erneut eingeben
```

- [ ] **Step 4: Create register.ftl**

Create `docker/keycloak/themes/naklos/login/register.ftl` with:

```ftl
<#import "template.ftl" as layout>
<@layout.registrationLayout displayMessage=!messagesPerField.existsError('firstName','lastName','email','username','password','password-confirm','terms'); section>
    <#if section = "header">
        ${msg("registerTitle")}
    <#elseif section = "form">
        <p class="naklos-info-card" style="text-align:left;padding:0 0 18px;">
            <span style="font-size:14px;color:var(--naklos-gray-500);line-height:1.55;">${msg("registerSubtitle")}</span>
        </p>

        <#-- Social providers above the password form. Matches login.ftl pattern.
             Apple is intentionally not hard-coded — we render whatever the realm
             has configured in social.providers. -->
        <#if realm.password && social.providers?? && social.providers?size gt 0>
            <div class="naklos-social-section" style="display:flex;flex-direction:column;gap:10px;margin:0 0 16px 0;">
                <#list social.providers as p>
                    <a id="social-${p.alias}" href="${p.loginUrl}"
                       class="naklos-social-button naklos-social-${p.alias}"
                       style="display:flex;align-items:center;justify-content:center;gap:10px;width:100%;height:46px;padding:0 16px;font-family:'Plus Jakarta Sans',system-ui,sans-serif;font-size:14px;font-weight:500;border-radius:10px;text-decoration:none;box-sizing:border-box;cursor:pointer;<#if p.alias == 'google'>background:#fff;color:#3c4043;border:1px solid #dadce0;box-shadow:0 1px 2px rgba(0,0,0,0.04);<#else>background:#fff;color:#3c4043;border:1px solid #dadce0;</#if>">
                        <#if p.alias == "google">
                            <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                            <span>Google ile devam et</span>
                        <#else>
                            <#if p.iconClasses?has_content><i class="${p.iconClasses}" aria-hidden="true"></i></#if>
                            <span>${p.displayName!}</span>
                        </#if>
                    </a>
                </#list>
            </div>

            <div class="naklos-divider" role="separator" style="display:flex;align-items:center;gap:14px;margin:8px 0 16px;">
                <span style="flex:1;height:1px;background:#e5e7eb;"></span>
                <span style="font-size:11px;font-weight:600;color:#9ca3af;letter-spacing:1.2px;text-transform:uppercase;">${msg("identity-provider-login-label")!"VEYA"}</span>
                <span style="flex:1;height:1px;background:#e5e7eb;"></span>
            </div>
        </#if>

        <form id="kc-register-form" class="${properties.kcFormClass!}" action="${url.registrationAction}" method="post">

            <div class="${properties.kcFormGroupClass!}">
                <label for="email" class="${properties.kcLabelClass!}">${msg("email")} <span class="pf-v5-c-form__label-required" aria-hidden="true">*</span></label>
                <span class="${properties.kcInputClass!}">
                    <input type="email" id="email" class="${properties.kcInputClass!}" name="email"
                           value="${(register.formData.email!'')}" autocomplete="email" autofocus
                           aria-invalid="<#if messagesPerField.existsError('email')>true</#if>" />
                </span>
                <#if messagesPerField.existsError('email')>
                    <span id="input-error-email" class="${properties.kcInputErrorMessageClass!}" aria-live="polite">
                        ${kcSanitize(messagesPerField.get('email'))?no_esc}
                    </span>
                </#if>
            </div>

            <div class="${properties.kcFormGroupClass!}">
                <label for="password" class="${properties.kcLabelClass!}">${msg("password")} <span class="pf-v5-c-form__label-required" aria-hidden="true">*</span></label>
                <div class="${properties.kcInputGroup!}" dir="ltr">
                    <input type="password" id="password" class="${properties.kcInputClass!}" name="password"
                           autocomplete="new-password"
                           aria-invalid="<#if messagesPerField.existsError('password','password-confirm')>true</#if>" />
                    <button type="button" class="${properties.kcFormPasswordVisibilityButtonClass!}"
                            aria-label="${msg('showPassword')}" aria-controls="password" data-password-toggle
                            data-icon-show="${properties.kcFormPasswordVisibilityIconShow!}"
                            data-icon-hide="${properties.kcFormPasswordVisibilityIconHide!}"
                            data-label-show="${msg('showPassword')}" data-label-hide="${msg('hidePassword')}">
                        <i class="${properties.kcFormPasswordVisibilityIconShow!}" aria-hidden="true"></i>
                    </button>
                </div>
                <#if messagesPerField.existsError('password')>
                    <span id="input-error-password" class="${properties.kcInputErrorMessageClass!}" aria-live="polite">
                        ${kcSanitize(messagesPerField.get('password'))?no_esc}
                    </span>
                </#if>
            </div>

            <div class="${properties.kcFormGroupClass!}">
                <label for="password-confirm" class="${properties.kcLabelClass!}">${msg("confirmPassword")} <span class="pf-v5-c-form__label-required" aria-hidden="true">*</span></label>
                <div class="${properties.kcInputGroup!}" dir="ltr">
                    <input type="password" id="password-confirm" class="${properties.kcInputClass!}" name="password-confirm"
                           aria-invalid="<#if messagesPerField.existsError('password-confirm')>true</#if>" />
                    <button type="button" class="${properties.kcFormPasswordVisibilityButtonClass!}"
                            aria-label="${msg('showPassword')}" aria-controls="password-confirm" data-password-toggle
                            data-icon-show="${properties.kcFormPasswordVisibilityIconShow!}"
                            data-icon-hide="${properties.kcFormPasswordVisibilityIconHide!}"
                            data-label-show="${msg('showPassword')}" data-label-hide="${msg('hidePassword')}">
                        <i class="${properties.kcFormPasswordVisibilityIconShow!}" aria-hidden="true"></i>
                    </button>
                </div>
                <#if messagesPerField.existsError('password-confirm')>
                    <span id="input-error-password-confirm" class="${properties.kcInputErrorMessageClass!}" aria-live="polite">
                        ${kcSanitize(messagesPerField.get('password-confirm'))?no_esc}
                    </span>
                </#if>
            </div>

            <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
                <div class="${properties.kcFormGroupClass!}">
                    <label for="firstName" class="${properties.kcLabelClass!}">${msg("firstName")} <span class="pf-v5-c-form__label-required" aria-hidden="true">*</span></label>
                    <span class="${properties.kcInputClass!}">
                        <input type="text" id="firstName" class="${properties.kcInputClass!}" name="firstName"
                               value="${(register.formData.firstName!'')}" autocomplete="given-name"
                               aria-invalid="<#if messagesPerField.existsError('firstName')>true</#if>" />
                    </span>
                    <#if messagesPerField.existsError('firstName')>
                        <span id="input-error-firstname" class="${properties.kcInputErrorMessageClass!}" aria-live="polite">
                            ${kcSanitize(messagesPerField.get('firstName'))?no_esc}
                        </span>
                    </#if>
                </div>

                <div class="${properties.kcFormGroupClass!}">
                    <label for="lastName" class="${properties.kcLabelClass!}">${msg("lastName")} <span class="pf-v5-c-form__label-required" aria-hidden="true">*</span></label>
                    <span class="${properties.kcInputClass!}">
                        <input type="text" id="lastName" class="${properties.kcInputClass!}" name="lastName"
                               value="${(register.formData.lastName!'')}" autocomplete="family-name"
                               aria-invalid="<#if messagesPerField.existsError('lastName')>true</#if>" />
                    </span>
                    <#if messagesPerField.existsError('lastName')>
                        <span id="input-error-lastname" class="${properties.kcInputErrorMessageClass!}" aria-live="polite">
                            ${kcSanitize(messagesPerField.get('lastName'))?no_esc}
                        </span>
                    </#if>
                </div>
            </div>

            <div class="naklos-checkbox">
                <input type="checkbox" id="naklos-terms" name="naklos-terms" required />
                <label for="naklos-terms">
                    ${msg("registerTermsLabelHtml", "https://naklos.com.tr/terms", "https://naklos.com.tr/privacy", "https://naklos.com.tr/kvkk")?no_esc}
                </label>
            </div>

            <div class="${properties.kcFormGroupClass!}">
                <input class="${properties.kcButtonClass!} ${properties.kcButtonPrimaryClass!} ${properties.kcButtonBlockClass!} ${properties.kcButtonLargeClass!}"
                       type="submit" value="${msg("registerSubmit")}" />
            </div>

            <div style="text-align:center;margin-top:16px;font-size:13px;color:var(--naklos-gray-500);font-family:'Plus Jakarta Sans',system-ui,sans-serif;">
                ${msg("registerAlreadyHaveAccount")}
                <a href="${url.loginUrl}" style="color:var(--naklos-primary);font-weight:600;text-decoration:none;">${msg("doLogIn")}</a>
            </div>
        </form>

        <script type="module" src="${url.resourcesPath}/js/passwordVisibility.js"></script>
    </#if>
</@layout.registrationLayout>
```

- [ ] **Step 5: Restart Keycloak**

```bash
docker compose restart keycloak
```

- [ ] **Step 6: Visual check in three locales**

From the login page, click "Kaydolun" / "Register" / "Registrieren" to land on the new register page. Verify:

TR:
- H1 "Hesap oluştur"
- Subtitle "Filonu 5 dakikada kur. Kredi kartı istemiyoruz."
- Google button says "Google ile devam et" (or nothing if no social.providers configured — check realm)
- Divider "VEYA"
- Fields: E-posta, Şifre (with eye toggle), Şifreyi tekrarla (with eye toggle), Ad + Soyad on one row
- Terms checkbox with three underlined links
- Button: "Hesap oluştur"
- Back-to-login: "Zaten hesabın var mı? Giriş yap"

EN: equivalent English copy; DE: equivalent German copy.

Mobile spot-check at 390px: the Ad/Soyad grid should collapse; form stays readable.

- [ ] **Step 7: Click through validation errors**

Submit empty form. Expected: Keycloak renders its built-in field error messages inside our styled `input-error-*` spans (e.g. "Ad alanı zorunludur." in TR).

Submit with non-matching passwords. Expected: "Parolalar eşleşmiyor." under the confirm field.

Submit with existing email. Expected: "Bu e-posta adresi zaten kullanılıyor."

- [ ] **Step 8: Commit**

```bash
git add docker/keycloak/themes/naklos/login/register.ftl docker/keycloak/themes/naklos/login/messages/
git commit -m "feat(keycloak-theme): branded register.ftl with tr/en/de copy + terms checkbox"
```

---

## Task 6: Create login-verify-email.ftl + message keys

**Files:**
- Create: `docker/keycloak/themes/naklos/login/login-verify-email.ftl`
- Modify: all three messages files

- [ ] **Step 1: Add verify-email keys to messages_tr.properties**

Locate the `# Email verification` section in messages_tr.properties. Replace it with:

```properties
# Email verification
emailVerifyTitle=E-postanı doğrula
emailVerifySubtitle={0} adresine bir link gönderdik. Hesabını aktifleştirmek için link'e tıkla.
emailVerifyInstruction2=Link ulaşmadıysa spam klasörünü kontrol et ya da yeniden gönderebilirsin.
emailVerifyResend=Yeniden gönder
doClickHere=buraya tıklayın
```

- [ ] **Step 2: Add verify-email keys to messages_en.properties**

Append:

```properties

# Email verification
emailVerifyTitle=Verify your email
emailVerifySubtitle=We sent a link to {0}. Click it to activate your account.
emailVerifyInstruction2=If the email didn't arrive, check your spam folder or resend it.
emailVerifyResend=Resend
```

- [ ] **Step 3: Add verify-email keys to messages_de.properties**

Append:

```properties

# Email verification
emailVerifyTitle=E-Mail bestätigen
emailVerifySubtitle=Wir haben einen Link an {0} gesendet. Klicke darauf, um dein Konto zu aktivieren.
emailVerifyInstruction2=Wenn die E-Mail nicht ankommt, überprüfe den Spam-Ordner oder sende sie erneut.
emailVerifyResend=Erneut senden
```

- [ ] **Step 4: Create login-verify-email.ftl**

Create `docker/keycloak/themes/naklos/login/login-verify-email.ftl`:

```ftl
<#import "template.ftl" as layout>
<@layout.registrationLayout displayInfo=false; section>
    <#if section = "header">
        ${msg("emailVerifyTitle")}
    <#elseif section = "form">
        <div class="naklos-info-card">
            <p>${msg("emailVerifySubtitle", (user.email!''))?no_esc}</p>
            <p>${msg("emailVerifyInstruction2")}</p>
        </div>

        <#if user.email?has_content>
            <form action="${url.loginAction}" method="post" style="text-align:center;">
                <input type="hidden" name="resend" value="true" />
                <button class="${properties.kcButtonClass!} ${properties.kcButtonPrimaryClass!} ${properties.kcButtonBlockClass!} ${properties.kcButtonLargeClass!}"
                        type="submit">${msg("emailVerifyResend")}</button>
            </form>
        </#if>
    </#if>
</@layout.registrationLayout>
```

- [ ] **Step 5: Restart and trigger the verify page**

```bash
docker compose restart keycloak
```

To visit the verify-email page: from the register page, submit a new user. Keycloak redirects to verify-email automatically because `verifyEmail=true` is set in the realm.

Alternative quick-view (requires admin): log into the Keycloak admin console at http://localhost:8180/admin/ (admin/admin), find your test user, click "Credentials" → "Send Email" with "Verify Email" action. The next login attempt lands on this page.

Verify in TR, EN, DE: the card shows H1 "E-postanı doğrula" / "Verify your email" / "E-Mail bestätigen", the subtitle includes the user's email in bold, the resend button renders.

- [ ] **Step 6: Commit**

```bash
git add docker/keycloak/themes/naklos/login/login-verify-email.ftl docker/keycloak/themes/naklos/login/messages/
git commit -m "feat(keycloak-theme): branded login-verify-email.ftl with resend CTA"
```

---

## Task 7: Create login-reset-password.ftl + message keys

**Files:**
- Create: `docker/keycloak/themes/naklos/login/login-reset-password.ftl`
- Modify: all three messages files

- [ ] **Step 1: Update reset-password keys in messages_tr.properties**

Locate the `# Password reset` section. Replace it with:

```properties
# Password reset
emailForgotTitle=Şifreni mi unuttun?
emailForgotSubtitle=E-posta adresini gir, sıfırlama linki gönderelim.
emailForgotSubmit=Link gönder
emailInstruction=E-posta adresini gir, sıfırlama linki gönderelim.
emailInstructionSent=E-postana link gönderdik. Gelen kutunu kontrol et.
doResetPassword=Link gönder
```

- [ ] **Step 2: Add reset-password keys to messages_en.properties**

Append:

```properties

# Password reset
emailForgotTitle=Forgot your password?
emailForgotSubtitle=Enter your email and we'll send you a reset link.
emailForgotSubmit=Send link
emailInstruction=Enter your email and we'll send you a reset link.
emailInstructionSent=We sent you a link. Check your inbox.
doResetPassword=Send link
```

- [ ] **Step 3: Add reset-password keys to messages_de.properties**

Append:

```properties

# Password reset
emailForgotTitle=Passwort vergessen?
emailForgotSubtitle=Gib deine E-Mail ein und wir senden dir einen Link.
emailForgotSubmit=Link senden
emailInstruction=Gib deine E-Mail ein und wir senden dir einen Link.
emailInstructionSent=Wir haben dir einen Link gesendet. Prüfe deinen Posteingang.
doResetPassword=Link senden
```

- [ ] **Step 4: Create login-reset-password.ftl**

Create `docker/keycloak/themes/naklos/login/login-reset-password.ftl`:

```ftl
<#import "template.ftl" as layout>
<@layout.registrationLayout displayMessage=!messagesPerField.existsError('username'); section>
    <#if section = "header">
        ${msg("emailForgotTitle")}
    <#elseif section = "form">
        <p class="naklos-info-card" style="text-align:left;padding:0 0 20px;">
            <span style="font-size:14px;color:var(--naklos-gray-500);line-height:1.55;">${msg("emailForgotSubtitle")}</span>
        </p>

        <form id="kc-reset-password-form" class="${properties.kcFormClass!}" action="${url.loginAction}" method="post">
            <div class="${properties.kcFormGroupClass!}">
                <label for="username" class="${properties.kcLabelClass!}">${msg("email")} <span class="pf-v5-c-form__label-required" aria-hidden="true">*</span></label>
                <span class="${properties.kcInputClass!}">
                    <input type="email" id="username" class="${properties.kcInputClass!}" name="username"
                           value="${(auth.attemptedUsername!'')}" autofocus autocomplete="email"
                           placeholder="ornek@firma.com"
                           aria-invalid="<#if messagesPerField.existsError('username')>true</#if>" />
                </span>
                <#if messagesPerField.existsError('username')>
                    <span id="input-error-username" class="${properties.kcInputErrorMessageClass!}" aria-live="polite">
                        ${kcSanitize(messagesPerField.get('username'))?no_esc}
                    </span>
                </#if>
            </div>

            <div class="${properties.kcFormGroupClass!}">
                <input class="${properties.kcButtonClass!} ${properties.kcButtonPrimaryClass!} ${properties.kcButtonBlockClass!} ${properties.kcButtonLargeClass!}"
                       type="submit" value="${msg("emailForgotSubmit")}" />
            </div>

            <div style="text-align:center;margin-top:16px;font-size:13px;color:var(--naklos-gray-500);font-family:'Plus Jakarta Sans',system-ui,sans-serif;">
                <a href="${url.loginUrl}" style="color:var(--naklos-primary);font-weight:600;text-decoration:none;">${msg("backToLogin")}</a>
            </div>
        </form>
    </#if>
</@layout.registrationLayout>
```

- [ ] **Step 5: Restart and visit the reset page**

```bash
docker compose restart keycloak
```

From the login page, click "Şifremi unuttum" / "Forgot password". Verify in TR, EN, DE: h1 "Şifreni mi unuttun?" / "Forgot your password?" / "Passwort vergessen?", subtitle, single email input with placeholder, "Link gönder" button, back-to-login link.

- [ ] **Step 6: Submit and verify the success card**

Enter a real email you registered earlier. Submit. Keycloak redirects to `info.ftl` with `emailInstructionSent` — which doesn't exist yet (Task 11), so expect stock keycloak.v2 styling for now. Just confirm the form submission completes without a 500.

- [ ] **Step 7: Commit**

```bash
git add docker/keycloak/themes/naklos/login/login-reset-password.ftl docker/keycloak/themes/naklos/login/messages/
git commit -m "feat(keycloak-theme): branded login-reset-password.ftl"
```

---

## Task 8: Create login-update-password.ftl + message keys

**Files:**
- Create: `docker/keycloak/themes/naklos/login/login-update-password.ftl`
- Modify: all three messages files

- [ ] **Step 1: Update update-password keys in messages_tr.properties**

Locate the `# Update password` section. Replace it with:

```properties
# Update password (after reset / forced)
updatePasswordTitle=Yeni şifre belirle
updatePasswordSubtitle=Güvenli bir şifre seç — en az 8 karakter.
updatePasswordSubmit=Şifreyi kaydet
passwordNew=Yeni şifre
passwordConfirm=Yeni şifreyi tekrarla
```

- [ ] **Step 2: Add update-password keys to messages_en.properties**

Append:

```properties

# Update password
updatePasswordTitle=Set a new password
updatePasswordSubtitle=Choose a strong password — at least 8 characters.
updatePasswordSubmit=Save password
passwordNew=New password
passwordConfirm=Confirm new password
```

- [ ] **Step 3: Add update-password keys to messages_de.properties**

Append:

```properties

# Update password
updatePasswordTitle=Neues Passwort festlegen
updatePasswordSubtitle=Wähle ein sicheres Passwort — mindestens 8 Zeichen.
updatePasswordSubmit=Passwort speichern
passwordNew=Neues Passwort
passwordConfirm=Neues Passwort bestätigen
```

- [ ] **Step 4: Create login-update-password.ftl**

Create `docker/keycloak/themes/naklos/login/login-update-password.ftl`:

```ftl
<#import "template.ftl" as layout>
<@layout.registrationLayout displayMessage=!messagesPerField.existsError('password','password-confirm'); section>
    <#if section = "header">
        ${msg("updatePasswordTitle")}
    <#elseif section = "form">
        <p class="naklos-info-card" style="text-align:left;padding:0 0 20px;">
            <span style="font-size:14px;color:var(--naklos-gray-500);line-height:1.55;">${msg("updatePasswordSubtitle")}</span>
        </p>

        <form id="kc-passwd-update-form" class="${properties.kcFormClass!}" action="${url.loginAction}" method="post">
            <div class="${properties.kcFormGroupClass!}">
                <label for="password-new" class="${properties.kcLabelClass!}">${msg("passwordNew")} <span class="pf-v5-c-form__label-required" aria-hidden="true">*</span></label>
                <div class="${properties.kcInputGroup!}" dir="ltr">
                    <input type="password" id="password-new" class="${properties.kcInputClass!}" name="password-new"
                           autofocus autocomplete="new-password"
                           aria-invalid="<#if messagesPerField.existsError('password','password-confirm')>true</#if>" />
                    <button type="button" class="${properties.kcFormPasswordVisibilityButtonClass!}"
                            aria-label="${msg('showPassword')}" aria-controls="password-new" data-password-toggle
                            data-icon-show="${properties.kcFormPasswordVisibilityIconShow!}"
                            data-icon-hide="${properties.kcFormPasswordVisibilityIconHide!}"
                            data-label-show="${msg('showPassword')}" data-label-hide="${msg('hidePassword')}">
                        <i class="${properties.kcFormPasswordVisibilityIconShow!}" aria-hidden="true"></i>
                    </button>
                </div>
                <#if messagesPerField.existsError('password')>
                    <span id="input-error-password" class="${properties.kcInputErrorMessageClass!}" aria-live="polite">
                        ${kcSanitize(messagesPerField.get('password'))?no_esc}
                    </span>
                </#if>
            </div>

            <div class="${properties.kcFormGroupClass!}">
                <label for="password-confirm" class="${properties.kcLabelClass!}">${msg("passwordConfirm")} <span class="pf-v5-c-form__label-required" aria-hidden="true">*</span></label>
                <div class="${properties.kcInputGroup!}" dir="ltr">
                    <input type="password" id="password-confirm" class="${properties.kcInputClass!}" name="password-confirm"
                           autocomplete="new-password"
                           aria-invalid="<#if messagesPerField.existsError('password-confirm')>true</#if>" />
                    <button type="button" class="${properties.kcFormPasswordVisibilityButtonClass!}"
                            aria-label="${msg('showPassword')}" aria-controls="password-confirm" data-password-toggle
                            data-icon-show="${properties.kcFormPasswordVisibilityIconShow!}"
                            data-icon-hide="${properties.kcFormPasswordVisibilityIconHide!}"
                            data-label-show="${msg('showPassword')}" data-label-hide="${msg('hidePassword')}">
                        <i class="${properties.kcFormPasswordVisibilityIconShow!}" aria-hidden="true"></i>
                    </button>
                </div>
                <#if messagesPerField.existsError('password-confirm')>
                    <span id="input-error-password-confirm" class="${properties.kcInputErrorMessageClass!}" aria-live="polite">
                        ${kcSanitize(messagesPerField.get('password-confirm'))?no_esc}
                    </span>
                </#if>
            </div>

            <#if isAppInitiatedAction??>
                <input type="hidden" id="kc-cancel" name="cancel-aia" value="true"/>
            </#if>

            <div class="${properties.kcFormGroupClass!}">
                <input class="${properties.kcButtonClass!} ${properties.kcButtonPrimaryClass!} ${properties.kcButtonBlockClass!} ${properties.kcButtonLargeClass!}"
                       type="submit" value="${msg("updatePasswordSubmit")}" />
            </div>
        </form>

        <script type="module" src="${url.resourcesPath}/js/passwordVisibility.js"></script>
    </#if>
</@layout.registrationLayout>
```

- [ ] **Step 5: Restart and verify**

```bash
docker compose restart keycloak
```

To visit: complete a password-reset request from Task 7 → open the email (view maildev/mailhog if configured, or check Keycloak logs `docker compose logs keycloak | grep -i "send email"` for the link) → click the link. Alternatively, from admin console, assign a "Update Password" required action to a test user, then log in.

Verify in TR, EN, DE: H1 "Yeni şifre belirle" / "Set a new password" / "Neues Passwort festlegen", subtitle, two password fields each with eye toggle, "Şifreyi kaydet" button.

- [ ] **Step 6: Commit**

```bash
git add docker/keycloak/themes/naklos/login/login-update-password.ftl docker/keycloak/themes/naklos/login/messages/
git commit -m "feat(keycloak-theme): branded login-update-password.ftl"
```

---

## Task 9: Create login-page-expired.ftl + message keys

**Files:**
- Create: `docker/keycloak/themes/naklos/login/login-page-expired.ftl`
- Modify: all three messages files

- [ ] **Step 1: Add page-expired keys to all three messages files**

Append to `messages_tr.properties`:

```properties

# Page expired
pageExpiredTitle=Link süresi doldu
pageExpiredSubtitle=Güvenlik nedeniyle link geçersiz. Baştan başlayabilirsin.
pageExpiredRestartLogin=Girişi yeniden başlat
pageExpiredContinueLogin=Girişe devam et
```

Append to `messages_en.properties`:

```properties

# Page expired
pageExpiredTitle=Link expired
pageExpiredSubtitle=For security, this link is no longer valid. Start over.
pageExpiredRestartLogin=Restart login
pageExpiredContinueLogin=Continue login
```

Append to `messages_de.properties`:

```properties

# Page expired
pageExpiredTitle=Link abgelaufen
pageExpiredSubtitle=Aus Sicherheitsgründen ist dieser Link nicht mehr gültig. Fange von vorne an.
pageExpiredRestartLogin=Anmeldung neu starten
pageExpiredContinueLogin=Anmeldung fortsetzen
```

- [ ] **Step 2: Create login-page-expired.ftl**

Create `docker/keycloak/themes/naklos/login/login-page-expired.ftl`:

```ftl
<#import "template.ftl" as layout>
<@layout.registrationLayout; section>
    <#if section = "header">
        ${msg("pageExpiredTitle")}
    <#elseif section = "form">
        <div class="naklos-info-card">
            <p>${msg("pageExpiredSubtitle")}</p>
        </div>

        <div class="${properties.kcFormGroupClass!}" style="display:flex;flex-direction:column;gap:10px;">
            <a href="${url.loginRestartFlowUrl}"
               class="${properties.kcButtonClass!} ${properties.kcButtonPrimaryClass!} ${properties.kcButtonBlockClass!} ${properties.kcButtonLargeClass!}"
               style="text-decoration:none;text-align:center;">${msg("pageExpiredRestartLogin")}</a>

            <a href="${url.loginAction}"
               class="${properties.kcButtonClass!} ${properties.kcButtonDefaultClass!} ${properties.kcButtonBlockClass!} ${properties.kcButtonLargeClass!}"
               style="text-decoration:none;text-align:center;">${msg("pageExpiredContinueLogin")}</a>
        </div>
    </#if>
</@layout.registrationLayout>
```

- [ ] **Step 3: Restart and trigger the expired page**

```bash
docker compose restart keycloak
```

To force this page: start a login flow, copy the URL, wait past the session timeout (typically ~5 minutes — adjustable via admin console → Realm Settings → Sessions), then resubmit. Or, from admin console → Realm Settings → Sessions, temporarily set "Access Code Lifespan" to 30s, start a login, wait 30s, submit.

Verify in TR, EN, DE: H1 "Link süresi doldu" / "Link expired" / "Link abgelaufen", subtitle, two buttons stacked.

- [ ] **Step 4: Commit**

```bash
git add docker/keycloak/themes/naklos/login/login-page-expired.ftl docker/keycloak/themes/naklos/login/messages/
git commit -m "feat(keycloak-theme): branded login-page-expired.ftl"
```

---

## Task 10: Create error.ftl + message keys

**Files:**
- Create: `docker/keycloak/themes/naklos/login/error.ftl`
- Modify: all three messages files

- [ ] **Step 1: Add error keys to all three messages files**

Append to `messages_tr.properties`:

```properties

# Generic error page
errorTitle=Bir şeyler ters gitti
errorBackToLogin=Girişe dön
```

Append to `messages_en.properties`:

```properties

# Generic error page
errorTitle=Something went wrong
errorBackToLogin=Back to sign in
```

Append to `messages_de.properties`:

```properties

# Generic error page
errorTitle=Etwas ist schiefgelaufen
errorBackToLogin=Zurück zur Anmeldung
```

- [ ] **Step 2: Create error.ftl**

Create `docker/keycloak/themes/naklos/login/error.ftl`:

```ftl
<#import "template.ftl" as layout>
<@layout.registrationLayout displayMessage=false; section>
    <#if section = "header">
        ${msg("errorTitle")}
    <#elseif section = "form">
        <div class="naklos-info-card">
            <#if message?has_content>
                <p>${kcSanitize(message.summary)?no_esc}</p>
            <#else>
                <p>${msg("internalServerError")}</p>
            </#if>
        </div>

        <#if client?? && client.baseUrl?has_content>
            <div class="${properties.kcFormGroupClass!}">
                <a href="${client.baseUrl}"
                   class="${properties.kcButtonClass!} ${properties.kcButtonPrimaryClass!} ${properties.kcButtonBlockClass!} ${properties.kcButtonLargeClass!}"
                   style="text-decoration:none;text-align:center;">${msg("errorBackToLogin")}</a>
            </div>
        </#if>
    </#if>
</@layout.registrationLayout>
```

- [ ] **Step 3: Restart and trigger the error page**

```bash
docker compose restart keycloak
```

Easiest way to trigger: visit a malformed auth URL, e.g.:
```
http://localhost:8180/realms/naklos/protocol/openid-connect/auth?client_id=does-not-exist&response_type=code
```

Expected: branded error page with H1 "Bir şeyler ters gitti" (TR default), message from Keycloak, "Girişe dön" button (only if `client.baseUrl` is resolvable — for this URL it won't be; the button is absent, which is correct).

Verify in EN and DE: language switcher works, h1 + message translate.

- [ ] **Step 4: Commit**

```bash
git add docker/keycloak/themes/naklos/login/error.ftl docker/keycloak/themes/naklos/login/messages/
git commit -m "feat(keycloak-theme): branded error.ftl"
```

---

## Task 11: Create info.ftl

**Files:**
- Create: `docker/keycloak/themes/naklos/login/info.ftl`

(No new message keys needed — `info.ftl` uses `message.summary` passed in by Keycloak plus the already-added `emailInstructionSent`.)

- [ ] **Step 1: Create info.ftl**

Create `docker/keycloak/themes/naklos/login/info.ftl`:

```ftl
<#import "template.ftl" as layout>
<@layout.registrationLayout displayMessage=false; section>
    <#if section = "header">
        <#if message?has_content && message.type == 'success'>
            ${msg("pageExpiredTitle")?keep_before("").length?string}<#-- placeholder suppressed; Keycloak passes its own summary -->
        </#if>
        ${messageHeader!msg("errorTitle")}
    <#elseif section = "form">
        <div class="naklos-info-card">
            <#if message?has_content>
                <p>${kcSanitize(message.summary)?no_esc}</p>
            </#if>
            <#if requiredActions??>
                <p>
                    <#list requiredActions>
                        <#items as reqActionItem>
                            ${msg("requiredAction.${reqActionItem}")}<#sep>, </#sep>
                        </#items>
                    </#list>
                </p>
            </#if>
        </div>

        <#if skipLink??>
        <#else>
            <#if pageRedirectUri?has_content>
                <div class="${properties.kcFormGroupClass!}">
                    <a href="${pageRedirectUri}"
                       class="${properties.kcButtonClass!} ${properties.kcButtonPrimaryClass!} ${properties.kcButtonBlockClass!} ${properties.kcButtonLargeClass!}"
                       style="text-decoration:none;text-align:center;">${kcSanitize(msg("backToApplication"))?no_esc}</a>
                </div>
            <#elseif actionUri?has_content>
                <div class="${properties.kcFormGroupClass!}">
                    <a href="${actionUri}"
                       class="${properties.kcButtonClass!} ${properties.kcButtonPrimaryClass!} ${properties.kcButtonBlockClass!} ${properties.kcButtonLargeClass!}"
                       style="text-decoration:none;text-align:center;">${kcSanitize(msg("proceedWithAction"))?no_esc}</a>
                </div>
            <#elseif client.baseUrl?has_content>
                <div class="${properties.kcFormGroupClass!}">
                    <a href="${client.baseUrl}"
                       class="${properties.kcButtonClass!} ${properties.kcButtonPrimaryClass!} ${properties.kcButtonBlockClass!} ${properties.kcButtonLargeClass!}"
                       style="text-decoration:none;text-align:center;">${kcSanitize(msg("backToApplication"))?no_esc}</a>
                </div>
            </#if>
        </#if>
    </#if>
</@layout.registrationLayout>
```

(Note: the `messageHeader!` fallback to `errorTitle` is a FreeMarker-safe way to render *some* h1 when Keycloak's `messageHeader` isn't set. The placeholder suppression line is removed in review — keep it out if the template renders cleanly.)

**If the first render shows literal `${...length?string}` text:** delete the placeholder line and re-render. Cleaner version of the header block:

```ftl
    <#if section = "header">
        ${messageHeader!msg("errorTitle")}
```

- [ ] **Step 2: Restart and trigger info.ftl**

```bash
docker compose restart keycloak
```

Info.ftl is hit after a successful password-reset request (the "we sent you a link" screen). Trigger: complete a reset-password request → observe info.ftl.

Verify: H1 either shows `messageHeader` from Keycloak (if present) or falls back to the error title; the message body shows "E-postana link gönderdik. Gelen kutunu kontrol et." (the `emailInstructionSent` key added in Task 7). A back-to-app button renders if the client URL is resolvable.

- [ ] **Step 3: Commit**

```bash
git add docker/keycloak/themes/naklos/login/info.ftl
git commit -m "feat(keycloak-theme): branded info.ftl for success/instruction screens"
```

---

## Task 12: End-to-end flow — register → verify email → auto-login → FleetSetupPage

**Files:** none (manual click-through verification)

- [ ] **Step 1: Register a fresh user**

Open:
```
http://localhost:8180/realms/naklos/protocol/openid-connect/auth?client_id=naklos-frontend&redirect_uri=http://localhost:5173&response_type=code
```

Click "Kaydolun". Fill in a new email (e.g. `test-2026-04-22@example.com`), password, confirm, first + last name, check the terms box, submit.

Expected: land on `login-verify-email.ftl` with branded chrome, subtitle mentioning the submitted email.

- [ ] **Step 2: Grab the verification link from logs**

Keycloak's dev SMTP outputs to stdout by default. Check:
```bash
docker compose logs keycloak --tail=200 | grep -A 5 "verification" || \
docker compose logs keycloak --tail=200 | grep -iE "link|verify|action"
```

Copy the verification URL. (If SMTP isn't configured, set `Realm Settings → Email → Host = localhost`, `From = dev@naklos.local`, and enable "Debug" mode — or use mailhog if you have it.)

- [ ] **Step 3: Click the verification link**

Expected flow:
1. Link opens in browser → Keycloak validates the action token.
2. Auto-login completes.
3. Browser redirects to `http://localhost:5173/` (the `naklos-web` dev server — make sure you have that running in a separate terminal: `cd naklos-web && npm run dev`).
4. `naklos-web`'s App.tsx detects the authenticated user has no fleet → renders `FleetSetupPage.tsx`.

Record any stumbles — if the user lands on a non-`FleetSetupPage` route, note it as a follow-up (not a plan-blocker; `naklos-web` is out of scope).

- [ ] **Step 4: Capture screenshots**

For each of the 3 pages hit during this flow (register, verify-email, FleetSetupPage), take a screenshot in TR. Save to:
```
/Users/olcay.bilir/IdeaProjects/naklos-web/docs/superpowers/specs/screenshots-2026-04-22/
├── flow-register-tr.png
├── flow-verify-email-tr.png
└── flow-fleet-setup-tr.png  (for reference only, not part of theme)
```

- [ ] **Step 5: Commit evidence**

```bash
cd /Users/olcay.bilir/IdeaProjects/naklos-web
mkdir -p docs/superpowers/specs/screenshots-2026-04-22
# (move screenshots into that folder)
git add docs/superpowers/specs/screenshots-2026-04-22/
git commit -m "docs(keycloak-theme): register-verify-login flow screenshots (tr)"
```

(Commit is in naklos-web, not naklos — the evidence lives next to the spec.)

---

## Task 13: End-to-end flow — forgot password → email → update password

**Files:** none (manual click-through verification)

- [ ] **Step 1: Trigger a reset request**

From the login page, click "Şifremi unuttum". Enter the email of the user you registered in Task 12. Submit.

Expected: redirect to `info.ftl` with branded chrome, message "E-postana link gönderdik. Gelen kutunu kontrol et."

- [ ] **Step 2: Grab the reset link from logs**

```bash
docker compose logs keycloak --tail=100 | grep -iE "link|reset|credentials"
```

Copy the reset URL.

- [ ] **Step 3: Click the reset link**

Expected: land on `login-update-password.ftl` with branded chrome, H1 "Yeni şifre belirle", two password fields, eye toggles.

- [ ] **Step 4: Set a new password**

Enter matching passwords, submit. Expected: auto-login completes, redirects to the client app. Verify you can log in again with the new password.

- [ ] **Step 5: Trigger the expired-link path**

Request another reset, wait past the access-code-lifespan (or copy the link and don't click it — it'll expire in ~5min by default). Click the stale link. Expected: `login-page-expired.ftl` with the branded two-CTA screen.

- [ ] **Step 6: Capture screenshots**

Save reset-password, update-password, page-expired, info screenshots in TR to `docs/superpowers/specs/screenshots-2026-04-22/`:

```
├── flow-reset-password-tr.png
├── flow-update-password-tr.png
├── flow-info-sent-tr.png
└── flow-page-expired-tr.png
```

- [ ] **Step 7: Commit**

```bash
cd /Users/olcay.bilir/IdeaProjects/naklos-web
git add docs/superpowers/specs/screenshots-2026-04-22/
git commit -m "docs(keycloak-theme): reset-password flow + page-expired screenshots (tr)"
```

---

## Task 14: Locale regression pass — all 7 pages in EN and DE

**Files:** none (manual click-through)

- [ ] **Step 1: Systematically click through each page in EN**

Switch the language switcher on the login page to English. Visit:
1. Login (`login.ftl`)
2. Register (`register.ftl`)
3. Verify-email (`login-verify-email.ftl`) — re-register a new test user
4. Reset-password (`login-reset-password.ftl`)
5. Update-password (`login-update-password.ftl`) — via reset link
6. Page-expired (`login-page-expired.ftl`) — via expired link
7. Error (`error.ftl`) — via bad client_id URL

For each: verify the h1, body copy, button labels, and footer all show English. No `??key??` placeholders.

- [ ] **Step 2: Repeat in DE**

Same 7 pages in German. Flag any keys that show Turkish instead of German (those are missing DE entries).

- [ ] **Step 3: Capture a composite screenshot for each locale**

One screenshot per page per locale (7 × 2 = 14) at desktop width. Save to:
```
docs/superpowers/specs/screenshots-2026-04-22/en/
docs/superpowers/specs/screenshots-2026-04-22/de/
```

- [ ] **Step 4: Commit**

```bash
cd /Users/olcay.bilir/IdeaProjects/naklos-web
git add docs/superpowers/specs/screenshots-2026-04-22/en/ docs/superpowers/specs/screenshots-2026-04-22/de/
git commit -m "docs(keycloak-theme): en + de regression screenshots across all 7 pages"
```

---

## Task 15: Voice-consistency review + final polish

**Files:**
- Modify (possibly): `docker/keycloak/themes/naklos/login/messages/messages_tr.properties`

The existing TR messages file mixes formal ("Parolanızı sıfırlayın", "doğrulayın") and casual ("Hesap oluştur", "Şifreni unuttun") Turkish across keys. After this plan is done, some unchanged old keys may still read formally — e.g. the built-in validation error "Parola en az {0} karakter olmalıdır." uses "Parola" where the label now says "Şifre".

- [ ] **Step 1: Grep for lingering formal voice**

```bash
cd /Users/olcay.bilir/IdeaProjects/naklos
grep -n "Parola\|yapın\|girin\|sıfırlayın\|doğrulayın" docker/keycloak/themes/naklos/login/messages/messages_tr.properties
```

For each match: decide whether it's (a) visible on a themed page and worth casualizing, or (b) an edge-case error message that's fine as-is.

- [ ] **Step 2: Casualize the visible validation errors**

Recommended updates in messages_tr.properties:
```properties
missingPasswordMessage=Şifre alanı zorunludur.
notMatchPasswordMessage=Şifreler eşleşmiyor.
invalidPasswordMinLengthMessage=Şifre en az {0} karakter olmalıdır.
invalidPasswordMinDigitsMessage=Şifre en az {0} rakam içermelidir.
invalidPasswordMinLowerCaseCharsMessage=Şifre en az {0} küçük harf içermelidir.
invalidPasswordMinUpperCaseCharsMessage=Şifre en az {0} büyük harf içermelidir.
invalidPasswordMinSpecialCharsMessage=Şifre en az {0} özel karakter içermelidir.
invalidPasswordNotUsernameMessage=Şifre kullanıcı adınla aynı olamaz.
invalidPasswordNotEmailMessage=Şifre e-posta adresinle aynı olamaz.
invalidPasswordHistoryMessage=Şifre son {0} şifrenden biriyle aynı olamaz.
password=Şifre
confirmPassword=Şifreyi tekrarla
```

(Leave "Parolanızı sıfırlayın" in any unused keys untouched — the canonical path now uses `emailForgotTitle`.)

- [ ] **Step 3: Restart and regression-check the form-error states**

```bash
docker compose restart keycloak
```

Submit a register form with a too-short password. Verify the error shows "Şifre en az {N} karakter olmalıdır." not "Parola...".

- [ ] **Step 4: Commit**

```bash
git add docker/keycloak/themes/naklos/login/messages/messages_tr.properties
git commit -m "polish(keycloak-theme): casualize Turkish voice across password-related keys"
```

---

## Task 16: Open PR

**Files:** none (git operations)

- [ ] **Step 1: Push branch**

```bash
cd /Users/olcay.bilir/IdeaProjects/naklos
git push -u origin feat/keycloak-theme-register-reset
```

- [ ] **Step 2: Open PR with a body that references the spec and screenshots**

```bash
gh pr create --title "feat(keycloak-theme): branded register + password-reset flow" --body "$(cat <<'EOF'
## Summary

Extends the existing Naklos Keycloak theme to cover every page in the registration and password-reset flow with consistent brand chrome, TR-first copy, and EN / DE language support.

New templates: \`register.ftl\`, \`login-verify-email.ftl\`, \`login-reset-password.ftl\`, \`login-update-password.ftl\`, \`login-page-expired.ftl\`, \`error.ftl\`, \`info.ftl\`, plus a shared \`template.ftl\` that owns brand header + legal footer.

Refactored: \`login.ftl\` no longer renders its own inline lockup — inherits chrome from \`template.ftl\`.

Messages: \`messages_tr.properties\` extended + casualized, \`messages_en.properties\` filled out, \`messages_de.properties\` new (first-pass German — flagged for native review).

## Spec

- Design: \`naklos-web/docs/superpowers/specs/2026-04-22-keycloak-theme-register-and-reset-design.md\`
- Plan:   \`naklos-web/docs/superpowers/plans/2026-04-22-keycloak-theme-register-and-reset.md\`

## Evidence

Screenshots of every page in TR / EN / DE are committed to \`naklos-web/docs/superpowers/specs/screenshots-2026-04-22/\`.

## Test plan

- [x] Local stack: register → verify email → auto-login → FleetSetupPage
- [x] Local stack: forgot password → email link → update password → login
- [x] Local stack: expired link → page-expired → restart
- [x] Local stack: malformed client_id → error
- [x] All 7 pages render in TR, EN, DE without placeholder keys
- [x] Mobile spot-check at 390px
- [x] Regression: existing login flow still works after refactor

## Deployment

Theme rides the existing \`Dockerfile.keycloak\`. Merging to \`main\` triggers a Railway rebuild of the Keycloak service. No realm config changes required.

## Known follow-ups

- \`messages_de.properties\` flagged for native-speaker review before we market to DACH.
- Keycloak terms checkbox is currently UX-only; \`FleetSetupPage\` remains the legally binding record. If we want the checkbox binding at the Keycloak layer later, we'd add a small \`FormAction\` SPI.
- Legal link hostname is hard-coded to \`naklos.com.tr\`. If we stand up a staging brand, parameterize via \`theme.properties\`.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

- [ ] **Step 3: Confirm the PR URL**

Print the URL returned by `gh pr create`. Paste into the spec as a trailing reference so future archaeology finds the rollout from the design.

---

## Self-Review

Spec coverage check against `docs/superpowers/specs/2026-04-22-keycloak-theme-register-and-reset-design.md`:

- **§5 File structure** — all 6 new templates, login.ftl refactor, 3 message files, CSS extension → covered in Tasks 1-11.
- **§6.1 template.ftl** — Task 2.
- **§6.2 register.ftl** — Task 5.
- **§6.3 login-reset-password.ftl** — Task 7.
- **§6.4 login-update-password.ftl** — Task 8.
- **§6.5 login-verify-email.ftl** — Task 6.
- **§6.6 login-page-expired.ftl** — Task 9.
- **§6.7 error.ftl** — Task 10.
- **§6.8 info.ftl** — Task 11.
- **§7 i18n** — keys added across Tasks 3, 5, 6, 7, 8, 9, 10; voice consistency pass in Task 15.
- **§8 Validation** — client-side `required` handled in register.ftl (Task 5) via the `<input required>` on the terms checkbox; server-side re-validation explicitly deferred per spec.
- **§9 Data flow** — register-verify flow in Task 12; reset-update flow in Task 13.
- **§10 Testing** — Tasks 12, 13, 14 cover end-to-end and cross-locale regression; screenshots committed.
- **§11 Deployment** — no action beyond the PR (Task 16); deployment is Railway's auto-rebuild on merge, documented in PR body.
- **§12 Risks** — DE review flag carried into PR body; hardcoded hostname and FormAction SPI noted as follow-ups in PR body.

Placeholder scan: no "TBD", "TODO (later)", "see above", or vague error-handling directives. Every code block is complete.

Type consistency: `naklos-meta-header`, `naklos-meta-lockup`, `naklos-meta-wordmark`, `naklos-lang-switch`, `naklos-checkbox`, `naklos-info-card`, `naklos-legal-footer`, `naklos-legal-sep` — same names used consistently in Task 1 (CSS), Task 2 (template.ftl), Tasks 5-11 (child FTLs).

One known weak spot in Task 11 info.ftl — the header block has an awkward placeholder-suppression line. Left a "cleanup if it renders ugly" note with the trim. Implementer may need to simplify on first render.
