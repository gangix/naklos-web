import { Outlet } from 'react-router-dom';
import ManagerTopNav from './ManagerTopNav';
import RoleSwitcher from '../common/RoleSwitcher';

const ManagerLayout = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <ManagerTopNav />
      <RoleSwitcher />
      <main className="pt-16">
        <Outlet />
      </main>
    </div>
  );
};

export default ManagerLayout;
