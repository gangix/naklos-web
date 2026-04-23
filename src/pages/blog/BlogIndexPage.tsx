// src/pages/blog/BlogIndexPage.tsx
import { useTranslation } from 'react-i18next';
import BlogLayout from './BlogLayout';
import PostCard from './components/PostCard';
import { listPosts, type Locale } from '../../content/loader';

export default function BlogIndexPage() {
  const { i18n, t } = useTranslation();
  const locale = (i18n.language as Locale) ?? 'tr';
  // If the current locale has no posts, fall back to TR — early-stage blog
  // is likely TR-only for a while.
  const posts = listPosts(locale).length > 0 ? listPosts(locale) : listPosts('tr');

  return (
    <BlogLayout>
      <main className="max-w-3xl mx-auto px-4 py-16">
        <h1 className="text-3xl font-extrabold text-slate-900 mb-2">
          {t('blog.index.title')}
        </h1>
        <p className="text-slate-600 mb-10">{t('blog.index.subtitle')}</p>
        <div className="space-y-6">
          {posts.map((p) => (
            <PostCard key={p.frontmatter.slug} frontmatter={p.frontmatter} />
          ))}
        </div>
      </main>
    </BlogLayout>
  );
}
