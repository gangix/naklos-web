# Landing Page v2 — Frontend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the existing landing page with a fuel-first, warm-operator-styled v2 that captures high-intent leads via a KVKK-consented form, under a clean per-section component split.

**Architecture:** `src/pages/LandingPage.tsx` becomes a ~80-line composition file. Each section lives under `src/pages/landing/*.tsx` and pulls its own translations via `useTranslation()`. Auth handlers come from `useAuth()` where needed. The contact form submits to `POST /api/public/lead` on the naklos backend (endpoint spec is in `docs/superpowers/specs/2026-04-20-landing-v2-design.md`, implementation is a separate plan in the naklos repo). Form is decoupled from backend readiness: while the endpoint is unavailable, users see a friendly toast directing them to email `info@naklos.com.tr`.

**Tech Stack:** React 19, TypeScript, Tailwind (existing `warm-50`, `urgent-500`, `attention-500`, `confirm-500`, `info-500`, `primary-*` tokens), `react-i18next` (3 locales: tr/en/de), `sonner` for toasts (already wired in `App.tsx`), Vitest + happy-dom + @testing-library/react for tests, Instrument Serif via Google Fonts.

**Branch:** `feat/landing-v2` (already cut from main at `c9d0150`).

**Out of scope for this plan:** backend endpoint `POST /api/public/lead` (separate plan in `naklos` repo), fuel-import tier-gate change (separate plan in `naklos` repo), payment integration, real dashboard screenshot.

**Testing philosophy:** The existing codebase has minimal React component tests (only utility/hook tests). We follow that pattern — full TDD flow only for the ContactForm (real logic), a translation-key alignment test, and a LandingPage composition smoke test. Pure-layout components (Hero, Features, Benefits, etc.) are implemented and verified via `npm run typecheck` + visual browser check. This is YAGNI, not laziness.

---

## File Structure

### Created
```
src/pages/landing/Header.tsx           ~50 lines
src/pages/landing/Hero.tsx             ~80 lines
src/pages/landing/HeroMockup.tsx       ~110 lines (StatTile + PriorityRow internal)
src/pages/landing/HowItWorks.tsx       ~40 lines
src/pages/landing/Features.tsx         ~55 lines (tone-stripe cards)
src/pages/landing/Benefits.tsx         ~35 lines
src/pages/landing/Pricing.tsx          ~140 lines (founding banner + 4 tiers)
src/pages/landing/ContactForm.tsx      ~200 lines (form + validation + POST + tests sidecar)
src/pages/landing/Footer.tsx           ~35 lines
src/pages/landing/leadSource.ts        ~10 lines (module-level source tracker)
src/pages/landing/ContactForm.test.tsx ~150 lines (TDD)
src/pages/landing/LandingPage.test.tsx ~40 lines (composition smoke test)
src/pages/landing/translations.test.ts ~50 lines (key alignment across tr/en/de)
```

### Modified
```
src/pages/LandingPage.tsx              631 → ~80 lines (composition only)
public/locales/tr/translation.json     landing.* rewritten
public/locales/en/translation.json     landing.* rewritten
public/locales/de/translation.json     landing.* rewritten
index.html                             add Instrument Serif Google Font
tailwind.config.js                     add font-serif token
```

---

## Task 1: Add Instrument Serif font + tailwind font-serif token

**Files:**
- Modify: `index.html`
- Modify: `tailwind.config.js`

- [ ] **Step 1: Add Google Fonts link to `index.html`**

Open `index.html` and inside the `<head>`, after existing `<link>` tags (or at the end of head if none), add:

```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link
  href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&display=swap"
  rel="stylesheet"
/>
```

- [ ] **Step 2: Extend Tailwind fontFamily**

In `tailwind.config.js`, in `theme.extend.fontFamily`, add a `serif` entry:

```js
fontFamily: {
  sans: ['Plus Jakarta Sans', 'system-ui', 'sans-serif'],
  mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
  serif: ['Instrument Serif', 'ui-serif', 'serif'],
},
```

- [ ] **Step 3: Verify typecheck passes**

Run: `npm run typecheck`
Expected: no errors.

- [ ] **Step 4: Verify font loads in browser**

Run: `npm run dev`
Open the app, inspect any page. In DevTools → Network, filter on "fonts" — confirm Instrument Serif files load from `fonts.gstatic.com`.

- [ ] **Step 5: Commit**

