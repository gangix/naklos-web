import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const RoleSwitcher = () => {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();

  const switchRole = () => {
    if (user?.role === 'fleet-manager') {
      // Switch to driver
      setUser({
        id: 'driver-1',
        name: 'Mehmet Yılmaz',
        role: 'driver',
        driverId: 'driver-1',
      });
      navigate('/driver');
    } else {
      // Switch to fleet manager
      setUser({
        id: 'user-1',
        name: 'Fleet Manager',
        role: 'fleet-manager',
      });
      navigate('/manager/dashboard');
    }
  };

  return (
    <button
      onClick={switchRole}
      className="fixed top-4 right-4 z-50 px-3 py-1.5 bg-purple-600 text-white text-xs rounded-full shadow-lg hover:bg-purple-700 transition-colors"
    >
      🔄 {user?.role === 'driver' ? 'Yönetici Görünümü' : 'Sürücü Görünümü'}
    </button>
  );
};

export default RoleSwitcher;
