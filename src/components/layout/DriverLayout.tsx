import { Outlet } from 'react-router-dom';
import DriverBottomNav from './DriverBottomNav';
import { LocationSharingProvider } from '../../contexts/LocationSharingContext';

const DriverLayout = () => {
  return (
    <LocationSharingProvider>
      <div className="min-h-screen bg-gray-50">
        {/* Phone-first but capped at tablet width — previously the page
            stretched edge-to-edge on iPad/desktop while manager pages sat
            in a 1152px well. Pages keep their own p-4 pb-20 padding. */}
        <main className="max-w-xl mx-auto">
          <Outlet />
        </main>
        <DriverBottomNav />
      </div>
    </LocationSharingProvider>
  );
};

export default DriverLayout;
