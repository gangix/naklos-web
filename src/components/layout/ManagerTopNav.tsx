import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Truck, Users, Building2, Settings, LogOut, Menu, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useDocumentWarnings } from '../../hooks/useDocumentWarnings';

const ManagerTopNav = () => {
  const { logout } = useAuth();
  const warningCount = useDocumentWarnings();
  const [mobileOpen, setMobileOpen] = useState(false);

  const menuItems = [
    { path: '/manager/dashboard', label: 'Ana Sayfa', icon: Home },
    { path: '/manager/trucks', label: 'Araçlar', icon: Truck },
    { path: '/manager/drivers', label: 'Sürücüler', icon: Users },
    { path: '/manager/clients', label: 'Müşteriler', icon: Building2 },
    { path: '/manager/more', label: 'Ayarlar', icon: Settings },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-30 bg-white border-b border-gray-200/80">
      {/* Top row: logo + hamburger/logout */}
      <div className="h-16 px-4 lg:px-6 flex items-center justify-between max-w-6xl mx-auto">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-sm shadow-primary-500/20">
            <Truck className="w-4 h-4 text-white" />
          </div>
          <span className="text-lg font-extrabold tracking-tight text-gray-900">Naklos</span>
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
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
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
          <div className="hidden md:block w-px h-6 bg-gray-200 mx-1" />
          <button
            onClick={logout}
            className="hidden md:flex items-center gap-2 px-3 py-2 text-sm text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium"
          >
            <LogOut className="w-4 h-4" />
            <span>Çıkış</span>
          </button>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden flex items-center justify-center w-10 h-10 rounded-lg hover:bg-gray-100 transition-colors"
          >
            {mobileOpen ? <X className="w-5 h-5 text-gray-600" /> : <Menu className="w-5 h-5 text-gray-600" />}
          </button>
        </div>
      </div>

      {/* Mobile dropdown nav */}
      {mobileOpen && (
        <nav className="md:hidden border-t border-gray-100 bg-white px-4 pb-3 pt-1 shadow-lg shadow-gray-200/50">
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
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
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
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors mt-1"
          >
            <LogOut className="w-5 h-5" />
            <span>Çıkış Yap</span>
          </button>
        </nav>
      )}
    </header>
  );
};

export default ManagerTopNav;
