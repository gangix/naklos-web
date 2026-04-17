import { useTranslation } from 'react-i18next';
import { Check } from 'lucide-react';

interface Props {
  /** When true, renders the filtered-list empty message instead of the
   *  "everything is fine" message. */
  filtered?: boolean;
}

/** Breathing check-circle with radial aura. Reward state for an empty list. */
export default function FuelAlertsEmpty({ filtered = false }: Props) {
  const { t } = useTranslation();

  const title = filtered
    ? t('fuelAlerts.empty.filteredTitle')
    : t('fuelAlerts.empty.title');
  const subtitle = filtered
    ? t('fuelAlerts.empty.filteredSubtitle')
    : t('fuelAlerts.empty.subtitle');

  return (
    <>
      <style>{`
        @keyframes fuel-alerts-breathe {
          0%, 100% { transform: scale(1);    opacity: 1    }
          50%      { transform: scale(1.04); opacity: 0.92 }
        }
        .fuel-alerts-breathe { animation: fuel-alerts-breathe 6s ease-in-out infinite; }
        .fuel-alerts-aura {
          background: radial-gradient(circle at 50% 40%, rgba(14,165,233,0.12), rgba(250,250,247,0) 62%);
        }
      `}</style>
      <div className="fuel-alerts-aura relative rounded-2xl py-20 px-6 overflow-hidden">
        <div className="relative max-w-sm mx-auto text-center">
          <div className="fuel-alerts-breathe inline-flex w-16 h-16 mx-auto rounded-full bg-white shadow-card items-center justify-center mb-6 border border-slate-100">
            <Check className="w-7 h-7 text-info-500" strokeWidth={2.5} />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">{title}</h2>
          <p className="mt-2 text-sm text-slate-600 leading-relaxed">{subtitle}</p>
        </div>
      </div>
    </>
  );
}
