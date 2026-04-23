// src/prerender/metaBuilder.ts
import { SITE_NAME, SITE_URL, DEFAULT_OG_IMAGE } from '../config/site';
import type { Frontmatter } from '../content/parsePost';

function abs(path: string): string {
  return path.startsWith('http') ? path : `${SITE_URL}${path}`;
}

function ogLocale(locale: string): string {
  switch (locale) {
    case 'tr': return 'tr_TR';
    case 'en': return 'en_US';
    case 'de': return 'de_DE';
    default:   return 'tr_TR';
  }
}

export function buildPostMeta(fm: Frontmatter): string {
  const url = `${SITE_URL}/blog/${fm.slug}`;
  const ogImage = abs(fm.ogImage ?? DEFAULT_OG_IMAGE);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: fm.title,
    description: fm.description,
    datePublished: fm.date,
    author: { '@type': 'Organization', name: SITE_NAME },
    publisher: {
      '@type': 'Organization',
      name: SITE_NAME,
      logo: { '@type': 'ImageObject', url: `${SITE_URL}/naklos-icon.svg` },
    },
    mainEntityOfPage: url,
  };

  return [
    `<title>${escapeHtml(fm.title)} | ${SITE_NAME}</title>`,
    `<meta name="description" content="${escapeAttr(fm.description)}">`,
    `<link rel="canonical" href="${url}">`,
    `<meta name="robots" content="index, follow">`,
    `<meta property="og:type" content="article">`,
    `<meta property="og:title" content="${escapeAttr(fm.title)}">`,
    `<meta property="og:description" content="${escapeAttr(fm.description)}">`,
    `<meta property="og:url" content="${url}">`,
    `<meta property="og:image" content="${ogImage}">`,
    `<meta property="og:locale" content="${ogLocale(fm.locale)}">`,
    `<meta property="article:published_time" content="${fm.date}">`,
    `<meta name="twitter:card" content="summary_large_image">`,
    `<meta name="twitter:title" content="${escapeAttr(fm.title)}">`,
    `<meta name="twitter:description" content="${escapeAttr(fm.description)}">`,
    `<meta name="twitter:image" content="${ogImage}">`,
    `<script type="application/ld+json">${JSON.stringify(jsonLd, null, 2)}</script>`,
  ].join('\n');
}

export function buildIndexMeta(locale: string): string {
  const url = `${SITE_URL}/blog`;
  const ogImage = abs(DEFAULT_OG_IMAGE);
  const titles: Record<string, { title: string; description: string }> = {
    tr: { title: 'Blog', description: 'Filo yönetimi, yakıt takibi ve nakliyat sektörü hakkında yazılar.' },
    en: { title: 'Blog', description: 'Articles about fleet management, fuel tracking, and the transport industry.' },
    de: { title: 'Blog', description: 'Artikel über Flottenmanagement, Kraftstoffverfolgung und die Transportbranche.' },
  };
  const meta = titles[locale] ?? titles['tr'];

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    name: `${SITE_NAME} Blog`,
    url,
    publisher: { '@type': 'Organization', name: SITE_NAME },
  };

  return [
    `<title>${escapeHtml(meta.title)} | ${SITE_NAME}</title>`,
    `<meta name="description" content="${escapeAttr(meta.description)}">`,
    `<link rel="canonical" href="${url}">`,
    `<meta name="robots" content="index, follow">`,
    `<meta property="og:type" content="website">`,
    `<meta property="og:title" content="${escapeAttr(meta.title)}">`,
    `<meta property="og:description" content="${escapeAttr(meta.description)}">`,
    `<meta property="og:url" content="${url}">`,
    `<meta property="og:image" content="${ogImage}">`,
    `<meta property="og:locale" content="${ogLocale(locale)}">`,
    `<meta name="twitter:card" content="summary_large_image">`,
    `<script type="application/ld+json">${JSON.stringify(jsonLd, null, 2)}</script>`,
  ].join('\n');
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]!));
}

function escapeAttr(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
}
