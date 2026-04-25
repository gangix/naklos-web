import { Outlet } from 'react-router-dom';
import ManagerTopNav from './ManagerTopNav';
import { FuelCountsProvider } from '../../contexts/FuelCountsContext';
import { FleetRosterProvider } from '../../contexts/FleetRosterContext';
import { MaintenanceWarningsProvider } from '../../contexts/MaintenanceWarningsContext';

const ManagerLayout = () => {
  return (
    <FleetRosterProvider>
      <FuelCountsProvider>
        <MaintenanceWarningsProvider>
          <div className="min-h-screen bg-gray-50">
            <ManagerTopNav />
            <main className="pt-16">
              <div className="max-w-6xl mx-auto px-4 md:px-6 py-4 md:py-5">
                <Outlet />
              </div>
            </main>
          </div>
        </MaintenanceWarningsProvider>
      </FuelCountsProvider>
    </FleetRosterProvider>
  );
};

export default ManagerLayout;
