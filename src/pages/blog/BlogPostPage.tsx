// src/pages/blog/BlogPostPage.tsx
import { Link, useParams, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import BlogLayout from './BlogLayout';
import BlogCta from './components/BlogCta';
import LocaleFallbackNotice from './components/LocaleFallbackNotice';
import { getPostWithFallback, type Locale } from '../../content/loader';

export default function BlogPostPage() {
  const { slug } = useParams<{ slug: string }>();
  const { t, i18n } = useTranslation();
  const locale = (i18n.language as Locale) ?? 'tr';

  if (!slug) return <Navigate to="/blog" replace />;

  const result = getPostWithFallback(slug, locale);
  if (!result) return <Navigate to="/404" replace />;

  const { post, usedFallback } = result;
  const date = new Intl.DateTimeFormat(i18n.language, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(post.frontmatter.date));

  return (
    <BlogLayout>
      <main className="max-w-2xl mx-auto px-4 py-16">
        <Link
          to="/blog"
          className="text-sm text-slate-500 hover:text-slate-900 mb-8 inline-block"
        >
          {t('blog.backToBlog')}
        </Link>

        {usedFallback && <LocaleFallbackNotice />}

        <div className="mb-8">
          <div className="text-xs text-slate-400 mb-3">
            {date} · {t('blog.readingTime', { minutes: post.frontmatter.readingTimeMinutes })}
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 leading-tight mb-4">
            {post.frontmatter.title}
          </h1>
          <p className="text-lg text-slate-600 leading-relaxed">
            {post.frontmatter.description}
          </p>
        </div>

        <article
          className="prose prose-slate max-w-none"
          dangerouslySetInnerHTML={{ __html: post.html }}
        />

        <BlogCta />
      </main>
    </BlogLayout>
  );
}
