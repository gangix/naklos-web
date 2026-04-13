import { AlertTriangle, MessageCircle, X } from 'lucide-react';

const WHATSAPP_URL = 'https://wa.me/4915257870965?text=Naklos%20plan%20yükseltme%20hakkında%20bilgi%20almak%20istiyorum';

const PLAN_DISPLAY: Record<string, { name: string; next: string; nextPrice: string }> = {
  FREE: { name: 'Başlangıç', next: 'Profesyonel', nextPrice: '499 ₺/ay' },
  PROFESSIONAL: { name: 'Profesyonel', next: 'İşletme', nextPrice: '999 ₺/ay' },
  BUSINESS: { name: 'İşletme', next: 'Kurumsal', nextPrice: 'Özel fiyat' },
  ENTERPRISE: { name: 'Kurumsal', next: '', nextPrice: '' },
};

const PLAN_LIMITS: Record<string, Record<string, number>> = {
  FREE: { araç: 5, sürücü: 5, müşteri: 3 },
  PROFESSIONAL: { araç: 25, sürücü: 25, müşteri: -1 },
  BUSINESS: { araç: 100, sürücü: 100, müşteri: -1 },
  ENTERPRISE: { araç: -1, sürücü: -1, müşteri: -1 },
};

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  resource: string;
  currentPlan: string;
  /** Custom message for feature gates (e.g., bulk import). If set, replaces the limit-based subtitle. */
  message?: string;
}

const UpgradeModal = ({ isOpen, onClose, resource, currentPlan, message }: UpgradeModalProps) => {
  if (!isOpen) return null;

  const current = PLAN_DISPLAY[currentPlan] ?? PLAN_DISPLAY.FREE;
  const currentLimits = PLAN_LIMITS[currentPlan] ?? PLAN_LIMITS.FREE;
  const nextPlan = current.next;
  const nextLimits = PLAN_LIMITS[nextPlan === 'Profesyonel' ? 'PROFESSIONAL' : nextPlan === 'İşletme' ? 'BUSINESS' : 'ENTERPRISE'] ?? {};

  const currentLimit = currentLimits[resource] ?? 0;
  const nextLimit = nextLimits[resource] ?? -1;

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
                {message ? 'Planınızı Yükseltin' : 'Plan Limitine Ulaştınız'}
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                {message ?? (
                  <>
                    {current.name} planınızda en fazla{' '}
                    <span className="font-semibold">{currentLimit} {resource}</span>{' '}
                    ekleyebilirsiniz.
                  </>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Body — plan comparison (hidden for feature gates where message is set) */}
        {nextPlan && !message && (
          <div className="px-6 py-5">
            <div className="grid grid-cols-2 gap-3">
              {/* Current plan */}
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2">Mevcut</p>
                <p className="text-sm font-bold text-gray-900">{current.name}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {currentLimit === -1 ? 'Sınırsız' : `${currentLimit} ${resource}`}
                </p>
              </div>

              {/* Next plan */}
              <div className="rounded-xl border-2 border-primary-200 bg-primary-50 p-4">
                <p className="text-[11px] font-semibold text-primary-600 uppercase tracking-wider mb-2">Önerilen</p>
                <p className="text-sm font-bold text-gray-900">{nextPlan}</p>
                <p className="text-xs text-gray-600 mt-1">
                  {nextLimit === -1 ? 'Sınırsız' : `${nextLimit} ${resource}`}
                </p>
                <p className="text-xs font-semibold text-primary-700 mt-2">{current.nextPrice}</p>
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
            Kapat
          </button>
          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 py-3 bg-primary-600 text-white rounded-xl font-semibold hover:bg-primary-700 transition-colors text-sm flex items-center justify-center gap-2"
          >
            <MessageCircle className="w-4 h-4" />
            Planı Yükselt
          </a>
        </div>
      </div>
    </div>
  );
};

export default UpgradeModal;
