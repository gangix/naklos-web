import { Outlet } from 'react-router-dom';
import DriverBottomNav from './DriverBottomNav';
import { LocationSharingProvider } from '../../contexts/LocationSharingContext';

const DriverLayout = () => {
  return (
    <LocationSharingProvider>
      <div className="min-h-screen bg-gray-50">
        <Outlet />
        <DriverBottomNav />
      </div>
    </LocationSharingProvider>
  );
};

export default DriverLayout;
