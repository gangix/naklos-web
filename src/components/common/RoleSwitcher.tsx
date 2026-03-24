import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const RoleSwitcher = () => {
  const { user, setUser, hasBothRoles } = useAuth();
  const navigate = useNavigate();

  // Only show if user has both driver and manager roles in Keycloak
  if (!hasBothRoles) return null;

  const switchRole = () => {
    if (!user) return;

    if (user.role === 'fleet-manager') {
      setUser({ ...user, role: 'driver' });
      navigate('/driver');
    } else {
      setUser({ ...user, role: 'fleet-manager' });
      navigate('/manager/dashboard');
    }
  };

  return (
    <button
      onClick={switchRole}
      className="fixed top-4 right-4 z-50 px-3 py-1.5 bg-purple-600 text-white text-xs rounded-full shadow-lg hover:bg-purple-700 transition-colors"
    >
      {user?.role === 'driver' ? 'Yönetici Görünümü' : 'Sürücü Görünümü'}
    </button>
  );
};

export default RoleSwitcher;