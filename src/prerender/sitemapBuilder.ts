// src/prerender/sitemapBuilder.ts
import { SITE_URL } from '../config/site';

export type SitemapEntry = { path: string; lastmod: string };

export function buildSitemap(entries: SitemapEntry[]): string {
  const urls = entries
    .map(
      (e) =>
        `  <url>\n    <loc>${SITE_URL}${e.path}</loc>\n    <lastmod>${e.lastmod}</lastmod>\n  </url>`,
    )
    .join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;
}

export function buildRobots(): string {
  return `User-agent: *
Allow: /
Sitemap: ${SITE_URL}/sitemap.xml
`;
}
