import { AlertTriangle, Mail, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const CONTACT_EMAIL = 'mailto:info@naklos.com.tr?subject=Naklos%20Plan%20Upgrade';

const PLAN_NEXT: Record<string, { next: string; nextPriceKey: string }> = {
  FREE:         { next: 'PROFESSIONAL', nextPriceKey: 'upgrade.priceProfessional' },
  PROFESSIONAL: { next: 'BUSINESS',     nextPriceKey: 'upgrade.priceBusiness' },
  BUSINESS:     { next: 'ENTERPRISE',   nextPriceKey: 'upgrade.priceEnterprise' },
  ENTERPRISE:   { next: '',             nextPriceKey: '' },
};

// -1 = unlimited
const PLAN_LIMITS: Record<string, Record<string, number>> = {
  FREE:         { truck: 5,   driver: 5,   client: 3 },
  PROFESSIONAL: { truck: 25,  driver: 25,  client: -1 },
  BUSINESS:     { truck: 100, driver: 100, client: -1 },
  ENTERPRISE:   { truck: -1,  driver: -1,  client: -1 },
};

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Stable resource key — 'truck' | 'driver' | 'client'. */
  resource: 'truck' | 'driver' | 'client';
  currentPlan: string;
  /** Custom message for feature gates (e.g., bulk import). If set, replaces the limit-based subtitle. */
  message?: string;
}

const UpgradeModal = ({ isOpen, onClose, resource, currentPlan, message }: UpgradeModalProps) => {
  const { t } = useTranslation();
  if (!isOpen) return null;

  const plan = (PLAN_NEXT[currentPlan] != null ? currentPlan : 'FREE') as keyof typeof PLAN_NEXT;
  const next = PLAN_NEXT[plan];
  const currentLimit = (PLAN_LIMITS[plan] ?? PLAN_LIMITS.FREE)[resource] ?? 0;
  const nextLimit = (PLAN_LIMITS[next.next] ?? {})[resource] ?? -1;
  const resourceLabel = t(`resource.${resource}`);

  const formatLimit = (limit: number) =>
    limit === -1 ? t('upgrade.unlimited') : `${limit} ${resourceLabel}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl shadow-gray-900/10 max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className="bg-amber-50 border-b border-amber-100 px-6 py-5">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-white/80 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center flex-shrink-0 mt-0.5">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-gray-900 tracking-tight">
                {message ? t('upgrade.upgradeYourPlan') : t('upgrade.limitReached')}
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                {message ?? (
                  <>
                    {t('upgrade.limitDescription', {
                      planName: t(`plan.${plan.toLowerCase()}`),
                      count: currentLimit,
                      resource: resourceLabel,
                    })}
                  </>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Body — plan comparison (hidden for feature gates where message is set) */}
        {next.next && !message && (
          <div className="px-6 py-5">
            <div className="grid grid-cols-2 gap-3">
              {/* Current plan */}
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2">{t('upgrade.current')}</p>
                <p className="text-sm font-bold text-gray-900">{t(`plan.${plan.toLowerCase()}`)}</p>
                <p className="text-xs text-gray-500 mt-1">{formatLimit(currentLimit)}</p>
              </div>

              {/* Next plan */}
              <div className="rounded-xl border-2 border-primary-200 bg-primary-50 p-4">
                <p className="text-[11px] font-semibold text-primary-600 uppercase tracking-wider mb-2">{t('upgrade.recommended')}</p>
                <p className="text-sm font-bold text-gray-900">{t(`plan.${next.next.toLowerCase()}`)}</p>
                <p className="text-xs text-gray-600 mt-1">{formatLimit(nextLimit)}</p>
                <p className="text-xs font-semibold text-primary-700 mt-2">{t(next.nextPriceKey)}</p>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="px-6 pb-6 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-colors text-sm"
          >
            {t('common.close')}
          </button>
          <a
            href={CONTACT_EMAIL}
            className="flex-1 py-3 bg-primary-600 text-white rounded-xl font-semibold hover:bg-primary-700 transition-colors text-sm flex items-center justify-center gap-2"
          >
            <Mail className="w-4 h-4" />
            {t('upgrade.upgradeButton')}
          </a>
        </div>
      </div>
    </div>
  );
};

export default UpgradeModal;
