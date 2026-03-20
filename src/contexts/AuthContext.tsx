import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import keycloak from '../auth/keycloak';

export type UserRole = 'driver' | 'fleet-manager';

interface User {
  id: string;
  name: string;
  role: UserRole;
  driverId?: string;
}

interface AuthContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  loginAsDriver: (driverId: string, driverName: string) => void;
  loginAsManager: () => void;
  isDriver: boolean;
  isFleetManager: boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [initialized, setInitialized] = useState(false);
  const [user, setUserState] = useState<User | null>(null);

  useEffect(() => {
    keycloak
      .init({ onLoad: 'login-required', checkLoginIframe: false, pkceMethod: 'S256' })
      .then((authenticated) => {
        if (authenticated) {
          const token = keycloak.tokenParsed as any;
          const roles: string[] = token?.realm_access?.roles ?? [];
          const isDriver = roles.includes('DRIVER');

          setUserState({
            id: token?.sub ?? '',
            name: token?.name ?? token?.preferred_username ?? '',
            role: isDriver ? 'driver' : 'fleet-manager',
            driverId: isDriver ? (token?.driver_id ?? token?.sub) : undefined,
          });
        }
        setInitialized(true);

        // Refresh token before it expires
        setInterval(() => {
          keycloak.updateToken(60).catch(() => keycloak.logout());
        }, 30000);
      })
      .catch(() => setInitialized(true));
  }, []);

  if (!initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600 text-sm">Giriş yapılıyor...</p>
        </div>
      </div>
    );
  }

  const value: AuthContextType = {
    user,
    setUser: setUserState,
    // These are kept for dev-tool compatibility but do nothing in production
    loginAsDriver: () => {},
    loginAsManager: () => {},
    isDriver: user?.role === 'driver',
    isFleetManager: user?.role === 'fleet-manager',
    logout: () => keycloak.logout({ redirectUri: window.location.origin }),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
