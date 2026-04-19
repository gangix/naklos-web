import type { LucideIcon } from 'lucide-react';

type Tone = 'neutral' | 'urgent' | 'attention' | 'info';

interface Props {
  label: string;
  value: number | string;
  sub?: string;
  icon: LucideIcon;
  tone?: Tone;
  onClick?: () => void;
}

// Only the icon disc carries the tone; hover border stays neutral so
// the strip reads as one calm row regardless of which tiles are hot.
const TONE: Record<Tone, string> = {
  neutral:   'bg-slate-100 text-slate-600',
  urgent:    'bg-urgent-50 text-urgent-600',
  attention: 'bg-attention-50 text-attention-600',
  info:      'bg-info-50 text-info-600',
};

/** One dashboard KPI tile. The number is the hero — label above, optional
 *  subtitle below. Clickable tiles get a subtle border-on-hover; static
 *  tiles don't. Uses existing design tokens only — no new palette. */
export default function KpiTile({ label, value, sub, icon: Icon, tone = 'neutral', onClick }: Props) {
  const base = 'group text-left bg-white rounded-xl border border-slate-200 p-4 shadow-card transition-colors';
  const interactive = onClick ? 'cursor-pointer hover:border-slate-300' : '';

  const content = (
    <>
      <div className="flex items-center justify-between mb-3">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
          {label}
        </p>
        <span className={`w-7 h-7 rounded-lg flex items-center justify-center ${TONE[tone]}`}>
          <Icon className="w-4 h-4" />
        </span>
      </div>
      <div className="flex items-baseline gap-1.5">
        <span className="text-3xl font-extrabold tabular-nums tracking-tight text-slate-900">
          {value}
        </span>
        {sub && <span className="text-xs text-slate-500">{sub}</span>}
      </div>
    </>
  );

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={`${base} ${interactive} w-full`}>
        {content}
      </button>
    );
  }
  return <div className={base}>{content}</div>;
}
