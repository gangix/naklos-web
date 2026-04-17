import type { Severity } from '../../types/fuelAnomaly';

interface Props {
  severity: Severity;
  /** Extra Tailwind classes — useful for absolute positioning adjustments. */
  className?: string;
}

const gradientClass: Record<Severity, string> = {
  CRITICAL: 'bg-gradient-to-b from-urgent-500 to-urgent-700',
  WARNING: 'bg-gradient-to-b from-attention-500 to-attention-700',
  INFO: 'bg-gradient-to-b from-info-500 to-info-700',
};

/** 4px gradient stripe that owns the left edge of a card. Must be rendered
 *  inside a `relative` parent. Positions top-left absolutely; the parent is
 *  expected to provide rounded corners via `overflow-hidden`. */
export default function SeverityStripe({ severity, className = '' }: Props) {
  return (
    <div
      aria-hidden="true"
      className={`absolute left-0 top-0 bottom-0 w-1 ${gradientClass[severity]} ${className}`}
    />
  );
}
