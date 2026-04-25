# Naklos → Lightweight FMS for Small Fleets

**Date:** April 25, 2026 (last updated)
**Author:** Strategy memo for olcay
**Decision pending:** Pivot from B2B freight marketplace → affordable Fleet Management Software (FMS) for small fleets in Turkey + Europe

---

## What's new in this revision

- **Pricing redesigned** to per-vehicle (₺39/vehicle/mo, 5-vehicle minimum, free up to 3) — removes the 10→11 vehicle cliff that the previous flat-rate Starter created.
- **Fuel anomaly engine kept** — corrected from "drop entirely" to "keep, make it opt-in." Driver fuel theft and odometer fraud are real fleet-owner pain.
- **Land-and-expand clarified** — one subscription with all features included; tier upgrades only happen on vehicle-count thresholds, never feature-by-feature.
- **Unit economics added (Section 9)** — honest revenue scenarios at 50, 100, 500, 1,000, and 2,500 fleets, plus TAM/SAM/SOM for Turkey.
- **EU expansion path quantified** — 1 EU customer ≈ 4–5 TR customers in revenue. The lever that turns this from side income into a real business.
- **NEW Section 10:** UX & frontend audit with prioritized findings against the actual codebase.
- **NEW Section 11:** SEO & marketing audit — keyword plan, landing-page architecture, content calendar.
- **NEW Section 12:** 12-week step-by-step roadmap from where the codebase is today to first paying customers.
- **NEW Section 12.5:** Fuel data integration strategy — corrects an earlier misclaim about Shell APIs (Shell *does* offer a public, OAuth-based dev portal), introduces the e-Fatura play as the real Turkey moat, and lays out a phased build plan that ships fast and upsells later. Also introduces a future **Pro+ tier (₺79–99/vehicle)** for premium real-time integrations.
- **NEW Section 14:** Adjacent revenue streams — maintenance shop network, insurance/parts partnerships, and brand sponsorships. Captures the strategic question of "should naklos broker maintenance shops to fleets and earn from shops?" with a tiered build plan and explicit warnings about marketplace timing.
- **EV-readiness note added to Section 12.5** — Hubject (the European EV charging eRoaming network) and Turkish charging operators (ZES, Eşarj, Voltrun) considered. Verdict: defer integration; ship an energy-agnostic data model now so naklos handles ICE + EV without rework. Hubject becomes the right tool only when naklos enters the EU.

---

## TL;DR — Does this idea make sense?

**Yes, conditionally.** The opportunity is real, but the framing needs sharpening. "Compete with fleet.io / Samsara / Arvento" is the wrong mental model — those are global enterprise platforms. The actual market gap, and the one your existing codebase is well-suited for, is:

> A localized, affordable, software-only FMS for **Turkish small fleets (5–25 vehicles)** who currently use Excel + WhatsApp groups and can't justify ₺500+/vehicle/month for Arvento or 30€/vehicle/month for Samsara.

Your real competitor is not Samsara. It's spreadsheets, notebooks, and the dispatcher's memory. Beat that, then expand.

You already have ~70% of the code for this. The pivot is technically cheap. The hard parts are **product focus, distribution, and pricing discipline** — not engineering.

---

## 1. Market reality check

