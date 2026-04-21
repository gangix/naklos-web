import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function FoundingTermsPage() {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen bg-warm-50">
      <div className="max-w-3xl mx-auto px-4 py-16">
        <Link to="/" className="text-sm text-slate-500 hover:text-slate-900 mb-8 inline-block">
          ← {t('foundingTerms.backLink')}
        </Link>

        <div className="bg-attention-50 border border-attention-200 text-attention-700 rounded-xl p-4 mb-8 text-sm">
          <strong>Draft.</strong> {t('foundingTerms.draftBanner')}
        </div>

        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-6">
          {t('foundingTerms.title')}
        </h1>

        <ol className="space-y-4 text-slate-700 list-decimal list-inside leading-relaxed">
          <li>{t('foundingTerms.point1')}</li>
          <li>{t('foundingTerms.point2')}</li>
          <li>{t('foundingTerms.point3')}</li>
          <li>{t('foundingTerms.point4')}</li>
          <li>{t('foundingTerms.point5')}</li>
        </ol>

        <p className="mt-8 text-sm text-slate-500">
          {t('foundingTerms.contact')}
        </p>
      </div>
    </div>
  );
}
