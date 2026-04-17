import { useTranslation } from 'react-i18next';
import { Check } from 'lucide-react';
import './fuelAlertsAnimations.css';

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
    <div className="fuel-alerts-aura relative rounded-2xl py-20 px-6 overflow-hidden">
      <div className="relative max-w-sm mx-auto text-center">
        <div className="fuel-alerts-breathe inline-flex w-16 h-16 mx-auto rounded-full bg-white shadow-card items-center justify-center mb-6 border border-slate-100">
          <Check className="w-7 h-7 text-info-500" strokeWidth={2.5} />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">{title}</h2>
        <p className="mt-2 text-sm text-slate-600 leading-relaxed">{subtitle}</p>
      </div>
    </div>
  );
}
