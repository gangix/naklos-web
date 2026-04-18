import { useRef, useState } from 'react';
import { Link, NavLink, useLocation, useMatch } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Settings as SettingsIcon, ChevronDown } from 'lucide-react';
import { useFuelCounts } from '../../contexts/FuelCountsContext';
import { useClickOutside } from '../../hooks/useClickOutside';

/** Sub-nav shared across fuel pages. Daily-use tabs (Uyarılar / İçe Aktar /
 *  İnceleme) get primary weight; admin concerns (Formatlar / Kurallar) live
 *  behind a settings disclosure so the row stays focused on what the manager
 *  actually does every day. */
function TabBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span className="ml-1.5 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold rounded-full bg-red-500 text-white tabular-nums align-middle">
      {count > 99 ? '99+' : count}
    </span>
  );
}

export default function FuelSectionNav() {
  const { t } = useTranslation();
  // Uyarılar tab shows anomaly-engine pending count; İnceleme shows the
  // unmatched-plate count. The top-level Yakıt badge is the sum of both, so
  // splitting them here keeps the math honest when the manager drills in.
  const { pending: pendingCount, unmatched: unmatchedCount } = useFuelCounts();
  // `/manager/fuel-alerts/config` is a sibling page without its own tab — keep
  // the Uyarılar tab visually active while the user is on the config screen.
  const configMatch = useMatch('/manager/fuel-alerts/config');
  const location = useLocation();
  const onConfigSurface =
    location.pathname.startsWith('/manager/fuel-resolutions') ||
    location.pathname.startsWith('/manager/fuel-formats');

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  useClickOutside(menuOpen, menuRef, () => setMenuOpen(false));

  const baseClass = 'relative px-4 py-2 text-sm font-medium rounded-lg transition-colors';
  const active = 'bg-primary-600 text-white shadow-sm';
  const idle = 'text-gray-600 border border-gray-200 hover:bg-gray-50 hover:text-gray-900 hover:border-gray-300';

  return (
    <nav className="flex gap-2 mb-5 flex-wrap items-center">
      <NavLink
        to="/manager/fuel-alerts"
        end
        className={({ isActive }) =>
          `${baseClass} ${isActive || configMatch ? active : idle}`
        }>
        {t('fuelAlerts.nav.tab')}
        <TabBadge count={pendingCount} />
      </NavLink>
      <NavLink
        to="/manager/fuel-imports"
        end
        className={({ isActive }) => `${baseClass} ${isActive ? active : idle}`}>
        {t('fuelReview.nav.imports')}
      </NavLink>
      <NavLink
        to="/manager/fuel-review"
        end
        className={({ isActive }) => `${baseClass} ${isActive ? active : idle}`}>
        {t('fuelReview.nav.review')}
        <TabBadge count={unmatchedCount} />
      </NavLink>

      <div className="relative ml-auto" ref={menuRef}>
        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          className={`${baseClass} inline-flex items-center gap-1.5 ${onConfigSurface ? active : idle}`}
          aria-haspopup="menu"
          aria-expanded={menuOpen}
        >
          <SettingsIcon className="w-4 h-4" />
          <span>{t('fuelReview.nav.settings')}</span>
          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${menuOpen ? 'rotate-180' : ''}`} />
        </button>
        {menuOpen && (
          <div
            role="menu"
            className="absolute right-0 mt-1 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-10 overflow-hidden"
          >
            <Link
              to="/manager/fuel-resolutions"
              role="menuitem"
              onClick={() => setMenuOpen(false)}
              className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
            >
              {t('fuelReview.nav.resolutions')}
            </Link>
            <Link
              to="/manager/fuel-formats"
              role="menuitem"
              onClick={() => setMenuOpen(false)}
              className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
            >
              {t('fuelReview.nav.formats')}
            </Link>
            <Link
              to="/manager/fuel-alerts/config"
              role="menuitem"
              onClick={() => setMenuOpen(false)}
              className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 border-t border-gray-100"
            >
              {t('fuelReview.nav.alertsConfig')}
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}
