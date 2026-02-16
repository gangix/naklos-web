import { useLocation, useNavigate } from 'react-router-dom';

const DriverBottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const tabs = [
    { id: 'home', label: 'Ana Sayfa', icon: '🏠', path: '/driver' },
    { id: 'trips', label: 'Seferler', icon: '📦', path: '/driver/trips' },
  ];

  const isActive = (path: string) => {
    if (path === '/driver') {
      return location.pathname === '/driver';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 safe-area-bottom">
      <div className="flex items-center justify-around h-16">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => navigate(tab.path)}
            className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
              isActive(tab.path)
                ? 'text-primary-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <span className="text-2xl">{tab.icon}</span>
            <span className="text-xs mt-1">{tab.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
};

export default DriverBottomNav;
