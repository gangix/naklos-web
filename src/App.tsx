import { Component, useState, useEffect } from 'react';
import type { ReactNode, ErrorInfo } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import { Toaster } from 'sonner';
import { useFleet } from './contexts/FleetContext';
import { useAuth } from './contexts/AuthContext';
import { driverApi } from './services/api';
import keycloak from './auth/keycloak';
import i18n from './i18n';
import ManagerLayout from './components/layout/ManagerLayout';
import DriverLayout from './components/layout/DriverLayout';
import DashboardPage from './pages/DashboardPage';
import TrucksPage from './pages/TrucksPage';
import TruckDetailPage from './pages/TruckDetailPage';
import DriversPage from './pages/DriversPage';
import DriverDetailPage from './pages/DriverDetailPage';
import ClientsPage from './pages/ClientsPage';
import ClientDetailPage from './pages/ClientDetailPage';
import SettingsPage from './pages/SettingsPage';
import FleetSetupPage from './pages/FleetSetupPage';
import LandingPage from './pages/LandingPage';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
import TermsOfServicePage from './pages/TermsOfServicePage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import AdminFleetDetailPage from './pages/AdminFleetDetailPage';
import FuelFormatsPage from './pages/FuelFormatsPage';
import FuelFormatCreatePage from './pages/FuelFormatCreatePage';
import FuelImportPage from './pages/FuelImportPage';
import FuelImportBatchDetailPage from './pages/FuelImportBatchDetailPage';
import CookieBanner from './components/common/CookieBanner';
import ContactButton from './components/common/ContactButton';
import { useLanguage } from './hooks/useLanguage';

// Driver pages
import DriverProfilePage from './pages/driver/DriverProfilePage';
import DriverTruckPage from './pages/driver/DriverTruckPage';

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
          <h1 style={{ fontSize: 24, marginBottom: 12 }}>{i18n.t('error.pageTitle')}</h1>
          <p style={{ marginBottom: 24, color: '#666' }}>{i18n.t('error.pageDescription')}</p>
          <button
            onClick={() => window.location.reload()}
            style={{ padding: '10px 24px', fontSize: 16, borderRadius: 8, border: 'none', background: '#2563eb', color: '#fff', cursor: 'pointer' }}
          >
            {i18n.t('error.reload')}
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
      <p style={{ fontSize: 18, marginBottom: 24, color: '#666' }}>{i18n.t('error.notFound')}</p>
      <Link to="/" style={{ padding: '10px 24px', fontSize: 16, borderRadius: 8, background: '#2563eb', color: '#fff', textDecoration: 'none' }}>
        {i18n.t('error.goHome')}
      </Link>
    </div>
  );
}

function App() {
  // Initialise language once at app root (reads localStorage / Keycloak token,
  // pushes to i18n, syncs document.lang).
  useLanguage();

  const { fleetId, plan } = useFleet();
  const { isDriver, isFleetManager, authenticated, user } = useAuth();
  const [checkingDriver, setCheckingDriver] = useState(true);
  const [isPreRegisteredDriver, setIsPreRegisteredDriver] = useState(false);

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

  const isSystemAdmin = user?.keycloakRoles?.includes('system_admin') ?? false;
  // Fuel routes are visible to paid plans; FREE hides them. The backend enforces
  // PlanLimits.bulkImport so unauthenticated URL guessers get 403 anyway — this
  // is a UX gate, not a security gate. VITE_FEATURE_FUEL_TRACKING=true forces
  // them on for local dev regardless of plan.
  const forceOn = import.meta.env.VITE_FEATURE_FUEL_TRACKING === 'true';
  const fuelTrackingEnabled = forceOn || (plan && plan !== 'FREE');
  const hasRole = isSystemAdmin || isDriver || isFleetManager;

  // For role-less authenticated users: check if they're a pre-registered
  // driver (added by a manager via bulk import). GET /drivers/me is open to
  // all authenticated users; if it returns a profile, the backend also
  // assigns fleet_driver role. We force a page reload to pick up the new
  // role from the refreshed JWT.
  useEffect(() => {
    if (!authenticated || hasRole) {
      setCheckingDriver(false);
      return;
    }
    driverApi.getMe()
      .then(() => {
        // Driver profile found — backend just assigned fleet_driver role.
        // Force token refresh then reload so isDriver becomes true.
        setIsPreRegisteredDriver(true);
        keycloak.updateToken(-1)
          .then(() => window.location.reload())
          .catch(() => window.location.reload());
      })
      .catch(() => {
        // No driver profile — genuinely new user, show fleet setup
        setCheckingDriver(false);
      });
  }, [authenticated, hasRole]);

  if (!authenticated) {
    return (
      <BrowserRouter basename={BASE}>
        <Routes>
          <Route path="/privacy" element={<PrivacyPolicyPage />} />
          <Route path="/terms" element={<TermsOfServicePage />} />
          <Route path="*" element={<LandingPage />} />
        </Routes>
        <Toaster position="top-center" richColors />
        <CookieBanner />
        <ContactButton />
      </BrowserRouter>
    );
  }

  // Show spinner while checking driver profile or preparing account
  if ((checkingDriver && !hasRole) || isPreRegisteredDriver) {
    return (
      <>
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-600 text-sm">
              {i18n.t('common.loading')}
            </p>
          </div>
        </div>
        <Toaster position="top-center" richColors />
      </>
    );
  }

  const needsFleetSetup = !isSystemAdmin && !isDriver && !isFleetManager;
  if (needsFleetSetup) {
    return (
      <BrowserRouter basename={BASE}>
        <Routes>
          <Route path="/privacy" element={<PrivacyPolicyPage />} />
          <Route path="/terms" element={<TermsOfServicePage />} />
          <Route path="*" element={<FleetSetupPage />} />
        </Routes>
        <Toaster position="top-center" richColors />
      </BrowserRouter>
    );
  }

  const homeRoute = isSystemAdmin ? '/admin' : isDriver ? '/driver' : isFleetManager ? '/manager/dashboard' : '/';

  return (
    <BrowserRouter basename={BASE}>
      <ErrorBoundary>
        <Routes>
          <Route path="/privacy" element={<PrivacyPolicyPage />} />
          <Route path="/terms" element={<TermsOfServicePage />} />
          <Route path="/" element={<Navigate to={homeRoute} replace />} />

          {isSystemAdmin && (
            <Route path="/admin">
              <Route index element={<AdminDashboardPage />} />
              <Route path="fleets/:fleetId" element={<AdminFleetDetailPage />} />
            </Route>
          )}

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
            <Route path="settings" element={<SettingsPage />} />
            {fuelTrackingEnabled && (
              <>
                <Route path="fuel-formats" element={<FuelFormatsPage />} />
                <Route path="fuel-formats/new" element={<FuelFormatCreatePage />} />
                <Route path="fuel-imports" element={<FuelImportPage />} />
                <Route path="fuel-imports/:batchId" element={<FuelImportBatchDetailPage />} />
              </>
            )}
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
      <Toaster position="top-center" richColors />
    </BrowserRouter>
  );
}

export default App;