### The market is big and growing
- European fleet management market: **~$9.82B in 2026, 11.5% CAGR through 2034** ([Market Data Forecast](https://www.marketdataforecast.com/market-reports/europe-fleet-management-market)).
- Tailwinds: EU CO2 regulation, Mobility Package, fuel volatility, sustainability mandates.
- SMB segment specifically is moving away from enterprise all-in-ones toward "simpler, focused solutions that solve specific operational pain points" ([G2](https://www.g2.com/categories/fleet-management/small-business)).

### Competitor pricing — the actual landscape

| Player | Pricing | Contract | Hardware | Fit for small TR fleet? |
|---|---|---|---|---|
| **Samsara** | $27–50/vehicle/mo + $99–148 hardware | 3-year minimum, can't remove vehicles mid-contract | Required | ❌ Way too expensive (~$10k upfront for 10 trucks) |
| **Fleetio** | $4–10/vehicle/mo, 5-vehicle min | Month-to-month | Optional, software-first | ⚠️ Affordable but not localized for Turkey |
| **Motive** | ~$35/vehicle/mo | Annual | Required | ❌ Enterprise-priced |
| **FleetRabbit** | $3/vehicle/mo, free ≤3 assets | None | None | ⚠️ Cheap but generic |
| **Geotab** | Mid-tier ($25–45/vehicle/mo) | Annual | Required | ❌ Enterprise-leaning |
| **Arvento** | Bundled hardware+software, ~₺530/mo (12-mo) or ~₺391/mo (24-mo) | 12–24 months | Required | ❌ Hardware-heavy, expensive |
| **Seyir Mobil** | Similar bundle pricing | Multi-year | Required | ❌ Same |
| **Mobiliz / Triomobil / TNB / Fora** | Same bundle pricing | Multi-year | Required | ❌ Same |
| **Türk Telekom M2M Araç Takip** | ₺33.90–67.80/mo (SIM only) | Carrier | Hardware separate | ⚠️ Pure connectivity, not FMS |

**Sources:** [Tech.co Samsara review](https://tech.co/fleet-management/samsara-fleet-management-review), [AirPinpoint Samsara pricing](https://airpinpoint.com/compare/samsara-pricing), [Capterra Fleetio](https://www.capterra.com/p/120855/Fleetio/), [Spytec Fleet Pricing Comparison](https://spytec.com/blogs/news/fleet-tracking-pricing-comparison), [Türk Telekom Araç Takip](https://kurumsal.turktelekom.com.tr/mobil/kampanyalar/arac-takip-kampanyasi), [Ufuk Araç Takip](https://www.ufuk-aractakip.com.tr/arac-takip-cihazlari).

### What small fleet managers actually complain about

From verified reviews (Capterra, G2, Reddit-flavored review aggregators):

1. **Samsara is too expensive for small fleets** and "nickel-and-dimes for every feature" ([oiengine](https://oiengine.com/samsara-fleet-review/)).
2. **3-year lock-in is brutal** — seasonal operations and small fleets need flexibility.
3. **Hardware capex is a barrier** — ~$1,000+ upfront for 10 trucks before the first feature is used.
4. **Feature bloat** — small fleets use 20% of the features but pay for 100%.
5. **Slow support** for accounts under a certain MRR threshold.

This is your wedge. **Affordable. No hardware required. Month-to-month. Localized.**

### The gap in Turkey specifically

Turkish FMS market is **dominated by hardware-bundled telematics players** (Arvento, Seyir Mobil, Mobiliz, etc.) selling to medium-large fleets. The under-served segment:

- 5–25 vehicle operators (electricians, plumbers, regional logistics, construction, courier, service businesses, small carriers)
- Currently managing fleet in Excel + WhatsApp + paper folders
- Care most about: **muayene/sigorta/MTV expiry tracking, fuel cost visibility, driver assignment, basic maintenance schedules**
- Don't need (and can't afford) real-time GPS, dashcams, harsh-braking analytics, ELD compliance

**Nobody is selling them a clean, cheap, Turkish-language software-only FMS.** Fleetio doesn't ship Turkish or KVKK compliance or muayene/MTV expiry tracking out of the box. Arvento's pricing wall is too high.

---

## 2. What you already have (asset inventory)

From the codebase audit:

### Reusable for FMS (~70%)
- **Identity / multi-tenant auth** (Keycloak + RBAC for fleet managers and drivers)
- **Fleet, Truck, Driver core domain** with document expiry fields (insurance, inspection, registration)
- **Document expiry computation** — already in `naklos-web/src/utils/expiry.ts`
- **Fuel import infrastructure** with parsers for Opet XLSX (and an extensible parser framework for Shell, BP, Petrol Ofisi, OPET, etc.) — **this is gold. Turkish fuel cards generate XLSX statements and nobody else parses them well.**
- **Manager dashboard scaffold** with priority briefing widget
- **Driver portal** (mobile-responsive web)
- **i18n** with Turkish + English + German translations
- **Onboarding flow** (FleetSetupPage)

### Drop entirely (~20%)
- `enterprise-module`, `partnership-module`, `discovery-module` (marketplace-only)
- `ClientsPage` / `ClientDetailPage`
- Trip/RFQ/offer/bid workflows

### Keep (correction from earlier draft)
- **Fuel anomaly rule engine** — the existing rules (MultipleFillsSameDay, OffHoursFill, ExceedsTankCapacity, ConsumptionSpike, OdometerImplausible) are directly valuable to small-fleet owners worried about driver fuel skimming, odometer fraud, and mechanical issues. This is *fleet owner pain*, not just marketplace fraud detection. Keep it. Surface it as an opt-in feature ("Yakıt anomali uyarıları") that can be toggled off per fleet — some owners trust their drivers and don't want noise; others care intensely.

### Build for FMS (~30% new effort)
- **Maintenance module** — already in planning (2026-04-25 backend plan), ship it
- **Fuel cost analytics** — replace anomaly feed with consumption trends, cost-per-km, budget vs. actual
- **Pre-trip / post-trip inspection forms** (driver-facing checklists)
- **Document OCR** (nice-to-have for auto-extracting expiry dates from photos)
- **Reminder/notification engine** for expiring docs and due maintenance (infra exists)

### Defer indefinitely
- Real-time GPS tracking, geofencing, driver behavior analytics, dashcams, telematics ingestion. **Do not build these.** They're hardware-heavy, expensive, and not the differentiator.

---

## 3. Sharpened positioning

**Don't say:** "We're like Samsara/Fleetio/Arvento but cheaper."

**Do say:**
> *"Türkiye'deki küçük filolar için Excel'den çıkış. Aracınızın muayene, sigorta, bakım ve yakıt giderlerini tek bir yerden takip edin. Donanım yok, taahhüt yok, 3 araca kadar ücretsiz."*
>
> ("Get out of Excel. Track inspection, insurance, maintenance and fuel for your small fleet in one place. No hardware, no contract, free up to 3 vehicles.")

**Job-to-be-done:** *"As a 12-vehicle small fleet owner, I want to stop forgetting muayene dates and stop hunting for fuel receipts in WhatsApp."*

That's the *painkiller* — the one feature painful enough to make them stop using Excel today and pay ₺249/month. Everything else (maintenance, fuel anomalies, driver portal, cost analytics) is value they discover *after* they're paying — included in the same subscription. **Don't sell modules separately.** That kills SMB conversion. One simple plan, all features included, priced by vehicle count.

The right mental model is **land-and-expand within one subscription**, not module-by-module pricing:

- **Land** with the painkiller (document/muayene/MTV expiry tracking) → they pay Starter.
- **Expand** their usage into maintenance, fuel, drivers → they stick around and don't churn.
- **Upgrade** their tier only when they cross the vehicle threshold (10 → 11 = Pro tier), never feature-by-feature.

Pricing stays dead simple: 3 tiers, all features in every paid tier, scale by vehicle count.

---

## 4. Recommended MVP scope (12 weeks)

Ship in this order, ruthlessly:

### Week 1–4: Get the core into production
- Strip out enterprise/partnership/discovery modules and `ClientsPage`
- Re-skin landing page around FMS positioning
- Polish vehicle list, vehicle detail, driver list
- Document expiry dashboard widget (already partially built)

### Week 5–8: Maintenance + fuel analytics
- Ship the maintenance module backend (per existing 2026-04-25 plan)
- Maintenance schedule UI + due-date dashboard widget
- **Add** fuel cost analytics alongside the existing anomaly engine: monthly cost trends, cost-per-km per vehicle, top-spending drivers. Anomaly feed stays — make it toggleable in settings.
- Reminder emails (docs expiring in 30/14/7 days)

### Week 9–12: Onboarding & first paying customers
- Self-serve signup + Stripe billing (or iyzico for Turkey)
- CSV bulk-import for vehicles & drivers (already exists)
- Free tier (3 vehicles) live
- Driver mobile PWA polish

**Explicitly out of scope:** GPS, geofencing, dashcams, driver behavior, ELD, real-time tracking, route optimization, dispatch.

---

## 5. Pricing — concrete proposal

Localized, TRY for Turkey, EUR for EU later. Land cheap, expand. **Per-vehicle, no tier cliffs** — flat-rate "up to N vehicles" tiers create exactly the kind of pricing jumps (10 vehicles = ₺249, 11 vehicles = ₺429) that make SMB owners churn or game the limit. Avoid them.

| Plan | Price | Notes |
|---|---|---|
| **Free** | ₺0 | Up to 3 vehicles. All core features. |
| **Pro (monthly)** | ₺39 / vehicle / month | 5-vehicle minimum (₺195 floor). All features included, including email-in fuel automation. Month-to-month. |
| **Pro (annual)** | ₺33 / vehicle / month (~15% off) | Same as Pro, paid yearly. Optional — only after PMF. |
| **Pro+** *(future, post-month-6)* | ₺79–99 / vehicle / month | Adds real-time fuel API integrations (Shell OAuth, e-Fatura, eventually Açık Bankacılık). Marketed from day one as "Yakında." |
| **EU Pro** | €4.5 / vehicle / month | (when ready, same per-vehicle structure) |

**Math at different fleet sizes (no cliffs):**

| Vehicles | Monthly | Annual equivalent |
|---|---|---|
| 3 | ₺0 (Free) | — |
| 5 | ₺195 | ₺2,340 |
| 10 | ₺390 | ₺4,680 |
| 11 | ₺429 | ₺5,148 |
| 25 | ₺975 | ₺11,700 |
| 50 | ₺1,950 | ₺23,400 |

**Versus the market at 10 vehicles:**

| Provider | ~Monthly cost (10 vehicles) |
|---|---|
| **naklos Pro** | ₺390 |
| Fleetio Essential | ~₺1,300 ($40) |
| Arvento (24-mo bundle) | ~₺3,910 (₺391 × 10) |
| Samsara | ~₺9,750+ ($300+ plus hardware) |

You're cleanly ~3× cheaper than Fleetio, ~10× cheaper than Arvento, ~25× cheaper than Samsara. That's the wedge.

**Why a 5-vehicle minimum?** Below 5 vehicles the support-cost-to-revenue ratio is bad, and the Free tier already covers that segment. The minimum nudges 4-vehicle fleets either to stay free or to commit to 5+. Standard SaaS pattern — Fleetio uses it too.

**Why no flat-rate "up to 10" tier?** Because it punishes growth. A fleet at 10 vehicles thinking about adding their 11th doesn't want a 70%+ jump in cost. Per-vehicle is smoother, more honest, and easier to defend in conversation: *"Add a truck, pay ₺39 more. Sell a truck, pay ₺39 less."*

**TRY inflation hedge:** review pricing every 6 months and bump in line with TÜFE, with 30 days' notice. Write that into the ToS so it's not a surprise.

**Don't sell annual pre-pay until you have PMF.** Month-to-month builds trust and removes objection #1 ("I don't want to be locked in like Samsara").

---

## 6. Go-to-market — realistic for a solo/small-team build

You're competing on *attention*, not features. Sales motion priorities for first 12 months:

1. **SEO content in Turkish** — high-intent queries: *"araç muayene takibi", "filo yönetimi excel şablonu", "MTV ne zaman ödenir", "fenni muayene takip programı", "yakıt gider takibi"*. Your existing blog infrastructure is reusable.
2. **Direct outreach** — LinkedIn DMs and forum posts to small fleet operators, owner-operators in trade groups (kargo şirketleri Facebook grupları, sektörel WhatsApp gruplari).
3. **Free tier as funnel** — 3-vehicle free plan with clear upgrade prompts when the 4th vehicle is added.
4. **Partnership outreach** — small fleet associations, accounting software (Logo, Mikro), fuel-card aggregators. *"List your partner integrations on naklos."*
5. **Local language + KVKK compliance** — make this explicit in marketing. Turkish fleets care.
6. **One sharp landing page per ICP** — `/elektrikçi`, `/inşaat-firması`, `/lojistik`, `/servis` — each speaks to a different vertical's pain in their language.

**Target:** 50 paying small fleets in Turkey by end of month 6. ARR ≈ ₺150k–₺300k. Not a venture business yet, but a real, defensible side income with a path to scale.

---

## 7. Honest risks to flag

1. **SMB SaaS is hard.** Low ARPU, churn-prone, expensive to acquire. Plan for high churn in year 1; iterate on retention.
2. **TRY volatility.** Revenue in TRY erodes if costs are in USD/EUR. Hedge by pricing reviews quarterly and building EU revenue early.
3. **Solo-founder bandwidth.** Engineering + marketing + sales + support is too much. Either narrow even further (Turkey only, one vertical) or get a co-founder for go-to-market.
4. **"Just spreadsheets" is a tough competitor.** Excel is free. Your value prop must be felt in the first 5 minutes.
5. **Without GPS, some prospects will say "we need tracking."** Have a clear answer: *"We don't sell hardware, but we integrate with your existing tracker"* — even if the integration is a phase-2 promise.
6. **Multi-country (TR + EU) too early.** Recommendation: nail Turkey for 6–12 months before opening Germany. Localization beats expansion.
7. **Free competitors at the bottom.** FleetRabbit free up to 3 will eat your free tier. Your defense is localization (Turkish UX, Turkish fuel-card parsers, KVKK).

---

## 8. Decision points for you

Things only you can answer; pick a lane before week 1:

- **Geographic focus:** Turkey-first for 12 months, or Turkey + Germany simultaneously? *(Strong recommendation: Turkey first.)*
- **ICP:** general "small fleet" or pick a vertical (small carriers / construction / service / delivery)? *(Strong recommendation: stay broad in product, but make 2–3 vertical landing pages for SEO.)*
- **Branding:** keep "naklos" (currently freight-marketplace-coded) or rename for the FMS positioning? *("Naklos" is fine, but the homepage and marketing copy must change. The name doesn't carry marketplace baggage to a new visitor.)*
- **Co-founder / first hire:** do you have anyone to handle marketing & sales, or are you doing both? This determines pace.

---

## 9. What to do this week

1. **Kill the marketplace narrative.** Update the landing page, README, and `naklos-ux-guide.md` to reflect FMS positioning. Don't hide the marketplace work — archive it.
2. **Cut the dead modules.** Disable/archive `enterprise-module`, `partnership-module`, `discovery-module`, and remove their navigation in the frontend. Keep their schemas in the DB for now (cheap to keep, expensive to migrate).
3. **Ship the maintenance module.** It's the highest-leverage missing feature and the plan already exists.
4. **Write 5 SEO articles in Turkish** on the high-intent queries above. Even rough drafts beat nothing.
5. **Talk to 10 small fleet operators** in Turkey this week. Validate the painkiller. Ask: *"How do you currently track muayene? What did you do last time you forgot one?"*

---

*Bottom line: the idea works if you stay disciplined. Don't build Samsara. Build "the thing that gets a 12-vehicle Turkish electrician out of Excel" — and then keep adding adjacent value once they're paying you.*

---

## 9. Unit economics & realistic addressable market

### Revenue scenarios at different scales (avg. 10-vehicle fleet, ₺390/mo)

| Scale | Monthly revenue | Annual ARR | USD equivalent | What it means |
|---|---|---|---|---|
| 50 fleets | ₺19,500 | ₺234,000 | ~$6,000 | Hobby income |
| 100 fleets | ₺39,000 | ₺468,000 | ~$12,000 | Solid side income |
| 250 fleets | ₺97,500 | ₺1.17M | ~$30,000 | Approaching livable |
| 500 fleets | ₺195,000 | ₺2.34M | ~$60,000 | Real business if solo + lean |
| 1,000 fleets | ₺390,000 | ₺4.68M | ~$120,000 | Serious indie SaaS |
| 2,500 fleets | ₺975,000 | ₺11.7M | ~$300,000 | Approaching venture-scale |

### Turkey TAM / SAM / SOM

- **Turkey FMS market:** ~$378M by 2032, **14.27% CAGR** in the small-fleet (<100 vehicles) segment (the fastest-growing) ([Data Bridge](https://www.databridgemarketresearch.com/nucleus/turkey-fleet-management-market)).
- **Light commercial vehicles:** ~322,400 units sold in Turkey in 2025 alone ([Statista](https://www.statista.com/outlook/mmo/commercial-vehicles/light-commercial-vehicles/turkey)).

| Layer | Count | What it means |
|---|---|---|
| **TAM** — Turkish businesses with 5–25 vehicles | ~30,000–80,000 | Everyone you *could* sell to |
| **SAM** — Of those, digitally-receptive | ~6,000–24,000 | Realistic universe over 5+ years |
| **SOM** — Realistic capture in 3–5 years (1–3% of SAM) | ~200–700 | What you'll actually get |

### Where the math gets good: EU expansion

| Metric | Turkey | EU |
|---|---|---|
| Avg fleet revenue (10 vehicles) | ₺390/mo | €45/mo (~₺1,700/mo) |
| Revenue per customer | 1× | ~5× |
| 100 fleets ARR | ~₺468k (~$12k) | ~€54k (~$60k) |

**One EU customer ≈ 4–5 Turkish customers in revenue.** The recommended sequence: Turkey first (12 months) for product-market fit, then Germany/Netherlands/Spain (months 12–24) for revenue.

### Three levers to push the ceiling higher
1. **Move upmarket** to medium fleets (25–100 vehicles) with a Pro tier at ₺99/vehicle and features they need (multi-org, audit logs, API). 50 mid-fleets at ₺2,500 each = same revenue as 320 small fleets.
2. **EU expansion** — same product, ~5× revenue per customer.
3. **Usage-based add-ons** (NOT module-based) — SMS reminders, OCR, accounting integrations. Small per-fleet ARPU bumps on a big base.

### Honest verdict
- **Side project goal:** 100 fleets in 18 months is realistic. Outcome ≈ ₺40k/mo. Pleasant supplement.
- **Livelihood goal:** need 500+ TR fleets *or* EU expansion. Realistic horizon: 24 months.
- **Venture-scale goal:** doesn't fit at this price point. Stay indie.

**Recommended target:** 500 fleets in Turkey + EU launch by end of year 2 → ~₺3–4M ARR (~€80–100k). That's a real business.

---

## 10. UX & frontend review (codebase audit)

*Review applies the design-critique, design-system, accessibility-review, and ux-copy lenses against the actual code in `/naklos-web`.*

### Severity-prioritized findings

| # | Finding | Severity | Effort |
|---|---|---|---|
| 1 | Marketplace IA still visible in nav and i18n: `Müşteriler` (Clients), `Seferler` (Trips), `Faturalar` (Invoices) routes/keys still present | **HIGH** | LOW |
| 2 | Inline expiry not shown on truck list (`TruckTable.tsx`) — owners can't triage urgency without clicking each row | HIGH | LOW |
| 3 | No skeleton loaders — pages flash blank during data load | MEDIUM | LOW |
| 4 | No reusable `Button` / `Modal` / `Card` primitives — boilerplate duplicated across `AddTruckModal`, `AddClientModal`, `DocumentUploadModal`, `BulkImportModal` | MEDIUM | MEDIUM |
| 5 | Plan-gating splits the fuel UX awkwardly — `anomalyUiEnabled` hides the whole "Yakıt" tab on free tier | MEDIUM | MEDIUM |
| 6 | Missing `aria-label` on icon buttons (e.g. `ManagerTopNav.tsx:186`, modal close × buttons) | MEDIUM | LOW |
| 7 | Modal overlays missing `role="dialog"`, `aria-modal="true"`, and focus trap | MEDIUM | LOW |
| 8 | `text-slate-400` on light backgrounds fails WCAG AA contrast (4.1:1 vs required 4.5:1) | MEDIUM | LOW |
| 9 | `FormField.tsx` labels not linked to inputs via `htmlFor` despite using `useId()` — breaks screen readers | MEDIUM | LOW |
| 10 | PWA is a manifest only — no offline strategy, single icon size, no install prompt. Driver portal will fail in field with poor signal | MEDIUM | HIGH |
| 11 | `FleetSetupPage` has no progress indicator, no inline help, no confirmation screen, no sample data | MEDIUM | MEDIUM |
| 12 | Empty-state copy missing for drivers list, fuel alerts list, and several other zero-data screens | LOW | LOW |
| 13 | Form validation rolled by hand — no react-hook-form/zod. Tax ID, email, phone format checks are missing | LOW | MEDIUM |
| 14 | `recharts` and `leaflet` imported but rarely used — bundle bloat | LOW | LOW |
| 15 | No granular error boundaries — one failed query breaks the whole page | LOW | MEDIUM |

### Concrete copy fixes (all in `/public/locales/tr/translation.json`)

| Where | Current | Should be |
|---|---|---|
| Whole `"client"` block (lines 212–227) | "Müşteriler", "Faturalar"… | **Delete** — not an FMS concept |
| Whole `"trip"` block (lines 159–184) | "Seferler", "Hareket"… | **Delete** — not relevant without GPS |
| Whole `"invoice"` block (lines 185–211) | "Ödemeler", "Faturalar" | **Delete** — not an FMS concept |
| Fuel import empty state | (missing) | "Henüz yakıt kaydı yok. Sürücüler mobil uygulamadan kayıt yapabilir." |
| Driver assignment when license expired | (missing) | "Ehliyet tarihi geçmiş, sürücü atama yapılamaz." |
| Plate validation | (missing) | "Bu plaka zaten kayıtlı." |
| Drivers empty state | (missing) | "Sürücü ekleyerek başlayın. Ehliyet ve belge takibini buradan yapabilirsiniz." |

### "Add a truck and set its inspection date" mental-model test
Currently 7 clicks. Trim to 3 by:
1. Adding a "Muayene tarihi" field directly in the **AddTruckModal** (not just on the document upload flow).
2. Surfacing the date as a badge on the truck card — no detail page needed.

### Onboarding gaps (FleetSetupPage + first-run)
- Add a 3-step progress bar: *Şirket → Adres → Onay*.
- Show inline "neden soruyoruz" hints on optional fields.
- After submit, show "Filo oluşturuldu" success state for 2 seconds before redirect.
- On first Dashboard load, render a checklist widget:
  - ☐ İlk aracı ekle
  - ☐ İlk sürücüyü ekle
  - ☐ Sürücüyü araca ata
  - ☐ Muayene/sigorta belgelerini yükle

---

## 11. SEO & marketing review

*Review applies the seo-audit, content-creation, and campaign-plan lenses.*

### Hero / landing page architecture

Current `LandingPage.tsx` mixes marketplace and FMS framing. Replace with a **single-goal landing page** focused on free signup. Top-performing SaaS SMB landing pages convert at 13.5% with a single CTA vs 10.5% with multiple ([SaaS Hero benchmarks](https://www.saashero.net/content/2026-b2b-saas-conversion-benchmarks/)).

Recommended structure:

```
[Hero — under 44 chars headline + 1 subhead + 1 primary CTA + product screenshot]
  H1: "Excel'i bırakın. Filonuzu büyütün."
  Sub: "Türkiye'deki küçük filolar için yakıt, muayene, bakım takibi."
  CTA: "Ücretsiz başla — kart gerekmez"

[Social proof — logos or "X firma kullanıyor" counter once you have customers]

[3-pillar value props with icons — Belgeler / Yakıt / Bakım]
  - "Muayene/MTV/sigorta tarihlerini bir daha unutmayın"
  - "Yakıt fişi nerede? sorununa son"
  - "Bakım takvimleri otomatik hatırlatma ile"

[Product screenshot or short loop — the dashboard with real-looking data]

[Comparison table — naklos vs Excel vs Arvento vs Samsara]

[Pricing — 3 cards: Free / Pro / Annual]

[FAQ — 6–8 questions, KVKK, "donanım gerekiyor mu", iptal koşulları]

[Final CTA + footer]
```

### Turkish keyword plan (initial targets)

These are high-intent commercial queries Turkish small fleet owners actually search. Verify volumes with [Semust](https://semust.com/blog/anahtar-kelime-bulma-araclari) (TR-native), Google Keyword Planner, or Ahrefs:

| Cluster | Seed keywords | Intent | Target page |
|---|---|---|---|
| Inspection compliance | araç muayene takibi, fenni muayene takip programı, muayene tarihi hatırlatma | Pain-aware | Blog post + `/araç-muayene-takibi` landing |
| Insurance/MTV | sigorta yenileme takibi, MTV ödeme tarihi, kasko bitiş tarihi | Pain-aware | Blog post |
| Fleet management software | filo yönetim yazılımı, küçük filo yazılımı, filo takip programı, araç filo yönetimi | Solution-aware | Homepage + comparison page |
| Excel alternatives | filo excel şablonu, araç takip excel, yakıt takip excel | Tool-replacement | Blog post + pricing CTA |
| Vertical pain | nakliye firması yazılımı, kargo firması filo, inşaat aracı takibi, servis aracı takibi | Vertical | One landing per vertical |
| Fuel | yakıt gider takibi, yakıt tüketim raporu, yakıt fişi takip | Solution-aware | Feature page + blog |
| Maintenance | araç bakım takvimi, periyodik bakım takip, oto bakım programı | Solution-aware | Feature page |

### Content calendar — first 8 weeks (1 article/week)

| Week | Title | Cluster | CTA |
|---|---|---|---|
| 1 | "MTV ne zaman ödenir? 2026 takvimi ve hatırlatma yöntemleri" | MTV | Free signup |
| 2 | "Filo yönetiminde Excel'in 5 büyük tuzağı" | Excel alt. | Free trial |
| 3 | "Araç fenni muayene takibi: Hatırlatma sistemi nasıl kurulur?" | Inspection | Free signup |
| 4 | "Küçük filo yakıt giderleri: Tasarruf için 7 ipucu" | Fuel | Demo |
| 5 | "Periyodik bakım takvimi nasıl oluşturulur?" | Maintenance | Free signup |
| 6 | "Arvento vs naklos: Küçük filo için doğru seçim" | Comparison | Pricing |
| 7 | "Sürücü yakıt suistimali nasıl önlenir?" | Anomaly | Demo |
| 8 | "Nakliye firması için 5 kritik takip noktası" | Vertical | Vertical landing |

### Outreach motion (first 50 customers)

1. **Direct LinkedIn DMs** — 20/day to small fleet operators ("filo müdürü", "operasyon müdürü", "filo şefi" titles, ≤25 employees).
2. **Sektörel Facebook/WhatsApp gruplari** — soft-share blog posts with no spam-hooks.
3. **Cold email with KVKK-respecting double opt-in** — to ~500 small fleets sourced from public registries (TOBB, sektör dernekleri).
4. **Product Hunt Türkiye / startups.watch** — when free tier launches.
5. **Partnership outreach** — small fleet associations, accounting software (Logo, Mikro), fuel-card aggregators.

### Email sequences (build with marketing:email-sequence later)
- Welcome (signup → 5 emails over 7 days, each highlighting one feature).
- Activation reminder (no truck added in 48h → "ilk aracını eklemen sadece 2 dakika sürer").
- Trial-ending (day 13 of free → upgrade incentive).
- Win-back (60 days inactive).
- Document expiry digest (weekly summary).

### Analytics & attribution to set up day 1
- **Plausible** or **PostHog EU** (KVKK-friendly).
- Funnel events: `landing_view → signup → fleet_setup_complete → first_truck_added → first_driver_added → first_doc_uploaded → activated → upgraded_to_paid`.
- North Star: % of signups that reach `first_doc_uploaded` within 7 days. Industry benchmark: median TTV 1.5 days for self-serve SMB SaaS.

---

## 12. 12-week step-by-step roadmap

This is the executable plan. Each week has a clear deliverable. Don't skip ahead.

### Phase 1 — Strip the marketplace DNA (Weeks 1–2)

**Goal:** Codebase says "FMS" not "freight marketplace" everywhere a user can see.

1. **Week 1, day 1–2:** Hide the marketplace routes — `/manager/clients`, trip/RFQ pages — behind a feature flag set to OFF. Keep DB schemas; just kill the UI surface.
2. **Week 1, day 3–4:** Delete the `client`, `trip`, `invoice` blocks from `/public/locales/tr/translation.json` (and `en`, `de`).
3. **Week 1, day 5:** Update `LandingPage.tsx` and the public homepage with the new hero/value-prop structure (Section 11).
4. **Week 2, day 1–2:** Update README.md, naklos-ux-guide.md, archive marketplace-era docs into `/docs/archive/marketplace`.
5. **Week 2, day 3–5:** Refresh the manager nav: Dashboard / Trucks / Drivers / Maintenance / Fuel / Settings. Remove Clients link.

**Success metric:** A new user landing on the app sees zero references to "Müşteri / Sefer / Fatura."

### Phase 2 — UX foundation (Weeks 3–4)

**Goal:** Reduce friction in the everyday FMS workflows.

6. **Week 3, day 1–2:** Extract `<Button>`, `<Modal>`, `<Card>` primitives. Replace the 4 modal implementations.
7. **Week 3, day 3–4:** Add `aria-label`s to every icon button. Add `role="dialog"` + focus trap to modals.
8. **Week 3, day 5:** Bump `text-slate-400` → `text-slate-600` on light backgrounds. Verify contrast with axe DevTools.
9. **Week 4, day 1–2:** Add inline `ExpiryBadge` columns to `TrucksPage` and `DriversPage` (muayene, sigorta, ehliyet). Default sort by urgency.
10. **Week 4, day 3:** Add inspection date directly into `AddTruckModal` so no user needs to dig into a sub-tab to set it.
11. **Week 4, day 4–5:** Add skeleton loaders for the 3 most-viewed pages (Dashboard, Trucks, TruckDetail).

**Success metric:** Mental-model test "add a truck and set its inspection date" drops from 7 clicks to 3.

### Phase 3 — Maintenance + onboarding (Weeks 5–6)

**Goal:** Ship the maintenance module and make first-run experience delightful.

12. **Week 5:** Ship the maintenance module backend per the existing `2026-04-25-maintenance-module-backend.md` plan. Schedule CRUD + due-date aggregator.
13. **Week 6, day 1–2:** Maintenance UI — schedule list, due-date dashboard widget, "Bakım yapıldı" log entry.
14. **Week 6, day 3–4:** FleetSetup wizard — 3-step progress bar, inline help, success confirmation screen.
15. **Week 6, day 5:** Dashboard onboarding checklist (4 items, dismisses when complete).

**Success metric:** A new user signs up and reaches `first_doc_uploaded` in under 10 minutes.

### Phase 4 — Fuel + driver portal + reminders (Weeks 7–8)

**Goal:** Kept features polished; communication loop closed.

16. **Week 7, day 1–2:** Consolidate the fuel UX. Fuel anomaly detection becomes a togglable setting (`Yakıt anomali uyarıları: AÇIK/KAPALI`), not a plan-gated feature.
17. **Week 7, day 3–4:** Replace the marketplace-y anomaly feed framing with "Yakıt Sağlığı" ("Fuel Health") — anomalies are surfaced inside a richer cost-trends + cost-per-km dashboard.
18. **Week 7, day 5:** Driver portal polish — bigger touch targets, lighter form fields, faster doc upload flow.
19. **Week 8, day 1–2:** PWA offline support — service-worker cache for last-seen vehicle/driver/doc data; offline.html fallback.
20. **Week 8, day 3–4:** Email reminder cron — docs expiring in 30/14/7/0 days, per-fleet digest.
21. **Week 8, day 5:** Manual end-to-end test of the full onboarding → first-week experience on a real fleet.

**Success metric:** Driver can mark a fuel entry from a poor-signal field site without errors.

### Phase 5 — Marketing infrastructure (Weeks 9–10)

**Goal:** Capture incoming traffic and convert it.

22. **Week 9, day 1:** Rewrite `LandingPage.tsx` with the single-goal architecture from Section 11.
23. **Week 9, day 2:** Build a `/fiyatlandirma` page with a vehicle-count slider + monthly cost calculator.
24. **Week 9, day 3:** Set up Plausible (or PostHog EU). Wire signup → fleet_setup → first_doc_uploaded events.
25. **Week 9, day 4–5:** Write the first 2 SEO articles ("MTV ne zaman ödenir 2026", "Filo Excel'in 5 tuzağı"). Publish on `/blog`.
26. **Week 10, day 1–2:** Stripe (or iyzico for Turkey) billing with the per-vehicle pricing model. Wire to Pro tier.
27. **Week 10, day 3:** Email sequences — welcome (5 emails over 7 days), activation reminder (48h no truck), trial-ending day 13.
28. **Week 10, day 4–5:** Vertical landing pages — `/elektrikçi`, `/inşaat-firması`, `/lojistik`, `/servis`. Each with vertical-specific copy + screenshot.

**Success metric:** End of week 10, signup → activation funnel is instrumented and the paid upgrade path is live.

### Phase 6 — First paying customers (Weeks 11–12)

**Goal:** 25 paying fleets by end of week 12. (Stretch: 50.)

29. **Week 11, day 1:** Public launch — Product Hunt TR, startups.watch, sektörel LinkedIn posts, Twitter/X.
30. **Week 11, day 2–3:** Cold outreach — 20 LinkedIn DMs/day to fleet managers at 5–25 employee operators. Lead with: "İlk 50 firma için ücretsiz onboarding ve süresiz indirim."
31. **Week 11, day 4–5:** Customer interviews — talk to first 10 signups. Watch them onboard live. Note every confusion.
32. **Week 12, day 1–3:** Iterate on the top 3 confusions. Fix immediately.
33. **Week 12, day 4:** Set up retention dashboard — DAU, WAU, churn at 7/30/60 days.
34. **Week 12, day 5:** Write up "Lessons from first 25 customers" — share publicly. Drives more signups.

**Success metric:** 25 paying fleets, ~₺10k MRR, retention dashboard live, clear path to 100 fleets.

---

## 12.5. Fuel data integration strategy

*Added after a deep-dive: how naklos should automate fuel data ingestion — what's possible, what's a moat, what's a trap, and when to build each piece.*

### Why this matters

Manual fuel logging is the single most painful job inside Excel-based fleet management. Owners hate hunting for fişler in WhatsApp groups. *"Yakıt verileri otomatik aksın"* is one of the strongest marketing hooks naklos has — possibly the strongest.

So the strategic question is **not** "should we automate fuel ingestion?" — yes, obviously. The questions are:

1. **What does "automation" mean to a customer?**
2. **What do we build first to deliver that, without burning months of solo-founder time?**
3. **What do we *market* on day one?**
4. **What integrations become real moats vs. nice-to-haves?**

### Three flavors of "API"

A clarification that matters when scoping this work:

| Type | What it means | Examples | Naklos impact |
|---|---|---|---|
| **Public, self-serve API** | Sign up at a dev portal, get credentials, ship code. No partnership conversation. | Stripe, Twilio, GitHub | Cheapest to integrate. Build when worth it. |
| **Public-but-customer-gated API** | Public dev portal exists, but each fleet customer must authorize naklos via OAuth/consent before we can read their data. | Plaid, Stripe Connect, **Shell Card APIs**, Açık Bankacılık AIS | Most powerful pattern for FMS — one integration per provider, per-customer authorization. |
| **Private / partnership API** | No public portal. Email biz dev, sign contracts, wait months. Often gated by minimum customer count. | Opet Otobil B2B, Setcard, Multinet | Defer until naklos has real traction. |

**Correction from earlier:** I'd previously bucketed Shell into the "walled garden" category. That was wrong. Shell runs a real public-but-customer-gated developer portal with OAuth 2.0, OpenAPI specs, and SDKs in 6 languages. For any naklos customer with a Shell Filo Kart, this is a clean OAuth integration — the kind we should build, not the kind we should avoid.

### The Turkish fuel-data landscape, mapped

| Provider | API status | Realistic path |
|---|---|---|
| **Shell (Filo Kart)** | Public dev portal, OAuth 2.0, full SDKs | Build it. ~10–15% of TR fleets use Shell. |
| **BP (BP Plus)** | Has APIs for partners | Probably partnership-gated. Worth a sales conversation when scale justifies. |
| **Opet (Otobil / TTS)** | Integration capabilities mentioned, no public docs | Partnership-only. Big market share but defer until naklos has 100+ customers. |
| **Petrol Ofisi (Bizim Kart)** | No public API | Statement parsing only. |
| **Aytemiz / TP / Total / smaller** | No public API | Statement parsing only. |
| **Setcard / Multinet / Pluxee** | No public dev programs (currently under TR antitrust investigation) | Statement parsing only. |
| **e-Fatura via integrators** (Logo, NES, Foriba, Uyumsoft, Turkcell e-Şirket) | Public dev portals; require commercial agreement with the integrator | **The real Turkey moat. Build this.** |
| **Açık Bankacılık (AIS)** | Public APIs at İş Bankası and others | Requires TPP license or partnership. Phase 2. |

### Why e-Fatura is the actual moat

Turkey's e-Fatura system is now near-universal in 2026. Almost every B2B fuel purchase generates a structured XML invoice that flows through GİB and lands at the customer's e-Fatura provider (Logo, NES, Foriba, Uyumsoft, Turkcell). Each invoice contains supplier (which station), buyer, date, total, line items (liters, product), tax breakdown, and often a vehicle plate.

**Naklos integrates with the customer's e-Fatura provider, not with Opet/Shell/BP separately.** The flow:

1. Naklos signs commercial agreements with 1–2 integrators (start with Logo since it dominates Turkish SMB accounting).
2. New customer signs up → tells us their integrator → consents to share incoming invoices.
3. Naklos polls/webhooks for new invoices → filters for fuel-station suppliers → extracts line items → creates fuel records automatically.

**One integration → fuel data from every station the customer visits, regardless of card brand.** That's the localization advantage Fleetio and Samsara cannot ship in Turkey. It's the kind of moat that compounds: every integrator partnership widens the captureable market.

### Customer-effort comparison (this is the UX core)

A reasonable pushback: *"Wouldn't it be easier for the customer to just sign up / authorize once than forward emails monthly?"* Yes — in **steady state**, OAuth is genuinely better UX. The trade-off is engineering cost vs. customer effort:

| Approach | Customer one-time effort | Customer ongoing effort | Naklos engineering cost | Time-to-ship |
|---|---|---|---|---|
| **Manual entry** | 0 | High (hours/month) | Already shipped | Now |
| **Email-in + parsers** | 1 min (set up forwarding rule) | ~1 min/month (forward email) | Low (1–2 weeks) | Weeks 1–2 |
| **Shell OAuth API** | ~2 min (one-time consent) | 0 | Medium (~3–4 weeks) | Months 3–4 |
| **e-Fatura via integrator** | ~3 min (one-time consent + integrator selection) | 0 | Medium-High (4–6 weeks + commercial agreement) | Months 4–6 |
| **Açık Bankacılık AIS** | ~3 min (consent flow) | 0 | High (TPP license or partnership) | Months 6–9 |

The honest read: **OAuth-based integrations are better long-term UX**, and the user is right to push on this. But every flavor of automation — including email-in — is a massive improvement over manual entry. You can ship the "good enough" version this month and the "ideal" version over the following 6 months.

### The build vs. market split

The temptation: "Real-time API integration is impressive — build it now to attract customers." The trap: spend 2 months engineering integrations and arrive at launch with nothing else to show paying customers.

The smart play: **separate marketing claims from engineering scope.**

You can put *"yakıt verileriniz otomatik aksın"* on your landing page on day one. That promise is delivered by **email-in + parsers** (which you mostly already have). The customer doesn't experience "API integration" — they experience "I forwarded a statement once and the dashboard filled in." From their POV, that *is* automation.

Then, in months 3–6, as paying customers ask for richer real-time integration, you ship Shell OAuth and e-Fatura — and you charge a premium for them.

### Pro+ tier proposal

A new tier slots in cleanly when integrations are ready:

| Plan | Price | Fuel automation included | Headline |
|---|---|---|---|
| **Free** | ₺0 (≤3 vehicles) | Manual entry + statement parsing on your own statements | — |
| **Pro** | ₺39/vehicle/mo | + Email-in (forward your monthly statement) | *"Aylık ekstrenizi iletin, naklos kalanını yapsın."* |
| **Pro+ (future, post-month-6)** | ₺79–99/vehicle/mo | + Shell OAuth + e-Fatura + Açık Bankacılık | *"Yakıt verileri saniye saniye, manuel müdahale sıfır."* |

You market all three from day one. Pro+ shows on the pricing page as **"Yakında"** with a notify-me email capture — that itself is a lead-gen tool for the eventual upsell.

### Phased integration roadmap

| Phase | Timeline | What | Cost | Output |
|---|---|---|---|---|
| **Phase A — Statement parsing 2.0** | Weeks 1–2 (inside existing Phase 4 of the 12-week roadmap) | Add parsers for Petrol Ofisi, Shell Filo, BP Plus, Aytemiz, TP. Add `fuel-fleet@in.naklos.com` email-in inbox with auto-detection of statement format. | Low | Pro tier marketing claim is deliverable. |
| **Phase B — Shell OAuth integration** | Months 3–4 | Build against Shell's public Data & Card Management APIs. Customer authorizes via OAuth in onboarding. Real-time transaction pull. | Medium | First "real automation" feature. ~10–15% of TR fleets benefit immediately. |
| **Phase C — e-Fatura via Logo (then NES)** | Months 4–6 | Commercial agreement with Logo. Build invoice-pull and fuel-supplier filter. Add NES as second integrator after PMF. | Medium-high (engineering + integrator fee) | The Turkey moat. Marketed as Pro+ headline. |
| **Phase D — Açık Bankacılık AIS** | Months 6–9 | Partner with a TPP (or apply for license). Pull corporate-card transactions. Catches fuel paid on regular cards. | High | Captures non-fuel-card spend. Niche but defensible. |
| **Phase E — Direct Opet/BP partnerships** | Months 9–12+ | Only if customer demand justifies. Lead with "we have N paying TR fleets asking for this." | High (slow business development) | Closes remaining gaps. |

### Decision rules to avoid premature optimization

Use these as gates before each phase:

- **Phase A:** Always ship. Fast and cheap.
- **Phase B (Shell):** Ship when 5+ paying customers ask, OR when you launch the Pro+ tier publicly.
- **Phase C (e-Fatura):** Ship when 10+ paying customers ask, OR a single customer commits to Pro+ specifically for this feature.
- **Phase D (Açık Bankacılık):** Ship after 50+ paying customers and verifiable demand.
- **Phase E (direct partnerships):** Only with 100+ customers and a clear deal-blocker pattern.

**The point:** every integration is justified by paying-customer signal, not by founder enthusiasm. Build fast, sell early, integrate when the math works.

### EV charging — the same logic, looking further out

A natural follow-up question: *"Should naklos integrate with EV charging networks like Hubject so fleets can track charging the way they track fuel?"* Yes, eventually — but the timing and target are different from fuel. Below is the reasoning so the team doesn't have to re-derive it later.

**Hubject in one paragraph.** Hubject runs **intercharge**, the world's largest EV-charging eRoaming network: ~1,000,000 charging points, 3,000+ B2B partners, 70+ countries. Their value prop is "one OICP integration → access to many networks." Recent fleet-relevant moves include partnerships with Flipturn (logistics depots + public charging) in Jan 2026 and Windrose (electric trucks, megawatt charging) in Mar 2026. REST APIs, OpenAPI specs, GitHub-published docs.

**Turkish EV reality (April 2026).** ~400,000 EVs on Turkish roads (+30.8% YoY in Q1 2026), forecast >1M EV+hybrid by H1 2026 and ≥20% of total fleet by 2034. Charging infrastructure: ~28,000 sockets growing toward 140,000 by 2030. Dominant local operators: **ZES, Eşarj, Voltrun, Sharz.net, Trugo** — all Turkish-first networks. **But:** EV adoption is concentrated in passenger vehicles. Commercial small-fleet EV penetration in Turkey is ~1–3% in 2026 — the Transit-van electrician in Bursa is still on diesel.

**Why Hubject doesn't fit naklos in 2026.**

| Mismatch | Why |
|---|---|
| Wrong customer | Today's TR small fleets are 95%+ ICE — Hubject helps maybe 2% of customers immediately |
| Wrong geography | Hubject's killer feature is *cross-country EU roaming*; in TR the dominant operators are local-first and may have limited intercharge integration |
| Wrong price point | Hubject is enterprise B2B (CPO/eMSP commercial agreements + monthly platform fees); naklos's wedge is ₺39/vehicle/month |
| Wrong order | Same trap as the fuel/maintenance integrations — solving a problem before paying customers ask |

**When Hubject does become the right answer.**

- **EU expansion (months 12–24).** When naklos opens Germany/Netherlands/Spain, EV penetration in commercial fleets is much higher and charging networks are fragmented. *One Hubject integration unlocks 70+ countries of charging data.* That's exactly what the platform is built for.
- **Vertical specialization (year 2–3).** If naklos picks a vertical that's electrifying fast — last-mile courier, urban delivery, intra-city service — EV charging becomes 30–60% of the energy story. Integrate then.

**What to ship now: an energy-agnostic data model.**

Without integrating any charging network, naklos can be EV-ready by extending one enum:

```
EnergyType: { DIESEL, GASOLINE, LPG, ELECTRIC, HYBRID }
```

- Fuel entries become "energy entries" with `unit ∈ {liter, kWh}`.
- The same anomaly engine works for EV: off-hours sessions, kWh exceeds battery capacity, consumption (kWh/100km) spikes, mismatch between session duration and reported kWh.
- Statement parsers (Phase A) ingest charging operator invoices via the **e-Fatura integration** (Phase C) for free — ZES, Eşarj, Voltrun, etc. all issue e-faturas just like Opet. **One integration architecture covers both ICE and EV.**

This is a few hours of model refactoring and zero new integrations. It future-proofs the product against EV adoption without buying engineering cost today.

**Phased EV integration plan (added to the table above).**

| Phase | Timeline | What | Trigger |
|---|---|---|---|
| **Phase A.1** | Inside Phase A | Extend energy enum: support kWh + electric energy entries in UI and reports | Always ship |
| **Phase F — TR charging operator** | Year 2 | Direct partnership with ZES or Eşarj (whichever has API access first) | When 10%+ of paying customers have ≥1 EV |
| **Phase G — Hubject** | EU expansion (months 12–24) | OICP integration; "naklos works across European charging networks out of the box" | First EU customer onboarding OR Pro+ EU tier launch |

**Marketing positioning today, even before any integration.**

> *"Dizel ya da elektrikli — naklos hepsiyle çalışır. Yakıt giderlerinizi ve şarj seanslarınızı tek panelde takip edin. Filonuz elektriğe geçtiğinde naklos hazır."*

This sells the vision (EV-ready, future-proof) without buying engineering cost. Captures EV-curious fleet managers as customers now; naklos becomes their default tool when they switch.

**TL;DR for the EV question.** Hubject is the right *eventual* answer for naklos but a wrong *current* answer. Ship an energy-agnostic model in v1, defer Hubject to EU expansion, and consider a TR-operator integration only after 10% of customers have at least one EV. Same discipline as the fuel-API decisions: customer signal first, integration second.

---

## 13. Beyond week 12 — what comes next

- **Months 4–6:** Push to 100 paying fleets in Turkey. Hire (or partner with) a part-time content/SEO writer. Ship Phase B and Phase C of the fuel-integration roadmap (Section 12.5) once customer demand justifies.
- **Months 7–9:** Begin EU positioning — German + English landing pages, KVKK + GDPR pages, EUR pricing live. Soft-launch in Germany via niche communities (DACH small-fleet forums).
- **Months 10–12:** Launch upmarket Pro+ tier (₺79–99/vehicle) with multi-org, audit logs, API access, real-time fuel integrations. Target medium fleets (25–100 vehicles). Begin Layer 1 of adjacent revenue (Section 14) — affiliate links to existing maintenance/parts platforms.
- **Year 2:** Aim for 500 fleets total, ~₺3M ARR, ~10% international. Begin Layer 2 of adjacent revenue (curated maintenance shop network in Istanbul/Ankara). Decide whether to raise, hire, or stay solo.

---

## 14. Adjacent revenue streams — maintenance shops, parts, insurance

*Captured after a strategic discussion: should naklos broker maintenance shops to fleets and take a cut from the shops? Short answer: yes, eventually — but this is a year-2+ play, and there are easier adjacent revenue streams to capture first.*

### Why this matters

Per-vehicle SaaS revenue at ₺39/vehicle/month has a ceiling. Even at 1,000 paying fleets, you're looking at ~$120k ARR — a real indie business but not transformative. Adjacent revenue is how vertical SaaS companies break through that ceiling. Toast did it (restaurants → payments → capital → payroll). ServiceTitan did it (HVAC SaaS → ServiceTitan Marketing Pro → financing). Vagaro did it (salon SaaS → consumer marketplace). The pattern: **land with focused SaaS, layer transactional/affiliate/partnership revenue once you have density.**

For naklos specifically, the natural adjacencies are:

- **Maintenance shop network** — refer fleets to repair shops, earn lead/listing/transaction fees
- **Parts retailers** — affiliate or direct
- **Insurance brokers** — commission on policy renewals (you already track expiry dates!)
- **Lubricant / tire / part brand sponsorships** — featured placement on the maintenance dashboard

### Why a maintenance marketplace is *not* a v1 feature

Same trap as the fuel APIs (Section 12.5): the right idea built at the wrong time kills focus. Specifically:

1. **Marketplaces have a chicken-and-egg problem.** Need shops to attract fleets; need fleets to attract shops. With 0 paying customers, neither side commits. *This is the same dynamic that pushed naklos away from the freight marketplace in the first place. Don't reintroduce it.*
2. **Shop onboarding is feet-on-the-street work.** Small repair shops in Turkey are mostly offline, busy, and technologically conservative. Selling them on a digital lead-gen subscription is a different muscle than selling SaaS to fleet managers — and it can't be done while solo-shipping product, content, and customer success.
3. **Quality control becomes naklos's problem.** If naklos recommends a shop and the work is bad, the *fleet* churns from naklos, not from the shop. You inherit reputational risk from every partner you list.
4. **It dilutes the wedge.** Today's positioning — *"the simple, affordable, focused FMS for small Turkish fleets"* — is sharp. Adding "and we'll find you mechanics" is the kind of scope drift that makes the homepage longer and the pitch weaker.
5. **Founder bandwidth.** Each new revenue stream subtracts from the others. You can't run SaaS GTM + content + integrations + a separate shop business development motion solo.

**Rule:** Don't build the marketplace until SaaS has product-market fit. Specifically: ≥200 paying TR fleets, ≤5% monthly churn, clear customer demand for shop matching.

### Three-layer approach (build in order, not parallel)

**Layer 1 — Affiliate / referral (year 1, after first 100 paying fleets)**

The cheapest possible version. Don't build supply at all — partner with platforms that already have shop networks:

- [Servisotel](https://www.servisotel.com.tr/) — auto service marketplace
- Otobakim — auto maintenance booking
- Otoyedek and similar — parts marketplaces
- Brand-specific service networks (e.g. authorized BMC, Ford Trucks dealer networks)

When naklos surfaces an upcoming maintenance, embed a *"Yakındaki servisleri bul"* link → kicks the fleet manager out to the partner site → naklos earns a referral fee.

- **Engineering cost:** ~1 week (link integration, click tracking)
- **Supply-side work:** zero
- **Revenue per booking:** ~₺50–200 referral fee, depending on partner
- **Annual revenue at 200 fleets × 1 booking/month:** ~₺120k–₺480k

This is pure margin. It funds Layer 2.

**Layer 2 — Curated, hand-picked network (year 2, after ~200–300 paying fleets in 2–3 cities)**

Once naklos has fleet density in Istanbul, Ankara, Izmir, manually onboard 5–10 trusted shops per city. Charge them a flat **₺999–1,499/month** for "verified partner" status + featured placement. *Not transactional — just listing fees.*

- **Engineering cost:** medium (shop directory, verified-badge system, listing pages, contact form)
- **Supply-side work:** real but bounded — 30 shops total, hand-picked, manageable solo or with one BD hire
- **Revenue at 30 shops × ₺1,200/month:** ~₺36k/month = ₺432k/year
- **Risk profile:** low — predictable subscription revenue, no transaction risk, no quality control disasters

This proves whether shops will pay before you build the heavier marketplace.

**Layer 3 — Full transactional marketplace (year 3+, only if Layer 2 works)**

Booking flow, calendar integration, prepayment, commission on transactions. This is where the big revenue is — and where the operational complexity is.

- **Engineering cost:** high (booking, calendar sync, payments, dispute resolution, ratings)
- **Supply-side work:** ongoing — dedicated marketplace operations role
- **Revenue model:** 5–8% commission on transaction value
- **Average small fleet maintenance spend:** ₺5,000–15,000/month
- **Revenue per fleet:** ~₺250–1,200/month on top of subscription
- **At 500 fleets running through marketplace:** ~₺125k–₺600k/month in commission revenue

This is the prize. But you only earn the right to build it by *first* proving Layers 1 and 2.

### A v1 tactic that seeds all of this: Service Log

Add a simple **"Servis kayıtları"** feature in Phase 3 of the roadmap. When a fleet manager logs a maintenance event, the form asks:

- Yapılan iş (Oil change / brakes / general / other)
- Servis adı (Free text — "Mehmet Usta Garaj", "Ford Servis Levent", etc.)
- Servis yeri (City)
- Tutar (₺)
- Tarih (defaults to today)

After 6 months, naklos has a structured dataset of *"shops that paying fleet managers actually use"* — with frequency, average spend, geography. **That's the seed list for your eventual curated network in Layer 2.** No partner-side work needed; the data accumulates as a byproduct of normal usage.

This is a lightweight feature with disproportionate strategic value.

### Easier adjacent revenue (build before the shop play)

Three of these are simpler than a shop network because they're 1-to-N (one supplier, many fleets) instead of N-to-N (many shops, many fleets):

| Adjacent stream | Mechanism | Effort | Revenue potential |
|---|---|---|---|
| **Insurance broker partnership** | Commission per renewed policy. naklos already tracks expiry dates → perfect lead source. One commercial deal with a broker = recurring commission for every fleet. | Low (one BD deal + UI integration) | ~₺200–500 commission per policy × N fleets/year |
| **Parts retailer affiliate** | Bulk-deal partnership with one or two parts marketplaces (Otoyedek, brand-specific). Click → buy → cut. | Low | ~3–8% of order value |
| **Lubricant / tire / part brand sponsorships** | Castrol, Mobil, Petlas pay for featured placement on the maintenance dashboard. *"Önerilen yağ markası: Mobil Delvac."* | Medium (BD effort, ad-quality control) | ₺10k–50k/year per brand sponsor |
| **Fuel-card aggregator partnerships** | Once Section 12.5 integrations exist, fuel-card providers may pay for being the "default" provider for naklos fleets. | Low (only after fuel APIs are live) | One-time + ongoing rev share |

**Most-recommended starter: insurance.** You already have the expiry-tracking data, the use case is unambiguous, the lead is genuinely high-intent (a fleet 30 days from expiry is going to renew somewhere — let it be you), and the unit economics are great (one commission can equal a year of SaaS subscription for that vehicle).

### Revenue math: what this looks like at scale

At 500 paying TR fleets × 10 vehicles average:

| Revenue stream | Annual contribution |
|---|---|
| Pro SaaS (₺390/fleet/mo × 500) | **₺2.34M** |
| Pro+ SaaS upgrade (10% of fleets at ₺790/fleet/mo) | **₺474k** |
| Layer 1 affiliate (1 booking/fleet/mo × ₺100) | **₺600k** |
| Layer 2 curated network (50 shops × ₺1,200/mo) | **₺720k** |
| Insurance commissions (500 fleets × 8 vehicles × 1 renewal/yr × ₺350) | **₺1.4M** |
| Parts affiliate (modest) | **₺200k** |
| Brand sponsorships (3 sponsors × ₺25k) | **₺75k** |
| **Total** | **~₺5.8M (~$150k)** |

That's roughly **2.5× the SaaS-only ceiling**. This is why adjacent revenue matters: it turns "indie SaaS that pays well" into "small business that compounds."

### Decision rules

To avoid building this prematurely:

- **Do not** start Layer 1 before 100 paying fleets.
- **Do not** start Layer 2 before 200 paying fleets in 2+ cities.
- **Do not** start Layer 3 before Layer 2 has proven retention with shops for 6+ months.
- **Do** ship the Service Log feature in v1 — it's pure data accumulation with zero downside.
- **Do** start insurance partnership conversations once you have 50+ fleets, since the BD cycle is long and the integration is light.

### TL;DR for this section

- Yes, brokering maintenance shops makes strategic sense.
- No, it shouldn't be a v1 feature — it has the same chicken-and-egg shape that drove the marketplace pivot in the first place.
- Build it in three layers: affiliate (year 1) → curated (year 2) → marketplace (year 3+).
- Seed the data now via a Service Log feature. Cheap to build, hugely strategic.
- Insurance and parts affiliate are easier adjacent plays; start there.
- At scale, adjacent revenue can ~2.5× the per-fleet revenue. Worth the patience.
