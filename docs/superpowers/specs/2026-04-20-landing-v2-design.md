# Landing Page v2 — Design Spec

**Date:** 2026-04-20
**Status:** Design approved, pending spec review
**Author:** olcay.bilir (with Claude)
**Repos affected:** `naklos-web` (primary), `naklos` (backend endpoint + tier-gate change)

---

## 1. Goal

Replace the current landing page (on `main`) with a version that:

- Leads with the fuel-leak-detection wedge instead of treating fuel as one feature of four.
- Commits to a "warm operator" aesthetic aligned with the app's semantic palette (`urgent` / `attention` / `confirm`), distinct from generic Western fleet-SaaS landings.
- Captures high-intent leads via a KVKK-consented web form instead of placeholder WhatsApp links or raw `mailto:` CTAs.
- Presents pricing honestly during the pre-billing phase ("founding access, free during rollout — 30% lock-in when billing ships") instead of advertising trials that cannot actually be billed.

The existing `feat/landing-wedge-rewrite` branch is preserved (committed as-is, not merged). This work starts fresh from `main` on a new branch `feat/landing-v2`.

## 2. Scope

**In scope:**
- `src/pages/LandingPage.tsx` rewrite and split into `src/pages/landing/*`
- Translations for TR / EN / DE in `public/locales/{tr,en,de}/translation.json`
- New contact form component with KVKK consent
- New `POST /api/public/lead` endpoint in `naklos` backend
- Relaxing the fuel-import tier-gate in `naklos` backend to allow the `FREE` plan
- Adding Instrument Serif font for section eyebrows

**Out of scope:**
- Payment integration (Stripe / iyzico) — deferred
- WhatsApp Business integration — deferred
- Updates to `naklos/naklos-ux-guide.md` — explicitly not a reference for this work
- Dashboard / in-app changes — landing page only
- Real dashboard screenshot — stylized `HeroMockup` stays
- Audit section — removed entirely, no manual fulfillment workflow

## 3. Decisions locked in during brainstorming

| # | Decision | Rationale |
|---|---|---|
| D1 | Start fresh from `main` on new branch `feat/landing-v2` | Branch work preserved for reference; cleaner starting point |
| D2 | Remove audit section entirely | No manual fulfillment workflow; simpler shape |
| D3 | Remove all WhatsApp surfaces (floating button, `waLink`, constants) | No WhatsApp Business account; avoid broken placeholder links |
| D4 | Contact = KVKK form → backend endpoint (not `mailto:`) | Audit trail ownership in our DB; not in a third-party processor |
| D5 | Keep 4-tier pricing (Starter / Owner / Business / Enterprise) | Per-truck pricing from branch; no collapse |
| D6 | Fuel enabled on Starter (trial / free) tier | Wedge strategy: the moat must be visible in the free experience |
| D7 | "Start free" → creates account on Starter, free until payment ships | Honest framing; no fake 14-day trial |
| D8 | Founding-customer framing: 30% off lock-in for 12 months when billing ships | Preserves urgency + pricing authority + honest current state |
| D9 | Aesthetic A — warm operator | Differentiates from Western SaaS; matches app's semantic palette |
| D10 | English copy locked in this spec; TR (source-of-truth) and DE translations happen in implementation from the locked EN semantics | TR is the primary market; requires natural phrasing, not literal translation |
| D11 | File split: `LandingPage.tsx` becomes composition-only; sections extracted to `src/pages/landing/*` | Current 631-line file is unmanageable; warm-operator adds markup |

## 4. Page structure

