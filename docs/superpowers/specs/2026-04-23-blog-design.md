# Blog (Markdown + Build-Time Prerender) — Design

**Date:** 2026-04-23
**Status:** Spec — ready for implementation planning
**Scope of first ship:** Blog infrastructure + one fully-written Turkish post (`yakit-takibi-nasil-yapilir`).

---

## 1. Goal

Ship a public, SEO-friendly blog at `https://naklos.com.tr/blog` that drives organic search traffic from TR-speaking fleet owners looking up terms like "yakıt takip", "filo yakıt kontrolü", and "yakıt kartı ekstre analizi". Posts must render as real HTML with real meta tags on the first byte so Google and social-link-unfurlers (WhatsApp, Twitter, LinkedIn) index them correctly.

First post: `/blog/yakit-takibi-nasil-yapilir`. Two more posts are planned as follow-up tasks after this ship is verified.

## 2. Constraints from the current codebase

- **Stack:** Vite + React 19 + React Router v7 + Tailwind 3. TypeScript throughout.
- **Rendering:** client-side SPA today. No SSR.
- **Hosting:** GitHub Pages (`gh-pages` npm package), custom domain `naklos.com.tr`. Deploy = `npm run deploy`.
- **i18n:** `i18next` + `react-i18next` with locales `tr`, `en`, `de` in `public/locales/`.
- **Routing:** routes declared manually in `src/App.tsx` inside three separate `<Routes>` blocks (unauthenticated, `needsFleetSetup`, authenticated) — public routes like `/privacy` are duplicated across all three.
- **Landing chrome:** `src/pages/landing/Header.tsx` (sticky, uses Tailwind `primary-*` tokens + `LanguageSwitcher`) and `src/pages/landing/Footer.tsx`.

## 3. Decisions locked during brainstorming

| # | Decision | Rationale |
|---|---|---|
| 1 | Content is **plain Markdown** files (`.md`), not MDX, not CMS | Prose-heavy posts; MDX adds complexity with no payoff since the CTA lives in the shell. |
| 2 | **Multi-locale folder structure from day one** (`src/content/blog/{tr,en}/`), but EN starts empty | 5-min structural cost now, zero rework later when EN posts are written. |
| 3 | **Build-time prerendering** of all blog routes via a custom post-build script | SEO and social previews need real HTML on first byte. GH Pages = static hosting, no SSR runtime. |
| 4 | **First ship = plumbing + 1 post**; future posts = drop in a `.md` file | Prove the pipeline end-to-end; review post #1 tone/shape before drafting #2 and #3. |
| 5 | **Canonical base URL** = `https://naklos.com.tr` (single constant in `src/config/site.ts`) | Prevents duplicate-content dilution between the custom domain and any incidental GH Pages URL. |
| 6 | **Markdown pipeline (A1):** `gray-matter` for frontmatter + `marked` for body, consumed via `import.meta.glob` at build time | Minimal deps; tree-shakes; non-devs can edit prose. |
| 7 | **Prerender pipeline (B1):** post-build Node script using React Router v7's `createStaticHandler` / `createStaticRouter` + `react-dom/server.renderToString` | Smallest surface area, reuses packages already installed, no Puppeteer (~200 MB saved from `node_modules`). |
| 8 | Meta tags injected **at build time by the prerender script**, not via `react-helmet-async` | We already own the HTML-writing step; runtime Helmet would duplicate work and add a dep. |

## 4. Architecture

### 4.1 Content model

```
src/content/blog/
  tr/
    yakit-takibi-nasil-yapilir.md
  en/
    (empty — structure ready for when EN posts are written)
```

Each file: YAML frontmatter + Markdown body. Required frontmatter fields:

| Field | Type | Example |
|---|---|---|
| `slug` | string | `yakit-takibi-nasil-yapilir` |
| `title` | string | `Filo Yakıt Takibi Nasıl Yapılır?` |
| `description` | string | (SEO meta description, 150–160 chars) |
| `date` | ISO date | `2026-04-23` |
| `readingTimeMinutes` | number | `5` |
| `locale` | `tr` \| `en` \| `de` | `tr` |
| `ogImage` | string (optional) | `/og/yakit-takibi.png` |

### 4.2 Content loader

`src/content/loader.ts` exposes:

