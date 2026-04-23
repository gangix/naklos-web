// src/pages/blog/components/LocaleFallbackNotice.tsx
import { useTranslation } from 'react-i18next';

export default function LocaleFallbackNotice() {
  const { t } = useTranslation();
  return (
    <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-600 mb-6">
      {t('blog.fallbackNotice')}
    </div>
  );
}
