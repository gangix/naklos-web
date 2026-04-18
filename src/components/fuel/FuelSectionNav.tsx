import { NavLink, useMatch } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useFuelCounts } from '../../contexts/FuelCountsContext';

/** Sub-nav shared across fuel pages. Kept here (not in ManagerTopNav) because
 *  the fuel section has four related pages — flattening them into the top nav
 *  would crowd it for users who don't care about fuel. */
/** Red count pill used on attention-required sub-tabs. */
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
  // Uyarılar tab shows anomaly-engine pending count; Eşleşmeyen Plakalar shows
  // the unmatched-plate count. The top-level Yakıt badge is the sum of both,
  // so splitting them here keeps the math honest when the manager drills in.
  const { pending: pendingCount, unmatched: unmatchedCount } = useFuelCounts();
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
