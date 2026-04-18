import { Outlet } from 'react-router-dom';
import DriverBottomNav from './DriverBottomNav';
import DriverTopBar from './DriverTopBar';
import { LocationSharingProvider } from '../../contexts/LocationSharingContext';

const DriverLayout = () => {
  return (
    <LocationSharingProvider>
      <div className="min-h-screen bg-gray-50">
        <DriverTopBar />
        {/* Phone-first but capped at tablet width — previously the page
            stretched edge-to-edge on iPad/desktop while manager pages sat
            in a 1152px well. pt-14 reserves room for the fixed top bar. */}
        <main className="max-w-xl mx-auto pt-14">
          <Outlet />
        </main>
        <DriverBottomNav />
      </div>
    </LocationSharingProvider>
  );
};

export default DriverLayout;