```ts
type Locale = 'tr' | 'en' | 'de';
type Frontmatter = {
  slug: string;
  title: string;
  description: string;
  date: string;
  readingTimeMinutes: number;
  locale: Locale;
  ogImage?: string;
};
type Post = { frontmatter: Frontmatter; html: string };

export const allPosts: Post[];
export function getPost(slug: string, locale: Locale): Post | undefined;
export function listPosts(locale: Locale): Post[];  // sorted date desc
export function getPostWithFallback(slug: string, locale: Locale): { post: Post; usedFallback: boolean } | undefined;
```

Implementation: `import.meta.glob('./blog/**/*.md', { query: '?raw', import: 'default', eager: true })`; for each key, `gray-matter` to split frontmatter from body, `marked` to compile body to HTML. All resolved at build time, so bundles only include what's needed.

### 4.3 Routes

Add to **all three** `<Routes>` blocks in `src/App.tsx`:

```tsx
<Route path="/blog" element={<BlogIndexPage />} />
<Route path="/blog/:slug" element={<BlogPostPage />} />
```

Added to the authenticated block too so logged-in users can still read the blog from a direct link or email.

### 4.4 Pages & components

```
src/pages/blog/
  BlogIndexPage.tsx            — lists posts for current locale via listPosts()
  BlogPostPage.tsx             — reads :slug, calls getPostWithFallback(), renders HTML
  BlogLayout.tsx               — landing Header + max-w prose container + landing Footer
  components/
    PostCard.tsx               — card on the index page
    LocaleFallbackNotice.tsx   — "Bu yazı sadece Türkçe mevcut" strip
    BlogCta.tsx                — bottom-of-post CTA ("Ücretsiz başla")
```

All blog components are pure presentational and **SSR-safe**: no `window` / `document` / `localStorage` access during render. Anything requiring the browser goes in a `useEffect`.

**Rendering the post body:** `BlogPostPage` uses `<article dangerouslySetInnerHTML={{ __html: post.html }} />` inside a `prose` wrapper from `@tailwindcss/typography`. Safe because post content is author-controlled at build time (no user input).

**Post-not-found:** if `getPostWithFallback` returns undefined, render the `NotFoundPage` component already defined in `App.tsx:85-95` to keep 404 UX consistent.

**Locale fallback:** if a post exists in TR but not in the user's current i18n locale, render the TR post with a notice strip at the top. Notice copy goes into existing `public/locales/{tr,en,de}/translation.json` under `blog.fallbackNotice`.

### 4.5 Header & Footer integration

**Header** (`src/pages/landing/Header.tsx`): add a "Blog" `<Link>` between the `LanguageSwitcher` and the login button. i18n key `landing.nav.blog`.

**Footer** (`src/pages/landing/Footer.tsx`): add a "Blog" link in the appropriate column (structure confirmed during implementation). Same i18n key.

**i18n additions** (`public/locales/{tr,en,de}/translation.json`):

```json
{
  "landing.nav.blog": "Blog",
  "blog.index.title": "Blog",
  "blog.index.subtitle": "Filo yönetimi, yakıt takibi ve nakliyat sektörü hakkında yazılar.",
  "blog.backToBlog": "← Blog'a dön",
  "blog.readingTime": "{{minutes}} dk okuma",
  "blog.fallbackNotice": "Bu yazı şu an sadece Türkçe mevcut."
}
```

EN/DE versions get translated equivalents (except the fallback notice itself, which intentionally stays bilingual).

### 4.6 Build pipeline

**New script:** `scripts/prerender-blog.mjs`, invoked via a new npm script:

```json
"postbuild": "node scripts/prerender-blog.mjs"
```

Because `postbuild` runs automatically after `vite build`, both `npm run build` and `npm run deploy` (which calls `predeploy` → `npm run build`) pick up the prerender with zero workflow changes.

**What the script does:**

1. Read `dist/index.html` (the SPA shell Vite produced).
2. Import the blog loader to get all `(locale, slug)` pairs.
3. Compute the route list to prerender:
   - `/blog` (blog index — currently TR only; add per-locale index pages when EN posts exist)
   - `/blog/<slug>` for every `(locale, slug)` tuple
4. For each route: use React Router v7's `createStaticHandler({ routes })` + `createStaticRouter` + `renderToString` to render the tree to an HTML string.
5. Inject the rendered HTML into the SPA shell's `<div id="root">…</div>` and inject per-route meta into `<head>`:
   - `<title>` / `<meta name="description">` / `<link rel="canonical">`
   - Open Graph (`og:type`, `og:title`, `og:description`, `og:url`, `og:image`, `og:locale`, `article:published_time`)
   - Twitter card (`twitter:card=summary_large_image`, title/description/image)
   - JSON-LD `BlogPosting` (per-post) or `Blog` (index)
