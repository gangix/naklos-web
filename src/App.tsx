import { Component } from 'react';
import type { ReactNode, ErrorInfo } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
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

/* ---------- Error Boundary ---------- */
interface EBProps { children: ReactNode }
interface EBState { hasError: boolean }

class ErrorBoundary extends Component<EBProps, EBState> {
  constructor(props: EBProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): EBState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: 24, textAlign: 'center' }}>
          <h1 style={{ fontSize: 24, marginBottom: 12 }}>Bir hata olustu</h1>
          <p style={{ marginBottom: 24, color: '#666' }}>Beklenmeyen bir hata meydana geldi.</p>
          <button
            onClick={() => window.location.reload()}
            style={{ padding: '10px 24px', fontSize: 16, borderRadius: 8, border: 'none', background: '#2563eb', color: '#fff', cursor: 'pointer' }}
          >
            Sayfayi Yenile
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

/* ---------- 404 Page ---------- */
function NotFoundPage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: 24, textAlign: 'center' }}>
      <h1 style={{ fontSize: 48, marginBottom: 8 }}>404</h1>
      <p style={{ fontSize: 18, marginBottom: 24, color: '#666' }}>Sayfa bulunamadi</p>
      <Link to="/" style={{ padding: '10px 24px', fontSize: 16, borderRadius: 8, background: '#2563eb', color: '#fff', textDecoration: 'none' }}>
        Ana Sayfaya Don
      </Link>
    </div>
  );
}

function App() {
  const { fleetId } = useFleet();
  const { isDriver, isFleetManager, authenticated, user } = useAuth();

  // Debug: log routing decision so we can see why a user lands where they do
  if (import.meta.env.DEV && authenticated) {
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

  // The fleet_manager role is only assigned when the user creates a fleet,
  // so !isFleetManager means they genuinely don't have a fleet yet — no need
  // to wait for fleetApi.getMy() to confirm.
  const needsFleetSetup = !isDriver && !isFleetManager;
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
      <ErrorBoundary>
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

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </ErrorBoundary>
    </BrowserRouter>
  );
}

export default App;