```
┌─ Header ─────────────────────────────────────────┐  sticky, unchanged from main
│  [logo] Naklos                [lang] [Log in]   │
├─ Hero ───────────────────────────────────────────┤
│  Badge: "For Turkish SMB fleets · KVKK-compliant"│
│  H1: "The fuel leak you can't see in Excel."     │
│      "We surface it the day it happens."         │
│  Tagline (operator voice)                        │
│  [Start free] [I have an account]                │
│  "No credit card. No sales call."                │
│  [Continue with Google]                          │
│                                    ┌──────────┐  │
│                                    │HeroMockup│  │
│                                    └──────────┘  │
├─ How it works ───────────────────────────────────┤  NEW section
│  3 steps: Upload Excel → Configure → Get alerts  │
├─ Features ───────────────────────────────────────┤  fuel-first order
│  [Fuel] [Docs] [Performance] [15-min setup]      │
├─ Benefits ───────────────────────────────────────┤  operator-voiced bullets
├─ Pricing ────────────────────────────────────────┤
│  Founding banner                                 │
│  [Starter] [Owner] [Business] [Enterprise]       │
├─ Contact ────────────────────────────────────────┤  REPLACES contact band
│  KVKK form → POST /api/public/lead               │
└─ Footer ─────────────────────────────────────────┘  unchanged from main
```

Removed vs. main: nothing removed except the contact band's `mailto:` pattern (replaced with form).
Removed vs. branch: audit section, floating WhatsApp button, WhatsApp constants/helpers, WhatsApp CTAs inside pricing.

## 5. Copy (English — source for TR + DE)

### 5.1 Hero

| Key | English |
|---|---|
| `landing.nav.login` | "Log in" |
| `landing.hero.badge` | "For Turkish SMB fleets · KVKK-compliant" |
| `landing.hero.title1` | "The fuel leak you can't see in Excel." |
| `landing.hero.title2` | "We surface it the day it happens." |
| `landing.hero.tagline` | "Per-vehicle anomaly rules flag suspicious fill-ups the moment they happen. Inspection, license and insurance — all on the same screen." |
| `landing.hero.ctaPrimary` | "Start free" |
| `landing.hero.ctaPrimarySub` | "No credit card. No sales call." |
| `landing.hero.ctaSecondary` | "I have an account" |
| `landing.hero.ctaGoogle` | "Continue with Google" |
| `landing.hero.preview.label` | "Today's priorities" |
| `landing.hero.preview.stat1Label` | "Vehicles" |
| `landing.hero.preview.stat2Label` | "Drivers" |
| `landing.hero.preview.stat3Label` | "Fuel alerts" |
| `landing.hero.preview.priorityTitle` | "Top priorities" |
| `landing.hero.preview.priorityItem1` | "34 ABC 123 · Inspection · 2 days" |
| `landing.hero.preview.priorityItem2` | "07 XYZ 300 · Insurance · 8 days" |
| `landing.hero.preview.priorityCta` | "Open" |

### 5.2 How it works

| Key | English |
|---|---|
| `landing.howItWorks.eyebrow` | "How it works" |
| `landing.howItWorks.title` | "Three steps — data to action" |
| `landing.howItWorks.subtitle` | "15-minute setup. First anomaly within a week." |
| `landing.howItWorks.steps.s1.title` | "Upload your Excel" |
| `landing.howItWorks.steps.s1.desc` | "Export from OPET, Shell, BP — plus your vehicle and driver list. Import in 15 minutes." |
| `landing.howItWorks.steps.s2.title` | "Configure thresholds" |
| `landing.howItWorks.steps.s2.desc` | "Tank capacity, L/100 km anomaly threshold, how many days ahead to warn on docs. Your rules." |
| `landing.howItWorks.steps.s3.title` | "Get alerted" |
| `landing.howItWorks.steps.s3.desc` | "Suspicious fill-up → email in minutes. Expiring document → 30 days ahead. Monthly performance report." |

### 5.3 Features (fuel-first)