6. Write to `dist/blog/index.html` and `dist/blog/<slug>/index.html`.
7. Emit `dist/sitemap.xml` listing `/`, `/blog`, and all `/blog/<slug>` with `lastmod = frontmatter.date`.
8. Emit `dist/robots.txt`:

   ```
   User-agent: *
   Allow: /
   Sitemap: https://naklos.com.tr/sitemap.xml
   ```

**Config source of truth:** `src/config/site.ts` exports `SITE_URL = 'https://naklos.com.tr'`. Used by the prerender script, sitemap builder, canonical tags, and any absolute URL in OG metadata.

**SSR-safety of the Header during prerender:** the landing Header uses `useAuth()`. If rendering it under `createStaticHandler` is problematic (e.g. `useAuth` touches Keycloak client state during render), the prerender script wraps the blog tree in an override context providing `authenticated: false` and `login: () => {}`. The client-side hydration replaces the stub with the real auth context on first render. Decided during implementation; both paths are acceptable.

### 4.7 SEO meta — example per-post `<head>`

```html
<title>Filo Yakıt Takibi Nasıl Yapılır? | Naklos</title>
<meta name="description" content="OPET, Shell ve BP yakıt kartı ekstrelerinden filo yakıt takibi nasıl yapılır? Adım adım rehber.">
<link rel="canonical" href="https://naklos.com.tr/blog/yakit-takibi-nasil-yapilir">
<meta name="robots" content="index, follow">

<meta property="og:type" content="article">
<meta property="og:title" content="Filo Yakıt Takibi Nasıl Yapılır?">
<meta property="og:description" content="OPET, Shell ve BP yakıt kartı ekstrelerinden filo yakıt takibi nasıl yapılır? Adım adım rehber.">
<meta property="og:url" content="https://naklos.com.tr/blog/yakit-takibi-nasil-yapilir">
<meta property="og:image" content="https://naklos.com.tr/og/yakit-takibi.png">
<meta property="og:locale" content="tr_TR">
<meta property="article:published_time" content="2026-04-23">

<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="Filo Yakıt Takibi Nasıl Yapılır?">
<meta name="twitter:description" content="OPET, Shell ve BP yakıt kartı ekstrelerinden filo yakıt takibi nasıl yapılır? Adım adım rehber.">
<meta name="twitter:image" content="https://naklos.com.tr/og/yakit-takibi.png">

<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "BlogPosting",
  "headline": "Filo Yakıt Takibi Nasıl Yapılır?",
  "description": "OPET, Shell ve BP yakıt kartı ekstrelerinden filo yakıt takibi nasıl yapılır? Adım adım rehber.",
  "datePublished": "2026-04-23",
  "author": { "@type": "Organization", "name": "Naklos" },
  "publisher": {
    "@type": "Organization",
    "name": "Naklos",
    "logo": { "@type": "ImageObject", "url": "https://naklos.com.tr/naklos-icon.svg" }
  },
  "mainEntityOfPage": "https://naklos.com.tr/blog/yakit-takibi-nasil-yapilir"
}
</script>
```

For `/blog` (index): `og:type=website`, JSON-LD `@type=Blog`, no `article:published_time`.

### 4.8 OG image strategy

- Each post can specify `ogImage` in frontmatter. The first post uses a handcrafted `public/og/yakit-takibi.png` (1200×630).
- If `ogImage` is omitted, fall back to `public/og/default.png`.
- If neither file exists at deploy time (first build), the prerender script emits OG tags pointing at `https://naklos.com.tr/naklos-icon.svg` — social platforms won't render a card, but the build won't fail.
- **Providing the two OG PNGs is the user's responsibility** (design asset, not code).

### 4.9 First post content

`src/content/blog/tr/yakit-takibi-nasil-yapilir.md` contains the prose from the user's pasted guide (Neden yakıt takibi önemli → Ekstre nedir → Manuel takibin sorunları → L/100km hesabı → Anomali kuralları → Otomatik takip). Adjustments vs. the pasted draft:

- The final inline CTA (`<div className="bg-primary-50 ...">`) is **removed from the Markdown** and replaced by the `<BlogCta />` component that `BlogPostPage` renders automatically after every post's prose. Authors don't hand-copy it.
- The "← Blog'a dön" breadcrumb comes from `BlogLayout`, not from the Markdown.

