import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ManagerLayout from './components/layout/ManagerLayout';
import DriverLayout from './components/layout/DriverLayout';
import DashboardPage from './pages/DashboardPage';
import TrucksPage from './pages/TrucksPage';
import TruckDetailPage from './pages/TruckDetailPage';
import TripsPage from './pages/TripsPage';
import TripDetailPage from './pages/TripDetailPage';
import DriversPage from './pages/DriversPage';
import DriverDetailPage from './pages/DriverDetailPage';
import InvoicesPage from './pages/InvoicesPage';
import InvoiceDetailPage from './pages/InvoiceDetailPage';
import InvoiceCreatePage from './pages/InvoiceCreatePage';
import ClientsPage from './pages/ClientsPage';
import MorePage from './pages/MorePage';
import ManagerApprovalsPage from './pages/ManagerApprovalsPage';

// Driver pages
import DriverDashboardPage from './pages/driver/DriverDashboardPage';
import DriverTripsPage from './pages/driver/DriverTripsPage';
import DriverTripCreatePage from './pages/driver/DriverTripCreatePage';
import DriverTripDetailPage from './pages/driver/DriverTripDetailPage';
import DriverProfilePage from './pages/driver/DriverProfilePage';
import DriverTruckPage from './pages/driver/DriverTruckPage';

function App() {
  return (
    <BrowserRouter basename="/naklos-web">
      <Routes>
        {/* Root redirect */}
        <Route path="/" element={<Navigate to="/manager/dashboard" replace />} />

        {/* Fleet Manager Routes */}
        <Route path="/manager" element={<ManagerLayout />}>
          <Route index element={<Navigate to="/manager/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="approvals" element={<ManagerApprovalsPage />} />
          <Route path="trucks" element={<TrucksPage />} />
          <Route path="trucks/:truckId" element={<TruckDetailPage />} />
          <Route path="trips" element={<TripsPage />} />
          <Route path="trips/:tripId" element={<TripDetailPage />} />
          <Route path="drivers" element={<DriversPage />} />
          <Route path="drivers/:driverId" element={<DriverDetailPage />} />
          <Route path="invoices" element={<InvoicesPage />} />
          <Route path="invoices/create" element={<InvoiceCreatePage />} />
          <Route path="invoices/:invoiceId" element={<InvoiceDetailPage />} />
          <Route path="clients" element={<ClientsPage />} />
          <Route path="more" element={<MorePage />} />
        </Route>

        {/* Driver Routes */}
        <Route path="/driver" element={<DriverLayout />}>
          <Route index element={<DriverDashboardPage />} />
          <Route path="trips" element={<DriverTripsPage />} />
          <Route path="trips/create" element={<DriverTripCreatePage />} />
          <Route path="trips/:tripId" element={<DriverTripDetailPage />} />
          <Route path="truck" element={<DriverTruckPage />} />
          <Route path="profile" element={<DriverProfilePage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
