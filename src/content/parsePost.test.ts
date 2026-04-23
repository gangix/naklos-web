// src/content/parsePost.test.ts
import { describe, it, expect } from 'vitest';
import { parsePost } from './parsePost';

const sampleMd = `---
slug: yakit-takibi-nasil-yapilir
title: Filo Yakıt Takibi Nasıl Yapılır?
description: Short description
date: 2026-04-23
readingTimeMinutes: 5
locale: tr
ogImage: /og/yakit-takibi.png
---

## Neden yakıt takibi önemli?

Bir nakliyat firmasında yakıt gideri, toplam operasyonel maliyetin %30–40'ını oluşturur.
`;

describe('parsePost', () => {
  it('extracts frontmatter into typed object', () => {
    const post = parsePost(sampleMd, 'src/content/blog/tr/yakit-takibi-nasil-yapilir.md');
    expect(post.frontmatter.slug).toBe('yakit-takibi-nasil-yapilir');
    expect(post.frontmatter.title).toBe('Filo Yakıt Takibi Nasıl Yapılır?');
    expect(post.frontmatter.locale).toBe('tr');
    expect(post.frontmatter.readingTimeMinutes).toBe(5);
    expect(post.frontmatter.date).toBe('2026-04-23');
    expect(post.frontmatter.ogImage).toBe('/og/yakit-takibi.png');
  });

  it('compiles markdown body to HTML', () => {
    const post = parsePost(sampleMd, 'src/content/blog/tr/yakit-takibi-nasil-yapilir.md');
    expect(post.html).toContain('<h2');
    expect(post.html).toContain('Neden yakıt takibi önemli?');
    expect(post.html).not.toContain('---'); // frontmatter stripped
  });

  it('derives locale from file path when frontmatter locale is missing', () => {
    const mdNoLocale = `---
slug: x
title: X
description: X
date: 2026-01-01
readingTimeMinutes: 1
---

# X
`;
    const post = parsePost(mdNoLocale, 'src/content/blog/en/x.md');
    expect(post.frontmatter.locale).toBe('en');
  });

  it('throws if required frontmatter fields are missing', () => {
    const bad = `---
title: X
---

body
`;
    expect(() => parsePost(bad, 'src/content/blog/tr/x.md')).toThrow(/slug/);
  });
});
