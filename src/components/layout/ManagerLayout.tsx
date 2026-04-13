import { Outlet } from 'react-router-dom';
import ManagerTopNav from './ManagerTopNav';

const ManagerLayout = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <ManagerTopNav />
      <main className="pt-16">
        <Outlet />
      </main>
    </div>
  );
};

export default ManagerLayout;
