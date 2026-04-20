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

/** Gradient stripe on the left edge of a card. 3px wide so the severity
 *  color is actually scannable from across the list — earlier w-1 (2px)
 *  was too thin to register at a glance. Must render inside a `relative`
 *  parent; parent provides rounded corners via `overflow-hidden`. */
export default function SeverityStripe({ severity, className = '' }: Props) {
  return (
    <div
      aria-hidden="true"
      className={`absolute left-0 top-0 bottom-0 w-1.5 ${gradientClass[severity]} ${className}`}
    />
  );
}
