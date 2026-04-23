// src/prerender/sitemapBuilder.test.ts
import { describe, it, expect } from 'vitest';
import { buildSitemap, buildRobots } from './sitemapBuilder';

describe('buildSitemap', () => {
  const xml = buildSitemap([
    { path: '/', lastmod: '2026-04-23' },
    { path: '/blog', lastmod: '2026-04-23' },
    { path: '/blog/yakit-takibi-nasil-yapilir', lastmod: '2026-04-23' },
  ]);

  it('wraps entries in urlset', () => {
    expect(xml).toContain('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');
  });

  it('emits absolute URLs against SITE_URL', () => {
    expect(xml).toContain('<loc>https://naklos.com.tr/blog/yakit-takibi-nasil-yapilir</loc>');
  });

  it('emits one <url> per entry', () => {
    expect((xml.match(/<url>/g) ?? []).length).toBe(3);
  });
});

describe('buildRobots', () => {
  it('allows all and points at the sitemap', () => {
    const txt = buildRobots();
    expect(txt).toContain('User-agent: *');
    expect(txt).toContain('Allow: /');
    expect(txt).toContain('Sitemap: https://naklos.com.tr/sitemap.xml');
  });
});
