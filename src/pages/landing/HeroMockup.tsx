import { AlertTriangle, Fuel, Truck, Users } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function HeroMockup() {
  const { t } = useTranslation();

  return (
    <div className="relative mx-auto max-w-lg" role="img" aria-label={t('landing.hero.preview.label')}>
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

        {/* Mini app body */}
        <div className="bg-warm-50 p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-1.5">
              <div className="w-5 h-5 rounded-md bg-primary-700 flex items-center justify-center">
                <Truck className="w-3 h-3 text-white" aria-hidden="true" />
              </div>
              <span className="text-[11px] font-extrabold text-slate-900 tracking-tight">Naklos</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-primary-50 text-primary-700 font-bold">PRO</span>
              <span className="w-5 h-5 rounded-full bg-slate-200" />
            </div>
          </div>

          {/* Today's alerts header */}
          <div className="mb-3 flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              {t('landing.hero.preview.alerts.today')}
            </span>
            <span className="text-[10px] font-bold text-urgent-600 tabular-nums bg-urgent-50 border border-urgent-100 rounded px-1.5 py-0.5">3</span>
          </div>

          <div className="space-y-2">
            <AlertRow
              tone="urgent"
              icon={<Fuel className="w-3.5 h-3.5" />}
              title={t('landing.hero.preview.alerts.fuelTitle')}
              detail={t('landing.hero.preview.alerts.fuelDetail')}
              when={t('landing.hero.preview.alerts.fuelWhen')}
            />
            <AlertRow
              tone="attention"
              icon={<AlertTriangle className="w-3.5 h-3.5" />}
              title={t('landing.hero.preview.alerts.docTitle')}
              detail={t('landing.hero.preview.alerts.docDetail')}
            />
            <AlertRow
              tone="attention"
              icon={<Users className="w-3.5 h-3.5" />}
              title={t('landing.hero.preview.alerts.driverTitle')}
              detail={t('landing.hero.preview.alerts.driverDetail')}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function AlertRow({
  tone, icon, title, detail, when,
}: {
  tone: 'urgent' | 'attention';
  icon: React.ReactNode;
  title: string;
  detail: string;
  when?: string;
}) {
  const stripe = tone === 'urgent' ? 'bg-urgent-500' : 'bg-attention-500';
  const iconText = tone === 'urgent' ? 'text-urgent-600' : 'text-attention-600';
  return (
    <div className="rounded-md bg-white border border-slate-100 overflow-hidden flex items-stretch">
      <span className={`w-0.5 ${stripe}`} aria-hidden="true" />
      <div className="flex-1 flex items-start gap-2 px-2 py-2">
        <span className={`flex-shrink-0 mt-0.5 ${iconText}`} aria-hidden="true">{icon}</span>
        <div className="flex-1 min-w-0">
          <div className="text-[10px] font-bold text-slate-900 truncate">{title}</div>
          <div className="text-[9px] text-slate-500 truncate">{detail}</div>
        </div>
        {when && (
          <span className="text-[8px] text-slate-400 flex-shrink-0 tabular-nums whitespace-nowrap">{when}</span>
        )}
      </div>
    </div>
  );
}
