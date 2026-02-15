import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/layout/Layout';
import DashboardPage from './pages/DashboardPage';
import TrucksPage from './pages/TrucksPage';
import TruckDetailPage from './pages/TruckDetailPage';
import TripsPage from './pages/TripsPage';
import TripDetailPage from './pages/TripDetailPage';
import DriversPage from './pages/DriversPage';
import DriverDetailPage from './pages/DriverDetailPage';
import ClientsPage from './pages/ClientsPage';

function App() {
  return (
    <BrowserRouter basename="/naklos-web">
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="trucks" element={<TrucksPage />} />
          <Route path="trucks/:truckId" element={<TruckDetailPage />} />
          <Route path="trips" element={<TripsPage />} />
          <Route path="trips/:tripId" element={<TripDetailPage />} />
          <Route path="drivers" element={<DriversPage />} />
          <Route path="drivers/:driverId" element={<DriverDetailPage />} />
          <Route path="clients" element={<ClientsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
