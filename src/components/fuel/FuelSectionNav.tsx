import { NavLink } from 'react-router-dom';

/** Sub-nav shared across fuel pages. Kept here (not in ManagerTopNav) because
 *  the fuel section has four related pages — flattening them into the top nav
 *  would crowd it for users who don't care about fuel. */
export default function FuelSectionNav() {
  const baseClass = 'px-3 py-1.5 text-sm font-medium rounded transition-colors';
  const active = 'bg-primary-100 text-primary-700';
  const idle = 'text-gray-600 hover:bg-gray-100 hover:text-gray-900';

  return (
    <nav className="flex gap-1 mb-4">
      <NavLink
        to="/manager/fuel-imports"
        end
        className={({ isActive }) => `${baseClass} ${isActive ? active : idle}`}>
        İçe Aktar
      </NavLink>
      <NavLink
        to="/manager/fuel-formats"
        end
        className={({ isActive }) => `${baseClass} ${isActive ? active : idle}`}>
        Formatlar
      </NavLink>
      <NavLink
        to="/manager/fuel-review"
        end
        className={({ isActive }) => `${baseClass} ${isActive ? active : idle}`}>
        İnceleme
      </NavLink>
    </nav>
  );
}
