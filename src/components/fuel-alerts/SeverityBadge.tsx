import { useTranslation } from 'react-i18next';
import type { Severity } from '../../types/fuelAnomaly';

interface Props {
  severity: Severity;
  size?: 'xs' | 'sm';
  className?: string;
}

const severityBgClass: Record<Severity, string> = {
  CRITICAL: 'bg-urgent-500',
  WARNING: 'bg-attention-500',
  INFO: 'bg-info-500',
};

const severityKey: Record<Severity, 'urgent' | 'attention' | 'info'> = {
  CRITICAL: 'urgent',
  WARNING: 'attention',
  INFO: 'info',
};

/** Solid severity pill — uppercase tracking-wider text on severity-500 bg. */
export default function SeverityBadge({ severity, size = 'sm', className = '' }: Props) {
  const { t } = useTranslation();
  const label = t(`fuelAlerts.severity.${severityKey[severity]}`);

  const sizeClass =
    size === 'xs'
      ? 'px-2 py-0.5 text-[10px]'
      : 'px-2.5 py-0.5 text-[11px]';

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md font-bold tracking-wider uppercase text-white ${severityBgClass[severity]} ${sizeClass} ${className}`}
    >
      {label}
    </span>
  );
}
