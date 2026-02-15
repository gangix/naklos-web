import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { NAV } from '../../constants/text';

const Layout = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    { path: '/dashboard', label: NAV.dashboard, icon: '🏠' },
    { path: '/trucks', label: NAV.trucks, icon: '🚛' },
    { path: '/trips', label: NAV.trips, icon: '📦' },
    { path: '/clients', label: NAV.clients, icon: '👥' },
    { path: '/more', label: NAV.more, icon: '☰' },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="flex flex-col h-screen bg-gray-50">
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