```bash
git add index.html tailwind.config.js
git commit -m "feat(landing): add Instrument Serif font for section eyebrows

Prep for warm-operator aesthetic on landing v2. Instrument Serif
will be used for small italicized section eyebrows only; body
and headlines stay on Plus Jakarta Sans.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 2: Rewrite landing translations across tr / en / de

**Files:**
- Modify: `public/locales/en/translation.json`
- Modify: `public/locales/tr/translation.json`
- Modify: `public/locales/de/translation.json`

These are large edits. The existing `LandingPage.tsx` on main still references old keys (`landing.pricing.startFree`, `landing.contact.cta`). We keep those keys in this commit with their current values so the existing page continues to render until Task 12 swaps it out. The new keys are added alongside.

- [ ] **Step 1: Edit `public/locales/en/translation.json`**

Find the `"landing": { … }` block (around line 1794 on main). Replace its contents entirely with:

```json
"landing": {
  "nav": { "login": "Log in" },
  "hero": {
    "badge": "For Turkish SMB fleets · KVKK-compliant",
    "title1": "Your fuel cards are leaking.",
    "title2": "We show you where.",
    "tagline": "Per-vehicle anomaly rules flag suspicious fill-ups the moment they happen. Inspection, license and insurance — all on the same screen.",
    "ctaPrimary": "Start free",
    "ctaPrimarySub": "No credit card. No sales call.",
    "ctaSecondary": "I have an account",
    "ctaGoogle": "Continue with Google",
    "preview": {
      "label": "Today's priorities",
      "stat1Label": "Vehicles",
      "stat2Label": "Drivers",
      "stat3Label": "Fuel alerts",
      "priorityTitle": "Top priorities",
      "priorityItem1": "34 ABC 123 · Inspection · 2 days",
      "priorityItem2": "07 XYZ 300 · Insurance · 8 days",
      "priorityCta": "Open"
    }
  },
  "howItWorks": {
    "eyebrow": "How it works",
    "title": "Three steps — data to action",
    "subtitle": "15-minute setup. First anomaly within a week.",
    "steps": {
      "s1": {
        "title": "Upload your Excel",
        "desc": "Export from OPET, Shell, BP — plus your vehicle and driver list. Import in 15 minutes."
      },
      "s2": {
        "title": "Configure thresholds",
        "desc": "Tank capacity, L/100 km anomaly threshold, how many days ahead to warn on docs. Your rules."
      },
      "s3": {
        "title": "Get alerted",
        "desc": "Suspicious fill-up → email in minutes. Expiring document → 30 days ahead. Monthly performance report."
      }
    }
  },
  "features": {
    "fuel": {
      "title": "Your cards spend. Which ones aren't driving?",
      "description": "Per-vehicle anomaly rules flag suspicious fill-ups. Email alert in minutes. Built for the way fuel cards actually get abused in Turkey."
    },
    "docs": {
      "title": "30-day warning before every roadside check",
      "description": "Inspection, license, SRC, K-belge, insurance — automatic reminders before expiry. Avoid ₺2,000–₺10,000 fines."
    },
    "vehicles": {
      "title": "Know which truck burns 22 L/100km, and which burns 28",
      "description": "L/100 km, cost per km, side-by-side comparison. The efficient vs. the expensive, with numbers."
    },
    "drivers": {
      "title": "Paste the Excel. We take it from there.",
      "description": "Bulk-import vehicles, drivers and fuel transactions. No GPS box, no terminal, no hardware."
    }
  },
  "benefits": {
    "title": "Goodbye, spreadsheets.",
    "items": {
      "b1": "Built for the owner checking the phone at 2 AM — not the accountant in Excel.",
      "b2": "Email alert the moment litre-per-100km goes past your threshold.",
      "b3": "No GPS box, no terminal, no installation — your fuel-card Excel is enough.",
      "b4": "Founding access — free during rollout, 30% off lock-in when billing ships.",
      "b5": "Turkish-first. KVKK-compliant. Email support."
    },
    "cta": "Try it now"
  },
  "pricing": {
    "eyebrow": "PRICING",
    "title": "Pricing that makes sense.",
    "subtitle": "Per truck, per month. Plain pricing. No hardware, no contracts.",
    "foundingBanner": "Founding customers lock in 30% off for 12 months when billing ships.",
    "tiers": {
      "free": "Starter",
      "pro": "Owner",
      "business": "Business",
      "enterprise": "Enterprise"
    },
    "popular": "Most Popular",
    "free": "Free",
    "freeSub": "founding access · free during rollout",
    "perMonth": "/truck/mo",
    "contactPrice": "Contact us",
    "contactUs": "Talk to us",
    "foundingCta": "Get founding access",
    "proPrice": "₺199",
    "businessPrice": "₺149",
    "businessNote": "25+ trucks",
    "features": {
      "trucks5": "All modules enabled",
      "trucks25": "Volume discount (25%)",
      "trucks100": "Custom pricing",
      "trucksUnlimited": "Unlimited vehicles",
      "drivers5": "No credit card needed",
      "drivers25": "For 25+ trucks",
      "drivers100": "For 100+ trucks",
      "driversUnlimited": "Custom integration + API",
      "docsAndEmails": "Document tracking + alerts",
      "fuelPerformance": "Fuel anomaly + performance",
      "weeklyDigest": "Weekly fleet digest",
      "bulkImport": "Bulk Excel import",
      "apiAccess": "API access",
      "prioritySupport": "Email priority support"
    }
  },
  "contact": {
    "title": "Talk to a human",
    "subtitle": "Questions about a tier, a custom integration, or a fleet under 5 trucks? Drop a note — we reply within 1 business day.",
    "form": {
      "name": "Your name",
      "email": "Email address",
      "phone": "Phone (optional)",
      "company": "Company (optional)",
      "fleetSize": "How many trucks?",
      "fleetSizeOptions": {
        "xs": "1–5",
        "s": "6–25",
        "m": "26–100",
        "l": "100+"
      },
      "message": "Anything we should know? (optional)",
      "consent": "I consent to Naklos processing my contact data per the Privacy Policy to respond to this inquiry.",
      "submit": "Send",
      "submitting": "Sending…",
      "success": "Thanks — we'll reply within 1 business day.",
      "errorGeneric": "Something went wrong. Try again, or email info@naklos.com.tr directly.",
      "errorRateLimit": "You've sent this a few times already. Please wait a bit before trying again.",
      "validationRequired": "Required.",
      "validationEmail": "Enter a valid email.",
      "validationConsent": "Please accept the privacy policy to continue."
    }
  },
  "footer": {
    "privacy": "Privacy Policy",
    "terms": "Terms of Service",
    "copyright": "© {{year}} Naklos. All rights reserved."
  }
}
```

Note: keys `fuelPerformanceDenied` (from main) is removed — fuel is open to all tiers now. Key `startFree` is removed in favor of `foundingCta`.

- [ ] **Step 2: Edit `public/locales/tr/translation.json`**

Replace the `"landing"` block with the Turkish version. TR is the primary market; prioritize natural Turkish idiom over literal translation. The wedge H1 "Your fuel cards are leaking / We show you where" should feel native:

```json
"landing": {
  "nav": { "login": "Giriş yap" },
  "hero": {
    "badge": "Türk KOBİ filoları için · KVKK uyumlu",
    "title1": "Yakıt kartlarınızda sızıntı var.",
    "title2": "Size nerede olduğunu gösteriyoruz.",
    "tagline": "Araç bazlı anomali kuralları, şüpheli dolumları anında yakalar. Muayene, ehliyet ve sigorta da aynı ekranda.",
    "ctaPrimary": "Ücretsiz başla",
    "ctaPrimarySub": "Kart yok. Satış görüşmesi yok.",
    "ctaSecondary": "Hesabım var",
    "ctaGoogle": "Google ile devam et",
    "preview": {
      "label": "Bugünün öncelikleri",
      "stat1Label": "Araçlar",
      "stat2Label": "Sürücüler",
      "stat3Label": "Yakıt uyarıları",
      "priorityTitle": "Bugün senin için",
      "priorityItem1": "34 ABC 123 · Muayene · 2 gün",
      "priorityItem2": "07 XYZ 300 · Sigorta · 8 gün",
      "priorityCta": "Aç"
    }
  },
  "howItWorks": {
    "eyebrow": "Nasıl çalışır",
    "title": "Üç adımda — veriden aksiyona",
    "subtitle": "15 dakikalık kurulum. İlk anomali bir hafta içinde.",
    "steps": {
      "s1": {
        "title": "Excel'ini yükle",
        "desc": "OPET, Shell, BP ekstreni — ve araç/sürücü listeni. 15 dakikada içeride."
      },
      "s2": {
        "title": "Eşikleri belirle",
        "desc": "Depo kapasitesi, L/100 km anomali eşiği, belge uyarı süresi. Kurallar senin."
      },
      "s3": {
        "title": "Uyarıları al",
        "desc": "Şüpheli dolum → dakikalar içinde e-posta. Biten belge → 30 gün önceden. Aylık performans raporu."
      }
    }
  },
  "features": {
    "fuel": {
      "title": "Yakıt kartların harcıyor. Hangisi yol yapmıyor?",
      "description": "Araç bazlı anomali kuralları şüpheli dolumları işaretler. Dakikalar içinde e-posta uyarı. Türkiye'de yakıt kartlarının nasıl suistimal edildiğini bilerek tasarlandı."
    },
    "docs": {
      "title": "Her yol kontrolünden 30 gün önce uyarı",
      "description": "Muayene, ehliyet, SRC, K-belgesi, sigorta — bitiş öncesi otomatik hatırlatma. ₺2.000–₺10.000 cezalardan kaçın."
    },
    "vehicles": {
      "title": "Hangi kamyon 22 L/100km yakıyor, hangisi 28",
      "description": "L/100 km, km başına maliyet, yan yana karşılaştırma. Verimli olan, olmayan — rakamlarla."
    },
    "drivers": {
      "title": "Excel'i yapıştır. Gerisini biz hallederiz.",
      "description": "Araç, sürücü ve yakıt hareketlerini toplu olarak içeri aktar. GPS kutusu, terminal, donanım yok."
    }
  },
  "benefits": {
    "title": "Excel'e elveda.",
    "items": {
      "b1": "Excel'deki muhasebeciye değil, gece 2'de telefonuna bakan patrona göre.",
      "b2": "Litre/100km eşiğini aştığı anda e-posta uyarı.",
      "b3": "GPS kutusu, terminal, kurulum yok — mevcut yakıt kartı Excel'in yeter.",
      "b4": "Kurucu erişim — lansman boyunca ücretsiz, faturalamaya geçtiğimizde 12 ay %30 kilit.",
      "b5": "Türkçe öncelikli. KVKK uyumlu. E-posta destek."
    },
    "cta": "Şimdi dene"
  },
  "pricing": {
    "eyebrow": "FİYATLANDIRMA",
    "title": "Anlaşılır fiyatlandırma.",
    "subtitle": "Araç başına, ay başına. Düz fiyat. Donanım yok, kontrat yok.",
    "foundingBanner": "Kurucu müşteriler, faturalamaya geçtiğimizde 12 ay boyunca %30 indirim kilitler.",
    "tiers": {
      "free": "Starter",
      "pro": "Sahip",
      "business": "Kurumsal",
      "enterprise": "Enterprise"
    },
    "popular": "En Popüler",
    "free": "Ücretsiz",
    "freeSub": "kurucu erişim · lansman boyunca ücretsiz",
    "perMonth": "/araç/ay",
    "contactPrice": "Bize ulaşın",
    "contactUs": "Konuşalım",
    "foundingCta": "Kurucu erişim al",
    "proPrice": "₺199",
    "businessPrice": "₺149",
    "businessNote": "25+ araç",
    "features": {
      "trucks5": "Tüm modüller açık",
      "trucks25": "Hacim indirimi (%25)",
      "trucks100": "Özel fiyatlandırma",
      "trucksUnlimited": "Sınırsız araç",
      "drivers5": "Kredi kartı gerekmez",
      "drivers25": "25+ araç için",
      "drivers100": "100+ araç için",
      "driversUnlimited": "Özel entegrasyon + API",
      "docsAndEmails": "Belge takibi + uyarılar",
      "fuelPerformance": "Yakıt anomalisi + performans",
      "weeklyDigest": "Haftalık filo özeti",
      "bulkImport": "Toplu Excel içe aktarma",
      "apiAccess": "API erişimi",
      "prioritySupport": "E-posta öncelikli destek"
    }
  },
  "contact": {
    "title": "Bir insanla konuş",
    "subtitle": "Bir fiyat tarifesi, özel entegrasyon ya da 5 aracın altında bir filo mu? Bir not bırak — 1 iş günü içinde dönüyoruz.",
    "form": {
      "name": "Adın",
      "email": "E-posta adresi",
      "phone": "Telefon (opsiyonel)",
      "company": "Şirket (opsiyonel)",
      "fleetSize": "Kaç araç?",
      "fleetSizeOptions": {
        "xs": "1–5",
        "s": "6–25",
        "m": "26–100",
        "l": "100+"
      },
      "message": "Bilmemiz gereken bir şey var mı? (opsiyonel)",
      "consent": "Bu talebe dönüş yapabilmesi için Naklos'un iletişim verilerimi Gizlilik Politikası uyarınca işlemesine onay veriyorum.",
      "submit": "Gönder",
      "submitting": "Gönderiliyor…",
      "success": "Teşekkürler — 1 iş günü içinde döneceğiz.",
      "errorGeneric": "Bir şeyler ters gitti. Tekrar dene ya da doğrudan info@naklos.com.tr'ye yaz.",
      "errorRateLimit": "Bunu birkaç defa gönderdin. Biraz bekleyip tekrar dener misin?",
      "validationRequired": "Zorunlu.",
      "validationEmail": "Geçerli bir e-posta gir.",
      "validationConsent": "Devam etmek için gizlilik politikasını kabul et."
    }
  },
  "footer": {
    "privacy": "Gizlilik Politikası",
    "terms": "Kullanım Koşulları",
    "copyright": "© {{year}} Naklos. Tüm hakları saklıdır."
  }
}
```

- [ ] **Step 3: Edit `public/locales/de/translation.json`**

Replace the `"landing"` block with the German version (semantic mirror of EN, no cultural re-interpretation needed for this audience):

```json
"landing": {
  "nav": { "login": "Anmelden" },
  "hero": {
    "badge": "Für türkische KMU-Flotten · KVKK-konform",
    "title1": "Ihre Tankkarten verlieren Geld.",
    "title2": "Wir zeigen Ihnen wo.",
    "tagline": "Fahrzeugbezogene Anomalieregeln markieren verdächtige Tankvorgänge in dem Moment, in dem sie passieren. Inspektion, Führerschein und Versicherung — alles auf einem Bildschirm.",
    "ctaPrimary": "Kostenlos starten",
    "ctaPrimarySub": "Keine Kreditkarte. Kein Verkaufsgespräch.",
    "ctaSecondary": "Ich habe ein Konto",
    "ctaGoogle": "Mit Google fortfahren",
    "preview": {
      "label": "Heutige Prioritäten",
      "stat1Label": "Fahrzeuge",
      "stat2Label": "Fahrer",
      "stat3Label": "Kraftstoff-Warnungen",
      "priorityTitle": "Top-Prioritäten",
      "priorityItem1": "34 ABC 123 · Inspektion · 2 Tage",
      "priorityItem2": "07 XYZ 300 · Versicherung · 8 Tage",
      "priorityCta": "Öffnen"
    }
  },
  "howItWorks": {
    "eyebrow": "So funktioniert's",
    "title": "Drei Schritte — von Daten zur Aktion",
    "subtitle": "15 Minuten Setup. Erste Anomalie in einer Woche.",
    "steps": {
      "s1": {
        "title": "Laden Sie Ihr Excel hoch",
        "desc": "Export von OPET, Shell, BP — plus Ihre Fahrzeug- und Fahrerliste. In 15 Minuten importiert."
      },
      "s2": {
        "title": "Schwellenwerte einstellen",
        "desc": "Tankvolumen, L/100 km Anomalieschwelle, Vorwarnzeit für Dokumente. Ihre Regeln."
      },
      "s3": {
        "title": "Warnungen erhalten",
        "desc": "Verdächtige Tankung → E-Mail innerhalb von Minuten. Ablaufendes Dokument → 30 Tage vorher. Monatlicher Leistungsbericht."
      }
    }
  },
  "features": {
    "fuel": {
      "title": "Ihre Karten geben aus. Welche davon fahren nicht?",
      "description": "Fahrzeugbezogene Anomalieregeln markieren verdächtige Tankvorgänge. E-Mail-Warnung in Minuten. Gebaut für die Art, wie Tankkarten in der Türkei tatsächlich missbraucht werden."
    },
    "docs": {
      "title": "30 Tage Vorwarnung vor jeder Straßenkontrolle",
      "description": "Inspektion, Führerschein, SRC, K-Belge, Versicherung — automatische Erinnerungen vor Ablauf. Vermeiden Sie ₺2.000–₺10.000 Strafen."
    },
    "vehicles": {
      "title": "Welcher Lkw verbraucht 22 L/100km, und welcher 28",
      "description": "L/100 km, Kosten pro km, Side-by-Side-Vergleich. Das Effiziente gegen das Teure — mit Zahlen."
    },
    "drivers": {
      "title": "Fügen Sie das Excel ein. Den Rest übernehmen wir.",
      "description": "Massenimport von Fahrzeugen, Fahrern und Tankvorgängen. Keine GPS-Box, kein Terminal, keine Hardware."
    }
  },
  "benefits": {
    "title": "Auf Wiedersehen, Tabellenkalkulationen.",
    "items": {
      "b1": "Gebaut für den Eigentümer, der um 2 Uhr morgens aufs Handy schaut — nicht für den Buchhalter in Excel.",
      "b2": "E-Mail-Warnung in dem Moment, in dem Liter pro 100km Ihre Schwelle überschreitet.",
      "b3": "Keine GPS-Box, kein Terminal, keine Installation — Ihr bestehendes Tankkarten-Excel reicht.",
      "b4": "Gründungszugang — kostenlos während des Rollouts, 30% Rabatt für 12 Monate bei Abrechnungsstart.",
      "b5": "Türkisch zuerst. KVKK-konform. E-Mail-Support."
    },
    "cta": "Jetzt ausprobieren"
  },
  "pricing": {
    "eyebrow": "PREISE",
    "title": "Preise, die Sinn machen.",
    "subtitle": "Pro Lkw, pro Monat. Klare Preise. Keine Hardware, keine Verträge.",
    "foundingBanner": "Gründungskunden sichern sich 30% Rabatt für 12 Monate, wenn die Abrechnung startet.",
    "tiers": {
      "free": "Starter",
      "pro": "Owner",
      "business": "Business",
      "enterprise": "Enterprise"
    },
    "popular": "Am Beliebtesten",
    "free": "Kostenlos",
    "freeSub": "Gründungszugang · kostenlos während Rollout",
    "perMonth": "/Lkw/Monat",
    "contactPrice": "Kontakt",
    "contactUs": "Sprechen wir",
    "foundingCta": "Gründungszugang erhalten",
    "proPrice": "₺199",
    "businessPrice": "₺149",
    "businessNote": "25+ Lkw",
    "features": {
      "trucks5": "Alle Module aktiv",
      "trucks25": "Mengenrabatt (25%)",
      "trucks100": "Individuelle Preise",
      "trucksUnlimited": "Unbegrenzte Fahrzeuge",
      "drivers5": "Keine Kreditkarte nötig",
      "drivers25": "Für 25+ Lkw",
      "drivers100": "Für 100+ Lkw",
      "driversUnlimited": "Individuelle Integration + API",
      "docsAndEmails": "Dokumentenverfolgung + Warnungen",
      "fuelPerformance": "Kraftstoff-Anomalie + Leistung",
      "weeklyDigest": "Wöchentliche Flottenübersicht",
      "bulkImport": "Excel-Massenimport",
      "apiAccess": "API-Zugang",
      "prioritySupport": "E-Mail-Prioritätssupport"
    }
  },
  "contact": {
    "title": "Mit einem Menschen sprechen",
    "subtitle": "Fragen zu einem Tarif, einer individuellen Integration oder einer Flotte unter 5 Lkw? Hinterlassen Sie eine Nachricht — wir antworten innerhalb von 1 Werktag.",
    "form": {
      "name": "Ihr Name",
      "email": "E-Mail-Adresse",
      "phone": "Telefon (optional)",
      "company": "Unternehmen (optional)",
      "fleetSize": "Wie viele Lkw?",
      "fleetSizeOptions": {
        "xs": "1–5",
        "s": "6–25",
        "m": "26–100",
        "l": "100+"
      },
      "message": "Gibt es etwas, das wir wissen sollten? (optional)",
      "consent": "Ich stimme zu, dass Naklos meine Kontaktdaten gemäß der Datenschutzerklärung verarbeitet, um auf diese Anfrage zu antworten.",
      "submit": "Senden",
      "submitting": "Wird gesendet…",
      "success": "Danke — wir antworten innerhalb von 1 Werktag.",
      "errorGeneric": "Etwas ist schiefgelaufen. Versuchen Sie es erneut oder schreiben Sie direkt an info@naklos.com.tr.",
      "errorRateLimit": "Sie haben dies schon einige Male gesendet. Bitte warten Sie einen Moment und versuchen Sie es erneut.",
      "validationRequired": "Erforderlich.",
      "validationEmail": "Gültige E-Mail eingeben.",
      "validationConsent": "Bitte akzeptieren Sie die Datenschutzerklärung, um fortzufahren."
    }
  },
  "footer": {
    "privacy": "Datenschutzerklärung",
    "terms": "Nutzungsbedingungen",
    "copyright": "© {{year}} Naklos. Alle Rechte vorbehalten."
  }
}
```

- [ ] **Step 4: Verify JSON validity**

Run: `node -e "JSON.parse(require('fs').readFileSync('public/locales/en/translation.json'))" && node -e "JSON.parse(require('fs').readFileSync('public/locales/tr/translation.json'))" && node -e "JSON.parse(require('fs').readFileSync('public/locales/de/translation.json'))"`
Expected: no output (all valid JSON).

- [ ] **Step 5: Verify typecheck passes**

Run: `npm run typecheck`
Expected: no errors.

- [ ] **Step 6: Verify existing landing page still renders**

Run: `npm run dev`. Open `/` in the browser. The page should render with the NEW copy (hero now says "Your fuel cards are leaking" etc.) — because the existing `LandingPage.tsx` reads these same keys. This confirms translations are wired. Some keys the old page uses (e.g. `fuelPerformanceDenied`) are gone, which will cause `t()` fallback-to-key behavior on those lines — that's expected until Task 12 rewrites the page.

- [ ] **Step 7: Commit**

```bash
git add public/locales/en/translation.json public/locales/tr/translation.json public/locales/de/translation.json
git commit -m "feat(landing): rewrite landing translations for v2 wedge + founding access

