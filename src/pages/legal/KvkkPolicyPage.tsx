import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function KvkkPolicyPage() {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen bg-warm-50">
      <div className="max-w-3xl mx-auto px-4 py-16">
        <Link to="/" className="text-sm text-slate-500 hover:text-slate-900 mb-8 inline-block">
          ← {t('kvkkPage.backLink')}
        </Link>

        <div className="bg-attention-50 border border-attention-200 text-attention-700 rounded-xl p-4 mb-8 text-sm">
          <strong>Draft.</strong> {t('kvkkPage.draftBanner')}
        </div>

        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-6">
          {t('kvkkPage.title')}
        </h1>

        <p className="text-slate-700 leading-relaxed">{t('kvkkPage.placeholder')}</p>

        <p className="mt-8 text-sm text-slate-500">{t('kvkkPage.contact')}</p>
      </div>
    </div>
  );
}
