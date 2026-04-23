// src/prerender/metaBuilder.test.ts
import { describe, it, expect } from 'vitest';
import { buildPostMeta, buildIndexMeta } from './metaBuilder';

const postFm = {
  slug: 'yakit-takibi-nasil-yapilir',
  title: 'Filo Yakıt Takibi Nasıl Yapılır?',
  description: 'Short description',
  date: '2026-04-23',
  readingTimeMinutes: 5,
  locale: 'tr' as const,
  ogImage: '/og/yakit-takibi.png',
};

describe('buildPostMeta', () => {
  const html = buildPostMeta(postFm);

  it('includes the title with site name', () => {
    expect(html).toContain('<title>Filo Yakıt Takibi Nasıl Yapılır? | Naklos</title>');
  });

  it('includes canonical pointing at naklos.com.tr', () => {
    expect(html).toContain(
      '<link rel="canonical" href="https://naklos.com.tr/blog/yakit-takibi-nasil-yapilir">',
    );
  });

  it('includes OG image as absolute URL', () => {
    expect(html).toContain(
      '<meta property="og:image" content="https://naklos.com.tr/og/yakit-takibi.png">',
    );
  });

  it('includes article:published_time', () => {
    expect(html).toContain('<meta property="article:published_time" content="2026-04-23">');
  });

  it('includes JSON-LD BlogPosting', () => {
    expect(html).toContain('"@type": "BlogPosting"');
    expect(html).toContain('"datePublished": "2026-04-23"');
  });

  it('escapes attribute-unsafe characters in frontmatter', () => {
    const hostile = buildPostMeta({
      ...postFm,
      title: 'quote"inside',
      description: 'less<than',
      ogImage: '/og/ev"il.png',
    });
    // The raw " must not appear inside any attribute value (content="...")
    expect(hostile).not.toContain('content="quote"inside');
    expect(hostile).toContain('quote&quot;inside');
    // The raw < must not appear in attribute values (the title text node is safe)
    expect(hostile).not.toContain('less<than');
    expect(hostile).toContain('less&lt;than');
    // The ogImage " must be escaped in the image attribute
    expect(hostile).not.toContain('ev"il.png"');
    expect(hostile).toContain('ev&quot;il.png');
  });

  it('escapes </script> sequences in JSON-LD', () => {
    const hostile = buildPostMeta({
      ...postFm,
      title: 'contains</script><x>',
    });
    expect(hostile).not.toContain('</script><x>');
    expect(hostile).toContain('\\u003c/script>\\u003cx>');
  });
});

describe('buildIndexMeta', () => {
  const html = buildIndexMeta('tr');

  it('uses website OG type and Blog JSON-LD type', () => {
    expect(html).toContain('<meta property="og:type" content="website">');
    expect(html).toContain('"@type": "Blog"');
  });

  it('does not include article:published_time', () => {
    expect(html).not.toContain('article:published_time');
  });

  it('includes all four Twitter card tags', () => {
    expect(html).toContain('<meta name="twitter:card" content="summary_large_image">');
    expect(html).toContain('<meta name="twitter:title"');
    expect(html).toContain('<meta name="twitter:description"');
    expect(html).toContain('<meta name="twitter:image"');
  });
});
