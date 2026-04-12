import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useFleet } from './contexts/FleetContext';
import { useAuth } from './contexts/AuthContext';
import ManagerLayout from './components/layout/ManagerLayout';
import DriverLayout from './components/layout/DriverLayout';
import DashboardPage from './pages/DashboardPage';
import TrucksPage from './pages/TrucksPage';
import TruckDetailPage from './pages/TruckDetailPage';
import DriversPage from './pages/DriversPage';
import DriverDetailPage from './pages/DriverDetailPage';
import ClientsPage from './pages/ClientsPage';
import ClientDetailPage from './pages/ClientDetailPage';
import MorePage from './pages/MorePage';
import FleetSetupPage from './pages/FleetSetupPage';
import LandingPage from './pages/LandingPage';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
import TermsOfServicePage from './pages/TermsOfServicePage';
import CookieBanner from './components/common/CookieBanner';
import WhatsAppButton from './components/common/WhatsAppButton';

// Driver pages
import DriverProfilePage from './pages/driver/DriverProfilePage';
import DriverTruckPage from './pages/driver/DriverTruckPage';

// v2 pages kept but not wired up:
// import TripsPage, TripCreatePage, TripDetailPage,
// InvoicesPage, InvoiceCreatePage, InvoiceDetailPage,
// DriverDashboardPage, DriverTripsPage, DriverTripCreatePage, DriverTripDetailPage

const BASE = import.meta.env.VITE_BASE_PATH ?? '/';

function App() {
  const { fleetId } = useFleet();
  const { isDriver, isFleetManager, authenticated, user } = useAuth();

  // Debug: log routing decision so we can see why a user lands where they do
  if (authenticated) {
    console.log('[Naklos] Auth state:', {
      authenticated,
      isDriver,
      isFleetManager,
      fleetId,
      keycloakRoles: user?.keycloakRoles,
    });
  }

  if (!authenticated) {
    return (
      <BrowserRouter basename={BASE}>
        <Routes>
          <Route path="/privacy" element={<PrivacyPolicyPage />} />
          <Route path="/terms" element={<TermsOfServicePage />} />
          <Route path="*" element={<LandingPage />} />
        </Routes>
        <CookieBanner />
        <WhatsAppButton />
      </BrowserRouter>
    );
  }

  // Authenticated but not a driver yet and no fleet → fresh signup, send to onboarding.
  // This covers both: new signups (no roles yet) and existing managers with no fleet.
  const needsFleetSetup = !isDriver && !fleetId;
  if (needsFleetSetup) {
    return (
      <BrowserRouter basename={BASE}>
        <Routes>
          <Route path="/privacy" element={<PrivacyPolicyPage />} />
          <Route path="/terms" element={<TermsOfServicePage />} />
          <Route path="*" element={<FleetSetupPage />} />
        </Routes>
      </BrowserRouter>
    );
  }

  const homeRoute = isDriver ? '/driver' : isFleetManager ? '/manager/dashboard' : '/';

  return (
    <BrowserRouter basename={BASE}>
      <Routes>
        <Route path="/privacy" element={<PrivacyPolicyPage />} />
        <Route path="/terms" element={<TermsOfServicePage />} />
        <Route path="/" element={<Navigate to={homeRoute} replace />} />

        <Route
          path="/manager"
          element={
            isFleetManager
              ? <ManagerLayout />
              : isDriver
                ? <Navigate to="/driver" replace />
                : <FleetSetupPage />
          }
        >
          <Route index element={<Navigate to="/manager/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="trucks" element={<TrucksPage />} />
          <Route path="trucks/:truckId" element={<TruckDetailPage />} />
          <Route path="drivers" element={<DriversPage />} />
          <Route path="drivers/:driverId" element={<DriverDetailPage />} />
          <Route path="clients" element={<ClientsPage />} />
          <Route path="clients/:clientId" element={<ClientDetailPage />} />
          <Route path="more" element={<MorePage />} />
        </Route>

        <Route
          path="/driver"
          element={
            isDriver
              ? <DriverLayout />
              : isFleetManager
                ? <Navigate to="/manager/dashboard" replace />
                : <FleetSetupPage />
          }
        >
          <Route index element={<Navigate to="/driver/truck" replace />} />
          <Route path="truck" element={<DriverTruckPage />} />
          <Route path="profile" element={<DriverProfilePage />} />
        </Route>

        {/* Catch-all: unknown routes → FleetSetupPage if role-less, else home */}
        <Route path="*" element={<Navigate to={homeRoute} replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
