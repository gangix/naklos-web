import { useTranslation } from 'react-i18next';
import type { EfficiencyStatus } from '../../utils/fuelStats';

interface Props {
  status: EfficiencyStatus;
  deviationPct: number | null;
  hasTarget: boolean;
}

const STATUS_TONE: Record<EfficiencyStatus, { cls: string; dot: string; key: string }> = {
  normal: {
    cls: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    dot: 'bg-emerald-500',
    key: 'fuelEntry.efficiency.status.normal',
  },
  attention: {
    cls: 'bg-amber-50 text-amber-700 border-amber-100',
    dot: 'bg-amber-500',
    key: 'fuelEntry.efficiency.status.attention',
  },
  warning: {
    cls: 'bg-red-50 text-red-700 border-red-100',
    dot: 'bg-red-500',
    key: 'fuelEntry.efficiency.status.warning',
  },
};

/**
 * Efficiency status pill shared between the Yakıt Kayıtları hero and the
 * Genel tab's mini efficiency card. Encodes the tone + dot + i18n'd label
 * once so the two surfaces can't drift apart visually or semantically.
 */
export default function EfficiencyStatusPill({ status, deviationPct, hasTarget }: Props) {
  const { t } = useTranslation();
  if (!hasTarget) {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-100 text-gray-600 text-xs font-bold border border-gray-200">
        <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
        {t('fuelEntry.efficiency.status.noTarget')}
      </span>
    );
  }
  const cfg = STATUS_TONE[status];
  // Pick the right phrasing based on direction; always pass a positive count.
  const deviation =
    deviationPct !== null
      ? t(
          deviationPct >= 0
            ? 'fuelEntry.efficiency.status.deviationOver'
            : 'fuelEntry.efficiency.status.deviationUnder',
          { count: Math.abs(deviationPct) },
        )
      : '';
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border ${cfg.cls}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {t(cfg.key)}
      {deviation && <span className="font-normal opacity-80"> · {deviation}</span>}
    </span>
  );
}
