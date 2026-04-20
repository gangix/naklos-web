import { Truck, Users, Fuel } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function HeroMockup() {
  const { t } = useTranslation();

  return (
    <div className="relative mx-auto max-w-lg">
      {/* Browser chrome */}
      <div className="relative rounded-2xl bg-white shadow-[0_30px_80px_-20px_rgba(15,23,42,0.25)] ring-1 ring-slate-200 overflow-hidden">
        <div className="flex items-center gap-1.5 px-3 h-8 border-b border-slate-100 bg-slate-50">
          <span className="w-2.5 h-2.5 rounded-full bg-slate-300" />
          <span className="w-2.5 h-2.5 rounded-full bg-slate-300" />
          <span className="w-2.5 h-2.5 rounded-full bg-slate-300" />
          <span className="ml-3 flex-1 text-[10px] text-slate-400 font-mono truncate">
            naklos.com.tr/manager/dashboard
          </span>
        </div>

        <div className="bg-warm-50 p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1.5">
              <div className="w-5 h-5 rounded-md bg-primary-700 flex items-center justify-center">
                <Truck className="w-3 h-3 text-white" />
              </div>
              <span className="text-[11px] font-extrabold text-slate-900 tracking-tight">Naklos</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-primary-50 text-primary-700 font-bold">PRO</span>
              <span className="w-5 h-5 rounded-full bg-slate-200" />
            </div>
          </div>

          <div className="mb-3">
            <div className="text-[9px] uppercase tracking-wider text-slate-400 font-semibold">
              {t('landing.hero.preview.label')}
            </div>
            <div className="h-4 w-28 mt-1 rounded bg-slate-200/80" />
          </div>

          <div className="grid grid-cols-3 gap-2 mb-3">
            <StatTile label={t('landing.hero.preview.stat1Label')} value="24" icon={<Truck className="w-3 h-3" />} />
            <StatTile label={t('landing.hero.preview.stat2Label')} value="18" icon={<Users className="w-3 h-3" />} />
            <StatTile label={t('landing.hero.preview.stat3Label')} value="3" alarm icon={<Fuel className="w-3 h-3" />} />
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-2.5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                {t('landing.hero.preview.priorityTitle')}
              </span>
              <span className="text-[9px] text-slate-400 tabular-nums">2</span>
            </div>
            <div className="space-y-1.5">
              <PriorityRow label={t('landing.hero.preview.priorityItem1')} tone="urgent" cta={t('landing.hero.preview.priorityCta')} />
              <PriorityRow label={t('landing.hero.preview.priorityItem2')} tone="attention" cta={t('landing.hero.preview.priorityCta')} />
            </div>
          </div>
        </div>
      </div>

      {/* Floating efficiency pill */}
      <div className="absolute -bottom-5 -right-5 bg-white rounded-xl shadow-[0_12px_30px_-10px_rgba(15,23,42,0.3)] ring-1 ring-slate-200 px-3 py-2 hidden sm:block">
        <div className="text-[9px] uppercase tracking-wider text-confirm-600 font-bold">
          {t('landing.features.fuel.title')}
        </div>
        <div className="text-lg font-extrabold text-slate-900 tabular-nums leading-none">%91</div>
      </div>
    </div>
  );
}

function StatTile({
  label, value, icon, alarm,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  alarm?: boolean;
}) {
  return (
    <div className={`rounded-lg p-2 border ${alarm ? 'border-attention-200 bg-attention-50/50' : 'border-slate-100 bg-white'}`}>
      <div className="w-5 h-5 rounded flex items-center justify-center mb-1 text-slate-500">
        {icon}
      </div>
      <div className="text-sm font-extrabold text-slate-900 tabular-nums leading-none">{value}</div>
      <div className="text-[9px] uppercase tracking-wider text-slate-400 font-semibold mt-1 truncate">{label}</div>
    </div>
  );
}

function PriorityRow({ label, tone, cta }: {
  label: string;
  tone: 'urgent' | 'attention';
  cta: string;
}) {
  const bar = tone === 'urgent' ? 'bg-urgent-500' : 'bg-attention-500';
  const btn = tone === 'urgent' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700';
  return (
    <div className="rounded-md bg-slate-50 border border-slate-100 overflow-hidden flex items-stretch">
      <span className={`w-0.5 ${bar}`} aria-hidden="true" />
      <div className="flex-1 flex items-center justify-between px-2 py-1.5">
        <span className="text-[10px] font-semibold text-slate-700 truncate">{label}</span>
        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${btn} flex-shrink-0 ml-2`}>{cta}</span>
      </div>
    </div>
  );
}