Rewrites all landing.* keys across tr/en/de with fuel-first wedge
copy, founding-access pricing framing, new howItWorks section, and
KVKK-consented contact form strings. Drops fuelPerformanceDenied
(fuel is now open on all tiers). Drops startFree in favor of
foundingCta.

See docs/superpowers/specs/2026-04-20-landing-v2-design.md §5.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 3: Create `src/pages/landing/leadSource.ts` module + `Header.tsx`

**Files:**
- Create: `src/pages/landing/leadSource.ts`
- Create: `src/pages/landing/Header.tsx`

- [ ] **Step 1: Create `src/pages/landing/leadSource.ts`**

```ts
// Tracks which landing surface triggered a ContactForm submission.
// Pricing's "Enterprise" CTA calls setLeadSource('enterprise-pricing')
// before scrolling to #contact. ContactForm reads this on submit and
// resets to 'contact' after.
export type LeadSource = 'contact' | 'enterprise-pricing';

let current: LeadSource = 'contact';

export const getLeadSource = (): LeadSource => current;
export const setLeadSource = (source: LeadSource): void => {
  current = source;
};
export const resetLeadSource = (): void => {
  current = 'contact';
};
```

- [ ] **Step 2: Create `src/pages/landing/Header.tsx`**

```tsx
import { Truck } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import LanguageSwitcher from '../../components/common/LanguageSwitcher';

export default function Header() {
  const { t } = useTranslation();
  const { login } = useAuth();

  return (
    <header className="relative bg-white/90 backdrop-blur-md border-b border-slate-200 sticky top-0 z-20">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-primary-700 flex items-center justify-center">
            <Truck className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-extrabold tracking-tight text-slate-900">Naklos</span>
        </div>
        <div className="flex items-center gap-1">
          <LanguageSwitcher variant="light" />
          <div className="w-px h-5 bg-slate-200 mx-1" aria-hidden="true" />
          <button
            onClick={login}
            className="px-4 py-2 text-sm font-semibold text-primary-700 hover:text-primary-800 hover:bg-primary-50 rounded-lg transition-colors"
          >
            {t('landing.nav.login')}
          </button>
        </div>
      </div>
    </header>
  );
}
```

