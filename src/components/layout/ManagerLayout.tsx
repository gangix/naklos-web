import { Outlet } from 'react-router-dom';
import ManagerTopNav from './ManagerTopNav';
import { FuelCountsProvider } from '../../contexts/FuelCountsContext';

const ManagerLayout = () => {
  return (
    <FuelCountsProvider>
      <div className="min-h-screen bg-gray-50">
        <ManagerTopNav />
        {/* Single-source-of-truth width + horizontal padding so every manager
            page sits in the same well instead of guessing per-page. max-w-6xl
            (1152px) feels dense on wide monitors without losing readability.
            Individual pages should NOT re-apply max-w or px; they inherit
            these from the layout. */}
        <main className="pt-16">
          <div className="max-w-6xl mx-auto px-4 md:px-6 py-4 md:py-5">
            <Outlet />
          </div>
        </main>
      </div>
    </FuelCountsProvider>
  );
};

export default ManagerLayout;
