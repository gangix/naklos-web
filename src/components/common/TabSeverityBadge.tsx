import type { Severity } from '../../types/severity';

interface Props {
  severity: Severity;
  count: number;
}

const TONE_CLASS: Record<Severity, string> = {
  CRITICAL: 'bg-urgent-100 text-urgent-700',
  WARNING: 'bg-attention-100 text-attention-700',
  INFO: 'bg-info-100 text-info-700',
};

/**
 * Inline pill rendered next to a tab label when the tab's domain has open
 * warnings. CRITICAL / WARNING render visibly; INFO and zero-count are hidden
 * (info-only counts are too noisy for the tab bar).
 */
export default function TabSeverityBadge({ severity, count }: Props) {
  if (count === 0 || severity === 'INFO') return null;
  return (
    <span
      className={`inline-flex items-center gap-0.5 px-1.5 py-px rounded text-[10px] font-bold tabular-nums ml-1.5 ${TONE_CLASS[severity]}`}
      aria-label={severity === 'CRITICAL' ? `${count} acil` : `${count} uyarı`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${severity === 'CRITICAL' ? 'bg-urgent-500' : 'bg-attention-500'}`} aria-hidden="true" />
      {count}
    </span>
  );
}
