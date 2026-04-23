// src/pages/blog/components/BlogCta.tsx
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function BlogCta() {
  const { t } = useTranslation();
  return (
    <div className="bg-primary-50 border border-primary-100 rounded-2xl p-6 mt-8 not-prose">
      <h3 className="font-bold text-slate-900 mb-2">{t('blog.cta.title')}</h3>
      <p className="text-sm text-slate-600 mb-4">{t('blog.cta.body')}</p>
      <Link
        to="/"
        className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-700 text-white rounded-xl font-semibold text-sm hover:bg-primary-800 transition-colors"
      >
        {t('blog.cta.button')}
      </Link>
    </div>
  );
}
