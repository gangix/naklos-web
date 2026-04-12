import { Outlet } from 'react-router-dom';
import DriverBottomNav from './DriverBottomNav';
import RoleSwitcher from '../common/RoleSwitcher';
import { LocationSharingProvider } from '../../contexts/LocationSharingContext';

const DriverLayout = () => {
  return (
    <LocationSharingProvider>
      <div className="min-h-screen bg-gray-50">
        <RoleSwitcher />
        <Outlet />
        <DriverBottomNav />
      </div>
    </LocationSharingProvider>
  );
};

export default DriverLayout;
