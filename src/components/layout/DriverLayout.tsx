import { Outlet } from 'react-router-dom';
import DriverBottomNav from './DriverBottomNav';
import RoleSwitcher from '../common/RoleSwitcher';

const DriverLayout = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <RoleSwitcher />
      <Outlet />
      <DriverBottomNav />
    </div>
  );
};

export default DriverLayout;
