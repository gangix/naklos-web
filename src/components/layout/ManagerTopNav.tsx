import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Truck, Users, Building2, Settings, LogOut, Menu, X, Fuel } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { useFleet } from '../../contexts/FleetContext';
import { useDocumentWarnings } from '../../hooks/useDocumentWarnings';
import LanguageSwitcher from '../common/LanguageSwitcher';

const ManagerTopNav = () => {
  const { t } = useTranslation();
  const { logout } = useAuth();
  const { plan } = useFleet();
  const warningCount = useDocumentWarnings();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Default-on in dev (`vite dev`); off in prod unless VITE_FEATURE_FUEL_TRACKING=true.
  const fuelTrackingEnabled =
    (import.meta.env.VITE_FEATURE_FUEL_TRACKING ?? (import.meta.env.DEV ? 'true' : 'false')) === 'true';

  const menuItems = [
    { path: '/manager/dashboard', label: t('nav.dashboard'), icon: Home },
    { path: '/manager/trucks', label: t('nav.trucks'), icon: Truck },
    { path: '/manager/drivers', label: t('nav.drivers'), icon: Users },
    { path: '/manager/clients', label: t('nav.clients'), icon: Building2 },
    ...(fuelTrackingEnabled
      ? [{ path: '/manager/fuel-imports', label: t('nav.fuel', { defaultValue: 'Yakıt' }), icon: Fuel }]
      : []),
    { path: '/manager/settings', label: t('nav.more'), icon: Settings },
  ];

  const planLabel = t(`plan.${(plan ?? 'FREE').toLowerCase()}`, {
    defaultValue:
      plan === 'PROFESSIONAL' ? 'Profesyonel'
      : plan === 'BUSINESS' ? 'İşletme'
      : plan === 'ENTERPRISE' ? 'Kurumsal'
      : 'Başlangıç',
  });

  return (
    <header className="fixed top-0 left-0 right-0 z-30 bg-slate-900">
      {/* Top row: logo + nav + logout */}
      <div className="h-16 px-4 lg:px-6 flex items-center justify-between max-w-6xl mx-auto">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center">
            <Truck className="w-4 h-4 text-white" />
          </div>
          <span className="text-lg font-extrabold tracking-tight text-white">Naklos</span>
          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ml-2 ${
            plan === 'PROFESSIONAL' ? 'bg-blue-500/20 text-blue-300' :
            plan === 'BUSINESS' ? 'bg-violet-500/20 text-violet-300' :
            plan === 'ENTERPRISE' ? 'bg-amber-500/20 text-amber-300' :
            'bg-white/10 text-slate-400'
          }`}>
            {planLabel}
          </span>
        </div>

        {/* Desktop nav inline */}
        <nav className="hidden md:flex items-center gap-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-white/15 text-white'
                      : 'text-slate-400 hover:text-white hover:bg-white/10'
                  }`
                }
              >
                <span className="relative">
                  <Icon className="w-4 h-4" />
                  {item.path === '/manager/dashboard' && warningCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-red-500 px-0.5 text-[9px] font-bold text-white">
                      {warningCount}
                    </span>
                  )}
                </span>
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <div className="hidden md:block">
            <LanguageSwitcher />
          </div>
          <div className="hidden md:block w-px h-6 bg-slate-700 mx-1" />
          <button
            onClick={logout}
            className="hidden md:flex items-center gap-2 px-3 py-2 text-sm text-slate-400 hover:text-red-400 hover:bg-white/10 rounded-lg transition-colors font-medium"
          >
            <LogOut className="w-4 h-4" />
            <span>{t('common.logout', { defaultValue: 'Çıkış' })}</span>
          </button>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden flex items-center justify-center w-10 h-10 rounded-lg hover:bg-white/10 transition-colors"
          >
            {mobileOpen ? <X className="w-5 h-5 text-slate-300" /> : <Menu className="w-5 h-5 text-slate-300" />}
          </button>
        </div>
      </div>

      {/* Mobile dropdown nav */}
      {mobileOpen && (
        <nav className="md:hidden border-t border-slate-700 bg-slate-900 px-4 pb-3 pt-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-white/15 text-white'
                      : 'text-slate-400 hover:bg-white/10 hover:text-white'
                  }`
                }
              >
                <span className="relative">
                  <Icon className="w-5 h-5" />
                  {item.path === '/manager/dashboard' && warningCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                      {warningCount}
                    </span>
                  )}
                </span>
                <span>{item.label}</span>
              </NavLink>
            );
          })}
          <div className="px-3 py-3">
            <LanguageSwitcher />
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium text-red-400 hover:bg-white/10 transition-colors mt-1"
          >
            <LogOut className="w-5 h-5" />
            <span>{t('common.logout', { defaultValue: 'Çıkış Yap' })}</span>
          </button>
        </nav>
      )}
    </header>
  );
};

export default ManagerTopNav;
