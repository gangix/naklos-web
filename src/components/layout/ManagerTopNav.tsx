import { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Truck, Users, Settings, LogOut, Menu, X, Fuel, Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { useFleet } from '../../contexts/FleetContext';
import { useFuelCounts } from '../../contexts/FuelCountsContext';
import { useDocumentAttention } from '../../hooks/useDocumentAttention';
import LanguageSwitcher from '../common/LanguageSwitcher';
import UserMenu from './UserMenu';
import CommandPalette from '../search/CommandPalette';

type NavItem = {
  id: 'dashboard' | 'trucks' | 'drivers' | 'fuel';
  path: string;
  label: string;
  icon: typeof Home;
};

interface NavBadgeProps {
  count: number;
  size: 'desktop' | 'mobile';
}

/** Red absolute-positioned pill for the icon top-right.
 *  Renders nothing when count <= 0. 99+ cap keeps the pill compact. */
const NavBadge = ({ count, size }: NavBadgeProps) => {
  if (count <= 0) return null;
  const display = count > 99 ? '99+' : String(count);
  const sizeCls =
    size === 'desktop'
      ? 'h-3.5 min-w-3.5 px-0.5 text-[9px]'
      : 'h-4 min-w-4 px-1 text-[10px]';
  return (
    <span
      className={`absolute -top-1.5 -right-1.5 flex ${sizeCls} items-center justify-center rounded-full bg-red-500 font-bold text-white`}
    >
      {display}
    </span>
  );
};

const ManagerTopNav = () => {
  const { t } = useTranslation();
  const { logout } = useAuth();
  const { plan } = useFleet();
  const { trucksWithWarnings, driversWithWarnings } = useDocumentAttention();
  const { total: fuelPendingCount } = useFuelCounts();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);

  // Global ⌘K / Ctrl+K listener. Always intercepts — preventing browser
  // default (which is "focus address bar" in Chrome on some locales).
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setPaletteOpen((o) => !o);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Visible to paid plans only. FREE plans don't see the Yakıt nav entry —
  // PlanLimits.bulkImport on the backend matches this gate (FREE → 403).
  // Dev override via VITE_FEATURE_FUEL_TRACKING=true forces visible regardless of plan.
  const forceOn = import.meta.env.VITE_FEATURE_FUEL_TRACKING === 'true';
  const fuelTrackingEnabled = forceOn || (plan !== 'FREE' && plan !== undefined);

  // Core nav is reserved for primary work surfaces. Settings + logout live in
  // the UserMenu dropdown (top-right, avatar-triggered).
  const menuItems: NavItem[] = [
    { id: 'dashboard', path: '/manager/dashboard', label: t('nav.dashboard'), icon: Home },
    { id: 'trucks', path: '/manager/trucks', label: t('nav.trucks'), icon: Truck },
    { id: 'drivers', path: '/manager/drivers', label: t('nav.drivers'), icon: Users },
    // Yakıt badge = pending anomalies + unmatched plates (`useFuelCounts`),
    // so the click destination must be the page that actually surfaces those
    // items. Alerts is the daily triage surface; Imports is an empty upload
    // form that has nothing to do with the badge count.
    ...(fuelTrackingEnabled
      ? [{ id: 'fuel' as const, path: '/manager/fuel-alerts', label: t('nav.fuel', { defaultValue: 'Yakıt' }), icon: Fuel }]
      : []),
  ];

  /** Badge convention: each nav item's badge = items-needing-action
   *  **in that section**. Ana Sayfa has no badge (it's the overview
   *  landing page; its dashboard IS the aggregate). Matches inbox-count
   *  semantics used by Samsara/Fleetio/Linear. */
  const badgeCountFor = (id: NavItem['id']): number => {
    if (id === 'trucks') return trucksWithWarnings;
    if (id === 'drivers') return driversWithWarnings;
    if (id === 'fuel') return fuelPendingCount;
    return 0;
  };

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
        <NavLink
          to="/manager/dashboard"
          className="flex items-center gap-2.5 rounded-lg px-1 py-1 -mx-1 hover:bg-white/5 transition-colors"
          aria-label="Naklos">
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
        </NavLink>

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
                  <NavBadge count={badgeCountFor(item.id)} size="desktop" />
                </span>
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          {/* ⌘K hint button — desktop only. Shows the shortcut so users
              discover the palette without hunting. Click also opens. */}
          <button
            type="button"
            onClick={() => setPaletteOpen(true)}
            aria-label={t('search.open', { defaultValue: 'Ara' })}
            className="hidden md:inline-flex items-center gap-2 pl-2.5 pr-2 py-1.5 rounded-lg bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white transition-colors group"
          >
            <Search className="w-3.5 h-3.5" />
            <span className="text-xs font-medium">{t('search.inlineLabel', { defaultValue: 'Ara' })}</span>
            <kbd className="inline-flex items-center justify-center h-5 px-1.5 rounded bg-slate-950/40 border border-white/10 text-[10px] font-semibold text-slate-400 group-hover:text-slate-200 transition-colors">⌘K</kbd>
          </button>

          {/* Mobile search — icon only; palette adapts layout for small screens. */}
          <button
            type="button"
            onClick={() => setPaletteOpen(true)}
            aria-label={t('search.open', { defaultValue: 'Ara' })}
            className="md:hidden flex items-center justify-center w-10 h-10 rounded-lg hover:bg-white/10 transition-colors"
          >
            <Search className="w-5 h-5 text-slate-300" />
          </button>

          <div className="hidden md:block">
            <LanguageSwitcher />
          </div>
          <div className="hidden md:block w-px h-6 bg-slate-700 mx-1" />
          <div className="hidden md:block">
            <UserMenu />
          </div>

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
                  <NavBadge count={badgeCountFor(item.id)} size="mobile" />
                </span>
                <span>{item.label}</span>
              </NavLink>
            );
          })}
          <NavLink
            to="/manager/settings"
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors ${
                isActive ? 'bg-white/15 text-white' : 'text-slate-400 hover:bg-white/10 hover:text-white'
              }`
            }>
            <Settings className="w-5 h-5" />
            <span>{t('nav.settings', { defaultValue: 'Ayarlar' })}</span>
          </NavLink>
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

      {/* ⌘K palette — lives here so the keyboard listener + open button
          share state. Renders as a portal-like fixed overlay, so the
          fixed header context doesn't clip it. */}
      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </header>
  );
};

export default ManagerTopNav;