| Order | Key | Title | Description |
|---|---|---|---|
| 1 | `landing.features.fuel.*` | "Your cards spend. Which ones aren't driving?" | "Per-vehicle anomaly rules flag suspicious fill-ups. Email alert in minutes. Built for the way fuel cards actually get abused in Turkey." |
| 2 | `landing.features.docs.*` | "30-day warning before every roadside check" | "Inspection, license, SRC, K-belge, insurance — automatic reminders before expiry. Avoid ₺2,000–₺10,000 fines." |
| 3 | `landing.features.vehicles.*` | "Know which truck burns 22 L/100km, and which burns 28" | "L/100 km, cost per km, side-by-side comparison. The efficient vs. the expensive, with numbers." |
| 4 | `landing.features.drivers.*` | "Paste the Excel. We take it from there." | "Bulk-import vehicles, drivers and fuel transactions. No GPS box, no terminal, no hardware." |

Note: the `drivers` key is kept (avoids translation-file churn) but semantically re-purposed to "15-min setup." Acceptable trade-off; the key is an internal identifier.

### 5.4 Benefits

| Key | English |
|---|---|
| `landing.benefits.title` | "Goodbye, spreadsheets." |
| `landing.benefits.items.b1` | "Built for the owner checking the phone at 2 AM — not the accountant in Excel." |
| `landing.benefits.items.b2` | "Email alert the moment litre-per-100km goes past your threshold." |
| `landing.benefits.items.b3` | "No GPS box, no terminal, no installation — your fuel-card Excel is enough." |
| `landing.benefits.items.b4` | "Founding access — free during rollout, 30% off lock-in when billing ships." |
| `landing.benefits.items.b5` | "Turkish-first. KVKK-compliant. Email support." |
| `landing.benefits.cta` | "Try it now" |

### 5.5 Pricing

| Key | English |
|---|---|
| `landing.pricing.eyebrow` | "PRICING" |
| `landing.pricing.title` | "Pricing that makes sense." |
| `landing.pricing.subtitle` | "Per truck, per month. Plain pricing. No hardware, no contracts." |
| `landing.pricing.foundingBanner` | "Founding customers lock in 30% off for 12 months when billing ships." |
| `landing.pricing.tiers.free` | "Starter" |
| `landing.pricing.tiers.pro` | "Owner" |
| `landing.pricing.tiers.business` | "Business" |
| `landing.pricing.tiers.enterprise` | "Enterprise" |
| `landing.pricing.popular` | "Most Popular" |
| `landing.pricing.free` | "Free" |
| `landing.pricing.freeSub` | "founding access · free during rollout" |
| `landing.pricing.perMonth` | "/truck/mo" |
| `landing.pricing.proPrice` | "₺199" |
| `landing.pricing.businessPrice` | "₺149" |
| `landing.pricing.businessNote` | "25+ trucks" |
| `landing.pricing.contactPrice` | "Contact us" |
| `landing.pricing.foundingCta` | "Get founding access" |
| `landing.pricing.contactUs` | "Talk to us" |
| `landing.pricing.features.*` | Feature bullet strings, kept aligned with current keys |

Dropped keys: `landing.pricing.startFree` (replaced by `foundingCta`).

### 5.6 Contact form

| Key | English |
|---|---|
| `landing.contact.title` | "Talk to a human" |
| `landing.contact.subtitle` | "Questions about a tier, a custom integration, or a fleet under 5 trucks? Drop a note — we reply within 1 business day." |
| `landing.contact.form.name` | "Your name" |
| `landing.contact.form.email` | "Email address" |
| `landing.contact.form.phone` | "Phone (optional)" |
| `landing.contact.form.company` | "Company (optional)" |
| `landing.contact.form.fleetSize` | "How many trucks?" |
| `landing.contact.form.fleetSize.options.xs` | "1–5" |
| `landing.contact.form.fleetSize.options.s` | "6–25" |
| `landing.contact.form.fleetSize.options.m` | "26–100" |
| `landing.contact.form.fleetSize.options.l` | "100+" |
| `landing.contact.form.message` | "Anything we should know? (optional)" |
| `landing.contact.form.consent` | "I consent to Naklos processing my contact data per the [Privacy Policy] to respond to this inquiry." |
| `landing.contact.form.submit` | "Send" |
| `landing.contact.form.success` | "Thanks — we'll reply within 1 business day." |
| `landing.contact.form.error.generic` | "Something went wrong. Try again, or email info@naklos.com.tr directly." |
| `landing.contact.form.error.rateLimit` | "You've sent this a few times already. Please wait a bit before trying again." |
| `landing.contact.form.validation.required` | "Required." |
| `landing.contact.form.validation.email` | "Enter a valid email." |
| `landing.contact.form.validation.consent` | "Please accept the privacy policy to continue." |

