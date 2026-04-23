// src/content/parsePost.ts
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

// Our blog posts use a flat "key: value" frontmatter only (no nested
// mappings, no arrays). gray-matter pulled Node's Buffer into the client
// bundle for this trivial shape; this tiny parser replaces it and is
// browser-safe.
function splitFrontmatter(raw: string): {
  data: Record<string, string | number>;
  content: string;
} {
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!m) return { data: {}, content: raw };
  const [, yaml, content] = m;
  const data: Record<string, string | number> = {};
  for (const line of yaml.split(/\r?\n/)) {
    if (!line.trim() || line.trimStart().startsWith('#')) continue;
    const idx = line.indexOf(':');
    if (idx < 1) continue;
    const key = line.slice(0, idx).trim();
    let value: string | number = line.slice(idx + 1).trim();
    if (
      value.length >= 2 &&
      ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'")))
    ) {
      value = value.slice(1, -1);
    }
    if (/^-?\d+(\.\d+)?$/.test(value)) value = Number(value);
    data[key] = value;
  }
  return { data, content };
}

export function parsePost(raw: string, filePath: string): Post {
  const { data, content } = splitFrontmatter(raw);

  const slug = requireField(data.slug as string | undefined, 'slug');
  const title = requireField(data.title as string | undefined, 'title');
  const description = requireField(data.description as string | undefined, 'description');
  const date = String(requireField(data.date as string | undefined, 'date'));
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
      date,
      readingTimeMinutes: Number(readingTimeMinutes),
      locale,
      ogImage: data.ogImage as string | undefined,
    },
    html,
  };
}
