# Naklos — Landing Page & Pricing Action Plan

A step-by-step, pragmatic rework plan for the Naklos landing page, adapted for where you are today: **no payment integration yet, "Contact us" email flow to upgrade.**

The spirit of the plan: keep v1's sharp copy and structure, borrow v2's visual polish, fix the Turkish/English mismatch, and design pricing that works honestly *without* a billing system.

---

## Step 1 — Fix the language default (30 min)

**Problem:** `<html lang="tr">`, Turkish meta description, but all visible copy is English. Turkish SME fleet owners land on an English page and bounce.

**Do this:**

1. Make **Turkish the default locale**. English stays as a toggle (you already have the 🇬🇧 EN button — just flip which language it starts in).
2. Keep `<html lang="tr">` and the existing Turkish meta description.
3. Translate all visible copy. German can wait — launch TR + EN only.
4. Translate aria-labels too (the floating mail button already says *"E-posta ile iletişime geç"* — good, just make the rest consistent).

**Detect the user's language:** `navigator.language` → if starts with `tr`, show TR. Otherwise show EN. Persist their choice in `localStorage`.

---

## Step 2 — Rewrite the hero to cover the full platform (1 hour)

**Problem you raised:** the old v1 headline leaned too hard on fuel and made it feel like a fuel-only app.

**Fix:** broaden the promise on line one, keep the sharp fuel example in the subhead. Keep the punchy tone.

### Turkish (default)

> **Eyebrow tag:** Türk KOBİ filoları için · KVKK uyumlu
>
> **H1:** Araçlarınız, sürücüleriniz ve belgeleriniz — tek ekranda.
>
> **Sub:** Excel'de göremediğiniz yakıt kaçağı. Gelecek ay kaçıracağınız muayene. Dün süresi dolan ehliyet. Naklos, size paraya mal olmadan önce bunları gösterir.
>
> **Primary CTA:** Ücretsiz başla
> **Secondary CTA:** Hesabım var
> **Microcopy under CTAs:** Kredi kartı gerekmez. Satış görüşmesi yok.

### English

> **Eyebrow tag:** For Turkish SMB fleets · KVKK-compliant
>
> **H1:** Your trucks, drivers and documents — on one screen.
>
> **Sub:** The fuel leak you can't see in Excel. The inspection you'll miss next month. The license that expired yesterday. Naklos surfaces them before they cost you.
>
> **Primary CTA:** Start free
> **Secondary CTA:** I have an account
> **Microcopy:** No credit card. No sales call.

**Why this works:** "Trucks, drivers AND documents" names all three pillars in the first line, so nobody thinks it's only about fuel. The sub gives three concrete pains (one per pillar), so it reads as a *complete* fleet platform with a sharp personality.

---

## Step 3 — Fix the hero dashboard mockup (45 min)

**Problem:** the mockup currently shows a generic dashboard. Wasted real estate.

**Do this:** make the mockup *prove* the headline. Show one real-looking alert per pillar.

Replace the three stat cards (24 / 18 / 3) and priorities list with something like:

```
┌─────────────────────────────────────────┐
│  Naklos              naklos.com.tr/...  │
├─────────────────────────────────────────┤
│  Today's alerts                    3    │
│                                         │
│  🚨 34 ABC 123 — Unusual fill-up        │
│     127L in 80L tank · ₺1,840 over      │
│     2 hours ago                         │
│                                         │
│  ⚠️ 07 XYZ 300 — Inspection due         │
│     Expires in 2 days                   │
│                                         │
│  ⚠️ Driver: Ahmet K. — License          │
│     Expires in 8 days                   │
└─────────────────────────────────────────┘
```

One alert from each pillar. Now the screenshot *is* the product story.

