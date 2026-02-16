import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import RoleSwitcher from '../common/RoleSwitcher';

const Layout = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    { path: '/dashboard', label: 'Ana Sayfa', icon: '🏠' },
    { path: '/trips', label: 'Seferler', icon: '📦' },
    { path: '/trucks', label: 'Araçlar', icon: '🚛' },
    { path: '/more', label: 'Diğer', icon: '☰' },
  ];

  const isActive = (path: string) => {
    if (path === '/more') {
      // More tab is active if on drivers, invoices, clients, or more page
      return ['/drivers', '/invoices', '/clients', '/more'].some((p) =>
        location.pathname.startsWith(p)
      );
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <RoleSwitcher />
      {/* Main content */}
      <main className="flex-1 overflow-y-auto pb-20">
        <Outlet />
      </main>

      {/* Bottom navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 safe-area-pb">
        <div className="flex justify-around items-center h-16">
          {navItems.map((item) => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
                isActive(item.path)
                  ? 'text-primary-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <span className="text-2xl mb-1">{item.icon}</span>
              <span className="text-xs font-medium">{item.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
};

export default Layout;
