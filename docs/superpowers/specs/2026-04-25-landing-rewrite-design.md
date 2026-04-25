# Landing Page Rewrite + Founding Customer Mechanic — Design Spec

**Date:** 2026-04-25
**Status:** Spec — design approved (mock at `/tmp/naklos-landing-mock.html`), plan pending
**Scope:** FE landing rewrite + BE founding-customer slot tracking
**Locales:** Turkish (`tr`) only for v1; `en`/`de` follow in a separate plan

---

## 1. Why this exists

The current landing (`src/pages/landing/`) was built for a freight-marketplace pitch and updated piecemeal. It has:
- Multiple competing CTAs (signup / contact / pricing scroll), diluting conversion
- Founding-customer messaging spread across 4 pricing tiers (Starter / Pro / Business / Enterprise) with manual price-lock framing that requires a buyer to mentally reconstruct the deal
- No comparison anchor — visitors can't tell if naklos is "the cheap one" or "the expensive one" without external research
- A 4-card pricing display that flattens to a single ₺ amount with no relationship to fleet size

This rewrite delivers a single-goal landing optimized for: **"new visitor signs up for free trial OR locks the founding-customer rate."**

The reference mock at `/tmp/naklos-landing-mock.html` is the source of truth for visual design — the spec below locks the implementation details.

---

## 2. Pricing structure (locked)

| Tier | Vehicles | Beta (now, ~6 mo) | Standard (post-billing) | Founding (first 10 fleets) |
|---|---|---|---|---|
| **Free** | Up to 3 | ₺0 | ₺0 (always) | — |
| **Pro** | 4+ (no minimum, no cap) | ₺0 (beta) | ₺79/araç/ay | **₺55/araç/ay (12 ay kilitli)** |

- **No tier cliffs.** Pro is linear: 4 vehicles = ₺316, 10 = ₺790, 25 = ₺1,975, 50 = ₺3,950. Founding rate is the same math at ₺55: 10 vehicles = ₺550.
- **No published Kurumsal tier** on the landing — replaced with a small "50+ araç filonuz mu var? Bize özel teklif için ulaşın →" link routing to the existing contact form. Manual deals for whales.
- **Beta is real:** the product genuinely costs ₺0 to use during beta. Billing wires up when Stripe/iyzico integration ships (~6 months out, gated by tax-ID procurement).
- **Founding rate is sticky:** once a fleet is granted a slot (see §3), the rate is locked at ₺55 for 12 months from the moment billing goes live. They keep the slot even if they later drop below 4 vehicles.

---

## 3. Founding customer mechanic (BE work)

### Trigger

**The first 10 fleets to reach 4+ registered (non-deleted) trucks.** Sign-up alone is not enough — that would be gameable. The 4th truck is the threshold (matches the Pro-tier boundary).

### Atomic slot assignment

Race-condition concern: two fleets could add their 4th truck simultaneously. Need atomic "claim a slot if available."

**Schema:** `fleet.fleets.founding_customer_seq INTEGER UNIQUE NULL` (1..10 = founding slot taken; NULL = not founding).

**Hook:** in `TruckService.registerTruck(...)`, after the truck is persisted (and after `DefaultScheduleSeeder.seed`), call `FoundingCustomerService.tryClaimSlot(fleetId)` which:

1. Counts non-deleted trucks for the fleet. If `< 4`, return immediately.
2. If fleet's `founding_customer_seq` is already NOT NULL, return immediately (already a founder).
3. Otherwise: in a transaction with `SELECT … FOR UPDATE`, count fleets where `founding_customer_seq IS NOT NULL`. If `< 10`, assign next slot via `UPDATE fleets SET founding_customer_seq = (current_max + 1) WHERE id = :fleetId`. The `UNIQUE` constraint on the column means concurrent attempts to grab the same seq number fail one of them safely.

**Stickiness:** never set `founding_customer_seq` back to NULL even if the fleet later deletes trucks below 4. The slot is earned once and persists.

### Public endpoint

`GET /api/public/founding-status` — no auth, returns:

```json
{ "taken": 3, "remaining": 7 }
```

Used by the landing page's pricing card badge ("İlk 10 firmadan 7 spot kaldı"). Cached client-side for 60 seconds (refresh on page load); BE response can be cached too.

### In-app celebration (deferred)