**Also:** kill the cryptic "%91" floating card. If you want a floating "proof card", use something like **"Ø 18 dk kurulum"** (avg 18-min setup) or **"Bu ay yakalanan: 47 anomali"** (47 anomalies caught this month — only if it's real).

---

## Step 4 — Restore "How it works" (30 min)

v2 deleted this. Put it back. For Turkish SME buyers who don't know you, seeing the onboarding process *before* they sign up is a big trust signal.

### Section copy

**Eyebrow:** Nasıl çalışır / How it works
**H2:** Üç adım. Veriden aksiyona. / Three steps — data to action.
**Sub:** 15 dakikada kurulum. İlk uyarı bir hafta içinde. / 15-minute setup. First alert within a week.

**Card 1 — Upload:** Excel'inizi yükleyin. OPET, Shell, BP fişlerini, araç ve sürücü listenizi. 15 dakikada hazır.

**Card 2 — Configure:** Kurallarınızı belirleyin. Depo kapasitesi, L/100 km eşiği, belgeler için kaç gün önce uyarı. Sizin filonuz, sizin kurallarınız.

**Card 3 — Get alerted:** Uyarıları alın. Şüpheli yakıt alımı → dakikalar içinde e-posta. Süresi dolan belge → 30 gün öncesinden. Haftalık performans raporu.

Keep the visual style from v1 (warm-50 cards with numbered badge top-left).

---

## Step 5 — Rewrite feature cards as outcomes, not categories (45 min)

v1 had sharp outcome-based cards. v2 regressed to *"Vehicle tracking / Driver management / Document alerts / Fuel performance."* Bring back outcomes. Keep all four pillars visible.

### Four cards (Turkish / English pairs)

**Card 1 — Documents (accent: urgent red)**
- TR: *"Her yol kontrolünden 30 gün önce uyarı."*
- EN: *"30-day warning before every roadside check."*
- Body TR: Muayene, ehliyet, SRC, K-belgesi, sigorta — süresi dolmadan otomatik hatırlatma. ₺2.000–₺10.000 cezalardan kaçının.
- Body EN: Inspection, license, SRC, K-belge, insurance — automatic reminders before expiry. Avoid ₺2,000–₺10,000 fines.

**Card 2 — Fuel anomaly (accent: attention amber)**
- TR: *"Kartlarınız harcıyor. Hangileri gerçekten yolda?"*
- EN: *"Your cards spend. Which ones aren't driving?"*
- Body TR: Araç bazında anomali kuralları şüpheli dolumları işaretler. Dakikalar içinde e-posta uyarısı. Türkiye'de yakıt kartlarının gerçekten nasıl kötüye kullanıldığına göre tasarlandı.
- Body EN: Per-vehicle anomaly rules flag suspicious fill-ups. Email alert in minutes. Built for the way fuel cards actually get abused in Turkey.

**Card 3 — Performance (accent: info blue)**
- TR: *"Hangi kamyon 22 L/100km yakıyor, hangisi 28 — rakamla görün."*
- EN: *"Know which truck burns 22 L/100km, and which burns 28."*
- Body TR: L/100 km, km başına maliyet, yan yana karşılaştırma. Verimli olanlar ve pahalı olanlar — rakamlarla.
- Body EN: L/100 km, cost per km, side-by-side comparison. The efficient vs. the expensive, with numbers.

**Card 4 — Excel onboarding (accent: confirm green)**
- TR: *"Excel'i yapıştırın. Gerisini biz hallederiz."*
- EN: *"Paste the Excel. We take it from there."*
- Body TR: Araçları, sürücüleri ve yakıt işlemlerini toplu içe aktarın. GPS kutusu yok, terminal yok, donanım yok.
- Body EN: Bulk-import vehicles, drivers and fuel transactions. No GPS box, no terminal, no hardware.

**Lean into "no hardware"** — this is your biggest differentiator against Arvento/Mobiliz/İşbak. Every Turkish fleet software vendor requires boxes. You don't. That's a massive purchase-friction win.

---

## Step 6 — Rewrite "Goodbye, spreadsheets" (20 min)

Tighten to 5 bullets that ladder up to *outcomes*, not features.

### Turkish

> ## Excel'e veda.
>
> ✓ Geceyarısı telefonunu kontrol eden sahip için — Excel'deki muhasebeci için değil.
> ✓ L/100 km eşiğinin aşıldığı an e-posta uyarısı.
> ✓ GPS kutusu yok, terminal yok, kurulum yok — yakıt kartı Excel'iniz yeterli.
> ✓ Türkçe-önce ürün, EN arayüz mevcut. KVKK uyumlu.
> ✓ Kurucu erişim — lansman sırasında ücretsiz, ücretlendirme başladığında %30 indirim kilidi.

### English

> ## Goodbye, spreadsheets.
>
> ✓ Built for the owner checking the phone at 2 AM — not the accountant in Excel.
> ✓ Email alert the moment L/100km goes past your threshold.
> ✓ No GPS box, no terminal, no installation — your fuel-card Excel is enough.
> ✓ Turkish-first, English UI available. KVKK-compliant.
> ✓ Founding access — free during rollout, 30% off lock-in when billing ships.

Drop the German mention unless you already have the UI translated. Promising a language you don't ship hurts trust more than the market upside helps.

---

## Step 7 — Design pricing that works WITHOUT billing integration

This is where you need real thought, because you're in an awkward middle zone: too early for Stripe, too visible to hide pricing. Here's the honest play.

### The strategy: "Founding access, free. Locked-in pricing, later."

You have no billing system, so don't fake one. Turn that into a *feature*: everyone who joins now gets in free, AND gets a discount locked in forever when billing ships. Creates urgency and honesty at the same time.

### Section header

**Eyebrow:** Fiyatlandırma / Pricing
**H2 TR:** Mantıklı fiyatlandırma.
**H2 EN:** Pricing that makes sense.
**Sub TR:** Araç başına, ayda. Donanım yok, sözleşme yok. Ücretlendirme başladığında önceden haber vereceğiz.
**Sub EN:** Per truck, per month. No hardware, no contracts. We'll give notice before billing starts.

### Prominent banner above the cards

```
🎉 Founding customers: Free during rollout.
   Lock in 30% off for 12 months when billing ships.
```

Turkish: *"🎉 Kurucu müşteriler: Lansman boyunca ücretsiz. Ücretlendirme başladığında 12 ay boyunca %30 indirim kilitlenir."*

### The four tiers

All buttons say **"Get founding access"** / **"Kurucu erişim al"** — which opens a `mailto:info@naklos.com.tr` OR (much better) opens the contact form section with the tier pre-selected. Both work; form is better for lead capture.

---

#### Tier 1 — Starter

- **Price now:** Free
- **Future price:** ₺199 / truck / month (shown struck-through or as *"later: ₺199/araç/ay"*)
- **Who it's for:** 1–5 trucks
- **What's in:**
    - All modules unlocked during founding access
    - Vehicle + driver + document tracking
    - Fuel anomaly + performance
    - Document expiry alerts (email)
    - Bulk Excel import
    - Email support (1 business day)
- **CTA:** Kurucu erişim al / Get founding access

#### Tier 2 — Owner (Most Popular)

- **Price now:** Free during founding access
- **Future price:** ₺199 / truck / month → **₺139 with founding lock-in (30% off, 12 mo)**
- **Who it's for:** 6–24 trucks
- **What's in (everything in Starter, plus):**
    - Weekly fleet digest (e-posta)
    - Priority email support
    - Early access to new modules (tire, maintenance — coming)
    - Custom anomaly thresholds per vehicle
- **CTA:** Kurucu erişim al / Get founding access

#### Tier 3 — Business

- **Price now:** Free during founding access
- **Future price:** ₺149 / truck / month → **₺104 with founding lock-in**
- **Who it's for:** 25+ trucks
- **What's in (everything in Owner, plus):**
    - Volume pricing auto-applied
    - Multi-user access (3 manager seats included)
    - Quarterly check-in call with product team (while founding)
- **CTA:** Kurucu erişim al / Get founding access

#### Tier 4 — Enterprise

- **Price:** Contact us
- **Who it's for:** 100+ trucks, custom needs
- **What's in:**
    - Unlimited vehicles and drivers
    - API access
    - Custom integrations (fuel-card provider, ERP)
    - Dedicated Slack/email support
- **CTA:** Bize yazın / Talk to us

### Why this pricing works without billing

1. **You're not asking for payment** — no Stripe, no invoicing, no chasing.
2. **You're setting a price anchor** — people see ₺199 and ₺139 and mentally accept the product is worth that. When billing ships, they don't flinch.
3. **You're creating commitment without charging** — founding customers are psychologically invested because they "earned" the discount.
4. **You have a natural upgrade conversation later** — when billing ships, you email everyone: *"Billing goes live Nov 1. Your 30% locked-in rate of ₺139/truck/mo kicks in then. Reply if you want to add a payment method before the deadline, or if you want to downgrade to Starter."* Clean, transparent, no surprises.
5. **"Contact us" tiers still work** — for Business & Enterprise, the email flow is expected. Big fleets always want to talk.

### Critical: write down what "founding access" promises

Put a small link under the pricing: **"Kurucu erişim şartları"** → a one-page explainer that says exactly:

- When billing will start (*"Ücretlendirme planımız Q2 2026"* or similar — pick a quarter, not a date)
- That you'll give 30 days' notice by email before charging anything
- That 30% off applies for 12 months from the first billed month
- That you can cancel any time and never get charged
- That founding access does NOT auto-convert — you have to actively confirm billing

This removes the "gotcha" feeling. Without it, sophisticated buyers (exactly your ICP) get suspicious.

---

## Step 8 — Add social proof (even if you have almost none)

Biggest missing thing on both versions. Turkish B2B doesn't buy without it.

**Do one or two of these this week:**

1. **Logo strip** of 3–5 pilot customers (even one-truck "pilots" count if they're real). Grey-scaled so it looks restrained. Header: *"Türkiye genelinde filolar tarafından kullanılıyor"* / *"Trusted by fleets across Turkey"*.
2. **One testimonial card** with a real quote, name, company, fleet size, and ideally a photo. If you don't have this, go get it — offer 3 months free in exchange for a named testimonial. It's worth it.
3. **A "by the numbers" strip** of real metrics: *"X filo · Y araç · Z anomali yakalandı"*. Only use if the numbers aren't embarrassing.

If you genuinely have zero, put a *"Founding customers wanted"* card in its place with a short story of who you're looking for. Turning the absence into a signal is better than pretending.

---

## Step 9 — Restore the contact form + clean up CTAs (30 min)

**v1 had a contact form. v2 deleted it. Put it back.** An email mailto is fine for Enterprise, but a proper form with a fleet-size qualifier is the best lead capture on the page.

**Form fields (keep v1's):**
- Name (required)
- Email (required)
- Phone (optional)
- Company (optional)
- How many trucks? (required, dropdown: 1–5 / 6–25 / 26–100 / 100+)
- Message (optional)
- KVKK consent checkbox (required)

**CTA consolidation — you have too many. Cut to 2 primary + 1 secondary:**
- **Primary:** "Start free" / "Ücretsiz başla" — appears in hero, sticky header after scroll, pricing cards
- **Secondary:** "Talk to us" / "Bize yazın" — scrolls to contact form
- **Tertiary:** "I have an account" / "Hesabım var" — hero only, quieter styling

**Kill:** the floating mailto button. The contact form and header CTAs make it redundant, and it clashes with the primary flow.

---

## Step 10 — Fix the footer for Turkish B2B trust (20 min)

Turkish KOBİ buyers subconsciously check the footer. Fix the gaps:

**Add:**
- Company legal name (*Naklos Teknoloji Ltd. Şti.* or whatever it actually is)
- Address (even if just district + city)
- Vergi dairesi + vergi no
- **KVKK Aydınlatma Metni** link (legally required anyway if you process TR personal data)
- **Çerez Politikası** link
- Contact email (info@naklos.com.tr — already there)
- Optional: a Turkish phone number or WhatsApp Business link for the truly traditional buyers

---

## Step 11 — Clean up the visual polish (1 hour)

Things to **borrow from v2** into v1's structure:

- ✅ Colored icon chips on feature cards (blue/emerald/amber/violet backgrounds behind the icons). Replaces the flat monochrome icons in v1 and adds life without being garish.
- ✅ Traffic-light window dots on the dashboard mockup (rose/amber/emerald). Tiny detail, but it makes the mockup feel like a real product.
- ✅ Subtle hover-lift (`hover:-translate-y-1`) on feature and pricing cards — but keep it subtle, 1–2px max.
- ✅ Dot-grid background pattern at low opacity — okay if you like it, optional.

Things to **keep from v1** (don't regress):

- ❌ Gradient-clipped headline text — too generic, kills the editorial feel.
- ❌ Glow behind the hero mockup — looks AI-generated.
- ❌ "hover-lift on everything" — cards should hover, sections shouldn't.
- ✅ Keep the serif-italic eyebrow tags ("How it works", "PRICING") — distinctive, good taste.
- ✅ Keep the warm-50 cream background on alternating sections — warmer than pure grey, more human.
- ✅ Keep the solid primary-700 brand color rather than gradient — more trustworthy for a B2B utility.

---

## Step 12 — Ship checklist & priority order

Don't do all 11 steps at once. Ship in this order:

**Day 1 (4 hours — high impact, low effort):**
1. Step 1 — Flip language default to Turkish
2. Step 2 — Rewrite hero (TR + EN)
3. Step 10 — Footer trust signals

**Day 2 (3 hours):**
4. Step 5 — Rewrite feature cards as outcomes
5. Step 6 — Rewrite "Goodbye, spreadsheets"
6. Step 9 — Restore contact form, kill floating button

**Day 3 (3 hours):**
7. Step 7 — Rework pricing with "founding access" framing
8. Step 11 — Visual polish (borrow from v2 selectively)

**Day 4 (3 hours):**
9. Step 3 — Fix dashboard mockup with real alerts
10. Step 4 — Restore "How it works" section

**This week or next (when you can):**
11. Step 8 — Social proof. Even one real testimonial beats zero.

---

## What success looks like after this rework

A Turkish fleet owner lands on naklos.com.tr, reads the headline in their language, understands in 3 seconds that it's a full fleet platform (not just fuel), sees specific Turkish-market details (KVKK, K-belge, ₺ fines), scrolls past a dashboard that *shows* three real alert types, reads four outcome-driven feature cards, sees a "15-minute setup" process, hits pricing they can understand with a compelling "founding access" offer, and either clicks "Ücretsiz başla" or fills a form. No hardware, no sales call, no guesswork.

That's a conversion page. What you have now — either version — isn't that yet. Both got parts of it. Stitch them together and you're there.

---

*Next step: once you've done Days 1–2, send me a screenshot and I'll build the 4–6 week launch campaign plan on top of it.*