### 5.7 Keys removed from translation files

All of:
- `landing.audit.*` (entire block)
- `landing.whatsappFloat`
- `landing.contact.cta` (replaced by form submit)
- `landing.pricing.startFree` (replaced by `foundingCta`)

## 6. Aesthetic — Warm Operator (direction A)

### 6.1 Tokens

| Token | Value | Use |
|---|---|---|
| Background | `bg-warm-50` (`#FAFAF7`) | Body, section backgrounds |
| Section alt bg | `bg-white` | Alternating bands (How it works, Benefits) |
| Headline color | `text-slate-900` | H1, H2 |
| Accent word color | `text-primary-700` | The one highlighted word per section title |
| Body text | `text-slate-600` | Taglines, feature descriptions |
| Muted text | `text-slate-500` | Captions, legal |
| Tone stripe — urgent | `bg-urgent-500` | Left stripe on priority rows, feature card for fuel |
| Tone stripe — attention | `bg-attention-500` | Left stripe on doc reminder feature |
| Tone stripe — confirm | `bg-confirm-500` | Left stripe on benefit/positive feature |
| Card border | `border-slate-200` | All cards |
| Card radius | `rounded-2xl` | Consistent |

### 6.2 No gradients

- Kill `bg-gradient-to-r from-primary-600 via-primary-500 to-blue-400 bg-clip-text text-transparent` on the H1 (branch has this — regression from main would be acceptable, but we want to commit harder to operator tone).
- Kill `bg-gradient-to-br from-primary-400/25 via-blue-300/15 to-emerald-200/20 blur-2xl` soft-glow behind `HeroMockup`.
- Kill `bg-gradient-to-br from-primary-500 to-primary-700` on logo tile (solid `bg-primary-700`).
- Kill audit section's `bg-gradient-to-br from-primary-600 to-primary-700` (audit section is removed anyway).

### 6.3 No universal hover-lift

- Remove `hover:-translate-y-0.5` / `hover:-translate-y-1` from all buttons and cards.
- One orchestrated moment only: staggered fade-in of the hero text column (badge → h1 → tagline → CTAs), 60ms between elements, 400ms total. Then hero mockup fades in 200ms after. Nothing else moves on load.
- Hover states: background/border colour change only, no motion.

### 6.4 Typography

- Body: `Plus Jakarta Sans` (existing default, no change).
- Section eyebrows: `Instrument Serif` at `text-sm italic tracking-wide`. Loaded via Google Fonts `<link>` in `index.html`, added to Tailwind config as `font-serif`.
- Headlines: Plus Jakarta Sans, `font-extrabold`, `tracking-tight`.
- Numbers (prices, stats): `tabular-nums` everywhere.

### 6.5 Feature cards

Current (branch + main): pastel-tinted icon tile on white card.
New: white card with 2px left tone-stripe (`urgent-500` for fuel card, `attention-500` for docs, `info-500` for vehicles, `confirm-500` for setup). Icon rendered in solid slate, no tinted background.

### 6.6 Background

- Replace the `#fafbfc` fixed-position radial dot grid with `bg-warm-50`.
- Optional: very faint noise texture via CSS background-image (1px grain, 2% opacity) for paper feel. Skipped if performance / SSR issues arise.

### 6.7 `HeroMockup` updates