When a fleet's 4th truck triggers the founding-slot grant, surface a one-time toast/modal in the manager UI: *"🎉 Tebrikler — kurucu fiyatı ₺55/araç/ay 12 ay kilitlendi."* **Out of scope for this spec** — implement with the rest of the founding-customer benefits when billing wires up. For now, the BE flag persists silently; visible value lands when Stripe goes live.

### Migration

`V19__fleet_founding_customer.sql`:

```sql
ALTER TABLE fleet.fleets
    ADD COLUMN founding_customer_seq INTEGER UNIQUE;

CREATE INDEX idx_fleets_founding_seq
    ON fleet.fleets (founding_customer_seq)
    WHERE founding_customer_seq IS NOT NULL;
```

No backfill — existing fleets are NOT auto-granted founding status. The first 10 to reach 4 trucks AFTER this ships get the slots, regardless of when they signed up. (Open question for the user: should we backfill the first N existing eligible fleets? Defaulting to "no" — keeps the rule clean and avoids surprise grants.)

---

## 4. Landing page structure

The mock at `/tmp/naklos-landing-mock.html` is the visual source of truth. Section-by-section breakdown:

### §4.1 — Top nav

`src/pages/landing/Header.tsx` (existing, refresh):
- Logo + naklos wordmark
- Beta badge: green dot + "BETA · ücretsiz" pill
- Nav links: Özellikler / Karşılaştırma / Fiyatlandırma / SSS (anchors to sections below)
- Right-side: "Giriş" link + "Hemen başla" primary CTA button

### §4.2 — Hero

`src/pages/landing/Hero.tsx` (existing, full rewrite):
- Eyebrow pill: "Şu anda beta — tüm özellikler ücretsiz" (green)
- H1: **"Excel'i bırakın."** (line 1) + **"Filonuzu büyütün."** (line 2 with "Filonuzu" in `serif-italic text-primary-700`)
- Subhead: "Türkiye'deki küçük filolar için **yakıt, muayene, bakım takibi**. Donanım yok, taahhüt yok, 3 araca kadar ücretsiz."
- Primary CTA: "Hemen başla — ücretsiz" → routes to existing signup
- Trust strip: 4 inline checkmarks — "Kart bilgisi gerekmez" / "KVKK uyumlu" / "Türkçe destek" / "Donanım yok"
- **Right side:** browser-chrome wrapped product mockup showing the new dashboard severity rollup. Real-looking row data:
  - Red row: 34 ABC 123 · 3 belge · "3 gün"
  - Red row: 7 yakıt uyarısı · "2 acil · 5 uyarı" · "Aç"
  - Amber row: 07 QRS 300 · 1 bakım · "25 gün"

### §4.3 — Three pillars

`src/pages/landing/Features.tsx` (existing, simplify from 4 to 3 cards):
- Eyebrow: "Üç şey, doğru yapılmış" (serif italic)
- Section H2: "Filonuzun unutulan şeyleri otomatik takipte"
- 3 cards in a grid (md:grid-cols-3):
  - **Belgeler** — red stripe + AlertTriangle icon — "Muayene, MTV, sigorta tarihlerini bir daha unutmayın. Bitiş 30/14/7 gün önceden e-posta uyarı."
  - **Yakıt** — amber stripe + Fuel icon — *"Yakıt fişi nerede?"* sorununa son. Excel ya da e-posta ile gelen ekstreniz otomatik içe aktarılır, anomaliler işaretlenir."
  - **Bakım** — blue stripe + Wrench icon — "Periyodik bakım takvimleri otomatik hatırlatma ile. Sürücü servisten dönerken 'servis girdim' tek dokunuş."

### §4.4 — Comparison table

`src/pages/landing/Comparison.tsx` (NEW):
- Eyebrow: "Adil bir karşılaştırma"
- H2: "Excel'den uzak, Arvento'ya yakın değil"
- Sub: "10 araçlık küçük filo için aylık maliyet ve özellikler."
- Table with 5 columns: blank header / Excel / **naklos Pro** (highlighted) / Fleetio / Arvento. Samsara explicitly omitted (different category).
- Rows: Aylık maliyet · Donanım · Taahhüt · Türkçe + KVKK · Muayene/MTV otomatik · Yakıt anomali · İptal
- naklos Pro column has `bg-primary-50/50` highlight + bordered. ₺790 prominent + "₺550 kurucu" sub-line.
- Footnote: "Kaynaklar: Fleetio Essential ($5/araç/ay × kur ortalaması), Arvento 24-ay paketi, naklos beta (Mart 2026)."

