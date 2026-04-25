import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { MapPin } from 'lucide-react';
import type { Truck } from '../../types';
import type { TruckWarning } from '../../utils/truckWarnings';
import { deriveTruckStatus, STATUS_BADGE, type DerivedStatus } from '../../utils/derivedStatus';
import RelativeTime from '../common/RelativeTime';

interface Props {
  trucks: Truck[];
  warningsByTruck: Map<string, TruckWarning[]>;
  hasUrgentWarning: (id: string) => boolean;
  statusByTruckId?: Map<string, DerivedStatus>;
}

/** Pick the single most-urgent warning from the list.
 *  Sort key: expired/missing < soonest positive daysLeft.
 *  Among positives, smallest daysLeft wins. null (missing date) goes last. */
function worstWarning(warnings: TruckWarning[]): TruckWarning | null {
  if (warnings.length === 0) return null;
  return warnings.reduce((best, w) => {
    // null < any negative < any positive
    if (best.daysLeft === null) return best;
    if (w.daysLeft === null) return best;
    return w.daysLeft < best.daysLeft ? w : best;
  });
}

const TYPE_LABEL_KEY: Record<TruckWarning['type'], string> = {
  'compulsory-insurance': 'trucksPage.compulsoryInsurance',
  'comprehensive-insurance': 'trucksPage.comprehensiveInsurance',
  'inspection': 'trucksPage.inspection',
};

/** Dense alternative to the card grid. Same data, lower pixel cost. Row
 *  links to the truck detail page; docStatus cell shows the worst expiring
 *  doc's label + day-pill so managers can triage without clicking each row. */
export default function TruckTable({ trucks, warningsByTruck, hasUrgentWarning, statusByTruckId }: Props) {
  const { t } = useTranslation();

  const th = 'py-2.5 px-4 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500';
  const td = 'py-2.5 px-4 text-sm text-slate-700 align-middle';

  return (
    <div className="overflow-x-auto bg-white rounded-xl border border-slate-200 shadow-card">
      <table className="min-w-full">
        <thead className="bg-slate-50/80 border-b border-slate-200">
          <tr>
            <th scope="col" className={th}>{t('trucks.table.plate')}</th>
            <th scope="col" className={th}>{t('trucks.table.type')}</th>
            <th scope="col" className={th}>{t('trucks.table.driver')}</th>
            <th scope="col" className={th}>{t('trucks.table.lastLocation')}</th>
            <th scope="col" className={th}>{t('trucks.table.docStatus')}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {trucks.map((truck) => {
            const warnings = warningsByTruck.get(truck.id) ?? [];
            const urgent = hasUrgentWarning(truck.id);
            const ds = statusByTruckId?.get(truck.id) ?? deriveTruckStatus(truck);
            const badge = STATUS_BADGE[ds];
            const pos = truck.lastPosition;
            const worst = worstWarning(warnings);

            // Day-pill label — mirrors DayLabel in PriorityBriefing
            const dayLabel = worst
              ? worst.daysLeft === null
                ? t('common.dateMissing')
                : worst.daysLeft < 0
                  ? t('common.daysExpiredShort', { count: Math.abs(worst.daysLeft) })
                  : worst.daysLeft === 0
                    ? t('common.today')
                    : t('common.daysRemainingShort', { count: worst.daysLeft })
              : null;

            // Severity tone for the cell
            const tone: 'urgent' | 'attention' | 'info' | null = worst
              ? worst.daysLeft === null
                ? 'info'
                : worst.daysLeft <= 7
                  ? 'urgent'
                  : worst.daysLeft <= 30
                    ? 'attention'
                    : 'info'
              : null;

            const toneClasses: Record<'urgent' | 'attention' | 'info', string> = {
              urgent: 'bg-urgent-50 text-urgent-700',
              attention: 'bg-attention-50 text-attention-700',
              info: 'bg-slate-100 text-slate-600',
            };

            return (
              <tr
                key={truck.id}
                className={`${urgent ? 'bg-urgent-50/40' : ''} hover:bg-slate-50 transition-colors`}
              >
                <td className={td}>
                  <Link
                    to={`/manager/trucks/${truck.id}`}
                    className="font-mono tabular-nums tracking-wide text-slate-900 hover:text-primary-600"
                  >
                    {truck.plateNumber}
                  </Link>
                </td>
                <td className={td}>
                  {t(`truckType.${truck.type}`, { defaultValue: truck.type })}
                </td>
                <td className={td}>
                  {truck.assignedDriverName ? (
                    <span className="text-slate-700">{truck.assignedDriverName}</span>
                  ) : (
                    <span className="text-xs text-slate-400 italic">
                      {t('trucks.table.noDriver')}
                    </span>
                  )}
                </td>
                <td className={td}>
                  {pos ? (
                    <span className="inline-flex items-center gap-1 text-slate-600">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                      <span>{pos.city}</span>
                      {pos.updatedAt && (
                        <span className="text-xs text-slate-400 tabular-nums">
                          · <RelativeTime date={pos.updatedAt} />
                        </span>
                      )}
                    </span>
                  ) : (
                    <span className="text-xs text-slate-300">—</span>
                  )}
                </td>
                <td className={td}>
                  {worst && tone ? (
                    <span className="inline-flex items-center gap-1.5">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold ${toneClasses[tone]}`}
                      >
                        <span className="truncate max-w-[8rem]">
                          {t(TYPE_LABEL_KEY[worst.type])}
                        </span>
                        <span className="text-[10px] opacity-80">·</span>
                        <span className="tabular-nums whitespace-nowrap">{dayLabel}</span>
                      </span>
                      {warnings.length > 1 && (
                        <span className="text-[10px] font-semibold text-slate-400 tabular-nums">
                          +{warnings.length - 1}
                        </span>
                      )}
                    </span>
                  ) : (
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold ${badge.bg} ${badge.text}`}>
                      {t(`derivedStatus.${ds}`)}
                    </span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