Stays stylized (no real screenshot). Changes for warm-operator cohesion:
- Remove the `bg-gradient-to-br` soft glow.
- Priority rows already use `bg-urgent-500` / `bg-attention-500` stripes — keep.
- Stat tiles: remove pastel icon backgrounds; icons render in slate.
- Floating "%91" pill: keep, but use solid shadow instead of gradient.

## 7. File / component structure

```
src/pages/LandingPage.tsx              ~80 lines, composition only
src/pages/landing/
  Header.tsx                           sticky bar, logo, language switcher, login
  Hero.tsx                             text column + CTAs (uses AuthContext)
  HeroMockup.tsx                       stylized preview (StatTile, PriorityRow internal)
  HowItWorks.tsx                       3 steps
  Features.tsx                         4 cards with tone stripes
  Benefits.tsx                         title + 5-bullet list
  Pricing.tsx                          4 tiers + founding banner
  ContactForm.tsx                      form, state, validation, POST handler
  Footer.tsx                           logo + privacy/terms/email
```

Each component pulls its own `useTranslation()`. Only `Hero.tsx` and `Pricing.tsx` use `useAuth()` (register / login handlers).

`ContactForm.tsx` owns form state via React `useState` (repo does not include `react-hook-form`; adding a dependency isn't justified for one form). Submits to `/api/public/lead` via `fetch`. Shows inline validation errors per field and surfaces success/error via `sonner` toasts (already in the repo).

## 8. Backend work (`naklos` repo)

### 8.1 New endpoint: `POST /api/public/lead`

| Aspect | Spec |
|---|---|
| Path | `/api/public/lead` |
| Auth | None (public) |
| Rate limit | 5/hour per IP, 10/day per unique email (429 on breach) |
| Method | `POST` |
| Body | JSON (see 8.2) |
| Response 201 | `{ "id": "<uuid>", "status": "queued" }` |
| Response 400 | Validation failures per field |
| Response 429 | Rate-limit hit, with retry-after hint |
| Side effect | Row in `public_leads` + email to `info@naklos.com.tr` via `notification-module` |

### 8.2 Request body

```json
{
  "name": "string, 1..200 chars, required",
  "email": "string, RFC-5322, required",
  "phone": "string, optional, E.164 or TR-local",
  "company": "string, optional, 0..200",
  "fleetSize": "enum: 1-5 | 6-25 | 26-100 | 100+, required",
  "message": "string, optional, 0..2000",
  "source": "enum: contact | enterprise-pricing, required",
  "consent": {
    "accepted": "bool, must be true, required",
    "version": "string, e.g. 2026-04-20-v1, required",
    "locale": "enum: tr | en | de, required"
  }
}
```

### 8.3 Data model — `public_leads` table

```sql
CREATE TABLE public_leads (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  name            VARCHAR(200) NOT NULL,
  email           VARCHAR(320) NOT NULL,
  phone           VARCHAR(40),
  company         VARCHAR(200),
  fleet_size      VARCHAR(16) NOT NULL,
  message         TEXT,
  source          VARCHAR(32) NOT NULL,
  consent_accepted   BOOLEAN NOT NULL,
  consent_version    VARCHAR(64) NOT NULL,
  consent_locale     VARCHAR(4) NOT NULL,
  consent_ip         INET,
  consent_user_agent VARCHAR(500),
  status          VARCHAR(16) NOT NULL DEFAULT 'queued',
  processed_at    TIMESTAMPTZ
);

CREATE INDEX public_leads_created_at_idx ON public_leads (created_at DESC);
CREATE INDEX public_leads_email_idx      ON public_leads (email);
```

Consent audit trail — `consent_version` references the privacy policy version in effect when the user agreed. Bump the version string when the privacy policy content changes.

### 8.4 Email relay

Uses the existing `notification-module`. Template:
```
Subject: [Naklos] New lead ({fleet_size}) — {name}

Name:       {name}
Email:      {email}
Phone:      {phone | —}
Company:    {company | —}
Fleet size: {fleet_size}
Source:     {source}

Message:
{message | —}

---
Consent:   accepted v{consent_version} ({consent_locale})
IP:        {consent_ip}
UA:        {consent_user_agent}
Lead ID:   {id}
```

### 8.5 Fuel-import tier-gate relaxation

Locate the tier-gate that currently blocks fuel-import endpoints for `FREE` plan (matches the `fuelPerformanceDenied` UI state on the current landing's Starter tier). Relax so that `FREE` / Starter-trial plans can use fuel endpoints.

Exact file path to be identified during implementation (grep `FREE` / `plan` in `naklos/fleet-module`).

### 8.6 Backend spec mirror

A thin companion spec will live at `naklos/docs/superpowers/specs/2026-04-20-public-lead-endpoint.md` referencing this document. Kept minimal: endpoint contract, data model, tier-gate change.

## 9. Translations strategy

- English (this spec) = semantic source of truth.
- TR = primary market, requires natural phrasing not literal translation. Specific wedge lines ("The fuel leak you can't see in Excel") must be re-expressed in Turkish idiom, not word-for-word translated.
- DE = mirror EN semantics. German audience is smaller; translation quality expectation is accurate but doesn't need cultural idiom polish at TR level.
- All three locales updated in the same PR as the landing rewrite.

## 10. Error handling

| Surface | Error state | Behavior |
|---|---|---|
| Contact form | Field validation | Inline red text under field, form stays filled |
| Contact form | 400 server-side | Toast + preserve form state, surface server field-errors if available |
| Contact form | 429 rate limit | Friendly message: "You've sent this a few times already." |
| Contact form | Network failure | Toast: "Connection issue. Try again, or email info@naklos.com.tr." |
| Start free | `register()` throws | Existing AuthContext error handling (unchanged) |

## 11. Testing

- **Component tests** (Vitest + Testing Library): each section component renders with minimal mock `t()`. `ContactForm` tested for: required-field validation, consent-required-to-submit, submit → fetch call with correct payload, success state, error states.
- **Integration-style component test** (Vitest + Testing Library, no e2e framework in the repo): `LandingPage` composes all sections; `ContactForm` submits against a mocked `fetch` and hits success/error/rate-limit branches.
- **Backend** (`naklos`): endpoint unit tests for validation, rate-limit behavior, consent persistence, email relay call. Migration test for the new table.
- **Translations**: snapshot test that no `landing.*` key is missing across tr/en/de and no orphan keys remain (e.g. `landing.audit.*` should be absent from all three).

## 12. Acceptance criteria

- [ ] New branch `feat/landing-v2` cut from `main`
- [ ] `LandingPage.tsx` split into 9 components under `src/pages/landing/`
- [ ] All copy in section 5 present in EN translation file
- [ ] TR + DE translations provided, reviewed by a Turkish-speaker for idiom (olcay)
- [ ] Warm-operator aesthetic applied: `warm-50` background, tone stripes on features, no gradients, Instrument Serif eyebrows
- [ ] Contact form submits to `/api/public/lead` with KVKK consent captured
- [ ] Backend endpoint + table + email relay live in `naklos`
- [ ] Fuel-import tier-gate allows `FREE` plan (verified by smoke test from a fresh signup)
- [ ] No references to audit section, WhatsApp constants, or `waLink()` remain in `naklos-web`
- [ ] All three translation files pass key-alignment check (no missing / orphan keys)
- [ ] Landing page renders without console errors, Lighthouse accessibility ≥ 95

## 13. Non-goals / deferred

- Payment integration (Stripe / iyzico)
- Real dashboard screenshot (hero mockup stays stylized)
- WhatsApp Business number migration path
- A/B testing infrastructure for headline variants
- Founding-customer lock-in enforcement (applied only at billing-ship time; pre-billing is an honor-system promise in copy)
- Analytics event wiring for CTA clicks / form submissions (add in a follow-up)
- Updates to `naklos/naklos-ux-guide.md`
