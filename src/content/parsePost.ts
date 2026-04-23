// src/content/parsePost.ts
import matter from 'gray-matter';
import { marked } from 'marked';

export type Locale = 'tr' | 'en' | 'de';

export type Frontmatter = {
  slug: string;
  title: string;
  description: string;
  date: string;
  readingTimeMinutes: number;
  locale: Locale;
  ogImage?: string;
};

export type Post = { frontmatter: Frontmatter; html: string };

const LOCALES: readonly Locale[] = ['tr', 'en', 'de'];

function localeFromPath(filePath: string): Locale | undefined {
  // Expect paths like ".../blog/tr/slug.md" or "src/content/blog/en/slug.md"
  const m = filePath.match(/blog\/(tr|en|de)\//);
  return (m?.[1] as Locale) ?? undefined;
}

function requireField<T>(value: T | undefined, field: string): T {
  if (value === undefined || value === null || value === '') {
    throw new Error(`parsePost: missing required frontmatter field "${field}"`);
  }
  return value;
}

export function parsePost(raw: string, filePath: string): Post {
  const { data, content } = matter(raw);

  const slug = requireField(data.slug as string | undefined, 'slug');
  const title = requireField(data.title as string | undefined, 'title');
  const description = requireField(data.description as string | undefined, 'description');
  const rawDate = requireField(data.date as string | Date | undefined, 'date');
  // gray-matter/js-yaml parses bare YAML dates (2026-04-23) as Date objects.
  // Convert back to ISO date string so consumers always get "YYYY-MM-DD".
  const date = rawDate instanceof Date
    ? rawDate.toISOString().slice(0, 10)
    : String(rawDate);
  const readingTimeMinutes = requireField(
    data.readingTimeMinutes as number | undefined,
    'readingTimeMinutes',
  );

  const localeRaw = (data.locale as string | undefined) ?? localeFromPath(filePath);
  if (!localeRaw || !LOCALES.includes(localeRaw as Locale)) {
    throw new Error(
      `parsePost: cannot determine locale for ${filePath}; set frontmatter.locale or place under blog/{tr,en,de}/`,
    );
  }
  const locale = localeRaw as Locale;

  const html = marked.parse(content, { async: false }) as string;

  return {
    frontmatter: {
      slug,
      title,
      description,
      date: String(date),
      readingTimeMinutes: Number(readingTimeMinutes),
      locale,
      ogImage: data.ogImage as string | undefined,
    },
    html,
  };
}