Aesthetic notes applied: solid `bg-primary-700` on logo tile (no gradient), slate-200 borders, color-change-only hover (no motion).

- [ ] **Step 3: Verify typecheck passes**

Run: `npm run typecheck`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/pages/landing/leadSource.ts src/pages/landing/Header.tsx
git commit -m "feat(landing): extract Header and add leadSource module

- Header.tsx: sticky top bar, logo, language switcher, login button.
  Solid primary-700 logo tile (no gradient) per warm-operator direction.
- leadSource.ts: module-level tracker so Pricing's Enterprise CTA can
  flag the ContactForm submission source without React state lifting.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 4: Extract `HeroMockup.tsx`

**Files:**
- Create: `src/pages/landing/HeroMockup.tsx`

Warm-operator changes vs the branch version: remove the gradient soft-glow behind the mockup, remove pastel icon backgrounds on `StatTile`, use solid shadow on the floating "%91" pill.

- [ ] **Step 1: Create `src/pages/landing/HeroMockup.tsx`**

```tsx
import { Truck, Users, Fuel } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function HeroMockup() {
  const { t } = useTranslation();

  return (
    <div className="relative mx-auto max-w-lg">
      {/* Browser chrome */}
      <div className="relative rounded-2xl bg-white shadow-[0_30px_80px_-20px_rgba(15,23,42,0.25)] ring-1 ring-slate-200 overflow-hidden">
        <div className="flex items-center gap-1.5 px-3 h-8 border-b border-slate-100 bg-slate-50">
          <span className="w-2.5 h-2.5 rounded-full bg-slate-300" />
          <span className="w-2.5 h-2.5 rounded-full bg-slate-300" />
          <span className="w-2.5 h-2.5 rounded-full bg-slate-300" />
          <span className="ml-3 flex-1 text-[10px] text-slate-400 font-mono truncate">
            naklos.com.tr/manager/dashboard
          </span>
        </div>

        <div className="bg-warm-50 p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1.5">
              <div className="w-5 h-5 rounded-md bg-primary-700 flex items-center justify-center">
                <Truck className="w-3 h-3 text-white" />
              </div>
              <span className="text-[11px] font-extrabold text-slate-900 tracking-tight">Naklos</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-primary-50 text-primary-700 font-bold">PRO</span>
              <span className="w-5 h-5 rounded-full bg-slate-200" />
            </div>
          </div>

          <div className="mb-3">
            <div className="text-[9px] uppercase tracking-wider text-slate-400 font-semibold">
              {t('landing.hero.preview.label')}
            </div>
            <div className="h-4 w-28 mt-1 rounded bg-slate-200/80" />
          </div>

          <div className="grid grid-cols-3 gap-2 mb-3">
            <StatTile label={t('landing.hero.preview.stat1Label')} value="24" icon={<Truck className="w-3 h-3" />} />
            <StatTile label={t('landing.hero.preview.stat2Label')} value="18" icon={<Users className="w-3 h-3" />} />
            <StatTile label={t('landing.hero.preview.stat3Label')} value="3" alarm icon={<Fuel className="w-3 h-3" />} />
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-2.5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                {t('landing.hero.preview.priorityTitle')}
              </span>
              <span className="text-[9px] text-slate-400 tabular-nums">2</span>
            </div>
            <div className="space-y-1.5">
              <PriorityRow label={t('landing.hero.preview.priorityItem1')} tone="urgent" cta={t('landing.hero.preview.priorityCta')} />
              <PriorityRow label={t('landing.hero.preview.priorityItem2')} tone="attention" cta={t('landing.hero.preview.priorityCta')} />
            </div>
          </div>
        </div>
      </div>

      {/* Floating efficiency pill */}
      <div className="absolute -bottom-5 -right-5 bg-white rounded-xl shadow-[0_12px_30px_-10px_rgba(15,23,42,0.3)] ring-1 ring-slate-200 px-3 py-2 hidden sm:block">
        <div className="text-[9px] uppercase tracking-wider text-confirm-600 font-bold">
          {t('landing.features.fuel.title')}
        </div>
        <div className="text-lg font-extrabold text-slate-900 tabular-nums leading-none">%91</div>
      </div>
    </div>
  );
}

function StatTile({
  label, value, icon, alarm,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  alarm?: boolean;
}) {
  return (
    <div className={`rounded-lg p-2 border ${alarm ? 'border-attention-200 bg-attention-50/50' : 'border-slate-100 bg-white'}`}>
      <div className="w-5 h-5 rounded flex items-center justify-center mb-1 text-slate-500">
        {icon}
      </div>
      <div className="text-sm font-extrabold text-slate-900 tabular-nums leading-none">{value}</div>
      <div className="text-[9px] uppercase tracking-wider text-slate-400 font-semibold mt-1 truncate">{label}</div>
    </div>
  );
}

function PriorityRow({ label, tone, cta }: {
  label: string;
  tone: 'urgent' | 'attention';
  cta: string;
}) {
  const bar = tone === 'urgent' ? 'bg-urgent-500' : 'bg-attention-500';
  const btn = tone === 'urgent' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700';
  return (
    <div className="rounded-md bg-slate-50 border border-slate-100 overflow-hidden flex items-stretch">
      <span className={`w-0.5 ${bar}`} aria-hidden="true" />
      <div className="flex-1 flex items-center justify-between px-2 py-1.5">
        <span className="text-[10px] font-semibold text-slate-700 truncate">{label}</span>
        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${btn} flex-shrink-0 ml-2`}>{cta}</span>
      </div>
    </div>
  );
}
```

Note: `attention-200` is referenced — not defined in `tailwind.config.js` (only 50/100/500/600/700). Fix this in the same step below.

- [ ] **Step 2: Ensure `attention-200` exists in tailwind config**

Open `tailwind.config.js`. In `theme.extend.colors.attention`, add a `200` step:

```js
attention: { 50:'#fffbeb', 100:'#fef3c7', 200:'#fde68a', 500:'#d97706', 600:'#b45309', 700:'#92400e' },
```

- [ ] **Step 3: Verify typecheck passes**

Run: `npm run typecheck`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/pages/landing/HeroMockup.tsx tailwind.config.js
git commit -m "feat(landing): extract HeroMockup with warm-operator aesthetic

- Moves the stylized dashboard preview out of LandingPage.tsx.
- Drops the primary→blue→emerald gradient soft-glow (no gradients per
  warm-operator direction).
- Drops pastel tile backgrounds on StatTile (slate-500 icons only).
- Body uses bg-warm-50 matching landing background.
- Adds attention-200 step to tailwind config for the alarm-state tile.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 5: Create `Hero.tsx`

**Files:**
- Create: `src/pages/landing/Hero.tsx`

- [ ] **Step 1: Create the file**

```tsx
import { ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import HeroMockup from './HeroMockup';

export default function Hero() {
  const { t } = useTranslation();
  const { loginWith, register } = useAuth();

  return (
    <section className="relative max-w-6xl mx-auto px-4 pt-16 pb-16 md:pt-24 md:pb-24">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-10 items-center">
        <div className="text-center lg:text-left">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary-50 text-primary-700 rounded-full text-xs font-semibold mb-8 border border-primary-100">
            <span className="w-1.5 h-1.5 bg-primary-600 rounded-full" />
            {t('landing.hero.badge')}
          </div>

          <h1 className="text-5xl md:text-6xl lg:text-[64px] font-extrabold text-slate-900 mb-6 leading-[1.05] tracking-tight">
            {t('landing.hero.title1')}
            <br />
            <span className="text-primary-700">{t('landing.hero.title2')}</span>
          </h1>

          <p className="text-lg text-slate-600 max-w-lg mx-auto lg:mx-0 mb-10 leading-relaxed">
            {t('landing.hero.tagline')}
          </p>

          <div className="flex flex-col sm:flex-row items-center lg:items-start justify-center lg:justify-start gap-3 mb-3">
            <button
              onClick={register}
              className="group w-full sm:w-auto px-8 py-4 bg-primary-700 text-white rounded-xl font-bold text-base hover:bg-primary-800 transition-colors flex items-center justify-center gap-2"
            >
              {t('landing.hero.ctaPrimary')}
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </button>
            <a
              href="#login"
              onClick={(e) => { e.preventDefault(); }}
              className="w-full sm:w-auto px-8 py-4 bg-white text-slate-700 rounded-xl font-semibold border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-colors text-base"
            >
              {t('landing.hero.ctaSecondary')}
            </a>
          </div>

          <p className="text-sm text-slate-600 mb-8 text-center lg:text-left">
            {t('landing.hero.ctaPrimarySub')}
          </p>

          <div className="max-w-sm mx-auto lg:mx-0">
            <button
              onClick={() => loginWith('google')}
              className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl font-medium text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-colors flex items-center justify-center gap-3 text-sm"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              {t('landing.hero.ctaGoogle')}
            </button>
          </div>
        </div>

        <div className="relative mt-4 lg:mt-0">
          <HeroMockup />
        </div>
      </div>
    </section>
  );
}
```

Warm-operator changes from the branch version: no H1 gradient (solid slate-900 with primary-700 accent on title2), no hover-lift on buttons, no pulsing badge dot, promoted `ctaPrimarySub` from `text-gray-400` to `text-slate-600`. Secondary CTA "I have an account" uses `login()` via AuthContext — but `useAuth()` returns `login`, so update:

Actually, re-read `useAuth()` — it returns `login`, `loginWith`, `register`. The secondary CTA should call `login()`. Replace the `<a href="#login" onClick...>` hack with:

```tsx
<button
  onClick={login}
  className="w-full sm:w-auto px-8 py-4 bg-white text-slate-700 rounded-xl font-semibold border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-colors text-base"
>
  {t('landing.hero.ctaSecondary')}
</button>
```

And destructure `login` from `useAuth()`:

```tsx
const { login, loginWith, register } = useAuth();
```

- [ ] **Step 2: Verify typecheck passes**

Run: `npm run typecheck`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/pages/landing/Hero.tsx
git commit -m "feat(landing): extract Hero section with warm-operator treatment

- Solid slate-900 H1 with primary-700 accent on title2 (no gradient).
- No hover-lift on buttons; color transitions only.
- Promoted ctaPrimarySub from gray-400 to slate-600 for readability.
- Login handler wired for 'I have an account' CTA.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 6: Create `HowItWorks.tsx` (new section)

**Files:**
- Create: `src/pages/landing/HowItWorks.tsx`

- [ ] **Step 1: Create the file**

```tsx
import { Upload, Sliders, Bell } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function HowItWorks() {
  const { t } = useTranslation();

  const steps = [
    { icon: Upload,   titleKey: 'landing.howItWorks.steps.s1.title', descKey: 'landing.howItWorks.steps.s1.desc' },
    { icon: Sliders,  titleKey: 'landing.howItWorks.steps.s2.title', descKey: 'landing.howItWorks.steps.s2.desc' },
    { icon: Bell,     titleKey: 'landing.howItWorks.steps.s3.title', descKey: 'landing.howItWorks.steps.s3.desc' },
  ];

  return (
    <section className="relative bg-white py-20 md:py-24 border-y border-slate-100">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-12">
          <div className="inline-block font-serif italic text-sm text-primary-700 mb-3">
            {t('landing.howItWorks.eyebrow')}
          </div>
          <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight mb-3">
            {t('landing.howItWorks.title')}
          </h2>
          <p className="text-slate-600 text-base max-w-xl mx-auto">
            {t('landing.howItWorks.subtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {steps.map((step, i) => {
            const Icon = step.icon;
            return (
              <div
                key={step.titleKey}
                className="relative bg-warm-50 rounded-2xl p-6 border border-slate-100"
              >
                <div className="absolute -top-3 -left-3 w-9 h-9 rounded-xl bg-primary-700 text-white flex items-center justify-center font-extrabold text-sm">
                  {i + 1}
                </div>
                <div className="w-11 h-11 rounded-xl bg-white text-primary-700 flex items-center justify-center mb-4 border border-slate-100">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-900 mb-2 text-base">{t(step.titleKey)}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{t(step.descKey)}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
```

Warm-operator: eyebrow uses `font-serif italic` (Instrument Serif from Task 1). Step numbers use solid `bg-primary-700`. Cards use `bg-warm-50` for the warm paper feel.

- [ ] **Step 2: Verify typecheck passes**

Run: `npm run typecheck`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/pages/landing/HowItWorks.tsx
git commit -m "feat(landing): add HowItWorks 3-step section

New section between Hero and Features. Answers 'what do I actually
have to do to get value' — one of the biggest gaps on main. Eyebrow
uses Instrument Serif italic per warm-operator direction.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 7: Create `Features.tsx` with tone-stripe cards

**Files:**
- Create: `src/pages/landing/Features.tsx`

Fuel-first order per spec §5.3. Cards use 2px left tone-stripes (urgent/attention/info/confirm) instead of pastel icon tiles.

- [ ] **Step 1: Create the file**

```tsx
import { Fuel, AlertTriangle, Truck, Upload } from 'lucide-react';
import { useTranslation } from 'react-i18next';

type Tone = 'urgent' | 'attention' | 'info' | 'confirm';

const toneStripe: Record<Tone, string> = {
  urgent:    'bg-urgent-500',
  attention: 'bg-attention-500',
  info:      'bg-info-500',
  confirm:   'bg-confirm-500',
};

const toneIcon: Record<Tone, string> = {
  urgent:    'text-urgent-600',
  attention: 'text-attention-600',
  info:      'text-info-600',
  confirm:   'text-confirm-600',
};

export default function Features() {
  const { t } = useTranslation();

  const features: Array<{ icon: typeof Fuel; titleKey: string; descKey: string; tone: Tone }> = [
    { icon: Fuel,           titleKey: 'landing.features.fuel.title',     descKey: 'landing.features.fuel.description',     tone: 'urgent' },
    { icon: AlertTriangle,  titleKey: 'landing.features.docs.title',     descKey: 'landing.features.docs.description',     tone: 'attention' },
    { icon: Truck,          titleKey: 'landing.features.vehicles.title', descKey: 'landing.features.vehicles.description', tone: 'info' },
    { icon: Upload,         titleKey: 'landing.features.drivers.title',  descKey: 'landing.features.drivers.description',  tone: 'confirm' },
  ];

  return (
    <section className="relative max-w-6xl mx-auto px-4 py-16 md:py-24">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {features.map((feature) => {
          const Icon = feature.icon;
          return (
            <div
              key={feature.titleKey}
              className="group relative bg-white rounded-2xl p-6 border border-slate-200 overflow-hidden hover:border-slate-300 transition-colors"
            >
              <span className={`absolute top-0 left-0 bottom-0 w-0.5 ${toneStripe[feature.tone]}`} aria-hidden="true" />
              <div className={`w-11 h-11 rounded-xl bg-warm-50 ${toneIcon[feature.tone]} flex items-center justify-center mb-5 border border-slate-100`}>
                <Icon className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 mb-2 text-[15px]">{t(feature.titleKey)}</h3>
              <p className="text-sm text-slate-600 leading-relaxed">{t(feature.descKey)}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
```

Note: fuel card (most important) gets `urgent-500` stripe — draws the eye first. This matches the semantic palette the app uses internally (urgent = things that need action now).

- [ ] **Step 2: Verify typecheck passes**

Run: `npm run typecheck`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/pages/landing/Features.tsx
git commit -m "feat(landing): add fuel-first Features grid with tone stripes

- Fuel card leads with urgent-500 left stripe (draws the eye).
- Docs: attention-500. Vehicles: info-500. Setup: confirm-500.
- Icon tile uses warm-50 bg + tone-colored icon (no pastel fills).
- Color-change-only hover (no hover-lift).

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 8: Create `Benefits.tsx`

**Files:**
- Create: `src/pages/landing/Benefits.tsx`

- [ ] **Step 1: Create the file**

```tsx
import { ArrowRight, Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';

export default function Benefits() {
  const { t } = useTranslation();
  const { register } = useAuth();

  const items = [
    t('landing.benefits.items.b1'),
    t('landing.benefits.items.b2'),
    t('landing.benefits.items.b3'),
    t('landing.benefits.items.b4'),
    t('landing.benefits.items.b5'),
  ];

  return (
    <section className="relative bg-white py-20 md:py-24 border-y border-slate-100">
      <div className="max-w-5xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-5 tracking-tight leading-tight">
              {t('landing.benefits.title')}
            </h2>
            <button
              onClick={register}
              className="group mt-3 px-6 py-3.5 bg-slate-900 text-white rounded-xl font-semibold hover:bg-slate-800 transition-colors flex items-center gap-2"
            >
              {t('landing.benefits.cta')}
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
          <div className="bg-warm-50 rounded-2xl p-8 border border-slate-200">
            <ul className="space-y-4">
              {items.map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-5 h-5 rounded-full bg-confirm-500/15 text-confirm-600 flex items-center justify-center mt-0.5">
                    <Check className="w-3 h-3" strokeWidth={3} />
                  </div>
                  <span className="text-slate-700 text-[15px] leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Verify typecheck passes**

Run: `npm run typecheck`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/pages/landing/Benefits.tsx
git commit -m "feat(landing): add Benefits section

Operator-voiced bullet list on warm-50 card. Check icons use
confirm-500 tone (green) matching the app's semantic palette.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 9: Create `Pricing.tsx` with founding banner

**Files:**
- Create: `src/pages/landing/Pricing.tsx`

All non-Enterprise tier CTAs = "Get founding access" → `register()`. Enterprise CTA = "Talk to us" → scrolls to `#contact` and sets `leadSource` to `'enterprise-pricing'`.

- [ ] **Step 1: Create the file**

```tsx
import { Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { setLeadSource } from './leadSource';

export default function Pricing() {
  const { t } = useTranslation();
  const { register } = useAuth();

  const handleEnterpriseClick = () => {
    setLeadSource('enterprise-pricing');
    document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section id="pricing" className="relative py-20 md:py-28 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-block font-serif italic text-sm text-primary-700 mb-3">
            {t('landing.pricing.eyebrow')}
          </div>
          <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight mb-3">
            {t('landing.pricing.title')}
          </h2>
          <p className="text-slate-600 text-base max-w-xl mx-auto">
            {t('landing.pricing.subtitle')}
          </p>
        </div>

        {/* Founding banner */}
        <div className="max-w-3xl mx-auto mb-12 px-5 py-3 rounded-xl bg-primary-50 border border-primary-100 text-center">
          <span className="text-sm font-semibold text-primary-800">
            {t('landing.pricing.foundingBanner')}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 items-start">
          {/* Starter */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 transition-colors hover:border-slate-300">
            <h3 className="text-sm font-bold text-slate-900 mb-1">{t('landing.pricing.tiers.free')}</h3>
            <div className="mb-1">
              <span className="text-2xl font-extrabold text-slate-900 tracking-tight">{t('landing.pricing.free')}</span>
            </div>
            <p className="text-xs text-slate-500 mb-5">{t('landing.pricing.freeSub')}</p>
            <ul className="space-y-3 mb-8 text-sm text-slate-700">
              <li className="flex items-center gap-2.5"><Check className="w-4 h-4 text-confirm-600 flex-shrink-0" /> {t('landing.pricing.features.trucks5')}</li>
              <li className="flex items-center gap-2.5"><Check className="w-4 h-4 text-confirm-600 flex-shrink-0" /> {t('landing.pricing.features.fuelPerformance')}</li>
              <li className="flex items-center gap-2.5"><Check className="w-4 h-4 text-confirm-600 flex-shrink-0" /> {t('landing.pricing.features.docsAndEmails')}</li>
              <li className="flex items-center gap-2.5"><Check className="w-4 h-4 text-confirm-600 flex-shrink-0" /> {t('landing.pricing.features.bulkImport')}</li>
              <li className="flex items-center gap-2.5"><Check className="w-4 h-4 text-confirm-600 flex-shrink-0" /> {t('landing.pricing.features.drivers5')}</li>
            </ul>
            <button
              onClick={register}
              className="w-full py-3 bg-slate-100 text-slate-800 rounded-xl font-semibold hover:bg-slate-200 transition-colors text-sm"
            >
              {t('landing.pricing.foundingCta')}
            </button>
          </div>

          {/* Owner — highlighted */}
          <div className="bg-white rounded-2xl border-2 border-primary-600 p-6 transition-colors relative lg:scale-[1.03]">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <span className="bg-primary-700 text-white text-[11px] font-bold px-3 py-1 rounded-full tracking-wide">
                {t('landing.pricing.popular')}
              </span>
            </div>
            <h3 className="text-sm font-bold text-primary-800 mb-1">{t('landing.pricing.tiers.pro')}</h3>
            <div className="mb-5">
              <span className="text-3xl font-extrabold text-slate-900 tracking-tight tabular-nums">{t('landing.pricing.proPrice')}</span>
              <span className="text-sm text-slate-500 font-medium">{t('landing.pricing.perMonth')}</span>
            </div>
            <ul className="space-y-3 mb-8 text-sm text-slate-700">
              <li className="flex items-center gap-2.5"><Check className="w-4 h-4 text-confirm-600 flex-shrink-0" /> {t('landing.pricing.features.fuelPerformance')}</li>
              <li className="flex items-center gap-2.5"><Check className="w-4 h-4 text-confirm-600 flex-shrink-0" /> {t('landing.pricing.features.docsAndEmails')}</li>
              <li className="flex items-center gap-2.5"><Check className="w-4 h-4 text-confirm-600 flex-shrink-0" /> {t('landing.pricing.features.bulkImport')}</li>
              <li className="flex items-center gap-2.5"><Check className="w-4 h-4 text-confirm-600 flex-shrink-0" /> {t('landing.pricing.features.weeklyDigest')}</li>
              <li className="flex items-center gap-2.5"><Check className="w-4 h-4 text-confirm-600 flex-shrink-0" /> {t('landing.pricing.features.prioritySupport')}</li>
            </ul>
            <button
              onClick={register}
              className="w-full py-3 bg-primary-700 text-white rounded-xl font-semibold hover:bg-primary-800 transition-colors text-sm"
            >
              {t('landing.pricing.foundingCta')}
            </button>
          </div>

          {/* Business */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 transition-colors hover:border-slate-300">
            <h3 className="text-sm font-bold text-slate-900 mb-1">{t('landing.pricing.tiers.business')}</h3>
            <div className="mb-1">
              <span className="text-3xl font-extrabold text-slate-900 tracking-tight tabular-nums">{t('landing.pricing.businessPrice')}</span>
              <span className="text-sm text-slate-500 font-medium">{t('landing.pricing.perMonth')}</span>
            </div>
            <p className="text-xs text-slate-500 mb-5">{t('landing.pricing.businessNote')}</p>
            <ul className="space-y-3 mb-8 text-sm text-slate-700">
              <li className="flex items-center gap-2.5"><Check className="w-4 h-4 text-confirm-600 flex-shrink-0" /> {t('landing.pricing.features.fuelPerformance')}</li>
              <li className="flex items-center gap-2.5"><Check className="w-4 h-4 text-confirm-600 flex-shrink-0" /> {t('landing.pricing.features.docsAndEmails')}</li>
              <li className="flex items-center gap-2.5"><Check className="w-4 h-4 text-confirm-600 flex-shrink-0" /> {t('landing.pricing.features.bulkImport')}</li>
              <li className="flex items-center gap-2.5"><Check className="w-4 h-4 text-confirm-600 flex-shrink-0" /> {t('landing.pricing.features.weeklyDigest')}</li>
              <li className="flex items-center gap-2.5"><Check className="w-4 h-4 text-confirm-600 flex-shrink-0" /> {t('landing.pricing.features.trucks25')}</li>
            </ul>
            <button
              onClick={register}
              className="w-full py-3 bg-slate-900 text-white rounded-xl font-semibold hover:bg-slate-800 transition-colors text-sm"
            >
              {t('landing.pricing.foundingCta')}
            </button>
          </div>

          {/* Enterprise */}
          <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 transition-colors">
            <h3 className="text-sm font-bold text-slate-300 mb-1">{t('landing.pricing.tiers.enterprise')}</h3>
            <div className="mb-5">
              <span className="text-2xl font-extrabold text-white tracking-tight">{t('landing.pricing.contactPrice')}</span>
            </div>
            <ul className="space-y-3 mb-8 text-sm text-slate-400">
              <li className="flex items-center gap-2.5"><Check className="w-4 h-4 text-confirm-500 flex-shrink-0" /> {t('landing.pricing.features.trucksUnlimited')}</li>
              <li className="flex items-center gap-2.5"><Check className="w-4 h-4 text-confirm-500 flex-shrink-0" /> {t('landing.pricing.features.driversUnlimited')}</li>
              <li className="flex items-center gap-2.5"><Check className="w-4 h-4 text-confirm-500 flex-shrink-0" /> {t('landing.pricing.features.apiAccess')}</li>
              <li className="flex items-center gap-2.5"><Check className="w-4 h-4 text-confirm-500 flex-shrink-0" /> {t('landing.pricing.features.prioritySupport')}</li>
            </ul>
            <button
              onClick={handleEnterpriseClick}
              className="w-full py-3 bg-white text-slate-900 rounded-xl font-semibold hover:bg-slate-100 transition-colors text-sm"
            >
              {t('landing.pricing.contactUs')}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Verify typecheck passes**

Run: `npm run typecheck`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/pages/landing/Pricing.tsx
git commit -m "feat(landing): add Pricing section with founding banner

- 4 tiers: Starter (free, founding access), Owner (₺199/truck, most
  popular), Business (₺149/truck at 25+), Enterprise (contact).
- All non-Enterprise CTAs call register() — single self-serve funnel.
- Enterprise CTA sets leadSource='enterprise-pricing' and scrolls to
  #contact.
- Founding banner above grid: 30% off for 12 months lock-in.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 10: Create `ContactForm.tsx` + TDD tests

**Files:**
- Create: `src/pages/landing/ContactForm.tsx`
- Create: `src/pages/landing/ContactForm.test.tsx`

This is the one component with real logic — validation, consent, POST, error branches. TDD flow applies.

- [ ] **Step 1: Write the failing test**

Create `src/pages/landing/ContactForm.test.tsx`:

```tsx
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { toast } from 'sonner';
import ContactForm from './ContactForm';
import { setLeadSource, getLeadSource } from './leadSource';

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Minimal i18n setup for tests
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
      // name and email and consent required
      expect(screen.getAllByText(/required/i).length).toBeGreaterThanOrEqual(1);
    });
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it('blocks submission when consent is not accepted', async () => {
    renderForm();
    fireEvent.change(screen.getByLabelText(/your name/i), { target: { value: 'Ali' } });
    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'ali@example.com' } });
    fireEvent.change(screen.getByLabelText(/how many trucks/i), { target: { value: '6-25' } });
    // consent checkbox NOT clicked
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
    expect(getLeadSource()).toBe('contact'); // reset after submit
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- src/pages/landing/ContactForm.test.tsx`
Expected: FAIL with "Cannot find module './ContactForm'" — the component doesn't exist yet.

- [ ] **Step 3: Create `src/pages/landing/ContactForm.tsx`**

```tsx
import { useState, FormEvent } from 'react';
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
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npm test -- src/pages/landing/ContactForm.test.tsx`
Expected: all tests PASS.

If any fail, fix the component (not the test) until all pass.

- [ ] **Step 5: Verify typecheck passes**

Run: `npm run typecheck`
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add src/pages/landing/ContactForm.tsx src/pages/landing/ContactForm.test.tsx
git commit -m "feat(landing): add KVKK-consented ContactForm with POST /api/public/lead

- Fields: name, email, phone, company, fleet size, message, consent.
- Inline validation: name/email/fleet-size required, email format,
  consent required.
- Consent captured with version (2026-04-20-v1) + locale for KVKK
  audit trail.
- POSTs to /api/public/lead. On success: toast + reset form + reset
  leadSource. On 429: rate-limit toast. On any other error: generic
  toast pointing to info@naklos.com.tr.
- Reads leadSource (set by Pricing's Enterprise CTA) on submit.
- Tests cover all validation paths and all fetch response branches.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 11: Create `Footer.tsx`

**Files:**
- Create: `src/pages/landing/Footer.tsx`

- [ ] **Step 1: Create the file**

```tsx
import { Truck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const CONTACT_EMAIL = 'info@naklos.com.tr';

export default function Footer() {
  const { t } = useTranslation();
  return (
    <footer className="relative py-12 px-4">
      <div className="max-w-6xl mx-auto text-center text-sm text-slate-500">
        <div className="flex items-center justify-center gap-2.5 mb-4">
          <div className="w-7 h-7 rounded-lg bg-primary-700 flex items-center justify-center">
            <Truck className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="font-extrabold text-slate-900 tracking-tight">Naklos</span>
        </div>
        <div className="flex items-center justify-center gap-6 mb-3">
          <Link to="/privacy" className="hover:text-slate-700 transition-colors">
            {t('landing.footer.privacy')}
          </Link>
          <Link to="/terms" className="hover:text-slate-700 transition-colors">
            {t('landing.footer.terms')}
          </Link>
          <a href={`mailto:${CONTACT_EMAIL}`} className="hover:text-slate-700 transition-colors">
            {CONTACT_EMAIL}
          </a>
        </div>
        <p className="text-slate-500">{t('landing.footer.copyright', { year: new Date().getFullYear() })}</p>
      </div>
    </footer>
  );
}
```

- [ ] **Step 2: Verify typecheck passes**

Run: `npm run typecheck`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/pages/landing/Footer.tsx
git commit -m "feat(landing): extract Footer section

Solid primary-700 logo tile (no gradient). Privacy/terms/email links.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 12: Rewire `LandingPage.tsx` as composition

**Files:**
- Modify: `src/pages/LandingPage.tsx` (rewrite entirely, 631 → ~40 lines)

- [ ] **Step 1: Replace `LandingPage.tsx` contents entirely**

```tsx
import Header from './landing/Header';
import Hero from './landing/Hero';
import HowItWorks from './landing/HowItWorks';
import Features from './landing/Features';
import Benefits from './landing/Benefits';
import Pricing from './landing/Pricing';
import ContactForm from './landing/ContactForm';
import Footer from './landing/Footer';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-warm-50">
      <Header />
      <Hero />
      <HowItWorks />
      <Features />
      <Benefits />
      <Pricing />
      <ContactForm />
      <Footer />
    </div>
  );
}
```

Notes on what's removed compared to main:
- `WHATSAPP_NUMBER`, `WHATSAPP_DISPLAY`, `CONTACT_EMAIL`, `waLink()` — all deleted (WhatsApp surfaces removed).
- Radial dot-grid background `<div className="fixed inset-0 pointer-events-none opacity-[0.35]">` — deleted (warm-operator = `bg-warm-50` only).
- Inline `HeroMockup` + `StatTile` + `PriorityRow` — extracted in Task 4.
- All section JSX — extracted in Tasks 5–11.
- Floating WhatsApp button — deleted.

- [ ] **Step 2: Verify typecheck passes**

Run: `npm run typecheck`
Expected: no errors.

- [ ] **Step 3: Run dev server and visually verify**

Run: `npm run dev`
Open `http://localhost:5173` (or whatever port Vite chose).

Verify:
- Page renders with warm cream background (`#FAFAF7`), no dot grid.
- Hero shows "Your fuel cards are leaking. / **We show you where.**" — title2 in primary blue, NO gradient.
- Badge reads "For Turkish SMB fleets · KVKK-compliant" and has no pulsing animation.
- HeroMockup shows on right, no gradient glow behind it.
- "Start free" and "I have an account" buttons don't lift on hover — color change only.
- "How it works" section exists between hero and features.
- Features grid: fuel card first, with red left stripe; docs with amber; vehicles with blue; setup with green.
- Benefits card has `warm-50` background with checkmark bullets.
- Pricing has a blue founding banner above the 4 tiers. All non-Enterprise CTAs say "Get founding access". Enterprise says "Talk to us".
- Clicking "Talk to us" scrolls smoothly to the Contact section.
- Contact section has the form. Submit without fields shows "Required." errors inline. Submit with valid data (but no backend running) shows the generic error toast.
- Footer is minimal — logo + privacy/terms/email links.
- No floating WhatsApp button anywhere on the page.
- Section eyebrows ("How it works", "PRICING") render in Instrument Serif italic.

- [ ] **Step 4: Run tests**

Run: `npm test`
Expected: all existing tests pass, ContactForm tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/pages/LandingPage.tsx
git commit -m "feat(landing): rewire LandingPage as composition-only

LandingPage.tsx goes from 631 lines (main) to ~25. All section JSX
lives in src/pages/landing/*. Warm-operator aesthetic applied:
bg-warm-50 background, no radial dot grid, no WhatsApp surfaces,
no gradients. HeroMockup extracted. Floating WhatsApp button gone.

Completes the frontend half of the landing v2 spec. Backend endpoint
POST /api/public/lead is a separate plan in the naklos repo; until
that ships, form submissions show a friendly error toast pointing to
info@naklos.com.tr.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 13: Translation-key alignment test

**Files:**
- Create: `src/pages/landing/translations.test.ts`

Catches key drift — a landing.* key added to EN but forgotten in TR or DE is a silent production bug.

- [ ] **Step 1: Write the test**

```ts
import { describe, it, expect } from 'vitest';
import en from '../../../public/locales/en/translation.json';
import tr from '../../../public/locales/tr/translation.json';
import de from '../../../public/locales/de/translation.json';

function flattenKeys(obj: unknown, prefix = ''): string[] {
  if (obj === null || typeof obj !== 'object') return [];
  const keys: string[] = [];
  for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
    const full = prefix ? `${prefix}.${k}` : k;
    if (v !== null && typeof v === 'object' && !Array.isArray(v)) {
      keys.push(...flattenKeys(v, full));
    } else {
      keys.push(full);
    }
  }
  return keys;
}

describe('landing translations alignment', () => {
  const enKeys = flattenKeys(en.landing, 'landing').sort();
  const trKeys = flattenKeys(tr.landing, 'landing').sort();
  const deKeys = flattenKeys(de.landing, 'landing').sort();

  it('EN and TR landing key sets match exactly', () => {
    expect(trKeys).toEqual(enKeys);
  });

  it('EN and DE landing key sets match exactly', () => {
    expect(deKeys).toEqual(enKeys);
  });

  it('no dropped keys remain: landing.audit, landing.whatsappFloat, landing.pricing.startFree, landing.pricing.features.fuelPerformanceDenied', () => {
    const forbidden = [
      'landing.audit',
      'landing.whatsappFloat',
      'landing.pricing.startFree',
      'landing.pricing.features.fuelPerformanceDenied',
      'landing.contact.cta',
    ];
    for (const locale of [enKeys, trKeys, deKeys]) {
      for (const prefix of forbidden) {
        const hit = locale.filter((k) => k === prefix || k.startsWith(prefix + '.'));
        expect(hit, `locale contains forbidden ${prefix}`).toEqual([]);
      }
    }
  });

  it('required new keys exist in all three locales', () => {
    const required = [
      'landing.howItWorks.eyebrow',
      'landing.howItWorks.title',
      'landing.howItWorks.subtitle',
      'landing.howItWorks.steps.s1.title',
      'landing.howItWorks.steps.s2.title',
      'landing.howItWorks.steps.s3.title',
      'landing.hero.ctaPrimarySub',
      'landing.pricing.foundingBanner',
      'landing.pricing.freeSub',
      'landing.pricing.foundingCta',
      'landing.contact.form.submit',
      'landing.contact.form.consent',
      'landing.contact.form.success',
      'landing.contact.form.errorRateLimit',
    ];
    for (const locale of [enKeys, trKeys, deKeys]) {
      for (const key of required) {
        expect(locale, `missing required key ${key}`).toContain(key);
      }
    }
  });
});
```

- [ ] **Step 2: Run the test**

Run: `npm test -- src/pages/landing/translations.test.ts`
Expected: all tests PASS.

If any key is missing in TR or DE, fix `public/locales/tr/translation.json` or `public/locales/de/translation.json` to add it.

- [ ] **Step 3: Commit**

```bash
git add src/pages/landing/translations.test.ts
git commit -m "test(landing): verify translation-key alignment across tr/en/de

Catches silent production bugs where a landing.* key is added to one
locale but forgotten in another. Also asserts that dropped keys
(audit, whatsappFloat, startFree, fuelPerformanceDenied, contact.cta)
remain absent so regressions don't bring them back.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 14: `LandingPage` smoke test

**Files:**
- Create: `src/pages/landing/LandingPage.test.tsx`

Verifies the whole page mounts and major sections are present. Not exhaustive — just catches "did the whole composition break."

- [ ] **Step 1: Write the test**

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import enRes from '../../../public/locales/en/translation.json';
import LandingPage from '../LandingPage';

// Mock AuthContext hook
vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    login: vi.fn(),
    loginWith: vi.fn(),
    register: vi.fn(),
  }),
}));

// Mock LanguageSwitcher (uses useLanguage which depends on keycloak)
vi.mock('../../components/common/LanguageSwitcher', () => ({
  default: () => <div data-testid="language-switcher" />,
}));

const testI18n = i18n.createInstance();
await testI18n.use(initReactI18next).init({
  lng: 'en',
  resources: { en: { translation: enRes } },
});

describe('LandingPage', () => {
  it('renders all major sections', () => {
    render(
      <MemoryRouter>
        <I18nextProvider i18n={testI18n}>
          <LandingPage />
        </I18nextProvider>
      </MemoryRouter>
    );

    // Hero
    expect(screen.getByText(/your fuel cards are leaking/i)).toBeInTheDocument();
    expect(screen.getByText(/we show you where/i)).toBeInTheDocument();

    // How it works — check eyebrow and one step title
    expect(screen.getByText(/how it works/i)).toBeInTheDocument();
    expect(screen.getByText(/upload your excel/i)).toBeInTheDocument();

    // Features — fuel card first
    expect(screen.getByText(/your cards spend/i)).toBeInTheDocument();

    // Benefits
    expect(screen.getByText(/goodbye, spreadsheets/i)).toBeInTheDocument();

    // Pricing
    expect(screen.getByText(/founding customers lock in/i)).toBeInTheDocument();
    expect(screen.getAllByText(/get founding access/i).length).toBeGreaterThanOrEqual(3);

    // Contact
    expect(screen.getByText(/talk to a human/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/your name/i)).toBeInTheDocument();

    // Footer
    expect(screen.getByText(/privacy policy/i)).toBeInTheDocument();
    expect(screen.getByText(/info@naklos\.com\.tr/i)).toBeInTheDocument();
  });

  it('renders no forbidden content (WhatsApp / audit)', () => {
    render(
      <MemoryRouter>
        <I18nextProvider i18n={testI18n}>
          <LandingPage />
        </I18nextProvider>
      </MemoryRouter>
    );

    expect(screen.queryByText(/whatsapp/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/free fuel audit/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/wa\.me/)).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the test**

Run: `npm test -- src/pages/landing/LandingPage.test.tsx`
Expected: all tests PASS.

- [ ] **Step 3: Commit**

```bash
git add src/pages/landing/LandingPage.test.tsx
git commit -m "test(landing): smoke test for full LandingPage composition

Verifies all 8 sections mount and contain their headline content.
Also asserts no WhatsApp or audit content leaks back in.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 15: Final sweep + full verification

**Files:**
- Audit/remove any stale references

- [ ] **Step 1: Grep for leftover WhatsApp / audit / waLink references**

Run: `grep -rn -E "(waLink|WHATSAPP_NUMBER|WHATSAPP_DISPLAY|landing\.audit|landing\.whatsappFloat|fuelPerformanceDenied)" src/ public/locales/ 2>/dev/null`
Expected: no matches.

If any appear, remove them (they're leftovers from main or the wedge draft) and commit.

- [ ] **Step 2: Full test run**

Run: `npm test`
Expected: all tests PASS, including pre-existing tests (`useLanguage`, `rangeSelect`, `fuelAnomaly`).

- [ ] **Step 3: Full typecheck**

Run: `npm run typecheck`
Expected: no errors.

- [ ] **Step 4: Full build**

Run: `npm run build`
Expected: build succeeds. Note any bundle-size warnings — we added Instrument Serif via Google Fonts (external) so no bundle impact.

- [ ] **Step 5: Lint**

Run: `npm run lint`
Expected: no errors. Warnings are acceptable but investigate if there are any about unused imports in the new files.

- [ ] **Step 6: Manual visual smoke test**

Run: `npm run dev`
In the browser, switch between TR / EN / DE via the language switcher. Verify each locale:
- Hero headline feels natural (TR: "Yakıt kartlarınızda sızıntı var.")
- All sections render with their translated copy
- No key-name fallback text (e.g. you should never see raw `landing.foo.bar` strings in the UI)
- Contact form labels translate correctly

- [ ] **Step 7: Lighthouse accessibility audit**

Open the landing page in Chrome → DevTools → Lighthouse → select "Accessibility" + "Desktop" → run audit.
Expected: Accessibility score ≥ 95 (per spec §12).

If below 95, fix issues surfaced by the audit. Most common causes on a landing like this:
- Missing `aria-label` on icon-only buttons
- Insufficient contrast on muted text (tweak from `slate-500` to `slate-600`)
- Form labels not associated with inputs (should be wired via `htmlFor`/`id` — already done in ContactForm)
- Language switcher buttons missing `aria-label` (fix in `LanguageSwitcher.tsx` if needed, but that's outside this plan's scope — flag as separate task)

- [ ] **Step 8: Commit if anything was fixed in step 1 or step 7**

If step 1 found leftover references or step 7 found accessibility issues that you fixed:

```bash
git add -A  # only files you intentionally modified
git commit -m "chore(landing): remove final WhatsApp/audit leftovers

Sweep after the main rewrite to catch any reference missed during
section extraction.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

Otherwise no commit — just confirm clean state.

- [ ] **Step 9: Final state check**

Run: `git log --oneline main..HEAD`
Expected: ~13–15 commits describing the progression from font setup → translations → component extraction → composition rewire → tests → sweep.

Run: `git status`
Expected: clean working tree (or only untracked local strategy docs and screenshots, never tracked files).

---

## Notes for the implementer

- If a `t()` call renders the raw key (e.g. `landing.hero.title1`) in the UI, the translation is missing for that locale. Fix the relevant `translation.json`.
- The `warm` color namespace is already in `tailwind.config.js` (`DEFAULT`, `50`, `100`). If you need a `200` step anywhere and it's missing, add it.
- When Plan B (backend endpoint) ships in the `naklos` repo, the ContactForm starts successfully hitting the real endpoint; no changes needed here.
- The `consent.version` string (`2026-04-20-v1`) is hardcoded in `ContactForm.tsx`. When the privacy policy content changes, bump this value.
- Do not add feature-flag code to hide sections — ship the whole page or don't ship it. If the backend endpoint isn't ready, the form still renders and fails gracefully (toast).
- Do not add analytics events — that's out of scope for this plan.
- The `.docx` / `.pptx` / `SCREENSHOT_GUIDE.md` files in the repo root are intentionally untracked local strategy artifacts. Leave them alone.
