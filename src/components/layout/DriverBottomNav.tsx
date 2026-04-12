import { useLocation, useNavigate } from 'react-router-dom';
import { Truck, User, MapPin } from 'lucide-react';
import { useLocationSharing } from '../../contexts/LocationSharingContext';

const DriverBottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { enabled, sending, toggle } = useLocationSharing();

  const tabs = [
    { id: 'truck', label: 'Aracım', icon: Truck, path: '/driver/truck' },
    { id: 'profile', label: 'Profil', icon: User, path: '/driver/profile' },
  ];

  const isActive = (path: string) => location.pathname.startsWith(path);

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 safe-area-bottom">
      <div className="flex items-center justify-around h-16">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => navigate(tab.path)}
              className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
                isActive(tab.path)
                  ? 'text-primary-600'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] mt-1 font-medium">{tab.label}</span>
            </button>
          );
        })}

        {/* Location toggle button */}
        <button
          onClick={toggle}
          className={`flex flex-col items-center justify-center flex-1 h-full transition-colors relative ${
            enabled ? 'text-green-600' : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          <div className="relative">
            <MapPin className={`w-5 h-5 ${sending ? 'animate-pulse' : ''}`} />
            {enabled && (
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-green-500 rounded-full" />
            )}
          </div>
          <span className="text-[10px] mt-1 font-medium">
            {sending ? 'Gönderiliyor' : enabled ? 'Konum Açık' : 'Konum'}
          </span>
        </button>
      </div>
    </nav>
  );
};

export default DriverBottomNav;
