// src/content/loader.ts
import { parsePost, type Locale, type Post } from './parsePost';

// Vite evaluates this at build time. `eager: true` means all .md files are
// bundled into this chunk (which is itself inside the lazy-loaded blog split).
const raw = import.meta.glob('./blog/**/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

const allPosts: Post[] = Object.entries(raw).map(([path, content]) =>
  parsePost(content, path),
);

export function listPosts(locale: Locale): Post[] {
  return allPosts
    .filter((p) => p.frontmatter.locale === locale)
    .sort((a, b) => (a.frontmatter.date < b.frontmatter.date ? 1 : -1));
}

export function getPost(slug: string, locale: Locale): Post | undefined {
  return allPosts.find(
    (p) => p.frontmatter.slug === slug && p.frontmatter.locale === locale,
  );
}

export function getPostWithFallback(
  slug: string,
  locale: Locale,
): { post: Post; usedFallback: boolean } | undefined {
  const exact = getPost(slug, locale);
  if (exact) return { post: exact, usedFallback: false };
  const tr = getPost(slug, 'tr');
  if (tr) return { post: tr, usedFallback: true };
  return undefined;
}

export { type Post, type Locale, type Frontmatter } from './parsePost';
