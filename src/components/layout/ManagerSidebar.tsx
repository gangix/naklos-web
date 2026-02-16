import { NavLink } from 'react-router-dom';
import { Home, Truck, Users, FileText, Building2 } from 'lucide-react';

const ManagerSidebar = () => {
  const menuItems = [
    { path: '/manager/dashboard', label: 'Ana Sayfa', icon: Home },
    { path: '/manager/trips', label: 'Seferler', icon: Truck },
    { path: '/manager/trucks', label: 'Araçlar', icon: Truck },
    { path: '/manager/drivers', label: 'Sürücüler', icon: Users },
    { path: '/manager/invoices', label: 'Faturalar', icon: FileText },
    { path: '/manager/clients', label: 'Müşteriler', icon: Building2 },
  ];

  return (
    <div className="flex h-full flex-col bg-slate-900 text-slate-100">
      {/* Logo/Header */}
      <div className="flex h-16 items-center border-b border-slate-700 px-6">
        <h1 className="text-xl font-bold">Naklos</h1>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-slate-800 text-white'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`
              }
            >
              <Icon className="h-5 w-5" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-slate-700 p-4">
        <div className="flex items-center gap-3 px-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-700">
            <Users className="h-4 w-4" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium">Fleet Manager</p>
            <p className="text-xs text-slate-400">Yönetici</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManagerSidebar;