### §4.5 — Pricing

`src/pages/landing/Pricing.tsx` (existing, full rewrite):
- Eyebrow: "Anlaşılır fiyatlandırma"
- H2: "Araç başına. Düz fiyat. Cliff yok."
- Sub: "3 araca kadar ücretsiz. 4+ için araç başı ₺79/ay. **İlk 10 firma için %30 indirim 12 ay kilitli.**"
- Beta banner (full-width inside section): green pill "Şu anda beta — tüm Pro özellikler ücretsiz. Ücretlendirme başladığında haber veririz."
- 2 pricing cards (md:grid-cols-2):
  - **Free** — white-on-warm card. ₺0/ay. Up to 3 vehicles. 5 feature bullets. White CTA button "Hemen başla."
  - **Pro** — primary-gradient card (highlighted). Floating accent badge: "Kurucu · {remaining} spot kaldı" (live-counter from `/api/public/founding-status`). ₺79 strikethrough → ₺55 prominent + "/araç/ay". Subline: "İlk 10 firma · %30 indirim · 12 ay kilitli." 5 feature bullets. White CTA button "Hemen başla — beta ücretsiz."
- Below cards: "50+ araçlı filonuz mu var? Bize özel teklif için ulaşın →" routing to contact form

### §4.6 — FAQ

`src/pages/landing/FAQ.tsx` (NEW):
- Eyebrow: "Sık sorulan sorular"
- H2: "Akla gelen ilk altı soru"
- 6 native HTML `<details>` accordions:
  1. **Donanım gerekiyor mu?** — Hayır, yazılım-yalnızca. GPS / kart okuyucu / terminal hiçbiri gerekmiyor. Mevcut yakıt kartınız + Excel/e-posta + telefon yeterli.
  2. **Mevcut yakıt kartlarımdan veri nasıl gelir?** — Aylık ekstrenizi (Opet, Shell, BP, Petrol Ofisi, Aytemiz, TP) içe aktarın. Kısa süre içinde özel e-posta adresine forward ile otomatikleşecek.
  3. **KVKK uyumlu mu?** — Evet. Türkiye/AB sunucularında, KVKK + GDPR ilkelerine göre. Aydınlatma metni, açık rıza, veri silme hakları arayüzden tek tıkla.
  4. **İptal etmek istersem?** — İstediğiniz an, tek tıkla. Sözleşme yok. Verilerinizi ZIP olarak indirip hesabı silersiniz.
  5. **Kaç araca kadar ücretsiz?** — 3 araca kadar her zaman ücretsiz. 4. aracı eklediğinizde Pro tier devreye girer (şu anda beta — yine ücretsiz).
  6. **Türkçe destek var mı?** — Türkçe öncelikli. Tüm arayüz Türkçe. Mesai saatlerinde e-posta + WhatsApp destek. Pro müşterileri için 24 saat içinde yanıt taahhüdü.

### §4.7 — Final CTA

`src/pages/landing/FinalCTA.tsx` (NEW, replaces existing `SocialProof` + `Benefits` + `HowItWorks` + `ContactForm` for landing flow — those components stay in the codebase but are no longer referenced from `LandingPage.tsx`):
- Dark primary background (`bg-primary-800`) with subtle white grid pattern
- H2: "Excel'den çıkmak **10 dakika** sürer." (with "10 dakika" in `serif-italic text-primary-200`)
- Sub: "İlk aracını ekle, dakikalar içinde belge ve bakım takibin başlasın. Kart bilgisi gerekmez."
- White CTA button: "Hemen başla — ücretsiz"
- Mono caption: "İlk 10 kurucu firma için ₺55/araç/ay 12 ay kilitli · {remaining} spot kaldı"

### §4.8 — Footer

`src/pages/landing/Footer.tsx` (existing, light refresh):
- Logo + "© 2026 · Türkiye'de inşa ediliyor"
- Links: KVKK / Şartlar / İletişim / Blog

---

## 5. Components removed from the landing flow

