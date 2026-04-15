import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

/** Sub-nav shared across fuel pages. Kept here (not in ManagerTopNav) because
 *  the fuel section has four related pages — flattening them into the top nav
 *  would crowd it for users who don't care about fuel. */
export default function FuelSectionNav() {
  const { t } = useTranslation();
  const baseClass = 'px-4 py-2 text-sm font-medium rounded-lg transition-colors';
  const active = 'bg-primary-600 text-white shadow-sm';
  const idle = 'text-gray-600 border border-gray-200 hover:bg-gray-50 hover:text-gray-900 hover:border-gray-300';

  // Order: frequency-first (daily flow on the left), config-last (Formats
  // is set once and rarely revisited).
  return (
    <nav className="flex gap-2 mb-5">
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
