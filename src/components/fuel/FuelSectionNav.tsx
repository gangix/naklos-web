import { NavLink, useMatch } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useFuelCounts } from '../../contexts/FuelCountsContext';

/** Sub-nav shared across fuel pages. Kept here (not in ManagerTopNav) because
 *  the fuel section has four related pages — flattening them into the top nav
 *  would crowd it for users who don't care about fuel. */
export default function FuelSectionNav() {
  const { t } = useTranslation();
  // Uyarılar tab surfaces only anomaly-engine pending items; unmatched plates
  // belong to the Bekleyenler tab's own badge.
  const { pending: pendingCount } = useFuelCounts();
  // `/manager/fuel-alerts/config` is a sibling page without its own tab — keep
  // the Uyarılar tab visually active while the user is on the config screen.
  const configMatch = useMatch('/manager/fuel-alerts/config');

  const baseClass = 'relative px-4 py-2 text-sm font-medium rounded-lg transition-colors';
  const active = 'bg-primary-600 text-white shadow-sm';
  const idle = 'text-gray-600 border border-gray-200 hover:bg-gray-50 hover:text-gray-900 hover:border-gray-300';

  // Order: alerts first (daily triage surface), then imports/review/config.
  return (
    <nav className="flex gap-2 mb-5 flex-wrap">
      <NavLink
        to="/manager/fuel-alerts"
        end
        className={({ isActive }) =>
          `${baseClass} ${isActive || configMatch ? active : idle}`
        }>
        {t('fuelAlerts.nav.tab')}
        {pendingCount > 0 && (
          <span className="ml-1.5 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold rounded-full bg-red-500 text-white tabular-nums align-middle">
            {pendingCount > 99 ? '99+' : pendingCount}
          </span>
        )}
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
      </NavLink>
      <NavLink
        to="/manager/fuel-resolutions"
        end
        className={({ isActive }) => `${baseClass} ${isActive ? active : idle}`}>
        {t('fuelReview.nav.resolutions')}
      </NavLink>
      <NavLink
        to="/manager/fuel-formats"
        end
        className={({ isActive }) => `${baseClass} ${isActive ? active : idle}`}>
        {t('fuelReview.nav.formats')}
      </NavLink>
    </nav>
  );
}
