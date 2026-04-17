import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronRight, Truck as TruckIcon } from 'lucide-react';
import Plate from './Plate';
import type { Severity } from '../../types/fuelAnomaly';

interface Props {
  plate: string | null;
  subtitle?: string;
  severityCounts: Record<Severity, number>;
  defaultOpen?: boolean;
  children: ReactNode;
}

const chipClass: Record<Severity, string> = {
  CRITICAL: 'bg-urgent-50 text-urgent-700 border border-urgent-100',
  WARNING: 'bg-attention-50 text-attention-700 border border-attention-100',
  INFO: 'bg-info-50 text-info-700 border border-info-100',
};

const dotClass: Record<Severity, string> = {
  CRITICAL: 'bg-urgent-500',
  WARNING: 'bg-attention-500',
  INFO: 'bg-info-500',
};

const severityI18nKey: Record<Severity, string> = {
  CRITICAL: 'fuelAlerts.severity.urgent',
  WARNING: 'fuelAlerts.severity.attention',
  INFO: 'fuelAlerts.severity.info',
};

/** Collapsible truck group. Summary must show aggregate severity chips
 *  so a manager can triage-scan without expanding every group. */
export default function TruckAccordion({
  plate,
  subtitle,
  severityCounts,
  defaultOpen = false,
  children,
}: Props) {
  const { t } = useTranslation();
  const chips: Severity[] = (['CRITICAL', 'WARNING', 'INFO'] as const).filter(
    (s) => severityCounts[s] > 0,
  );

  return (
    <details
      open={defaultOpen}
      className="group mb-4 bg-white rounded-xl border border-slate-200 shadow-card overflow-hidden"
    >
      <summary className="flex items-center gap-3 px-5 py-4 hover:bg-slate-50 transition-colors list-none cursor-pointer select-none">
        <ChevronRight className="w-4 h-4 text-slate-400 flex-shrink-0 transition-transform group-open:rotate-90" />

        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-10 h-10 rounded-lg bg-slate-900 text-white flex items-center justify-center flex-shrink-0">
            <TruckIcon className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <Plate plate={plate} size="lg" />
            {subtitle && (
              <div className="text-xs text-slate-500 truncate">{subtitle}</div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0 flex-wrap justify-end">
          {chips.map((s) => (
            <span
              key={s}
              className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-bold tabular-nums ${chipClass[s]}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${dotClass[s]}`} />
              {severityCounts[s]} {t(severityI18nKey[s])}
            </span>
          ))}
        </div>
      </summary>

      <div className="border-t border-slate-100">{children}</div>
    </details>
  );
}