These pre-existing components stay in the codebase (don't delete — may be reused for marketing pages later) but are no longer rendered by `LandingPage.tsx`:

- `Benefits.tsx` — replaced by the comparison table + pricing
- `HowItWorks.tsx` — covered by FAQ + final CTA
- `SocialProof.tsx` — "Kurucu müşteriler" pitch becomes redundant when the Pro pricing card already surfaces founding-customer urgency
- `ContactForm.tsx` — moved to a dedicated `/iletisim` route (existing); landing CTAs route to signup, not contact

`HeroMockup.tsx` is repurposed inline by the new Hero (or replaced by the inline browser-chrome mockup; implementer's choice).

---

## 6. Wire shapes (FE ↔ BE)

### `GET /api/public/founding-status`

Public, no auth. CORS open. 60-second client-side cache.

Response:
```json
{ "taken": 3, "remaining": 7 }
```

Implementation:
```sql
SELECT
  count(*) FILTER (WHERE founding_customer_seq IS NOT NULL) AS taken,
  10 - count(*) FILTER (WHERE founding_customer_seq IS NOT NULL) AS remaining
FROM fleet.fleets;
```

(`remaining` clamped to 0 minimum on the FE side just in case the cap is later raised mid-flight.)

### `TruckService.registerTruck(...)` hook

After the existing `scheduleSeeder.seed(saved)` call, add:

```java
foundingCustomerService.tryClaimSlot(saved.getFleetId());
```

Failure is silent (logged but doesn't fail the truck registration).

---

## 7. Acceptance criteria

After ship, the following manual tests should pass:

1. **Landing loads cleanly** at `naklos.com.tr` (or local dev) — no console errors, all sections render, fonts load.
2. **Hero CTA navigates to signup** — `/signup` or whatever the existing free-tier signup route is.
3. **FAQ accordions** open/close on click without JS errors.
4. **Pricing card "Kurucu spot kaldı" badge** displays a number from `/api/public/founding-status` — verify by hitting the endpoint manually and matching the displayed value.
5. **50+ vehicles link** routes to existing `ContactForm` page or modal.
6. **BE: register a 4th truck on a fresh test fleet** — confirm `founding_customer_seq` is set to the next available number; confirm the public endpoint's `remaining` decrements by 1.
7. **BE: register a 4th truck on the 11th fleet** (after 10 slots taken) — confirm `founding_customer_seq` stays NULL; confirm `remaining` is 0.
8. **BE: register an 11th truck on a founding fleet** — confirm `founding_customer_seq` is unchanged (already granted).
9. **BE: delete trucks back to 3** on a founding fleet — confirm `founding_customer_seq` persists (sticky).
10. **No regressions:** existing tests pass; lint green; tsc green.

---

## 8. Out of scope (explicit non-goals)

- **English / German locales** — TR-only for v1. EN/DE land in a separate plan once the TR copy is validated by real visitors.
- **In-app founding-customer celebration toast** — defer until Stripe wires up so the celebration can include the actual locked rate.
- **Backfill founding slots for existing eligible fleets** — first-come-first-served from the moment V19 ships.
- **A/B test infrastructure** — single landing variant for v1. Test variants only after Plausible analytics is live (deferred).
- **Sticky beta-banner across all pages** — the banner is landing-only for now; the in-app already signals beta state via the manager top nav.
- **`/iletisim` page redesign** — uses the existing `ContactForm` component as-is.
- **Removed components (Benefits / HowItWorks / SocialProof / ContactForm)** — left in place for potential future reuse.
- **Pricing-page-specific landing variant** (e.g. `/fiyatlandirma`) — anchor scroll to the pricing section is fine for v1.

---

## 9. Estimated cost

| Layer | Files | LOC |
|---|---|---|
| BE | V19 migration + entity field + service + controller + integration test | ~200 |
| FE | Landing components (Hero/Features/Comparison/Pricing/FAQ/FinalCTA + LandingPage routing + i18n keys for tr) | ~600 |
| **Total** | | **~800 LOC** |

**Effort: ~1 focused day via subagent-driven execution.**

---

## 10. Open questions for the implementer

1. **Backfill founding slots?** Per §3, defaulting to "no." If the user changes their mind later, a one-off SQL migration can backfill the first N eligible fleets ordered by `created_at`.
2. **Login button in nav** — does the existing app have a public `/login` route or does Keycloak handle this? If Keycloak, the "Giriş" button should redirect to the Keycloak login endpoint with `redirect_uri=/manager/dashboard`.
3. **Signup route** — verify the existing free-tier signup path (probably `/signup` or `/manager/setup`) and route the Hero/Pricing/FinalCTA CTAs there.
4. **HeroMockup.tsx** — refresh inline (matches the mock's browser-chrome dashboard preview) or extract into a separate component? Either works; implementer picks.
