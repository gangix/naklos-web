// src/pages/blog/components/PostCard.tsx
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { Frontmatter } from '../../../content/loader';

export default function PostCard({ frontmatter }: { frontmatter: Frontmatter }) {
  const { t, i18n } = useTranslation();
  const date = new Intl.DateTimeFormat(i18n.language, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(frontmatter.date));

  return (
    <Link
      to={`/blog/${frontmatter.slug}`}
      className="block bg-white border border-slate-200 rounded-2xl p-6 hover:border-slate-300 transition-colors"
    >
      <div className="flex items-center gap-2 text-xs text-slate-400 mb-2">
        <span>{date}</span>
        <span aria-hidden="true">·</span>
        <span>{t('blog.readingTime', { minutes: frontmatter.readingTimeMinutes })}</span>
      </div>
      <h2 className="text-lg font-bold text-slate-900 mb-1">{frontmatter.title}</h2>
      <p className="text-sm text-slate-600">{frontmatter.description}</p>
    </Link>
  );
}
