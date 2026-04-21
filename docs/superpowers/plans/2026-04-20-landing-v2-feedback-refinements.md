# Landing v2 — Feedback Refinements Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Apply the adopted items from `feedback.md` on top of the already-merged landing v2 work: TR-first first-paint, a hybrid hero tagline covering all three pillars, a mockup that *shows* the product instead of decorating it, pricing with transparent future prices and a founding-access-terms explainer, a social-proof placeholder, and legally-required TR footer fields.

**Architecture:** All changes sit inside the existing `src/pages/landing/*` section files and the translation JSONs. Two new route/pages added (`FoundingTermsPage`, `KvkkPolicyPage`, `CookiePolicyPage`) with placeholder legal content — the user / their lawyer fills in the body copy. No new libraries, no new patterns.

**Tech Stack:** Existing React 19 + TypeScript + Tailwind + react-i18next. No new dependencies.

**Branch:** Continue on `feat/landing-v2` (current head: `f7ef5ec` after the final-review a11y fixes). This is pre-merge work — the feedback items should bundle with the initial v2 merge, not ship as a separate v2.1.

**Out of scope:**
- Full hero rewrite to platform-first (explicitly rejected — we're keeping the wedge-first title1 and only widening the tagline; see decision below).
- Feature-card reorder (Docs first, Fuel second) — explicitly rejected; fuel stays first with the urgent stripe.
- Any aesthetic regression from feedback Step 11: no pastel icon chips on feature cards, no colored traffic-light mockup dots, no universal hover-lift on cards. Warm-operator commits stand.
- Legal copy itself — we ship placeholder-body pages with real metadata and a visible "Draft — needs legal review" banner. The user's lawyer supplies the actual policy text.
- Social-proof real content — we ship the "Founding customers wanted" framing; real logos/testimonials go in a follow-up once they exist.
- Re-testing the 2 pre-existing `useLanguage.test.ts` failures as regressions — they're stale tests on already-correct code. F1 updates or deletes them.

**Decisions locked in during brainstorming:**

| # | Decision | Reasoning |
|---|---|---|
| D1 | Keep wedge-first H1 (`Excel'de göremediğiniz yakıt kaçağı`) | Already shipped; pivoting now wastes work and weakens the sharpest line on the page |
| D2 | Widen the hero *tagline* (not title) to cover all 3 pillars | Hybrid compromise — sharpness of wedge + platform breadth |
| D3 | Keep fuel-first feature ordering with urgent stripe | Already shipped; the wedge is reinforced by fuel being card #1 |
| D4 | Reject feedback Step 11 pastel/dots/hover-lift | Undoes the explicit warm-operator commit |
| D5 | Placeholder legal pages with "Draft" banner | We're not lawyers; the routes + metadata are our job, the policy copy is the user's |
| D6 | Social proof: "Founding customers wanted" placeholder | Honest about where we are; faking logos is worse than acknowledging zero |
| D7 | Pricing — show future prices alongside "Free" | Anchors the ₺ value now, avoids surprise when billing ships |

---

## File Structure

### Created
```
src/pages/landing/SocialProof.tsx                      ~40 lines — "Founding customers wanted" section
src/pages/legal/FoundingTermsPage.tsx                  ~80 lines — explains founding access terms
src/pages/legal/KvkkPolicyPage.tsx                     ~50 lines — placeholder KVKK Aydınlatma Metni
src/pages/legal/CookiePolicyPage.tsx                   ~50 lines — placeholder Çerez Politikası
```

### Modified
```
src/pages/landing/Hero.tsx                             tagline renders multi-pillar copy (no title change)
src/pages/landing/HeroMockup.tsx                       mockup body: 3 real alert rows instead of stat tiles + priority rows
src/pages/landing/Pricing.tsx                          add struck-through future prices + founding-terms link below grid
src/pages/landing/Footer.tsx                           add legal footer block (company, tax, KVKK/Çerez/founding-terms links)
src/pages/LandingPage.tsx                              insert <SocialProof /> between <Benefits /> and <Pricing />
src/App.tsx                                            register /founding-terms, /kvkk, /cerez-politikasi routes
public/locales/en/translation.json                     updated copy for hero.tagline, features (no reorder), pricing additions, footer legal, socialProof, founding-terms page strings
public/locales/tr/translation.json                     same set in Turkish
public/locales/de/translation.json                     same set in German
src/hooks/__tests__/useLanguage.test.ts                fix / replace stale assertions that predated browser-locale detection
src/pages/landing/translations.test.ts                 extend required-keys list with the new keys added in F2–F6
src/pages/landing/LandingPage.test.tsx                 verify SocialProof section renders + footer legal links present
```

### Constants
- Company legal placeholders live in `Footer.tsx` as constants at top of the file — the user swaps them for real values when registered:
  - `COMPANY_LEGAL_NAME = 'Naklos Teknoloji Ltd. Şti.'` *(example — replace with actual)*
  - `COMPANY_ADDRESS_CITY = 'İstanbul'`
  - `TAX_OFFICE = 'TBD'`
  - `TAX_NUMBER = 'TBD'`

---

## Task F1: Fix language first-paint + stale useLanguage tests

**Files:**
- Modify: `src/hooks/__tests__/useLanguage.test.ts`
- Potentially: `src/main.tsx` or `src/i18n.ts` (only if we find the first-paint is actually English)

### Context

The `useLanguage` hook in `src/hooks/useLanguage.ts` already implements the feedback's Step 1 requirement:
1. localStorage persisted choice wins
2. Keycloak token locale next
3. `navigator.languages` primary subtag
4. Fallback to `'tr'`

Two existing tests fail because they predate the `navigator.languages` path — they expect the hook to return `'tr'` when there's "no signal," but in happy-dom the navigator's language is `'en-US'`, so the hook correctly returns `'en'`.

### Steps

- [ ] **Step 1: Read the existing test assertions**

```bash
cat src/hooks/__tests__/useLanguage.test.ts
```

Identify the two failing tests: "defaults to tr when no signal is present" and "rejects unsupported locales and falls back to tr".

- [ ] **Step 2: Decide — update or delete**

For each failing test:
- If the test is asserting behavior we still want (fallback to `'tr'` when nothing matches), we must stub `navigator.languages` to empty/unsupported BEFORE calling `useLanguage`. Update the test to reflect this.
- If the test duplicates coverage already provided by the "honours browser language" test, delete it.

- [ ] **Step 3: Update the "defaults to tr" test**

Replace its setup with explicit no-signal stubbing:

```ts
it('defaults to tr when no signal is present', () => {
  localStorage.clear();
  document.documentElement.lang = '';
  const originalLanguages = navigator.languages;
  const originalLanguage = navigator.language;
  Object.defineProperty(navigator, 'languages', { value: [], configurable: true });
  Object.defineProperty(navigator, 'language', { value: '', configurable: true });
  try {
    const { result } = renderHook(() => useLanguage());
    expect(result.current.language).toBe('tr');
    expect(document.documentElement.lang).toBe('tr');
  } finally {
    Object.defineProperty(navigator, 'languages', { value: originalLanguages, configurable: true });
    Object.defineProperty(navigator, 'language', { value: originalLanguage, configurable: true });
  }
});
```

- [ ] **Step 4: Update the "rejects unsupported locale" test**

```ts
it('rejects unsupported locales and falls back to tr', () => {
  localStorage.setItem('naklos.language', 'fr');
  const originalLanguages = navigator.languages;
  Object.defineProperty(navigator, 'languages', { value: ['fr-FR'], configurable: true });
  try {
    const { result } = renderHook(() => useLanguage());
    // Unsupported localStorage value + unsupported navigator -> 'tr' fallback
    expect(result.current.language).toBe('tr');
  } finally {
    Object.defineProperty(navigator, 'languages', { value: originalLanguages, configurable: true });
  }
});
```

- [ ] **Step 5: Run the hook tests**

Run: `npm test -- src/hooks/__tests__/useLanguage.test.ts`
Expected: all 5 tests pass (was 3/5).

- [ ] **Step 6: Verify first-paint rendering in browser**

Run: `npm run dev`. Open in a browser with Turkish as the preferred language (or temporarily change browser language to `tr-TR`). Open `/` — confirm the page renders in Turkish on first paint, not English.

Also test with `en-US` — page should render in English.

Also test with `fr-FR` (unsupported) — page should render in Turkish (fallback).

If the page renders in English for a Turkish browser, the bug is not in `useLanguage.ts` — it's in the i18next init path (`src/i18n.ts`). In that case, make sure i18next is initialized from the same source the hook uses. The fix may be as simple as `i18n.init({ lng: readInitial(), ... })` instead of a hardcoded `lng: 'en'`.

Report what you found — don't blindly edit.

- [ ] **Step 7: Commit**

```bash
git add src/hooks/__tests__/useLanguage.test.ts   # + src/i18n.ts if edited
git commit -m "$(cat <<'EOF'
fix(i18n): align useLanguage tests with browser-locale detection

The hook was updated to walk navigator.languages before falling
back to 'tr', but two tests still asserted 'tr' for cases where
the happy-dom navigator returns 'en-US'. Stub navigator.languages
explicitly in the no-signal + unsupported-locale tests so they
actually exercise the fallback path.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task F2: Hybrid hero tagline

**Files:**
- Modify: `public/locales/en/translation.json`
- Modify: `public/locales/tr/translation.json`
- Modify: `public/locales/de/translation.json`

H1 stays as the wedge. Tagline widens to cover all three pillars.

### Steps

- [ ] **Step 1: Edit EN — `landing.hero.tagline`**

Before:
```json
"tagline": "Per-vehicle anomaly rules flag suspicious fill-ups the moment they happen. Inspection, license and insurance — all on the same screen."
```
After:
```json
"tagline": "The fuel leak you can't see in Excel. The inspection you'll miss next month. The license that expired yesterday. Naklos surfaces them before they cost you."
```

- [ ] **Step 2: Edit TR — `landing.hero.tagline`**

Before:
```json
"tagline": "Araç bazlı anomali kuralları, şüpheli dolumları anında yakalar. Muayene, ehliyet ve sigorta da aynı ekranda."
```
After:
```json
"tagline": "Excel'de göremediğiniz yakıt kaçağı. Gelecek ay kaçıracağınız muayene. Dün süresi dolan ehliyet. Naklos, size paraya mal olmadan önce bunları gösterir."
```

- [ ] **Step 3: Edit DE — `landing.hero.tagline`**

Before:
```json
"tagline": "Fahrzeugbezogene Anomalieregeln markieren verdächtige Tankvorgänge in dem Moment, in dem sie passieren. Inspektion, Führerschein und Versicherung — alles auf einem Bildschirm."
```
After:
```json
"tagline": "Der Kraftstoffverlust, den Excel verbirgt. Die Inspektion, die Sie nächsten Monat verpassen. Der Führerschein, der gestern abgelaufen ist. Naklos zeigt sie, bevor sie Geld kosten."
```

- [ ] **Step 4: Verify JSON + typecheck + existing tests**

```bash
node -e "JSON.parse(require('fs').readFileSync('public/locales/en/translation.json'))" && \
node -e "JSON.parse(require('fs').readFileSync('public/locales/tr/translation.json'))" && \
node -e "JSON.parse(require('fs').readFileSync('public/locales/de/translation.json'))"
npm run typecheck
npm test -- src/pages/landing/translations.test.ts src/pages/landing/LandingPage.test.tsx
```
Expected: JSON valid, typecheck clean, translations alignment test passes, LandingPage smoke test passes (tagline string isn't hardcoded in assertions, only referenced as a key).

If the LandingPage smoke test asserted the old tagline text, update its assertion to the new text.

- [ ] **Step 5: Commit**

```bash
git add public/locales/en/translation.json public/locales/tr/translation.json public/locales/de/translation.json
git commit -m "$(cat <<'EOF'
feat(landing): widen hero tagline to cover all three pillars

Hybrid hero — H1 stays wedge-first ('The fuel leak you can't see
in Excel'), tagline now names the three concrete pains one per
pillar (fuel, docs, driver license). Keeps the sharp fuel hook
while signalling platform breadth for visitors who'd otherwise
bounce thinking it's a fuel-only tool.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task F3: HeroMockup — replace decoration with product story

**Files:**
- Modify: `src/pages/landing/HeroMockup.tsx`
- Modify: `public/locales/{en,tr,de}/translation.json` — new `landing.hero.preview.alerts.*` keys

Current mockup renders 3 stat tiles ("24", "18", "3") + a priority-briefing with 2 rows. Feedback: make it show one real-looking alert per pillar.

### Steps

- [ ] **Step 1: Add new translation keys in all 3 locales**

Add under `landing.hero.preview` (alongside existing `label`, `priorityTitle`, etc.):

**EN:**
```json
"alerts": {
  "fuelTitle": "34 ABC 123 — Unusual fill-up",
  "fuelDetail": "127L in 80L tank · ₺1,840 over",
  "fuelWhen": "2 hours ago",
  "docTitle": "07 XYZ 300 — Inspection due",
  "docDetail": "Expires in 2 days",
  "driverTitle": "Driver: Ahmet K. — License",
  "driverDetail": "Expires in 8 days",
  "today": "Today's alerts"
}
```

**TR:**
```json
"alerts": {
  "fuelTitle": "34 ABC 123 — Olağandışı dolum",
  "fuelDetail": "80L depoya 127L · ₺1.840 fazla",
  "fuelWhen": "2 saat önce",
  "docTitle": "07 XYZ 300 — Muayene",
  "docDetail": "2 gün içinde dolacak",
  "driverTitle": "Sürücü: Ahmet K. — Ehliyet",
  "driverDetail": "8 gün içinde dolacak",
  "today": "Bugünün uyarıları"
}
```

**DE:**
```json
"alerts": {
  "fuelTitle": "34 ABC 123 — Ungewöhnliche Tankung",
  "fuelDetail": "127L in 80L-Tank · ₺1.840 zu viel",
  "fuelWhen": "vor 2 Stunden",
  "docTitle": "07 XYZ 300 — Inspektion",
  "docDetail": "Läuft in 2 Tagen ab",
  "driverTitle": "Fahrer: Ahmet K. — Führerschein",
  "driverDetail": "Läuft in 8 Tagen ab",
  "today": "Heutige Warnungen"
}
```

- [ ] **Step 2: Rewrite `HeroMockup.tsx` body**

Replace the mockup's body (the `<div className="bg-warm-50 p-4">` block) so the content after the mini-nav is:

```tsx
{/* Today's alerts header */}
<div className="mb-3 flex items-center justify-between">
  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
    {t('landing.hero.preview.alerts.today')}
  </span>
  <span className="text-[10px] font-bold text-urgent-600 tabular-nums bg-urgent-50 border border-urgent-100 rounded px-1.5 py-0.5">3</span>
</div>

{/* Three real-looking alert rows */}
<div className="space-y-2">
  <AlertRow
    tone="urgent"
    icon={<Fuel className="w-3.5 h-3.5" />}
    title={t('landing.hero.preview.alerts.fuelTitle')}
    detail={t('landing.hero.preview.alerts.fuelDetail')}
    when={t('landing.hero.preview.alerts.fuelWhen')}
  />
  <AlertRow
    tone="attention"
    icon={<AlertTriangle className="w-3.5 h-3.5" />}
    title={t('landing.hero.preview.alerts.docTitle')}
    detail={t('landing.hero.preview.alerts.docDetail')}
  />
  <AlertRow
    tone="attention"
    icon={<Users className="w-3.5 h-3.5" />}
    title={t('landing.hero.preview.alerts.driverTitle')}
    detail={t('landing.hero.preview.alerts.driverDetail')}
  />
</div>
```

Remove: the `grid grid-cols-3 gap-2 mb-3` stat-tile block, the old priority-briefing `<div className="rounded-lg border border-slate-200 bg-white p-2.5">` block, the internal `StatTile` and `PriorityRow` helpers (delete the functions).

Add internal `AlertRow` helper:

```tsx
function AlertRow({
  tone, icon, title, detail, when,
}: {
  tone: 'urgent' | 'attention';
  icon: React.ReactNode;
  title: string;
  detail: string;
  when?: string;
}) {
  const stripe = tone === 'urgent' ? 'bg-urgent-500' : 'bg-attention-500';
  const iconText = tone === 'urgent' ? 'text-urgent-600' : 'text-attention-600';
  return (
    <div className="rounded-md bg-white border border-slate-100 overflow-hidden flex items-stretch">
      <span className={`w-0.5 ${stripe}`} aria-hidden="true" />
      <div className="flex-1 flex items-start gap-2 px-2 py-2">
        <span className={`flex-shrink-0 mt-0.5 ${iconText}`} aria-hidden="true">{icon}</span>
        <div className="flex-1 min-w-0">
          <div className="text-[10px] font-bold text-slate-900 truncate">{title}</div>
          <div className="text-[9px] text-slate-500 truncate">{detail}</div>
        </div>
        {when && (
          <span className="text-[8px] text-slate-400 flex-shrink-0 tabular-nums whitespace-nowrap">{when}</span>
        )}
      </div>
    </div>
  );
}
```

Remove the floating "%91" pill at the bottom (the cryptic one that feedback flagged). If a floating proof card feels right once you see the layout, replace it with a semantically meaningful one later.

Imports needed at the top: `AlertTriangle` (lucide-react) — remove `Truck`, `Users`, `Fuel` if now unused... wait, `Users` and `Fuel` are still used in alert rows; keep them. `Truck` is still used in the mini-nav logo tile. No import removals.

- [ ] **Step 3: Prune dead helpers**

Verify nothing imports `StatTile` or `PriorityRow` from `HeroMockup.tsx`. These were internal helpers so they should be safe to delete. Run:

```bash
grep -rn "StatTile\|PriorityRow" src/ --include="*.tsx" --include="*.ts"
```

If matches appear outside `HeroMockup.tsx`, stop and report — they weren't supposed to leak.

- [ ] **Step 4: Typecheck + tests**

```bash
npm run typecheck
npm test -- src/pages/landing/
```

The LandingPage smoke test may assert on old mockup strings — update assertions to the new alert titles if needed. The translations alignment test will fail until Step 5 extends the required-keys list.

- [ ] **Step 5: Extend `translations.test.ts` required-keys list**

In `src/pages/landing/translations.test.ts`, the `required` array — add:
- `landing.hero.preview.alerts.fuelTitle`
- `landing.hero.preview.alerts.docTitle`
- `landing.hero.preview.alerts.driverTitle`
- `landing.hero.preview.alerts.today`

Rerun the translations test — now passes.

- [ ] **Step 6: Commit**

```bash
git add src/pages/landing/HeroMockup.tsx \
        public/locales/en/translation.json public/locales/tr/translation.json public/locales/de/translation.json \
        src/pages/landing/translations.test.ts \
        src/pages/landing/LandingPage.test.tsx  # only if its assertions needed updates
git commit -m "$(cat <<'EOF'
feat(landing): HeroMockup shows three real-looking alerts

Replaces the decorative 3-stat / 2-priority-row mockup with three
alert rows — one per pillar (fuel, document, driver license).
Feedback called the old layout 'wasted real estate' since it
didn't prove what the headline claims.

- urgent stripe + fuel icon: '34 ABC 123 — Unusual fill-up, 127L
  in 80L tank'. Makes the fuel wedge concrete.
- attention stripe + warning icon: 'Inspection due in 2 days'.
- attention stripe + user icon: 'Driver license expires in 8 days'.

Drops the cryptic '%91' floating proof pill. If a proof card
returns later it'll say something measurable ('47 anomalies
caught this month' — only if real).

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task F4: Pricing — future-price anchors + founding-terms link

**Files:**
- Modify: `src/pages/landing/Pricing.tsx`
- Create: `src/pages/legal/FoundingTermsPage.tsx`
- Modify: `src/App.tsx` — register `/founding-terms` route
- Modify: `public/locales/{en,tr,de}/translation.json` — new keys

Visitors see "Free" on every tier but no future-price anchor. Feedback: show the future price alongside so ₺199 becomes a mental anchor now, no surprise when billing ships. Also add a visible link to a founding-terms page that explains *when* billing starts and *how* the 30% lock-in works.

### Steps

- [ ] **Step 1: Add translation keys in all 3 locales**

Add under `landing.pricing`:

**EN:**
```json
"futureLabel": "When billing ships",
"lockInLabel": "Founding lock-in (30% off, 12 mo)",
"termsLinkLabel": "Founding access terms",
"ownerLockInPrice": "₺139",
"businessLockInPrice": "₺104"
```

**TR:**
```json
"futureLabel": "Ücretlendirme başladığında",
"lockInLabel": "Kurucu kilidi (%30 indirim, 12 ay)",
"termsLinkLabel": "Kurucu erişim şartları",
"ownerLockInPrice": "₺139",
"businessLockInPrice": "₺104"
```

**DE:**
```json
"futureLabel": "Wenn die Abrechnung startet",
"lockInLabel": "Gründungsrabatt (30% Rabatt, 12 Monate)",
"termsLinkLabel": "Gründungszugang-Bedingungen",
"ownerLockInPrice": "₺139",
"businessLockInPrice": "₺104"
```

- [ ] **Step 2: Update `Pricing.tsx` tier cards**

For **Starter**: under the big "Free" label add:

```tsx
<p className="text-xs text-slate-500 mb-5">{t('landing.pricing.freeSub')}</p>
<div className="text-[11px] text-slate-400 mb-5 -mt-3">
  <span className="line-through">{t('landing.pricing.proPrice')}{t('landing.pricing.perMonth')}</span>
  <span className="ml-1">· {t('landing.pricing.futureLabel')}</span>
</div>
```

For **Owner**: change the price block so "Free during rollout" is the primary price, and the future `₺199 → ₺139 lock-in` is shown below:

```tsx
<div className="mb-5">
  <span className="text-3xl font-extrabold text-slate-900 tracking-tight">{t('landing.pricing.free')}</span>
  <div className="text-[11px] text-slate-500 mt-1">
    <span className="line-through">{t('landing.pricing.proPrice')}</span>
    <span className="ml-1">→ <span className="font-semibold text-primary-800">{t('landing.pricing.ownerLockInPrice')}</span>{t('landing.pricing.perMonth')}</span>
  </div>
  <div className="text-[10px] text-slate-400 mt-0.5">{t('landing.pricing.lockInLabel')}</div>
</div>
```

For **Business**: similar pattern with `businessPrice` and `businessLockInPrice`.

Enterprise keeps "Contact us" — no struck-through price.

Below the grid (outside the `<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">`), add a centered link:

```tsx
<div className="mt-8 text-center">
  <Link
    to="/founding-terms"
    className="text-sm text-slate-600 hover:text-slate-900 underline decoration-slate-300 hover:decoration-slate-600 underline-offset-2 transition-colors"
  >
    {t('landing.pricing.termsLinkLabel')} →
  </Link>
</div>
```

Import `Link` from `react-router-dom` at the top of `Pricing.tsx`.

- [ ] **Step 3: Create `src/pages/legal/FoundingTermsPage.tsx`**

```tsx
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function FoundingTermsPage() {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen bg-warm-50">
      <div className="max-w-3xl mx-auto px-4 py-16">
        <Link to="/" className="text-sm text-slate-500 hover:text-slate-900 mb-8 inline-block">
          ← Naklos
        </Link>

        <div className="bg-attention-50 border border-attention-200 text-attention-700 rounded-xl p-4 mb-8 text-sm">
          <strong>Draft.</strong> {t('foundingTerms.draftBanner')}
        </div>

        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-6">
          {t('foundingTerms.title')}
        </h1>

        <section className="prose prose-slate max-w-none">
          <ol className="space-y-4 text-slate-700">
            <li>{t('foundingTerms.point1')}</li>
            <li>{t('foundingTerms.point2')}</li>
            <li>{t('foundingTerms.point3')}</li>
            <li>{t('foundingTerms.point4')}</li>
            <li>{t('foundingTerms.point5')}</li>
          </ol>

          <p className="mt-8 text-sm text-slate-500">
            {t('foundingTerms.contact')}
          </p>
        </section>
      </div>
    </div>
  );
}
```

Add translation keys in all 3 locales under a new top-level `foundingTerms` block:

**EN:**
```json
"foundingTerms": {
  "draftBanner": "This page explains what founding access means before our billing system goes live. It will be reviewed by counsel before launch.",
  "title": "Founding access — what you're signing up for",
  "point1": "Billing starts in Q2 2026 at the earliest. We'll give 30 days' notice by email before the first charge.",
  "point2": "Founding customers get 30% off the published price for 12 months from the first billed month.",
  "point3": "Founding access does not auto-convert to a paid plan. You have to actively confirm billing for it to start.",
  "point4": "You can cancel at any time during founding access and never be charged.",
  "point5": "Your data stays yours. Canceling means we stop using it for anything beyond keeping your account accessible to you.",
  "contact": "Questions? Email info@naklos.com.tr."
}
```

**TR:**
```json
"foundingTerms": {
  "draftBanner": "Bu sayfa, ücretlendirme sistemimiz yürürlüğe girmeden önce kurucu erişimin ne anlama geldiğini açıklar. Lansmandan önce hukuk müşaviri tarafından gözden geçirilecek.",
  "title": "Kurucu erişim — ne kaydettiriyorsunuz",
  "point1": "Ücretlendirme en erken 2026 Q2'de başlar. İlk tahsilattan 30 gün önce e-posta ile haber veririz.",
  "point2": "Kurucu müşteriler, ilk ücretli aydan başlayarak 12 ay boyunca yayımlanan fiyatın %30 indirimli halini alır.",
  "point3": "Kurucu erişim, otomatik olarak ücretli plana geçmez. Ücretlendirmenin başlaması için aktif olarak onaylamanız gerekir.",
  "point4": "Kurucu erişim süresince istediğiniz zaman iptal edebilirsiniz ve hiç ücret ödemezsiniz.",
  "point5": "Verileriniz sizindir. İptal ettiğinizde, hesabınıza erişiminizi korumak dışında hiçbir amaçla kullanmayız.",
  "contact": "Soru mu var? info@naklos.com.tr'ye yazın."
}
```

**DE:**
```json
"foundingTerms": {
  "draftBanner": "Diese Seite erklärt, was Gründungszugang bedeutet, bevor unser Abrechnungssystem aktiviert wird. Sie wird vor dem Start von einem Anwalt überprüft.",
  "title": "Gründungszugang — wofür Sie sich anmelden",
  "point1": "Die Abrechnung beginnt frühestens Q2 2026. Wir geben 30 Tage vor der ersten Abrechnung per E-Mail Bescheid.",
  "point2": "Gründungskunden erhalten 30% Rabatt auf den veröffentlichten Preis für 12 Monate ab dem ersten abgerechneten Monat.",
  "point3": "Gründungszugang wandelt sich nicht automatisch in einen bezahlten Tarif um. Sie müssen die Abrechnung aktiv bestätigen.",
  "point4": "Sie können während des Gründungszugangs jederzeit kündigen und werden nie abgerechnet.",
  "point5": "Ihre Daten gehören Ihnen. Bei Kündigung verwenden wir sie für nichts weiter, außer Ihr Konto für Sie zugänglich zu halten.",
  "contact": "Fragen? Schreiben Sie an info@naklos.com.tr."
}
```

- [ ] **Step 4: Register the route**

In `src/App.tsx`, add the route in every route-tree fork that currently has `/privacy` and `/terms`:

```tsx
import FoundingTermsPage from './pages/legal/FoundingTermsPage';

// ... in each <Routes> block where /privacy and /terms live:
<Route path="/founding-terms" element={<FoundingTermsPage />} />
```

The Grep earlier showed 3 fork points in `App.tsx` where `/privacy` and `/terms` are registered — add to all 3.

- [ ] **Step 5: Typecheck + test**

```bash
npm run typecheck
npm test
```

The translations alignment test will fail until the required-keys list is extended. Add the new `landing.pricing.*` and `foundingTerms.*` keys to the `required` array in `src/pages/landing/translations.test.ts`.

- [ ] **Step 6: Commit**

```bash
git add src/pages/landing/Pricing.tsx src/pages/legal/FoundingTermsPage.tsx src/App.tsx \
        public/locales/en/translation.json public/locales/tr/translation.json public/locales/de/translation.json \
        src/pages/landing/translations.test.ts
git commit -m "$(cat <<'EOF'
feat(landing): show future prices + add founding-terms page

Pricing cards now anchor the mental ₺ value:
- Starter: Free with '₺199 · when billing ships' faint line
- Owner: Free with '₺199 → ₺139' struck-through + lock-in
- Business: Free with '₺149 → ₺104' struck-through + lock-in
- Enterprise: unchanged (Contact us)

Adds /founding-terms legal page explaining exactly what founding
access commits to: billing start quarter, 30-day notice, 12-month
lock-in window, no auto-convert, cancel-anytime guarantee. Ships
with a 'Draft — legal review pending' banner so it's honest about
its state.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task F5: Social proof — "Founding customers wanted" placeholder

**Files:**
- Create: `src/pages/landing/SocialProof.tsx`
- Modify: `src/pages/LandingPage.tsx` — insert `<SocialProof />` between `<Benefits />` and `<Pricing />`
- Modify: `public/locales/{en,tr,de}/translation.json` — new `landing.socialProof.*` keys

No faking logos. Ship the absence honestly as a recruiting card.

### Steps

- [ ] **Step 1: Add translation keys**

**EN:**
```json
"socialProof": {
  "eyebrow": "Founding customers",
  "title": "Looking for the first ten fleets who'll set the tone.",
  "body": "We're picking ten founding customers to run the product with us through launch. If you run 5+ trucks in Turkey, have the pain Naklos solves, and want 30% off for 12 months when billing ships — this is for you.",
  "cta": "Talk to us"
}
```

**TR:**
```json
"socialProof": {
  "eyebrow": "Kurucu müşteriler",
  "title": "Tonu belirleyecek ilk on filoyu arıyoruz.",
  "body": "Ürünü lansmana kadar bizimle birlikte çalıştıracak on kurucu müşteri seçiyoruz. Türkiye'de 5+ aracınız varsa, Naklos'un çözdüğü sorunu yaşıyorsanız ve ücretlendirme başladığında 12 ay boyunca %30 indirim istiyorsanız — bu sizin için.",
  "cta": "Bize yazın"
}
```

**DE:**
```json
"socialProof": {
  "eyebrow": "Gründungskunden",
  "title": "Wir suchen die ersten zehn Flotten, die den Ton angeben.",
  "body": "Wir wählen zehn Gründungskunden aus, die das Produkt bis zum Start gemeinsam mit uns betreiben. Wenn Sie 5+ Lkw in der Türkei betreiben, das Problem kennen, das Naklos löst, und 30% Rabatt für 12 Monate wollen, wenn die Abrechnung startet — das ist für Sie.",
  "cta": "Sprechen wir"
}
```

- [ ] **Step 2: Create `src/pages/landing/SocialProof.tsx`**

```tsx
import { ArrowRight, Users } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function SocialProof() {
  const { t } = useTranslation();

  const scrollToContact = () => {
    document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="relative max-w-5xl mx-auto px-4 py-16 md:py-20">
      <div className="bg-white rounded-2xl border border-slate-200 p-8 md:p-12 relative overflow-hidden">
        <span className="absolute top-0 left-0 bottom-0 w-0.5 bg-confirm-500" aria-hidden="true" />
        <div className="flex items-start gap-6">
          <div className="hidden md:flex w-14 h-14 rounded-xl bg-warm-50 text-confirm-600 items-center justify-center flex-shrink-0 border border-slate-100">
            <Users className="w-6 h-6" aria-hidden="true" />
          </div>
          <div className="flex-1">
            <div className="font-serif italic text-sm text-primary-700 mb-2">
              {t('landing.socialProof.eyebrow')}
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight mb-3 leading-tight">
              {t('landing.socialProof.title')}
            </h2>
            <p className="text-slate-600 text-base leading-relaxed mb-6 max-w-2xl">
              {t('landing.socialProof.body')}
            </p>
            <button
              onClick={scrollToContact}
              className="group inline-flex items-center gap-2 px-5 py-3 bg-slate-900 text-white rounded-xl font-semibold hover:bg-slate-800 transition-colors text-sm"
            >
              {t('landing.socialProof.cta')}
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 3: Insert into `LandingPage.tsx`**

Between `<Benefits />` and `<Pricing />`:

```tsx
<Benefits />
<SocialProof />
<Pricing />
```

Import at top: `import SocialProof from './landing/SocialProof';`

- [ ] **Step 4: Extend smoke test + translations test**

In `src/pages/landing/LandingPage.test.tsx`, add to the "renders all major sections" test:
```tsx
expect(screen.getByText(/looking for the first ten fleets/i)).toBeInTheDocument();
```

In `src/pages/landing/translations.test.ts`, extend the required-keys array:
- `landing.socialProof.eyebrow`
- `landing.socialProof.title`
- `landing.socialProof.body`
- `landing.socialProof.cta`

- [ ] **Step 5: Typecheck + test**

```bash
npm run typecheck
npm test
```

All pass.

- [ ] **Step 6: Commit**

```bash
git add src/pages/landing/SocialProof.tsx src/pages/LandingPage.tsx \
        public/locales/en/translation.json public/locales/tr/translation.json public/locales/de/translation.json \
        src/pages/landing/translations.test.ts src/pages/landing/LandingPage.test.tsx
git commit -m "$(cat <<'EOF'
feat(landing): add SocialProof — 'founding customers wanted'

No real logos or testimonials yet — so don't fake them. Section
turns the absence into a recruitment signal: we're picking ten
founding customers, here's what we want, here's what they get
(30% off for 12 months). CTA scrolls to the contact form.

Swaps for a real logo-strip + testimonial block once real data
exists. Until then this is honest, not empty.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task F6: Legal footer — TR B2B trust fields

**Files:**
- Modify: `src/pages/landing/Footer.tsx`
- Create: `src/pages/legal/KvkkPolicyPage.tsx`
- Create: `src/pages/legal/CookiePolicyPage.tsx`
- Modify: `src/App.tsx` — register `/kvkk` and `/cerez-politikasi` routes
- Modify: `public/locales/{en,tr,de}/translation.json` — new keys

Turkish B2B buyers subconsciously check the footer for company legal name, address, vergi office/no, KVKK aydınlatma metni link, çerez politikası. Missing these makes the site feel informal. Legally required anyway once you process personal data.

### Steps

- [ ] **Step 1: Add translation keys**

**EN:**
```json
"footer": {
  "privacy": "Privacy Policy",
  "terms": "Terms of Service",
  "kvkk": "KVKK Notice",
  "cookies": "Cookie Policy",
  "foundingTerms": "Founding access terms",
  "legalHeading": "Naklos Teknoloji Ltd. Şti.",
  "taxLabel": "VKN:",
  "addressLabel": "Adres:",
  "copyright": "© {{year}} Naklos. All rights reserved."
}
```

**TR:**
```json
"footer": {
  "privacy": "Gizlilik Politikası",
  "terms": "Kullanım Koşulları",
  "kvkk": "KVKK Aydınlatma Metni",
  "cookies": "Çerez Politikası",
  "foundingTerms": "Kurucu erişim şartları",
  "legalHeading": "Naklos Teknoloji Ltd. Şti.",
  "taxLabel": "VKN:",
  "addressLabel": "Adres:",
  "copyright": "© {{year}} Naklos. Tüm hakları saklıdır."
}
```

**DE:** (mirror EN semantics, keep Turkish company name as-is since it's a legal entity)
```json
"footer": {
  "privacy": "Datenschutzerklärung",
  "terms": "Nutzungsbedingungen",
  "kvkk": "KVKK-Hinweis",
  "cookies": "Cookie-Richtlinie",
  "foundingTerms": "Gründungszugang-Bedingungen",
  "legalHeading": "Naklos Teknoloji Ltd. Şti.",
  "taxLabel": "Steuernummer:",
  "addressLabel": "Adresse:",
  "copyright": "© {{year}} Naklos. Alle Rechte vorbehalten."
}
```

- [ ] **Step 2: Rewrite `Footer.tsx`**

```tsx
import { Truck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const CONTACT_EMAIL = 'info@naklos.com.tr';

// Legal placeholders — swap for real values once the Ltd. Şti. is registered.
// Leaving 'TBD' here is more honest than an invented tax number; users can
// see the structure is ready.
const TAX_OFFICE = 'TBD';
const TAX_NUMBER = 'TBD';
const ADDRESS_CITY = 'İstanbul, Türkiye';

export default function Footer() {
  const { t } = useTranslation();
  return (
    <footer className="relative border-t border-slate-100 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10 text-sm">
          {/* Brand + legal */}
          <div>
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-7 h-7 rounded-lg bg-primary-700 flex items-center justify-center">
                <Truck className="w-3.5 h-3.5 text-white" aria-hidden="true" />
              </div>
              <span className="font-extrabold text-slate-900 tracking-tight">Naklos</span>
            </div>
            <p className="font-semibold text-slate-700">{t('landing.footer.legalHeading')}</p>
            <p className="text-slate-500 mt-1">{t('landing.footer.addressLabel')} {ADDRESS_CITY}</p>
            <p className="text-slate-500">{t('landing.footer.taxLabel')} {TAX_OFFICE} / {TAX_NUMBER}</p>
          </div>

          {/* Policy links */}
          <div>
            <ul className="space-y-2">
              <li><Link to="/privacy" className="text-slate-600 hover:text-slate-900 transition-colors">{t('landing.footer.privacy')}</Link></li>
              <li><Link to="/terms" className="text-slate-600 hover:text-slate-900 transition-colors">{t('landing.footer.terms')}</Link></li>
              <li><Link to="/kvkk" className="text-slate-600 hover:text-slate-900 transition-colors">{t('landing.footer.kvkk')}</Link></li>
              <li><Link to="/cerez-politikasi" className="text-slate-600 hover:text-slate-900 transition-colors">{t('landing.footer.cookies')}</Link></li>
              <li><Link to="/founding-terms" className="text-slate-600 hover:text-slate-900 transition-colors">{t('landing.footer.foundingTerms')}</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <a href={`mailto:${CONTACT_EMAIL}`} className="text-slate-600 hover:text-slate-900 transition-colors">
              {CONTACT_EMAIL}
            </a>
          </div>
        </div>

        <p className="text-xs text-slate-500 text-center border-t border-slate-100 pt-6">
          {t('landing.footer.copyright', { year: new Date().getFullYear() })}
        </p>
      </div>
    </footer>
  );
}
```

Notes:
- `TAX_OFFICE = 'TBD'` / `TAX_NUMBER = 'TBD'` are placeholders. The user MUST swap these for the real vergi dairesi and VKN once the legal entity is registered. The comment at the top of the file reminds them.
- Address uses `İstanbul, Türkiye` as a generic placeholder — swap for a real address (at minimum district + city, no PO Box) when known.

- [ ] **Step 3: Create placeholder KVKK + Cookie pages**

Both follow the same shape as `FoundingTermsPage` from F4. Translation keys go under new `kvkkPage` and `cookiePage` top-level blocks.

`src/pages/legal/KvkkPolicyPage.tsx`:

```tsx
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function KvkkPolicyPage() {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen bg-warm-50">
      <div className="max-w-3xl mx-auto px-4 py-16">
        <Link to="/" className="text-sm text-slate-500 hover:text-slate-900 mb-8 inline-block">
          ← Naklos
        </Link>

        <div className="bg-attention-50 border border-attention-200 text-attention-700 rounded-xl p-4 mb-8 text-sm">
          <strong>Draft.</strong> {t('kvkkPage.draftBanner')}
        </div>

        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-6">
          {t('kvkkPage.title')}
        </h1>

        <div className="prose prose-slate max-w-none text-slate-700">
          <p>{t('kvkkPage.placeholder')}</p>
          <p className="text-sm text-slate-500 mt-8">{t('kvkkPage.contact')}</p>
        </div>
      </div>
    </div>
  );
}
```

`src/pages/legal/CookiePolicyPage.tsx`: identical structure, different keys (`cookiePage.draftBanner` / `title` / `placeholder` / `contact`).

Translation keys for both pages (sample for TR):

```json
"kvkkPage": {
  "draftBanner": "Bu sayfa KVKK Aydınlatma Metni için taslaktır. Lansmandan önce hukuk müşaviri tarafından nihai hali verilecek.",
  "title": "KVKK Aydınlatma Metni",
  "placeholder": "Naklos Teknoloji Ltd. Şti. olarak, kişisel verilerinizi 6698 sayılı Kişisel Verilerin Korunması Kanunu ('KVKK') kapsamında işliyoruz. Tam metin yakında bu sayfada yayınlanacaktır.",
  "contact": "Sorularınız için info@naklos.com.tr'ye yazabilirsiniz."
},
"cookiePage": {
  "draftBanner": "Bu sayfa Çerez Politikası için taslaktır. Lansmandan önce hukuk müşaviri tarafından nihai hali verilecek.",
  "title": "Çerez Politikası",
  "placeholder": "Web sitemizde oturum yönetimi ve dil tercihiniz için strictly-necessary çerezler kullanıyoruz. Üçüncü-taraf analiz veya pazarlama çerezi kullanmıyoruz. Tam metin yakında bu sayfada yayınlanacaktır.",
  "contact": "Sorularınız için info@naklos.com.tr'ye yazabilirsiniz."
}
```

Provide EN and DE counterparts with semantically equivalent copy.

- [ ] **Step 4: Register routes in `App.tsx`**

Add to every `<Routes>` block that has `/privacy`:

```tsx
import KvkkPolicyPage from './pages/legal/KvkkPolicyPage';
import CookiePolicyPage from './pages/legal/CookiePolicyPage';

<Route path="/kvkk" element={<KvkkPolicyPage />} />
<Route path="/cerez-politikasi" element={<CookiePolicyPage />} />
```

- [ ] **Step 5: Extend smoke + translations tests**

In `LandingPage.test.tsx`, extend the "renders all major sections" test:
```tsx
expect(screen.getByText(/naklos teknoloji ltd/i)).toBeInTheDocument();
expect(screen.getByText(/kvkk/i)).toBeInTheDocument();
```

In `translations.test.ts`, extend required-keys:
- `landing.footer.legalHeading`
- `landing.footer.kvkk`
- `landing.footer.cookies`
- `landing.footer.foundingTerms`
- `kvkkPage.title`
- `cookiePage.title`

- [ ] **Step 6: Typecheck + test + build**

```bash
npm run typecheck
npm test
npm run build
```

All pass. Bundle-size should increase minimally (3 small pages added).

- [ ] **Step 7: Commit**

```bash
git add src/pages/landing/Footer.tsx \
        src/pages/legal/KvkkPolicyPage.tsx src/pages/legal/CookiePolicyPage.tsx \
        src/App.tsx \
        public/locales/en/translation.json public/locales/tr/translation.json public/locales/de/translation.json \
        src/pages/landing/translations.test.ts src/pages/landing/LandingPage.test.tsx
git commit -m "$(cat <<'EOF'
feat(landing): Turkish B2B legal footer + placeholder policy pages

Adds company legal heading, address, and VKN (tax number) fields
to the footer — Turkish B2B buyers subconsciously check for these
and bounce without them. Tax office + number still 'TBD' strings;
swap for real values once the Ltd. Şti. is registered (comment in
Footer.tsx flags this).

Four policy links now in the footer:
- Privacy (existing)
- Terms (existing)
- KVKK Aydınlatma Metni (new, placeholder page with Draft banner)
- Çerez Politikası (new, placeholder page with Draft banner)
- Kurucu erişim şartları (added in F4)

Placeholder pages are labelled 'Draft — legal review pending' and
contain skeleton copy. Lawyer fills in the body before launch.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task F7: Final verification

**Files:** none

- [ ] **Step 1: Full test run**

Run: `npm test 2>&1 | tail -20`
Expected: all passing — the 2 useLanguage failures fixed in F1, plus the new tests added in F3/F5/F6.

- [ ] **Step 2: Full typecheck**

Run: `npm run typecheck`
Expected: clean.

- [ ] **Step 3: Full build**

Run: `npm run build 2>&1 | tail -10`
Expected: clean. Bundle should grow slightly from the 3 new legal pages but stay within reason (each page is ~50-80 lines).

- [ ] **Step 4: Grep for leftover placeholders that shipped by accident**

```bash
grep -rn "TBD" src/pages/landing/ src/pages/legal/ 2>/dev/null | grep -v Footer.tsx
```
Only the `TAX_OFFICE = 'TBD'` and `TAX_NUMBER = 'TBD'` in `Footer.tsx` should appear. Anywhere else is a bug.

- [ ] **Step 5: Visual smoke in browser**

Run: `npm run dev`. Walk the page:
- Hero tagline now says "fuel leak / inspection / license"
- HeroMockup shows 3 real alert rows (not stat tiles)
- Between Benefits and Pricing, the "Founding customers wanted" section renders
- Pricing cards show struck-through ₺199 / ₺149 prices
- Below pricing, "Founding access terms →" link scrolls to `/founding-terms`
- Footer has Ltd. Şti., İstanbul, VKN: TBD, and all 5 policy links
- Click `/founding-terms` — shows the Draft banner + 5 numbered points
- Click `/kvkk` and `/cerez-politikasi` — shows Draft banners + placeholder copy

- [ ] **Step 6: Lighthouse a11y spot-check**

Same as T15 of the prior plan: DevTools → Lighthouse → Accessibility. Target ≥ 90. The legal placeholder pages should come out clean since they're text-only.

- [ ] **Step 7: No commit needed** — verification only.

---

## Notes for the implementer

- **Do not** pre-invent the Ltd. Şti. tax office / number. Real placeholders are worse than visible `TBD` strings.
- **Do not** write actual KVKK or Cookie policy body text — the placeholder copy in the translation files is intentional. A lawyer swaps it in later.
- **Do not** re-order or re-color the feature cards (feedback wanted Docs first / urgent — we're rejecting that; fuel stays first per D3).
- **Do not** add pastel icon chips, colored window dots, or hover-lift on cards (feedback Step 11 regressions — rejected per D4).
- **Do not** touch the backend repo (`naklos/feat/public-lead-endpoint`) — these are pure frontend changes.
- **Do not** merge to `main` until the F1–F6 chain is complete and F7 passes.