Frontmatter:

```yaml
---
slug: yakit-takibi-nasil-yapilir
title: Filo Yakıt Takibi Nasıl Yapılır?
description: OPET, Shell ve BP yakıt kartı ekstrelerinden filo yakıt takibi nasıl yapılır? Adım adım rehber.
date: 2026-04-23
readingTimeMinutes: 5
locale: tr
ogImage: /og/yakit-takibi.png
---
```

## 5. New dependencies

| Package | Why | Dev/Runtime |
|---|---|---|
| `marked` | Compile Markdown body to HTML at build time | Runtime (pulled in by loader which is build-time evaluated via `eager: true`; not shipped to browser) |
| `gray-matter` | Parse YAML frontmatter | Same as above |
| `@tailwindcss/typography` | Prose styling for `<article dangerouslySetInnerHTML>` | Dev (Tailwind plugin) |

Everything else (`react-dom/server`, React Router's static APIs) is already in the current `react-router-dom@7` + `react-dom@19` install.

## 6. Files touched / added

**Added:**
- `src/config/site.ts`
- `src/content/loader.ts`
- `src/content/blog/tr/yakit-takibi-nasil-yapilir.md`
- `src/content/blog/en/` (empty directory — kept with `.gitkeep`)
- `src/pages/blog/BlogIndexPage.tsx`
- `src/pages/blog/BlogPostPage.tsx`
- `src/pages/blog/BlogLayout.tsx`
- `src/pages/blog/components/PostCard.tsx`
- `src/pages/blog/components/LocaleFallbackNotice.tsx`
- `src/pages/blog/components/BlogCta.tsx`
- `scripts/prerender-blog.mjs`
- `public/og/yakit-takibi.png` *(user-provided asset)*
- `public/og/default.png` *(user-provided asset)*

**Modified:**
- `src/App.tsx` — register `/blog` and `/blog/:slug` routes in all three `<Routes>` blocks.
- `src/pages/landing/Header.tsx` — add Blog link.
- `src/pages/landing/Footer.tsx` — add Blog link.
- `public/locales/tr/translation.json` — add `landing.nav.blog`, `blog.*` keys.
- `public/locales/en/translation.json` — same keys, EN values.
- `public/locales/de/translation.json` — same keys, DE values.
- `tailwind.config.js` — register `@tailwindcss/typography` plugin.
- `package.json` — add `postbuild` script + 3 new deps.

## 7. Verification (post-deploy manual checks)

1. `curl -sI https://naklos.com.tr/blog/yakit-takibi-nasil-yapilir` → `200 OK`.
2. `curl -s https://naklos.com.tr/blog/yakit-takibi-nasil-yapilir | grep -iE '<title>|canonical|og:title'` → post-specific meta, not the generic `Naklos - Filo Yönetimi`.
3. `curl -s https://naklos.com.tr/sitemap.xml` → contains the post URL.
4. `curl -s https://naklos.com.tr/robots.txt` → references the sitemap.
5. Paste the post URL into a social card validator (Twitter's, Facebook's, or just WhatsApp) → rich preview with OG image.
6. Load the URL in a browser, verify content renders, language switcher works, the `BlogCta` scrolls/links back to `/`.
7. In Google Search Console: add/verify `naklos.com.tr`, submit `sitemap.xml`, request indexing for the post URL.

## 8. Out of scope (explicitly)

- Dynamic OG image generation (auto-rendered title on branded background)
- MDX / embeddable React components inside prose
- Tag / category pages
- RSS feed
- Blog search UI
- Comments
- EN / DE post translations (folder structure is ready; content comes when written)
- The remaining two planned posts (`yakit-kacagi-nasil-tespit-edilir`, `opet-shell-yakit-karti-ekstresi-analizi`) — follow-up tasks after this ship is verified

## 9. Follow-up flagged (not part of this ship)

`public/404.html` sets `pathSegmentsToKeep = 1`, which is the SPA routing trick for GH Pages serving at a `/repo-name/` subpath — **but the live site is at the root of `naklos.com.tr`**, so the correct value is `0`. This likely means cold-loading a deep link like `https://naklos.com.tr/privacy` in a new tab is subtly broken today (or masked by something we haven't inspected). Prerendered blog URLs are unaffected (they're real static files, not falling back through `404.html`), so this does not block the blog ship. Recommended as a separate small investigation / fix task.
